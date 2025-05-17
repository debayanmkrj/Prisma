# Prisma
"Prisma" is an interactive webcam installation that transforms viewers' video feeds in real-time, displaying them simultaneously across three distinct temporal perspectives: past, present, and future. 


PRISMA: Past, Present, Future
Show Image
<div align="center">
  <img src="https://github.com/username/prisma-installation/raw/main/docs/images/prisma-banner.png" alt="PRISMA Banner" width="800"/>
  <p><em>An interactive art installation exploring human existence through time</em></p>
</div>
Overview
PRISMA is an interactive digital art installation that refracts the human form through three temporal lenses: past, present, and future. The installation uses real-time computer vision, body tracking, and generative AI to transform participants into evolving visual interpretations across time dimensions.
When visitors step in front of the installation, they see themselves reflected in three distinct panels:

PAST: A Renaissance-inspired point cloud visualization reminiscent of Da Vinci's Vitruvian Man, rendering the human form as geometric patterns in warm sepia tones.
PRESENT: A real-time distorted reflection with cascading text and motion trails, using prismatic effects to fragment and refract the visitor's image.
FUTURE: A futuristic, AI-generated interpretation of the human form through Stable Diffusion, reimagining the visitor with cybernetic and futuristic elements.

Features

Real-time Body Tracking: Uses MediaPipe to detect and track human movement
Interactive Elements: Responds to visitor position, movement, and audio input
AI Integration: Employs Stable Diffusion for real-time image transformation
Seamless Transitions: Smooth visual flows between temporal panels
Audio Reactivity: Visual elements respond to ambient sound or music
Focus Mode: Allows emphasis on a particular time dimension

Technical Architecture
The installation consists of:

Frontend: Browser-based interface with three interactive canvas panels
Backend: Python Flask server with WebSocket communication
AI Component: Stable Diffusion pipeline for image transformation
Computer Vision: MediaPipe for body tracking and segmentation

Requirements
Hardware

Computer with webcam
Display monitor or projection system
(Optional) Audio input device

Software Dependencies

Python 3.8+
TensorFlow 2.x
PyTorch 1.12+
Flask & Flask-SocketIO
MediaPipe
Diffusers (Hugging Face)
Modern web browser with WebSocket support

Installation

Clone the repository:
bashgit clone https://github.com/username/prisma-installation.git
cd prisma-installation

Install Python dependencies:
bashpip install -r requirements.txt

Download pre-trained models:
bashpython download_models.py

Start the server:
bashpython server.py

Open a web browser and navigate to:
http://localhost:5000


Usage

Stand in front of the webcam within 2-3 meters
Move naturally to see how the installation responds
Use keyboard controls:

T: Manually trigger transformation
A: Toggle auto-regeneration
P: Pause/resume the installation



Project Structure
prisma-installation/
├── server.py                # Main Flask server
├── body_tracker.py          # MediaPipe body tracking implementation
├── diffusion_transformer.py # Stable Diffusion integration
├── static/
│   ├── css/
│   │   └── styles.css       # Main styling
│   ├── js/
│   │   ├── main.js          # Core application logic
│   │   ├── past-effect.js   # Past panel visualization
│   │   ├── present-effect.js # Present panel visualization
│   │   ├── future-effect.js # Future panel visualization
│   │   ├── panel-transitions.js # Inter-panel effects
│   │   ├── config.js        # Configuration settings
│   │   └── utils.js         # Utility functions
│   └── images/              # Static image assets
├── templates/
│   └── index.html           # Main HTML template
└── model_cache/             # Directory for downloaded models
Configuration
You can customize the installation by modifying static/js/config.js:

Adjust visual parameters for each panel
Change audio sensitivity
Modify animation timing
Customize color palettes

Artistic Statement
PRISMA explores the continuum of human existence through time, asking the question "Are we Human?" across different temporal dimensions. By refracting the human form through these lenses, the installation invites visitors to contemplate how our understanding of humanity evolves:

The Past panel connects us to our historical understanding of human form and proportion
The Present panel fragments our current perception, highlighting the fluidity of our digital identities
The Future panel speculates on how AI and technology might reimagine humanity

Inspiration
This project draws inspiration from:

Camille Utterback's "Text Rain" installation
Refik Anadol's "Archive Dreaming"
Mario Klingemann's AI art explorations
Da Vinci's "Vitruvian Man"

Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

Fork the repository
Create your feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add some amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request

License
This project is licensed under the MIT License - see the LICENSE file for details.
Acknowledgments

MediaPipe for body tracking capabilities
Stable Diffusion for image generation
Flask for the web framework
All the artists whose work has inspired this installation


<div align="center">
  <p>Created by [Your Name/Organization]</p>
  <p>© 2025</p>
</div>
