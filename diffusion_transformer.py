"""
DiffusionTransformer - Handles Stable Diffusion transformation of images
"""

import torch
import numpy as np
import cv2
from diffusers import StableDiffusionImg2ImgPipeline, StableDiffusionXLImg2ImgPipeline
from diffusers.utils import load_image
from PIL import Image
import os

class DiffusionTransformer:
    """Transforms images using Stable Diffusion models"""
    def __init__(self, model_id="stabilityai/stable-diffusion-xl-base-1.0", 
             device="cuda", prompt="futuristic cybernetic human", 
             strength=0.75, guidance_scale=7.5):
        """
        Initialize the Stable Diffusion pipeline.
        
        Args:
            model_id: ID of the model to use (from Hugging Face)
            device: Device to run inference on ("cuda" or "cpu")
            prompt: Default prompt to use for transformation
            strength: How strong the transformation should be (0-1)
            guidance_scale: Guidance scale for diffusion (higher = more prompt adherence)
        """
        # Define the exact path to the Hugging Face cache directory
        # This points directly to where your models are already stored
        huggingface_hub_dir = os.path.join(os.path.expanduser("~"), ".cache", "huggingface", "hub")
        
        # Create a project-specific cache directory as fallback
        project_cache_dir = os.path.join(os.path.dirname(__file__), "model_cache")
        os.makedirs(project_cache_dir, exist_ok=True)
        
        # Force CUDA to be visible
        os.environ["CUDA_VISIBLE_DEVICES"] = "0"
        
        # Check for GPU and set device
        self.has_cuda = torch.cuda.is_available()
        print(f"CUDA available: {self.has_cuda}")
        if self.has_cuda:
            print(f"CUDA Device: {torch.cuda.get_device_name()}")
            print(f"CUDA Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
        
        # Override device parameter if CUDA is available
        self.device = "cuda" if self.has_cuda else "cpu"
        print(f"Using device: {self.device}")
        
        self.model_id = model_id
        self.default_prompt = prompt
        self.strength = strength
        self.guidance_scale = guidance_scale
        
        # Optimization settings
        self.width = 512
        self.height = 512
        self.last_transform = None
        self.transform_overlay = None
        self.reuse_frames = 30  # Only regenerate every 30 frames
        self.frame_count = 0
        
        # Determine appropriate dtype based on device
        if self.device == "cuda":
            self.dtype = torch.float16  # Use half precision on GPU
        else:
            self.dtype = torch.float32  # Use full precision on CPU
            
        print(f"Using dtype: {self.dtype}")
        
        # Add information about which cache directory we're trying to use
        print(f"Looking for models in: {huggingface_hub_dir}")
        
        # Initialize the pipeline based on model type (SD or SDXL)
        try:
            if "xl" in model_id.lower():
                self.pipeline = StableDiffusionXLImg2ImgPipeline.from_pretrained(
                    model_id, 
                    torch_dtype=self.dtype,
                    use_safetensors=True,
                    variant="fp16" if self.device == "cuda" else None,
                    local_files_only=True,
                    cache_dir=huggingface_hub_dir  # Use the user's cache directory where models are stored
                )
            else:
                self.pipeline = StableDiffusionImg2ImgPipeline.from_pretrained(
                    model_id,
                    torch_dtype=self.dtype,
                    use_safetensors=True,
                    variant="fp16" if self.device == "cuda" else None,
                    local_files_only=True,
                    cache_dir=huggingface_hub_dir  # Use the user's cache directory where models are stored
                )
            print(f"Successfully loaded model from cache: {model_id}")
        except Exception as e:
            print(f"Error loading model from local cache: {e}")
            print("Attempting to download the model...")
            
            # If loading from cache fails, try downloading
            if "xl" in model_id.lower():
                self.pipeline = StableDiffusionXLImg2ImgPipeline.from_pretrained(
                    model_id, 
                    torch_dtype=self.dtype,
                    use_safetensors=True,
                    variant="fp16" if self.device == "cuda" else None,
                    local_files_only=False  # Allow download if needed
                )
            else:
                self.pipeline = StableDiffusionImg2ImgPipeline.from_pretrained(
                    model_id,
                    torch_dtype=self.dtype,
                    use_safetensors=True,
                    variant="fp16" if self.device == "cuda" else None,
                    local_files_only=False  # Allow download if needed
                )
            print(f"Successfully downloaded model: {model_id}")
            
        # Move the model to the selected device
        self.pipeline = self.pipeline.to(self.device)
        
        # Optimization if on CUDA
        if self.device == "cuda":
            self.pipeline.enable_attention_slicing()
            self.pipeline.enable_vae_slicing()
            
            # Try to enable memory efficient attention
            try:
                if torch.__version__ >= "2.0.0":
                    self.pipeline.enable_xformers_memory_efficient_attention()
                    print("Enabled xformers memory efficient attention")
            except Exception as e:
                print(f"Could not enable xformers: {e}")
                # Try alternative memory optimization
                try:
                    self.pipeline.enable_sequential_cpu_offload()
                    print("Enabled sequential CPU offload")
                except:
                    pass
    
    def transform_image(self, image, prompt=None, body_data=None):
        """
        Transform an image using Stable Diffusion with the given prompt.
        
        Args:
            image: OpenCV image (BGR format)
            prompt: Text prompt to guide the transformation (uses default if None)
            body_data: Body tracking data to enhance the prompt or guide the transformation
            
        Returns:
            Transformed image as numpy array (BGR format)
        """
        # Check if this is the first transformation
        if not hasattr(self, 'first_run_completed'):
            print("First transformation - using optimized settings...")
            # Use fewer steps for the first run
            steps = 15
            self.first_run_completed = True
        else:
            steps = 30
        
        # Convert OpenCV BGR to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Scale down for faster inference
        h, w = rgb_image.shape[:2]
        aspect_ratio = w / h
        
        if aspect_ratio > 1:  # Wider than tall
            new_w = self.width
            new_h = int(self.width / aspect_ratio)
        else:  # Taller than wide
            new_h = self.height
            new_w = int(self.height * aspect_ratio)
            
        resized_image = cv2.resize(rgb_image, (new_w, new_h))
        pil_image = Image.fromarray(resized_image)
        
        # Build the prompt
        if prompt is None:
            prompt = self.default_prompt
            
        # Enhance prompt with body data if available
        if body_data is not None and body_data.is_person_detected:
            # IMPORTANT: Add instructions to show the full body, not just face
            prompt += ", full body shot, show entire body, no cropping, wider frame"
            
            # Other body position checks can remain, but ensure they don't focus on face
            if body_data.pose_landmarks is not None:
                # Check if person is standing, sitting, etc.
                left_shoulder = body_data.pose_landmarks[11]
                right_shoulder = body_data.pose_landmarks[12]
                
                if hasattr(left_shoulder, 'y') and hasattr(right_shoulder, 'y'):
                    avg_shoulder_y = (left_shoulder.y + right_shoulder.y) / 2
                    
                    if avg_shoulder_y < 0.4:  # Upper part of the frame
                        prompt += ", standing tall, full figure"
                    elif avg_shoulder_y > 0.6:  # Lower part of the frame
                        prompt += ", sitting or crouching position, full figure"
        
        # Run the diffusion pipeline
        with torch.no_grad():
            try:
                print(f"Running inference with prompt: {prompt}")
                print(f"Device: {self.device}, Dtype: {self.dtype}")
                
                # For SDXL, explicitly handle different config
                if "xl" in self.model_id.lower():
                    result = self.pipeline(
                        prompt=prompt,
                        image=pil_image,
                        strength=self.strength,
                        guidance_scale=self.guidance_scale,
                        num_inference_steps=steps
                    ).images[0]
                else:
                    # For regular SD
                    result = self.pipeline(
                        prompt=prompt,
                        image=pil_image,
                        strength=self.strength,
                        guidance_scale=self.guidance_scale,
                        num_inference_steps=steps
                    ).images[0]
                    
            except RuntimeError as e:
                print(f"Error during inference: {e}")
                # Fallback to CPU if we encounter CUDA issues
                if "CUDA" in str(e) and self.device == "cuda":
                    print("Falling back to CPU...")
                    self.pipeline = self.pipeline.to("cpu")
                    self.device = "cpu"
                    self.dtype = torch.float32
                    self.pipeline.to(dtype=torch.float32)
                    
                    # Retry inference
                    result = self.pipeline(
                        prompt=prompt,
                        image=pil_image,
                        strength=self.strength,
                        guidance_scale=self.guidance_scale,
                        num_inference_steps=steps // 2  # Fewer steps for CPU
                    ).images[0]
                else:
                    # If not a CUDA error or fallback failed, return the original image
                    print("Cannot process image, returning original")
                    return image
            
        # Convert back to numpy and BGR
        result_rgb = np.array(result)
        
        # Resize back to original size
        result_rgb_resized = cv2.resize(result_rgb, (w, h))
        result_bgr = cv2.cvtColor(result_rgb_resized, cv2.COLOR_RGB2BGR)
        
        return result_bgr
    
    def cleanup_memory(self):
        """Free up memory after transformations"""
        if self.device == "cuda":
            # Clear CUDA cache
            torch.cuda.empty_cache()
            
        # Force garbage collection
        import gc
        gc.collect()

    # Call this after transformations
        self.diffusion.cleanup_memory()