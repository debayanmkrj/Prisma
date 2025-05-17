"""
PrismaServer - Backend server for the Prisma installation
Handles Stable Diffusion image generation and WebSocket communication
"""

import os
import time
import base64
import json
import cv2
import numpy as np
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_socketio import SocketIO, emit
import threading
import torch
from PIL import Image
from io import BytesIO

# Import your existing components
from body_tracker import BodyTracker
from diffusion_transformer import DiffusionTransformer

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['SECRET_KEY'] = 'prisma-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*")

# Global variables
body_tracker = None
diffusion = None
is_transforming = False
last_transformation_time = 0
regeneration_interval = 30  # Seconds between auto-regenerations
auto_regenerate = True
transformed_image = None
regeneration_thread = None

def init_components():
    """Initialize body tracker and diffusion transformer"""
    global body_tracker, diffusion
    
    print("Initializing components...")
    # Use CPU for body tracking to free up GPU for diffusion
    body_tracker = BodyTracker(device="cpu")
    
    # Use GPU for diffusion if available
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device} for diffusion")
    
    # Default prompt
    default_prompt = "A futuristic human figure inspired by Da Vinci's Vitruvian Man, reimagined through neon-lit cybernetic anatomy, radiating blue and teal energy, with futuristic neon circular patterns in the background, advanced technology aesthetic, sharp details"
    
    # Initialize diffusion transformer
    diffusion = DiffusionTransformer(
        model_id="runwayml/stable-diffusion-v1-5",
        device=device,
        prompt=default_prompt,
        strength=0.75,
        guidance_scale=7.5
    )
    
    print("Components initialized")

def start_regeneration_thread():
    """Start a thread that regenerates the transformation periodically"""
    global regeneration_thread
    
    if regeneration_thread is not None and regeneration_thread.is_alive():
        return  # Thread is already running
    
    def regeneration_loop():
        global is_transforming, last_transformation_time, transformed_image
        
        while auto_regenerate:
            current_time = time.time()
            
            # Check if it's time to regenerate
            if (transformed_image is not None and 
                (current_time - last_transformation_time) >= regeneration_interval):
                
                # Only regenerate if we're not already transforming
                if not is_transforming:
                    print(f"Auto-regenerating transformation after {regeneration_interval} seconds")
                    socketio.emit('regeneration_started')
                    
                    # We will rely on the next frame from the client to trigger transformation
                    socketio.emit('request_frame_for_regeneration')
            
            # Sleep for a short period to avoid consuming too much CPU
            time.sleep(1)
    
    # Create and start the thread
    regeneration_thread = threading.Thread(target=regeneration_loop)
    regeneration_thread.daemon = True
    regeneration_thread.start()

def process_image(image_data, for_regeneration=False):
    """Process an image frame from the client"""
    global is_transforming, last_transformation_time, transformed_image
    
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(image_data.split(',')[1])
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Process with MediaPipe for body tracking
        body_data = body_tracker.process_frame(frame)
        
        # Extract body mask and pose results
        mask = body_data.get_person_mask()
        is_person_detected = body_data.is_person_detected
        pose_landmarks = body_data.pose_landmarks
        
        # Send tracking data back to client
        tracking_data = {
            'is_person_detected': is_person_detected,
        }
        
        # Only include landmarks if person is detected
        if is_person_detected and pose_landmarks is not None:
            # Convert landmarks to list for JSON serialization
            landmarks_list = []
            for i, landmark in enumerate(pose_landmarks):
                if landmark and hasattr(landmark, 'visibility') and landmark.visibility > 0.5:
                    landmarks_list.append({
                        'index': i,
                        'x': landmark.x,
                        'y': landmark.y,
                        'visibility': landmark.visibility
                    })
            tracking_data['landmarks'] = landmarks_list
        
        # Send tracking results
        socketio.emit('tracking_results', tracking_data)
        
        # Check if we should transform the image
        should_transform = for_regeneration and is_person_detected and not is_transforming
        
        if should_transform and mask is not None:
            is_transforming = True
            socketio.emit('transformation_started')
            
            # Create a thread for transformation to not block
            def transform_thread():
                global is_transforming, last_transformation_time, transformed_image
                
                try:
                    # Create pose-aware input for better results
                    pose_frame = create_pose_aware_input(frame, mask, body_data)
                    
                    # Transform with Stable Diffusion
                    result = diffusion.transform_image(pose_frame, prompt=None, body_data=body_data)
                    
                    # Convert to base64 for sending to client
                    _, buffer = cv2.imencode('.jpg', result)
                    img_str = base64.b64encode(buffer).decode('utf-8')
                    
                    # Update global state
                    transformed_image = result
                    last_transformation_time = time.time()
                    
                    # Send result to client
                    socketio.emit('transformation_result', {
                        'image': f"data:image/jpeg;base64,{img_str}"
                    })
                except Exception as e:
                    print(f"Error during transformation: {str(e)}")
                    socketio.emit('transformation_error', {'error': str(e)})
                finally:
                    is_transforming = False
            
            # Start transformation in a separate thread
            threading.Thread(target=transform_thread).start()
        
        return True
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        socketio.emit('processing_error', {'error': str(e)})
        return False

def create_pose_aware_input(frame, mask, body_data):
    """Create an input image that emphasizes the current pose for better SD generation"""
    h, w = frame.shape[:2]
    
    # Start with a black canvas with geometric patterns
    input_image = np.zeros((h, w, 3), dtype=np.uint8)
    
    # Find center of the person
    if body_data.pose_landmarks is not None:
        # Calculate average position of key landmarks to find body center
        landmarks = body_data.pose_landmarks
        torso_landmarks = [11, 12, 23, 24]  # Shoulders and hips
        visible_torso = []
        
        for idx in torso_landmarks:
            if idx < len(landmarks) and landmarks[idx] and landmarks[idx].visibility > 0.5:
                visible_torso.append((landmarks[idx].x, landmarks[idx].y))
        
        if visible_torso:
            avg_x = sum(p[0] for p in visible_torso) / len(visible_torso)
            avg_y = sum(p[1] for p in visible_torso) / len(visible_torso)
            center_x = int(avg_x * w)
            center_y = int(avg_y * h)
        else:
            center_x, center_y = w // 2, h // 2
    else:
        center_x, center_y = w // 2, h // 2
    
    # Create Vitruvian Man-inspired circular patterns
    cv2.circle(input_image, (center_x, center_y), min(w, h) // 2 - 20, (0, 40, 80), 2)
    cv2.circle(input_image, (center_x, center_y), min(w, h) // 3, (0, 60, 120), 2)
    
    # Draw reference lines
    cv2.line(input_image, (center_x - w//2, center_y), (center_x + w//2, center_y), (0, 30, 60), 1)
    cv2.line(input_image, (center_x, center_y - h//2), (center_x, center_y + h//2), (0, 30, 60), 1)
    
    # Copy the person from the frame but with reduced opacity
    person = cv2.bitwise_and(frame, frame, mask=mask)
    
    # Add a blue/cyan tint to the person
    blue_tint = np.zeros_like(person)
    blue_tint[mask > 0] = [120, 50, 20]  # BGR format: more blue, less red
    person = cv2.addWeighted(person, 0.7, blue_tint, 0.3, 0)
    
    # Add edge highlights to emphasize the figure
    kernel = np.ones((3, 3), np.uint8)
    edge_mask = cv2.dilate(mask, kernel) - cv2.erode(mask, kernel)
    person[edge_mask > 0] = [200, 200, 50]  # Yellow-ish highlights
    
    # Blend the person onto the background
    alpha = 0.8
    input_image = cv2.addWeighted(input_image, 1.0, person, alpha, 0)
    
    return input_image

@app.route('/')
def index():
    """Serve the main application page"""
    return render_template('index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    """Serve static files"""
    return send_from_directory('static', path)

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print('Client connected')
    emit('connected', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print('Client disconnected')

@socketio.on('frame')
def handle_frame(data):
    """Handle incoming frame from client"""
    process_image(data['image'])

@socketio.on('transform_request')
def handle_transform_request(data):
    """Handle transformation request from client"""
    # The data contains the image frame to transform
    process_image(data['image'], for_regeneration=True)

@socketio.on('toggle_auto_regenerate')
def handle_toggle_auto_regenerate():
    """Toggle auto-regeneration"""
    global auto_regenerate
    auto_regenerate = not auto_regenerate
    
    if auto_regenerate and (regeneration_thread is None or not regeneration_thread.is_alive()):
        start_regeneration_thread()
    
    return {'auto_regenerate': auto_regenerate}

if __name__ == '__main__':
    # Initialize components
    init_components()
    
    # Start regeneration thread if auto-regenerate is enabled
    if auto_regenerate:
        start_regeneration_thread()
    
    # Start the server
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)