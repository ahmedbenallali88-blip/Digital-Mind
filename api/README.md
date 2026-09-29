# Digital Mind API

Secure backend for **العقل الرقمي**.

## Environment
- OPENAI_API_KEY = your server-side OpenAI API key
- OPENAI_MODEL = gpt-5.6-luna (optional)
- PORT = 3000 (optional)

## Endpoints
- GET /health
- POST /api/chat

POST body:
{"message":"مرحبا","history":[{"role":"user","content":"..."}]}

The API key is never sent to the Android application.