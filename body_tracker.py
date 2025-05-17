"""
BodyTracker - Handles body tracking using MediaPipe
"""

import cv2
import numpy as np
import mediapipe as mp
import time

class BodyData:
    """Container for body tracking data"""
    def __init__(self):
        self.landmarks = None
        self.segmentation_mask = None
        self.pose_landmarks = None
        self.is_person_detected = False
        
    def get_person_mask(self):
        """Return binary mask of the person"""
        if self.segmentation_mask is not None:
            # Convert confidence mask to binary mask
            binary_mask = (self.segmentation_mask > 0.5).astype(np.uint8) * 255
            
            # Apply morphological operations to clean up the mask
            kernel = np.ones((5, 5), np.uint8)
            binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_CLOSE, kernel)
            binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel)
            
            return binary_mask
        return None
    
    def get_skeleton_image(self, frame_shape):
        """Generate a visualization of the pose skeleton with ALL landmarks equally"""
        if not self.is_person_detected or self.pose_landmarks is None:
            return np.zeros(frame_shape, dtype=np.uint8)
            
        h, w = frame_shape[:2]
        skeleton_img = np.zeros(frame_shape, dtype=np.uint8)
        
        # Draw lines between landmarks - UNIFORM style for ALL connections
        connections = mp.solutions.pose.POSE_CONNECTIONS
        landmarks = self.pose_landmarks
        
        # Use consistent line thickness for all landmarks
        line_thickness = 2
        
        for connection in connections:
            start_idx, end_idx = connection
            if landmarks[start_idx] and landmarks[end_idx]:
                start_point = (int(landmarks[start_idx].x * w), int(landmarks[start_idx].y * h))
                end_point = (int(landmarks[end_idx].x * w), int(landmarks[end_idx].y * h))
                # Use the same green color for all landmarks
                cv2.line(skeleton_img, start_point, end_point, (0, 255, 0), line_thickness)
                
        # Draw landmark points - UNIFORM size and color for ALL points
        circle_radius = 5
        for landmark in landmarks:
            if landmark:
                point = (int(landmark.x * w), int(landmark.y * h))
                # Use the same red color for all landmarks
                cv2.circle(skeleton_img, point, circle_radius, (0, 0, 255), -1)
                
        return skeleton_img

class BodyTracker:
    """Tracks human body in video frames using MediaPipe"""
    def __init__(self, device="cpu"):
        self.device = device
        
        # Initialize MediaPipe solutions
        self.mp_pose = mp.solutions.pose
        self.mp_selfie_segmentation = mp.solutions.selfie_segmentation
        
        # Configure pose detection
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,  # Use 0 for faster but less accurate
            smooth_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Configure segmentation
        self.selfie_segmentation = self.mp_selfie_segmentation.SelfieSegmentation(model_selection=1)
        
        # For performance tracking
        self.processing_times = []
        
    def process_frame(self, frame):
        """Process a frame to extract body data"""
        start_time = time.time()
        body_data = BodyData()
        
        # Convert to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Get pose landmarks
        pose_results = self.pose.process(rgb_frame)
        if pose_results.pose_landmarks:
            body_data.is_person_detected = True
            body_data.pose_landmarks = pose_results.pose_landmarks.landmark
            
        # Get segmentation mask
        segmentation_results = self.selfie_segmentation.process(rgb_frame)
        if segmentation_results.segmentation_mask is not None:
            body_data.segmentation_mask = segmentation_results.segmentation_mask
            
            # If we have a mask but no pose landmarks, assume a person is detected
            if body_data.segmentation_mask.max() > 0.5:
                body_data.is_person_detected = True
        
        # Track performance
        elapsed = time.time() - start_time
        self.processing_times.append(elapsed)
        if len(self.processing_times) > 100:
            self.processing_times.pop(0)
        
        return body_data
    
    def get_average_processing_time(self):
        """Get the average frame processing time"""
        if not self.processing_times:
            return 0
        return sum(self.processing_times) / len(self.processing_times)