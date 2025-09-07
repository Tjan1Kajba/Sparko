#!/usr/bin/env python3
"""
Complete startup script for the Document Processing System
This script will start both the processing server and the login application
"""

import subprocess
import sys
import os
import time
import webbrowser
from pathlib import Path


def check_requirements(project_path, requirements_file="requirements.txt"):
    """Check if requirements.txt exists and install packages"""
    req_path = project_path / requirements_file
    if not req_path.exists():
        print(f"❌ {requirements_file} not found in {project_path}")
        return False

    print(f"📦 Installing requirements from {req_path}...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", str(req_path)
        ], cwd=str(project_path))
        print(f"✅ Requirements installed for {project_path.name}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing requirements: {e}")
        return False


def start_server(server_path, port, app_name):
    """Start a FastAPI server"""
    print(f"🚀 Starting {app_name} on port {port}...")

    if app_name == "Document Processing Server":
        cmd = [sys.executable, "-m", "uvicorn", "app:app",
               "--host", "0.0.0.0", "--port", str(port), "--reload"]
    else:
        cmd = [sys.executable, "-m", "uvicorn", "main:app",
               "--host", "0.0.0.0", "--port", str(port), "--reload"]

    return subprocess.Popen(cmd, cwd=str(server_path))


def main():
    """Main function to orchestrate the startup"""
    print("🌟 Document Processing System Startup")
    print("=" * 50)

    current_dir = Path(__file__).parent
    server_path = current_dir.parent / "Server"
    login_path = current_dir

    print(f"📁 Server path: {server_path}")
    print(f"📁 Login app path: {login_path}")

    if not server_path.exists() or not (server_path / "app.py").exists():
        print("❌ Could not find Server directory or app.py")
        return

    if not login_path.exists() or not (login_path / "main.py").exists():
        print("❌ Could not find main.py in login directory")
        return

    install_deps = input(
        "Install/update requirements for both applications? (y/n): ").lower().strip()
    if install_deps in ['y', 'yes']:
        print("\n📦 Installing dependencies...")
        if not check_requirements(server_path):
            return
        if not check_requirements(login_path):
            return

    print("\n🚀 Starting applications...")

    try:
        server_process = start_server(
            server_path, 8080, "Document Processing Server")
        print("✅ Document Processing Server started on http://localhost:8080")

        time.sleep(3)

        login_process = start_server(login_path, 8000, "Login Application")
        print("✅ Login Application started on http://localhost:8000")

        print("\n" + "="*50)
        print("🎉 System is now running!")
        print("📊 Document Processing Server: http://localhost:8080")
        print("🌐 Login Application: http://localhost:8000")
        print("📚 API Documentation: http://localhost:8080/docs")
        print("\n💡 To test the system:")
        print("   1. Open http://localhost:8000 in your browser")
        print("   2. Register a new account or login")
        print("   3. Upload an image in the dashboard")
        print("\n⚠️  Press Ctrl+C to stop both servers")
        print("="*50)

        try:
            server_process.wait()
        except KeyboardInterrupt:
            print("\n🛑 Stopping servers...")
            server_process.terminate()
            login_process.terminate()

            time.sleep(2)

            try:
                server_process.kill()
                login_process.kill()
            except:
                pass

            print("✅ Servers stopped")

    except Exception as e:
        print(f"❌ Error starting system: {e}")
        return


if __name__ == "__main__":
    main()
