import torch
from diffusers import ShapEPipeline
from diffusers.utils import export_to_ply
import os
import uuid

class AIEngine:
    def __init__(self):
        print("Initializing AI Engine (Shap-E)...")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Running on device: {self.device}")
        
        try:
            # Load the Shap-E pipeline from Hugging Face
            # We use openai/shap-e with torch.float16 for speed on GPU if available
            dtype = torch.float16 if self.device == "cuda" else torch.float32
            self.pipe = ShapEPipeline.from_pretrained("openai/shap-e", torch_dtype=dtype, variant="fp16" if self.device=="cuda" else None)
            
            # Optimization for Low VRAM (4GB)
            if self.device == "cuda":
                # enable_sequential_cpu_offload saves the most memory but makes inference slower
                # It moves modules to GPU only when needed
                self.pipe.enable_sequential_cpu_offload()
            else:
                self.pipe = self.pipe.to("cpu")
            print("Model loaded successfully.")
        except Exception as e:
            print(f"Error loading model: {e}")
            self.pipe = None

    def generate(self, prompt: str, steps: int = 64, guidance_scale: float = 15.0):
        if not self.pipe:
            return {"error": "Model not loaded correctly."}

        print(f"Generating 3D model for prompt: {prompt}")
        
        try:
            # Generate mesh
            # output_type="mesh" returns a list of mesh objects suitable for export_to_ply
            images = self.pipe(
                prompt,
                num_inference_steps=steps, 
                guidance_scale=guidance_scale, 
                frame_size=256,
                output_type="mesh"
            ).images

            mesh = images[0]
            
            # Ensure output directory exists
            output_dir = "generated_models"
            os.makedirs(output_dir, exist_ok=True)
            
            # Create unique filename
            filename = f"{uuid.uuid4()}.ply"
            file_path = os.path.join(output_dir, filename)
            
            # Export to PLY
            export_to_ply(mesh, file_path)
            
            # Return relative path or URL friendly path
            return {
                "status": "success",
                "model_url": f"/static/{filename}",
                "message": f"Generated model for '{prompt}'",
                "filename": filename
            }
            
        except Exception as e:
            print(f"Error during generation: {e}")
            return {"error": str(e)}
