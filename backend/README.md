# Flask Chatbot Backend

This is the Flask backend server for the mental wellness chatbot, powered by Groq API.

## Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Get your Groq API key from https://console.groq.com/
   - Add your API key to the `.env` file:
     ```
     GROQ_API_KEY=your_actual_api_key_here
     ```

3. **Run the server:**
   ```bash
   python app.py
   ```

The server will start on `http://localhost:5000` by default.

## API Endpoints

### Health Check
- **GET** `/health`
- Returns server health status

### Chat
- **POST** `/api/chat`
- Request body:
  ```json
  {
    "message": "User's message here",
    "history": [
      {
        "sender": "user",
        "text": "Previous message"
      },
      {
        "sender": "bot",
        "text": "Previous response"
      }
    ]
  }
  ```
- Response:
  ```json
  {
    "response": "Bot's response",
    "success": true
  }
  ```

## Notes

- The backend uses CORS to allow requests from the Next.js frontend
- Conversation history is limited to the last 10 messages to manage token usage
- The model used is `llama-3.3-70b-versatile` (can be changed in `app.py`)
