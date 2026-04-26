# Section 5 — AI Chat Feature

## Project Overview

Full-stack AI-powered chat application built with:
- **Angular 18** — Frontend (Reactive Forms, streaming via Fetch API)
- **FastAPI** — AI Backend (Gemini integration, MongoDB, JWT)
- **.NET Core 10** — Transactional Backend (User profiles, MySQL, JWT)

## Architecture

```
Angular Frontend (port 4200)
    ├── FastAPI Backend (port 8000)  →  Gemini API + MongoDB
    └── .NET Core Backend (port 5000)  →  MySQL
```

## Quick Start

### 1. FastAPI Backend

```bash
cd fastapi-backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env: add your GEMINI_API_KEY and MongoDB URI

# Run
uvicorn main:app --reload --port 8000
```

API docs will be available at: http://localhost:8000/docs

### 2. .NET Core Backend

```bash
cd dotnet-backend/DeckziApi

# Edit appsettings.json with your MySQL connection string
dotnet run
```

API runs at: http://localhost:5000

### 3. Angular Frontend

```bash
cd angular-frontend
npm install
npm run start
```

App opens at: http://localhost:4200

## API Endpoints

### FastAPI (AI Backend)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | - | Register new user |
| POST | `/auth/login` | - | Login (returns JWT) |
| POST | `/chat` | JWT | Send message, stream AI response |
| GET | `/chat/history?session_id=` | JWT | Get conversation history |
| POST | `/chat/clear?session_id=` | JWT | Clear conversation history |

### .NET Core (Transactional Backend)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | - | Register user in MySQL |
| POST | `/api/auth/login` | - | Login |
| GET | `/api/userprofile` | JWT | Get user profile |
| PUT | `/api/userprofile` | JWT | Update display name & preferences |

## Key Features Implemented

- ✅ Gemini 1.5 Flash streaming responses (token-by-token)
- ✅ Prompt injection detection (10+ regex patterns)
- ✅ Conversation history in MongoDB
- ✅ JWT authentication (both backends)
- ✅ Angular Reactive Forms with validation
- ✅ Typing indicator while streaming
- ✅ Input disabled during streaming (prevents double-sends)
- ✅ Clear history button
- ✅ Auth guard — unauthenticated users redirected to login
- ✅ JWT interceptor for Angular HttpClient
- ✅ User profile in MySQL via .NET Core
- ✅ Glassmorphism dark UI design

## Environment Variables

### FastAPI `.env`
```
GEMINI_API_KEY=your_key_here
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=deckzi_ai
JWT_SECRET=your_secret_here
```

### .NET `appsettings.json`
```json
{
  "ConnectionStrings": {
    "Default": "Server=localhost;Database=deckzi_users;User=root;Password=;"
  },
  "Jwt": {
    "Secret": "your_secret_here"
  }
}
```

> **Note:** Both backends must use the **same JWT secret** for seamless auth across services.

## Deployment

- **Angular** → Vercel (`vercel --prod`)
- **FastAPI** → Render / Railway (add `Procfile`: `web: uvicorn main:app --host 0.0.0.0 --port $PORT`)
- **.NET** → Azure App Service / Railway
