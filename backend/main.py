from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
import os

# Import engine (placeholder for now)
try:
    from engine import AIEngine
except ImportError:
    # Fallback if engine.py is not yet ready or dependencies missing
    class AIEngine:
        def generate(self, prompt):
            return {"status": "mocked", "prompt": prompt}

app = FastAPI(title="Fast3dPrint API")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = AIEngine()

class GenerateRequest(BaseModel):
    prompt: str

@app.get("/")
def read_root():
    return {"status": "online", "message": "Fast3dPrint Backend is running"}

@app.post("/generate")
def generate_model(request: GenerateRequest):
    try:
        result = engine.generate(request.prompt)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-image")
def generate_from_image(
    front_image: UploadFile = File(...),
    back_image: Optional[UploadFile] = File(None)
):
    try:
        # Mock processing
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
