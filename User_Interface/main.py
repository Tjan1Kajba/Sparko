from fastapi import FastAPI, Request, Form, status, Depends, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse, Response
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from passlib.context import CryptContext
from pymongo import MongoClient
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from collections import defaultdict, deque
import os
import secrets
import time
import httpx
import gridfs
from validation import validate_credentials, validate_registration_data
from dotenv import load_dotenv


load_dotenv()


class ReceiptItem(BaseModel):
    name: Optional[str] = ""
    value: Optional[str] = ""
    quantity: Optional[str] = ""


class Receipt(BaseModel):
    store_name: Optional[str] = ""
    store_addr: Optional[str] = ""
    phone: Optional[str] = ""
    date: Optional[str] = ""
    time: Optional[str] = ""
    subtotal: Optional[str] = ""
    svc: Optional[str] = ""
    tax: Optional[str] = ""
    total: Optional[str] = ""
    tips: Optional[str] = ""
    discount: Optional[str] = ""
    items: List[ReceiptItem] = []
    image_id: Optional[str] = ""


app = FastAPI()
templates = Jinja2Templates(directory="templates")


def get_secret_key():
    secret_key = os.getenv("SECRET_KEY")
    if not secret_key:
        secret_key = secrets.token_urlsafe(32)
        print("⚠️  Warning: No SECRET_KEY environment variable found.")
        print("🔑 Using auto-generated secret key for this session.")
    return secret_key


DONUT_SERVER_URL = os.getenv("DONUT_SERVER_URL", "http://localhost:8080")
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URL)
db = client["login_db"]
users_collection = db["users"]
receipts_collection = db["receipts"]
fs = gridfs.GridFS(db)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app.add_middleware(SessionMiddleware, secret_key=get_secret_key())
app.mount("/static", StaticFiles(directory="static"), name="static")

SESSION_TIMEOUT = 30 * 60
RATE_LIMIT_REQUESTS = 60
RATE_LIMIT_WINDOW = 60

request_counts = defaultdict(deque)


async def process_image_with_donut(file_content: bytes, filename: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            files = {"file": (filename, file_content, "image/jpeg")}
            response = await client.post(f"{DONUT_SERVER_URL}/process-document", files=files)

            if response.status_code == 200:
                return response.json()
            else:
                return {"success": False, "error": f"Server error: {response.status_code}"}
    except httpx.RequestError as e:
        return {"success": False, "error": f"Connection error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Unexpected error: {str(e)}"}


def check_rate_limit(client_ip: str) -> bool:
    current_time = time.time()
    while request_counts[client_ip] and request_counts[client_ip][0] < current_time - RATE_LIMIT_WINDOW:
        request_counts[client_ip].popleft()
    if len(request_counts[client_ip]) >= RATE_LIMIT_REQUESTS:
        return False
    request_counts[client_ip].append(current_time)
    return True


def rate_limit_middleware(request: Request):
    client_ip = request.client.host
    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Maximum {RATE_LIMIT_REQUESTS} requests per minute allowed."
        )
    return True


def get_current_user(request: Request):
    user = request.session.get("user")
    login_time = request.session.get("login_time")
    if not user or not login_time:
        return None
    current_time = time.time()
    if current_time - login_time > SESSION_TIMEOUT:
        request.session.clear()
        return None
    return user


def require_auth(request: Request):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/", status_code=status.HTTP_302_FOUND)
    return user


@app.get("/image/{image_id}")
async def get_image(image_id: str, request: Request, _: bool = Depends(rate_limit_middleware)):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")
    try:
        grid_out = fs.get(ObjectId(image_id))
        if grid_out.username != user:
            raise HTTPException(status_code=403, detail="Access denied")
        return Response(
            content=grid_out.read(),
            media_type=grid_out.content_type or "image/jpeg",
            headers={
                "Content-Disposition": f"inline; filename={grid_out.filename or 'image.jpg'}"
            }
        )
    except gridfs.NoFile:
        raise HTTPException(status_code=404, detail="Image not found")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error retrieving image: {str(e)}")


@app.post("/save_receipt")
async def save_receipt(request: Request, receipt_data: Receipt, _: bool = Depends(rate_limit_middleware)):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:
        image_id = receipt_data.image_id or request.session.get(
            "last_image_id", "")
        receipt_doc = {
            "username": user,
            "created_at": datetime.utcnow(),
            **receipt_data.dict(),
            "image_id": image_id
        }
        result = receipts_collection.insert_one(receipt_doc)
        if "last_image_id" in request.session:
            del request.session["last_image_id"]

        if result.inserted_id:
            return JSONResponse(
                status_code=200,
                content={"success": True, "message": "Receipt saved successfully",
                         "receipt_id": str(result.inserted_id)}
            )
        else:
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": "Failed to save receipt"}
            )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False,
                     "message": f"Error saving receipt: {str(e)}"}
        )


@app.get("/", response_class=HTMLResponse)
def home(request: Request, _: bool = Depends(rate_limit_middleware)):
    user = get_current_user(request)
    if user:
        return RedirectResponse("/dashboard", status_code=status.HTTP_302_FOUND)
    return templates.TemplateResponse("home.html", {"request": request, "user": user})


@app.get("/register", response_class=HTMLResponse)
def register_get(request: Request, _: bool = Depends(rate_limit_middleware)):
    user = get_current_user(request)
    if user:
        return RedirectResponse("/dashboard", status_code=status.HTTP_302_FOUND)
    return templates.TemplateResponse("register.html", {"request": request, "message": None})


@app.post("/register", response_class=HTMLResponse)
def register_post(request: Request, username: str = Form(...), email: str = Form(...), password: str = Form(...), confirm_password: str = Form(...), _: bool = Depends(rate_limit_middleware)):
    user = get_current_user(request)
    if user:
        return RedirectResponse("/dashboard", status_code=status.HTTP_302_FOUND)
    validation_error = validate_registration_data(
        username, email, password, confirm_password, users_collection)
    if validation_error:
        return templates.TemplateResponse("register.html", {"request": request, "message": validation_error})
    hashed_password = pwd_context.hash(password)
    users_collection.insert_one(
        {"username": username, "email": email, "password": hashed_password})
    return RedirectResponse("/login", status_code=status.HTTP_302_FOUND)


@app.get("/login", response_class=HTMLResponse)
def login_get(request: Request, _: bool = Depends(rate_limit_middleware)):
    user = get_current_user(request)
    if user:
        return RedirectResponse("/dashboard", status_code=status.HTTP_302_FOUND)
    return templates.TemplateResponse("login.html", {"request": request, "message": None})


@app.post("/login", response_class=HTMLResponse)
def login_post(request: Request, email: str = Form(...), password: str = Form(...), _: bool = Depends(rate_limit_middleware)):
    user = get_current_user(request)
    if user:
        return RedirectResponse("/dashboard", status_code=status.HTTP_302_FOUND)
    is_valid, error_message, user_data = validate_credentials(
        email, password, users_collection, pwd_context)
    if not is_valid:
        return templates.TemplateResponse("login.html", {"request": request, "message": error_message})
    request.session["user"] = user_data.get("username", email)
    request.session["login_time"] = time.time()
    return RedirectResponse("/dashboard", status_code=status.HTTP_302_FOUND)


@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request, _: bool = Depends(rate_limit_middleware)):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/", status_code=status.HTTP_302_FOUND)
    return templates.TemplateResponse("dashboard.html", {"request": request, "user": user})


@app.post("/dashboard", response_class=HTMLResponse)
async def dashboard_upload(request: Request, file: UploadFile = File(...), _: bool = Depends(rate_limit_middleware)):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/", status_code=status.HTTP_302_FOUND)
    try:
        file_content = await file.read()
        image_id = fs.put(
            file_content,
            filename=file.filename,
            content_type=file.content_type,
            username=user,
            upload_date=datetime.utcnow()
        )
        result = await process_image_with_donut(file_content, file.filename)
        if result.get("success"):
            result["image_id"] = str(image_id)
        request.session["last_image_id"] = str(image_id)
        return templates.TemplateResponse("dashboard.html", {
            "request": request,
            "user": user,
            "result": result,
            "filename": file.filename,
            "image_id": str(image_id)
        })
    except Exception as e:
        error_result = {"success": False, "error": f"Upload error: {str(e)}"}
        return templates.TemplateResponse("dashboard.html", {
            "request": request,
            "user": user,
            "result": error_result
        })


@app.get("/all_receipts", response_class=HTMLResponse)
def all_receipts(request: Request, _: bool = Depends(rate_limit_middleware)):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/", status_code=status.HTTP_302_FOUND)
    grouped = request.query_params.get("grouped", "false").lower() == "true"
    try:
        receipts = list(receipts_collection.find(
            {"username": user}).sort("created_at", -1))
        for receipt in receipts:
            receipt["_id"] = str(receipt["_id"])
            if receipt.get("created_at"):
                receipt["created_at_formatted"] = receipt["created_at"].strftime(
                    "%Y-%m-%d %H:%M:%S")
    except Exception as e:
        receipts = []

    return templates.TemplateResponse("all_receipts.html", {
        "request": request,
        "user": user,
        "receipts": receipts,
        "grouped": grouped
    })


@app.get("/get_receipt/{receipt_id}")
async def get_receipt(receipt_id: str, request: Request, _: bool = Depends(rate_limit_middleware)):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")
    try:
        receipt = receipts_collection.find_one(
            {"_id": ObjectId(receipt_id), "username": user})

        if not receipt:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Receipt not found"}
            )
        receipt["_id"] = str(receipt["_id"])
        if receipt.get("created_at"):
            receipt["created_at_formatted"] = receipt["created_at"].strftime(
                "%Y-%m-%d %H:%M:%S")
            receipt["created_at"] = receipt["created_at"].isoformat()

        def make_serializable(obj):
            if hasattr(obj, 'isoformat'):
                return obj.isoformat()
            elif isinstance(obj, ObjectId):
                return str(obj)
            elif isinstance(obj, dict):
                return {k: make_serializable(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [make_serializable(item) for item in obj]
            else:
                return obj

        serializable_receipt = make_serializable(receipt)

        return JSONResponse(
            status_code=200,
            content=serializable_receipt
        )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False,
                     "message": f"Error fetching receipt: {str(e)}"}
        )


@app.get("/export_receipt_xml/{receipt_id}")
async def export_receipt_xml(receipt_id: str, request: Request, _: bool = Depends(rate_limit_middleware)):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")
    try:
        receipt = receipts_collection.find_one(
            {"_id": ObjectId(receipt_id), "username": user})
        if not receipt:
            raise HTTPException(status_code=404, detail="Receipt not found")
        xml = "<s_receipt>\n"
        xml += f"  <s_store_name>{receipt.get('store_name', '')}</s_store_name>\n"
        xml += f"  <s_store_addr>{receipt.get('store_addr', '')}</s_store_addr>\n"
        xml += f"  <s_phone>{receipt.get('phone', '')}</s_phone>\n"
        xml += f"  <s_date>{receipt.get('date', '')}</s_date>\n"
        xml += f"  <s_time>{receipt.get('time', '')}</s_time>\n"
        xml += f"  <s_subtotal>{receipt.get('subtotal', '')}</s_subtotal>\n"
        xml += f"  <s_svc>{receipt.get('svc', '')}</s_svc>\n"
        xml += f"  <s_tax>{receipt.get('tax', '')}</s_tax>\n"
        xml += f"  <s_total>{receipt.get('total', '')}</s_total>\n"
        xml += f"  <s_tips>{receipt.get('tips', '')}</s_tips>\n"
        xml += f"  <s_discount>{receipt.get('discount', '')}</s_discount>\n"
        xml += "  <s_line_items>\n"

        for item in receipt.get('items', []):
            xml += f"    <s_item_name>{item.get('name', '')}</s_item_name>\n"
            xml += f"    <s_item_value>{item.get('value', '')}</s_item_value>\n"
            xml += f"    <s_item_quantity>{item.get('quantity', '')}</s_item_quantity>\n"
            xml += "    <sep/>\n"

        xml += "  </s_line_items>\n"
        xml += "</s_receipt>"

        return Response(
            content=xml,
            media_type="application/xml",
            headers={
                "Content-Disposition": f"attachment; filename=receipt_{receipt_id}.xml"}
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error exporting receipt: {str(e)}")


@app.delete("/delete_receipt/{receipt_id}")
async def delete_receipt(receipt_id: str, request: Request, _: bool = Depends(rate_limit_middleware)):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:
        result = receipts_collection.delete_one(
            {"_id": ObjectId(receipt_id), "username": user})

        if result.deleted_count == 1:
            return JSONResponse(
                status_code=200,
                content={"success": True,
                         "message": "Receipt deleted successfully"}
            )
        else:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Receipt not found"}
            )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False,
                     "message": f"Error deleting receipt: {str(e)}"}
        )


@app.put("/update_receipt/{receipt_id}")
async def update_receipt(receipt_id: str, receipt_data: Receipt, request: Request, _: bool = Depends(rate_limit_middleware)):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:
        update_data = {}
        receipt_dict = receipt_data.dict()

        for key, value in receipt_dict.items():
            if key == 'items':
                update_data[key] = [item for item in value if item.get(
                    'name') or item.get('value') or item.get('quantity')]
            else:
                update_data[key] = value if value is not None else ""

        update_data["updated_at"] = datetime.utcnow()

        result = receipts_collection.update_one(
            {"_id": ObjectId(receipt_id), "username": user},
            {"$set": update_data}
        )

        if result.matched_count == 1:
            return JSONResponse(
                status_code=200,
                content={"success": True,
                         "message": "Receipt updated successfully"}
            )
        else:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Receipt not found"}
            )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False,
                     "message": f"Error updating receipt: {str(e)}"}
        )


@app.get("/statistics", response_class=HTMLResponse)
async def statistics(request: Request, _: bool = Depends(rate_limit_middleware)):
    user = get_current_user(request)
    if not user:
        from fastapi.responses import RedirectResponse
        return RedirectResponse("/", status_code=302)

    return templates.TemplateResponse("statistics.html", {"request": request, "user": user})


@app.get("/logout")
def logout(request: Request, _: bool = Depends(rate_limit_middleware)):
    request.session.clear()
    return RedirectResponse("/", status_code=status.HTTP_302_FOUND)


@app.get("/api/statistics/top_stores")
async def api_top_stores(request: Request, _: bool = Depends(rate_limit_middleware)):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")
    try:
        receipts = list(receipts_collection.find({"username": user}))
        store_totals = {}
        import re

        def parse_total(val):
            if not val:
                return 0.0
            if isinstance(val, (int, float)):
                return float(val)
            s = re.sub(r'[^0-9,.-]', '', str(val))
            if ',' in s and '.' in s:
                if s.rfind('.') > s.rfind(','):
                    s = s.replace(',', '')
                else:
                    s = s.replace('.', '').replace(',', '.')
            elif ',' in s:
                s = s.replace(',', '.')
            try:
                return float(s)
            except Exception:
                return 0.0

        for r in receipts:
            store = (r.get('store_name') or '').strip()
            total_raw = r.get('total')
            total = parse_total(total_raw)
            if store and total > 0:
                store_totals[store] = store_totals.get(store, 0.0) + total

        sorted_stores = sorted(store_totals.items(),
                               key=lambda x: x[1], reverse=True)[:10]
        stores = [s[0] for s in sorted_stores]
        totals = [round(s[1], 2) for s in sorted_stores]
        return {"stores": stores, "totals": totals}
    except Exception as e:
        return {"stores": [], "totals": [], "error": str(e)}


@app.get("/api/statistics/most_visited_stores")
async def api_most_visited_stores(request: Request, _: bool = Depends(rate_limit_middleware)):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")
    try:
        receipts = list(receipts_collection.find({"username": user}))
        store_counts = {}
        for r in receipts:
            store = (r.get('store_name') or '').strip()
            if store:
                store_counts[store] = store_counts.get(store, 0) + 1
        sorted_stores = sorted(store_counts.items(),
                               key=lambda x: x[1], reverse=True)[:10]
        stores = [s[0] for s in sorted_stores]
        counts = [s[1] for s in sorted_stores]
        return {"stores": stores, "counts": counts}
    except Exception as e:
        return {"stores": [], "counts": [], "error": str(e)}


@app.get("/api/statistics/most_expensive_items")
async def api_most_expensive_items(request: Request, _: bool = Depends(rate_limit_middleware)):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")
    try:
        receipts = list(receipts_collection.find({"username": user}))
        items = []
        import re

        def parse_value(val):
            if not val:
                return 0.0
            if isinstance(val, (int, float)):
                return float(val)
            s = re.sub(r'[^0-9,.-]', '', str(val))
            if ',' in s and '.' in s:
                if s.rfind('.') > s.rfind(','):
                    s = s.replace(',', '')
                else:
                    s = s.replace('.', '').replace(',', '.')
            elif ',' in s:
                s = s.replace(',', '.')
            try:
                return float(s)
            except Exception:
                return 0.0
        for r in receipts:
            for item in r.get('items', []):
                name = (item.get('name') or '').strip()
                value = parse_value(item.get('value'))
                if name and value > 0:
                    items.append({"name": name, "value": value})
        items_sorted = sorted(
            items, key=lambda x: x['value'], reverse=True)[:5]
        names = [i['name'] for i in items_sorted]
        values = [i['value'] for i in items_sorted]
        return {"names": names, "values": values}
    except Exception as e:
        return {"names": [], "values": [], "error": str(e)}


@app.get("/api/statistics/top_items")
async def api_top_items(request: Request, _: bool = Depends(rate_limit_middleware)):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")
    try:
        receipts = list(receipts_collection.find({"username": user}))
        item_quantities = {}

        for receipt in receipts:
            items = receipt.get('items', [])
            for item in items:
                if not item:
                    continue
                item_name = (item.get('name') or '').strip()
                quantity = float(item.get('quantity', 0))

                if item_name and quantity > 0:
                    item_quantities[item_name] = item_quantities.get(
                        item_name, 0.0) + quantity

        sorted_items = sorted(item_quantities.items(),
                              key=lambda x: x[1], reverse=True)[:10]

        items = [item[0] for item in sorted_items]
        quantities = [round(item[1], 2) for item in sorted_items]

        return {"items": items, "quantities": quantities}
    except Exception as e:
        return {"items": [], "quantities": [], "error": str(e)}
