from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt
from datetime import datetime, timedelta

from database import get_db, engine, Base
import models, schemas

from fastapi.middleware.cors import CORSMiddleware

# Buat tabel otomatis jika belum ada
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Task Management API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Mengizinkan semua akses dari frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "rahasia-banget-buat-jwt-moonlay"
ALGORITHM = "HS256"
security = HTTPBearer()

# Helper untuk verifikasi JWT sederhana
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau sudah kedaluwarsa",
        )

# 1. Endpoint Login (Autentikasi JWT)
@app.post("/api/login")
def login(form_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or user.password != form_data.password: # Untuk cepatnya, cek langsung (bisa disesuaikan hashing-nya)
        raise HTTPException(status_code=400, detail="Username atau password salah")
    
    # Buat token JWT berdurasi 24 jam
    expiration = datetime.utcnow() + timedelta(days=1)
    token = jwt.encode({"sub": str(user.id), "username": user.username, "exp": expiration}, SECRET_KEY, algorithm=ALGORITHM)
    
    return {"access_token": token, "token_type": "bearer"}

# 2. Endpoint Get Users (Untuk Dropdown Assignee di Frontend)
@app.get("/api/users", response_model=list[schemas.UserResponse])
def get_users(db: Session = Depends(get_db), user=Depends(verify_token)):
    users = db.query(models.User).all()
    return users

# 3. Endpoint Get All Tasks (Melihat daftar seluruh task)
@app.get("/api/tasks", response_model=list[schemas.TaskResponse])
def get_tasks(db: Session = Depends(get_db), user=Depends(verify_token)):
    tasks = db.query(models.Task).all()
    # Mapping manual agar assignee ter-load dengan baik di response schema
    result = []
    for t in tasks:
        assignee_data = db.query(models.User).filter(models.User.id == t.assignee_id).first()
        result.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "deadline": t.deadline,
            "assignee": assignee_data
        })
    return result

# 4. Endpoint Create Task (Menambah task)
@app.post("/api/tasks", response_model=schemas.TaskResponse)
def create_task(task_data: schemas.TaskCreate, db: Session = Depends(get_db), user=Depends(verify_token)):
    new_task = models.Task(
        title=task_data.title,
        description=task_data.description,
        status=task_data.status,
        deadline=task_data.deadline,
        assignee_id=task_data.assignee_id
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    assignee_data = db.query(models.User).filter(models.User.id == new_task.assignee_id).first()
    return {
        "id": new_task.id,
        "title": new_task.title,
        "description": new_task.description,
        "status": new_task.status,
        "deadline": new_task.deadline,
        "assignee": assignee_data
    }

# 5. Endpoint Update Task (Mengubah task & status)
@app.put("/api/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: str, task_data: schemas.TaskUpdate, db: Session = Depends(get_db), user=Depends(verify_token)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task tidak ditemukan")
    
    if task_data.title is not None: task.title = task_data.title
    if task_data.description is not None: task.description = task_data.description
    if task_data.status is not None: task.status = task_data.status
    if task_data.deadline is not None: task.deadline = task_data.deadline
    if task_data.assignee_id is not None: task.assignee_id = task_data.assignee_id

    db.commit()
    db.refresh(task)
    
    assignee_data = db.query(models.User).filter(models.User.id == task.assignee_id).first()
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "deadline": task.deadline,
        "assignee": assignee_data
    }

# 6. Endpoint Delete Task (Menghapus task)
@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db), user=Depends(verify_token)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task tidak ditemukan")
    
    db.delete(task)
    db.commit()
    return {"message": "Task berhasil dihapus"}