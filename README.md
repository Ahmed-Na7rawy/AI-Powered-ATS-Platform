# AI-Powered-ATS-Platform
* **Backend:** Python, FastAPI, SQLite/PostgreSQL, SQLAlchemy (Async), Alembic, Celery.
* **Frontend:** React, Vite, Vanilla CSS (Premium UI), Axios, Lucide-React.
* **AI Engine:** Google Gemini Pro (Company-level configuration support).
* **Document Engine:** PyPDF2, python-docx, OCR via Tesseract & Poppler.

---

## ✨ Features
- **AI Resume Screening:** Automatic scoring (0-100%) and summarization of candidates based on specific job descriptions.
- **Robust Document Parsing:** Native text extraction for PDF/Docx with automatic **OCR Fallback** for scanned/image-based resumes.
- **Multi-Tenant User Management:** Complete recruiter dashboard for inviting teammates, managing roles, and deactivating accounts.
- **Flexible Settings:** Manage SMTP (for email automation) and **Company-specific Gemini API Keys** directly from the UI.
- **Sleek UI:** Modern, dark-mode-first recruiters' dashboard with interactive candidate drawers and progress tracking.

---

## Prerequisites
Before you begin, ensure you have the following installed:
* [Docker Desktop](https://www.docker.com/products/docker-desktop) (for Postgres / Redis infrastructure)
* [Python 3.10+](https://www.python.org/downloads/)
* [Node.js 18+](https://nodejs.org/) & npm

---

## 🏗️ 1. Infrastructure Setup (Docker Compose)

The application utilizes Docker to quickly spin up the required PostgreSQL and Redis services (Redis is required for Celery workers).

1. Open your terminal in the root of the project.
2. Run the `docker-compose` command to start the background infrastructure in detached mode:
   ```bash
   docker-compose up -d
   ```
3. Verify the containers are running:
   ```bash
   docker-compose ps
   ```

---

## ⚙️ 2. Environment Variables

Create a file named `.env` in the root directory (where `main.py` or the `app` folder resides) and configure the following required environment variables:

```env
# Database configuration (Use Postgres if using docker, or SQLite for local dev)
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ats_db
# Option for local SQLite: DATABASE_URL=sqlite+aiosqlite:///./ats_dev.db

# Redis URL for Celery Message Broker
REDIS_URL=redis://localhost:6379/0

# Security (Generate a secure token for this)
SECRET_KEY=your_highly_secure_generated_key_here

# AI Integration
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🐍 3. Backend Setup (FastAPI & Celery)

1. **Set up a Python Virtual Environment:**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Apply Database Migrations:**
   Ensure your database schemas are up-to-date using Alembic.
   ```bash
   alembic upgrade head
   ```

4. **Seed the Database (Optional):**
   Seed the database with initial test data and admin credentials.
   ```bash
   python scripts/seed_db.py
   ```

5. **Start the FastAPI Server:**
   ```bash
   uvicorn app.main:app --reload
   ```
   > The API will be accessible at `http://127.0.0.1:8000`. Auto-generated Swagger docs are available at `http://127.0.0.1:8000/docs`.

6. **Start the Celery Worker (In a separate terminal):**
   ```bash
   # Ensure environment is activated
   celery -A app.worker.celery_app worker --loglevel=info
   ```

---

## ⚛️ 4. Frontend Setup (React/Vite)

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node Modules:**
   ```bash
   npm install
   ```

3. **Configure Frontend Environment (Optional):**
   Create an `.env` file in the `frontend` folder if you need to override the backend API URL. By default, it proxies to `http://127.0.0.1:8000`.
   ```env
   VITE_API_URL=http://127.0.0.1:8000
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   > The HR Dashboard will be accessible at `http://localhost:5173`.

---

## 🚀 Quick Start (Windows)
For convenience, a `start_dev.bat` script is included in the root directory to simultaneously launch both the FastAPI backend and Vite frontend development servers.
```cmd
.\start_dev.bat
```
