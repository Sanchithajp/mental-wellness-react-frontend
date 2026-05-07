# Mental Wellness React Frontend

A modern mental wellness application built with Next.js, featuring meditation, breathing exercises, chat support, and more.

## Features

- 🧘 Meditation sessions
- 🌬️ Breathing exercises
- 💬 AI-powered chatbot (powered by Groq API)
- 🎬 ASMR videos from YouTube (reels-style interface)
- 🎮 Wellness games
- 📊 Mood tracking
- 🎵 Playlists
- 📚 Resources

## Prerequisites

- Node.js 18+ and npm
- Groq API key ([Get one here](https://console.groq.com/))
- YouTube Data API v3 key ([Get one here](https://console.cloud.google.com/apis/credentials))

## Setup Instructions

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Setup

1. **Create `.env.local` file in the root directory:**
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

2. **Get your API keys:**
   - Groq API: [console.groq.com](https://console.groq.com/)
   - YouTube API: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

### Backend Setup (Optional - Flask backend is no longer needed)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Mac/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   - Create a `.env` file in the `backend` directory
   - Add your Groq API key:
     ```
     GROQ_API_KEY=your_groq_api_key_here
     PORT=5000
     ```

5. **Run the Flask server:**
   ```bash
   # Windows
   python app.py
   # or use the batch file
   run.bat

   # Mac/Linux
   python app.py
   # or use the shell script
   chmod +x run.sh
   ./run.sh
   ```

   The backend will be available at [http://localhost:5000](http://localhost:5000)

## Running Both Servers

You need to run both the frontend and backend servers simultaneously:

1. **Terminal 1 - Frontend:**
   ```bash
   npm run dev
   ```

2. **Terminal 2 - Backend:**
   ```bash
   cd backend
   python app.py
   ```

## Environment Variables

Create a `.env.local` file in the root directory with the following:

```env
# Groq API Key for chatbot
GROQ_API_KEY=your_groq_api_key_here

# YouTube Data API v3 Key for ASMR videos
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### Getting API Keys

1. **Groq API Key:**
   - Visit [Groq Console](https://console.groq.com/)
   - Sign up/login and create an API key

2. **YouTube Data API v3 Key:**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the "YouTube Data API v3"
   - Go to "Credentials" and create an API key
   - Restrict the key to "YouTube Data API v3" for security

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── chatbot/           # Chatbot page
│   ├── chat/              # Chat page
│   └── ...                # Other pages
├── backend/               # Flask backend
│   ├── app.py            # Main Flask application
│   ├── requirements.txt  # Python dependencies
│   └── README.md         # Backend documentation
├── components/            # React components
└── lib/                   # Utility functions
    └── api.ts            # API client for backend
```

## Technologies Used

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Radix UI

### Backend
- Flask
- Groq API (LLM)
- Flask-CORS

## Troubleshooting

### Backend Connection Issues
- Ensure the Flask server is running on port 5000
- Check that your `.env` file contains a valid `GROQ_API_KEY`
- Verify CORS is enabled (it should be by default)

### Frontend Issues
- Clear your browser cache
- Check the browser console for errors
- Ensure both servers are running

## License

This project is for educational purposes.
