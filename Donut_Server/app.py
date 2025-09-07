from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import tempfile
import os
from pathlib import Path
from typing import Dict, Any
import time
from main_final_optimized import initialize_model, process_document

# Ustvari FastAPI aplikacijo
app = FastAPI(
    title="Document Processing API",
    description="API for processing documents using Donut model",
    version="1.0.0"
)

model_initialized = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model_initialized
    try:
        # Inicializacija modela ob zagonu
        initialize_model()
        model_initialized = True
    except Exception as e:
        model_initialized = False
    yield

app.router.lifespan_context = lifespan


@app.post("/process-document")
async def process_document_endpoint(file: UploadFile = File(...)) -> Dict[str, Any]:
    if not model_initialized:
        raise HTTPException(
            status_code=503,
            detail="Model not initialized. Please wait for the server to start up completely."
        )
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail="File must be an image (JPEG, PNG, etc.)"
        )
    temp_dir = Path(tempfile.gettempdir())
    temp_file = temp_dir / f"temp_image_{int(time.time())}_{file.filename}"

    try:
        with open(temp_file, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        start_time = time.time()
        result = process_document(str(temp_file))
        processing_time = time.time() - start_time

        return {
            "success": True,
            "filename": file.filename,
            "extracted_text": result,
            "processing_time_seconds": round(processing_time, 2),
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing document: {str(e)}"
        )

    finally:
        # Počisti začasno datoteko
        try:
            if temp_file.exists():
                os.unlink(temp_file)
        except Exception:
            pass

if __name__ == "__main__":
    # Zaženi strežnik
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8080,
        reload=False,
        log_level="info"
    )
