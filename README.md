# Standard RAG Frontend

React + Vite frontend for the Standard RAG backend. It lets users sign up, sign in, upload PDF documents, and ask questions against uploaded documents through the Spring Boot RAG API.

## Project Folders

```text
RAG Models/
  frontend/      React + Vite app, runs on port 3000
  standardRag/   Spring Boot backend, runs on port 8080
```

## Requirements

- Node.js 18 or newer
- npm
- Java 21
- Docker Desktop
- Ollama models used by the backend:
  - `nomic-embed-text:latest`
  - `gemma3:1b`

## 1. Start the Backend

Download the backend

```command
git pull https://github.com/Avanish0210/RAG-Model.git
```

### Option A: Docker Compose

This starts the backend services defined by the backend project:

```powershell
docker compose up -d
```

Pull the Ollama models if you have not done it before:

```powershell
docker exec -it RAG-ollama ollama pull nomic-embed-text:latest
docker exec -it RAG-ollama ollama pull gemma3:1b
```

Backend should be available at:

```text
http://localhost:8080
```

### Option B: Run Spring Boot Locally

Start the database/services first, then run the app:

```powershell
docker compose up -d db
.\mvnw.cmd spring-boot:run
```

If you run Ollama directly on your machine, also run:

```powershell
ollama pull nomic-embed-text:latest
ollama pull gemma3:1b
```

## 2. Start the Frontend

Open another terminal in the frontend folder:

```powershell
cd "C:\Users\LENOVO\OneDrive\Documents\RAG Models\frontend"
npm install
npm run dev
```

Frontend will run at:

```text
http://localhost:3000
```

## 3. Use the App

1. Open `http://localhost:3000`.
2. Create a user account or sign in with an existing backend user.
3. Upload a PDF from the document/repository screen.
4. Select the uploaded document in chat.
5. Ask questions about that document.

Important: upload and chat require a real JWT from backend login. If you previously used the demo/local login, sign out and sign in again with a backend user.

## API Proxy

The frontend uses Vite proxy rules so the browser calls the frontend origin and Vite forwards requests to the backend:

```text
/api       -> http://localhost:8080
/upload    -> http://localhost:8080
/Documents -> http://localhost:8080
```

Because of this, frontend code should call paths like:

```text
/api/auth/login
/upload
/Documents/chat
```

Do not call `http://localhost:8080/...` directly from browser code, or the browser may block the request with CORS errors.

## Useful Commands

```powershell
# frontend
npm run dev
npm run build
npm run preview
npm run lint
```

```powershell
# backend
.\mvnw.cmd spring-boot:run
docker compose up -d
docker compose down
```

## Troubleshooting

### CORS Error

Make sure the frontend is calling relative paths such as `/Documents/chat`, not absolute URLs like `http://localhost:8080/Documents/chat`.

Also restart the frontend dev server after changing `vite.config.ts`.

### Forbidden on Upload or Chat

This usually means the frontend does not have a valid JWT.

Fix:

1. Sign out.
2. Sign in again with a real backend user.
3. Retry upload or chat.

If it still fails, create a fresh account from the frontend, then sign in with that account.

### Chat Returns No Useful Answer

Check that:

- The backend is running on port `8080`.
- Ollama is running.
- Both required Ollama models are pulled.
- You uploaded a PDF successfully before chatting.
- You are chatting with the uploaded document selected.

### PowerShell Blocks npm

If `npm run ...` fails because scripts are disabled, use:

```powershell
npm.cmd run dev
npm.cmd run lint
```

## Backend Endpoints Used

```text
POST /api/auth/signup
POST /api/auth/login
POST /upload
PUT  /upload/{documentId}
POST /Documents/chat
```

All endpoints except `/api/auth/**` require:

```text
Authorization: Bearer <jwt-token>
```
