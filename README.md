# 🚀 Šparko Receipt Processing System

[![YouTube Video](https://i.ytimg.com/vi/trH_vHMMgvo/maxresdefault.jpg)](https://www.youtube.com/embed/trH_vHMMgvo?si=PV53zFyxGKhIqZkD)

A **FastAPI-based system** that integrates a secure **login application** with a **document processing server** using the **Donut model** for intelligent image-to-text extraction.  

---

## 🏗️ System Architecture

┌─────────────────────┐    HTTP Request    ┌──────────────────────┐
│   Login Application │ ─────────────────► │ Document Processing  │
│   (Port 8000)       │                    │ Server (Port 8080)   │
│                     │ ◄───────────────── │                      │
│   - User Auth       │    JSON Response   │   - Donut Model      │
│   - File Upload     │                    │   - Image Processing │
│   - Dashboard       │                    │   - Text Extraction  │
└─────────────────────┘                    └──────────────────────┘


## 🔑 Login Application (Port 8000)
User registration & authentication

Session management with timeout

Secure password hashing (bcrypt)

Drag & drop file upload

Real-time results dashboard

## 📄 Document Processing Server (Port 8080)
Donut model for text extraction

REST API endpoints

GPU acceleration (if available)

Batch processing support

Health monitoring

## 🔐 Security Guide
The app uses a secure SECRET_KEY (from .env or environment variables). If none is set, one is generated automatically.

Setup Environment Variables
bash
Copy code
# Generate a strong secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"
Copy .env.example → .env

Replace your-secret-key-here with the generated key

## ⚡ Production Tips:

Never commit .env files

Use platform-specific environment variable settings

Enable HTTPS & rate limiting

## ⚡ Quick Start
## 📋 Prerequisites
Python 3.8+

MongoDB (local or Atlas)

CUDA-capable GPU (optional)

## ▶️ Option 1: Automated Startup (Recommended)
bash
Copy code
python start_complete_system.py
## ▶️ Option 2: Manual Startup
Start Document Processing Server:

bash
Copy code
cd Server
pip install -r requirements.txt
python -m uvicorn app:app --host 0.0.0.0 --port 8080 --reload
Start Login Application:

bash
Copy code
cd Project_Login
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
## 📡 API Endpoints
## 🔑 Login Application (Port 8000)
GET / → Home

GET /register → Registration form

POST /register → Create new user

GET /login → Login form

POST /login → Authenticate user

GET /dashboard → Dashboard (auth required)

POST /dashboard → Upload & process doc

GET /logout → Logout

## 📄 Document Processing Server (Port 8080)
POST /process-document → Process single doc

GET /docs → Swagger UI

## 📂 File Structure
text
Copy code
Project_Login/
├── main.py                     # FastAPI login app
├── requirements.txt            # Dependencies
├── start_complete_system.py    # Startup script
├── start_system.ps1            # PowerShell script
├── test_integration.py         # Integration tests
├── static/                     # CSS, images
├── templates/                  # HTML templates
│   ├── dashboard.html
│   ├── login.html
│   ├── register.html
│   └── ...

Server/
├── app.py                      # FastAPI server
├── main_final_optimized.py     # Donut model impl.
├── requirements.txt            # Dependencies
├── start_server.py             # Startup script
└── model_cache/                # Cached model files
## 🔄 Integration Flow
User uploads image via dashboard

Login app forwards file → processing server

Donut model extracts text & metadata

Server responds with results

Login app displays output

## ⚙️ Performance Optimization
GPU: Install CUDA, adjust batch sizes

CPU: Optimize thread usage, scale with workers


