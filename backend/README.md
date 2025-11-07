# Backend README

## AI Code Generator - Backend API

FastAPI-based backend service for AI code generation using OpenAI's GPT models.

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   copy .env.example .env
   # Edit .env with your OpenAI API key
   ```

3. **Run server:**
   ```bash
   python main.py
   ```

4. **View API docs:**
   Open `http://localhost:8000/docs`

## API Endpoints

### Health Check
```http
GET /health
```

### Chat
```http
POST /api/chat
Content-Type: application/json

{
  "message": "Create a Python function",
  "conversation_history": [],
  "language": "python",
  "mode": "code"
}
```

### Generate Code
```http
POST /api/generate-code
Content-Type: application/json

{
  "prompt": "Function to sort array",
  "language": "python",
  "include_comments": true,
  "include_tests": false
}
```

### Supported Languages
```http
GET /api/languages
```

## Project Structure

```
backend/
├── main.py              # FastAPI application & routes
├── config.py            # Configuration management
├── models.py            # Pydantic models
├── services/
│   └── ai_service.py   # OpenAI integration
├── requirements.txt     # Dependencies
└── .env                # Environment variables
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `OPENAI_MODEL` | GPT model | gpt-4-turbo-preview |
| `HOST` | Server host | 0.0.0.0 |
| `PORT` | Server port | 8000 |
| `MAX_TOKENS` | Max response tokens | 2048 |
| `TEMPERATURE` | AI temperature | 0.7 |

## Development

### Run with auto-reload:
```bash
uvicorn main:app --reload
```

### Run tests:
```bash
pytest
```

### Format code:
```bash
black .
isort .
```

## Production

### Using Uvicorn:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Using Docker:
```bash
docker build -t ai-chatbot-backend .
docker run -p 8000:8000 ai-chatbot-backend
```
