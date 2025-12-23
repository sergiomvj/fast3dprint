from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import uvicorn
import os

# Import engine
try:
    from engine import AIEngine
except ImportError:
    print("WARNING: engine.py import failed. Running in mock mode.")
    class AIEngine:
        def generate(self, prompt, **kwargs):
            return {"status": "mocked", "prompt": prompt}

app = FastAPI(title="Fast3dPrint API")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the generated_models directory to serve static files
os.makedirs("generated_models", exist_ok=True)
app.mount("/static", StaticFiles(directory="generated_models"), name="static")

# Initialize Engine Global
engine = AIEngine()

class GenerateRequest(BaseModel):
    prompt: str
    steps: Optional[int] = 64
    guidance: Optional[float] = 15.0

@app.get("/")
def read_root():
    return {"status": "online", "message": "Fast3dPrint Backend is running with Shap-E"}

@app.post("/generate")
def generate_model(request: GenerateRequest):
    try:
        result = engine.generate(request.prompt, steps=request.steps, guidance_scale=request.guidance)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-image")
def generate_from_image(
    front_image: UploadFile = File(...),
    back_image: Optional[UploadFile] = File(None)
):
    try:
        # TODO: Implement Image-to-3D pipeline
        return {
            "status": "success",
            "front_image": front_image.filename,
            "back_image": back_image.filename if back_image else None,
            "message": "Images received. 3D generation mockup."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
