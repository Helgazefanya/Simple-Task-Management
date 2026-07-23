# Simple Task Management App - Technical Test

Aplikasi Task Management sederhana yang dibangun untuk memenuhi kriteria Technical Test Frontend & Backend Developer Intern. Aplikasi ini memungkinkan pengguna untuk melakukan manajemen tugas secara penuh (CRUD), mengubah status tugas, menentukan penanggung jawab (*assignee*), serta dilengkapi dengan autentikasi berbasis JWT.

---

## Tech Stack
* **Frontend:** Next.js (React), Tailwind CSS
* **Backend:** Python (FastAPI)
* **Database:** PostgreSQL
* **Dokumentasi API:** Postman Collection

---

## Struktur Folder & Database
* **`task-management-backend/`**: Berisi kode sumber FastAPI dan koneksi database.
* **`task-management-frontend/`**: Berisi antarmuka pengguna Next.js.
* **`Task Management API - Technical Test.postman_collection.json`**: Berkas dokumentasi endpoint API lengkap dengan contoh respons (*Save as Example*).

---

## Cara Menjalankan Project

### 1. Konfigurasi Database (PostgreSQL)
Buat database baru bernama `task_management_db`, lalu jalankan skrip SQL berikut untuk membuat tabel:
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Todo',
    deadline TIMESTAMP NOT NULL,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Akun default untuk login
INSERT INTO users (username, password) VALUES ('admin', 'admin123');
```
2. Menjalankan Backend (FastAPI)
a. Masuk ke folder backend:

```Bash
cd task-management-backend
```
b. Buat dan aktifkan virtual environment, lalu install dependencies:

```Bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
pip install fastapi uvicorn pydantic psycopg2-binary passlib python-jose
```
c. Jalankan server backend:

```Bash
uvicorn main:app --reload
```

3. Menjalankan Frontend (Next.js)
a. Buka terminal baru dan masuk ke folder frontend:

```Bash
cd task-management-frontend
```

b. Install dependencies dan jalankan aplikasi:

```Bash
npm install
npm run dev
```
(Akses aplikasi melalui browser di http://localhost:3000)


**Dokumentasi API:**
Gunakan file Task Management API - Technical Test.postman_collection.json yang tersedia di root repository ini dengan mengimpornya (import) ke dalam Postman untuk menguji seluruh endpoint.
