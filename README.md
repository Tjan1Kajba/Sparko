
<iframe width="560" height="315" src="https://www.youtube.com/embed/trH_vHMMgvo?si=PV53zFyxGKhIqZkD" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>


# Document Processing & Login System

This project integrates a FastAPI-based login application with a document processing server using the Donut model for image text extraction. It features secure authentication, file upload, and robust security practices.

---

## System Architecture

```
┌─────────────────────┐    HTTP Request    ┌──────────────────────┐
│   Login Application │ ─────────────────► │ Document Processing  │
│   (Port 8000)       │                    │ Server (Port 8080)   │
│                     │ ◄───────────────── │                      │
│   - User Auth       │    JSON Response   │   - Donut Model      │
│   - File Upload     │                    │   - Image Processing │
│   - Dashboard       │                    │   - Text Extraction  │
└─────────────────────┘                    └──────────────────────┘
```

---

## Features

### Login Application (Port 8000)

- User registration and authentication
- Session management with timeout
- Secure password hashing (bcrypt)
- File upload interface with drag & drop
- Real-time processing results display

### Document Processing Server (Port 8080)

- Donut model for document text extraction
- REST API endpoints
- GPU acceleration (if available)
- Batch processing support
- Health monitoring

---

## Security Guide

The application uses a secure secret key from the `SECRET_KEY` environment variable. If not set, it generates a cryptographically secure key for the session.

#### Setting Up Environment Variables

1. **For Local Development:**
   - Copy `.env.example` to `.env`
   - Generate a new secret key: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
   - Replace `your-secret-key-here` with the generated key
2. **For Production:**
   - Set the `SECRET_KEY` environment variable on your server
   - Never commit the actual `.env` file to version control
   - Use your hosting platform's environment variable settings

#### Security Best Practices

1. **Secret Keys:**
   - Use cryptographically secure random keys (32+ characters)
   - Never hardcode secrets in source code
   - Use different keys for different environments
   - Rotate keys regularly
2. **Additional Security Measures:**
   - Enable HTTPS in production
   - Implement proper rate limiting
   - Keep dependencies updated

## Setup & Quick Start

### Prerequisites

1. **Python 3.8+**
2. **MongoDB** (for user authentication)
3. **CUDA-capable GPU** (optional, for faster processing)

#### Installing MongoDB (Windows)

1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Install with default settings
3. MongoDB will run as a Windows service automatically
   - Alternative: Use MongoDB Atlas (cloud) by updating the `MONGO_URL` environment variable.

### Option 1: Automated Startup (Recommended)

1. **Run the Python script:**
   ```bash
   python start_complete_system.py
   ```

### Option 2: Manual Startup

1. **Start the Document Processing Server:**
   ```bash
   cd Server
   pip install -r requirements.txt
   python -m uvicorn app:app --host 0.0.0.0 --port 8080 --reload
   ```
2. **Start the Login Application:**
   ```bash
   cd Project_Login
   pip install -r requirements.txt
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

## API Endpoints

### Login Application (Port 8000)

- `GET /` - Home page
- `GET /register` - Registration form
- `POST /register` - Create new user
- `GET /login` - Login form
- `POST /login` - Authenticate user
- `GET /dashboard` - Dashboard (authenticated)
- `POST /dashboard` - Upload and process document
- `GET /logout` - Logout user

### Document Processing Server (Port 8080)

- `POST /process-document` - Process single document
- `GET /docs` - API documentation (Swagger UI)

---

## File Structure

```
Project_Login/
├── main.py                     # FastAPI login application
├── requirements.txt            # Python dependencies
├── start_complete_system.py    # Python startup script
├── start_system.ps1            # PowerShell startup script
├── test_integration.py         # Integration testing
├── static/                     # CSS, images, etc.
├── templates/                  # HTML templates
│   ├── dashboard.html          # Main dashboard with upload
│   ├── login.html              # Login form
│   ├── register.html           # Registration form
│   └── ...                     # Other templates

Server/
├── app.py                      # FastAPI document processing server
├── main_final_optimized.py     # Donut model implementation
├── requirements.txt            # Python dependencies
├── start_server.py             # Server startup script
└── model_cache/                # Cached model files
```

---

## Integration Details

### Communication Flow

1. User uploads image via dashboard form
2. Login app receives file and forwards to processing server
3. Processing server loads image and runs Donut model
4. Server returns extracted text and metadata
5. Login app displays results to user

### Performance Optimization

1. **GPU Usage:**
   - Install CUDA toolkit for GPU acceleration
   - Monitor GPU memory usage
   - Adjust batch size based on GPU memory
2. **CPU Optimization:**
   - Set appropriate number of threads
   - Monitor CPU usage
   - Consider using multiple worker processes
