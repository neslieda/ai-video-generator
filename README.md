# AI Video Generator

A full-stack MVP that generates short AI videos from a text prompt.

**How it works:**
1. You enter a concept (e.g. "fear of heights")
2. OpenAI generates cinematic scene descriptions
3. Each scene becomes a short video clip (Pika API or mock)
4. ElevenLabs generates voice narration
5. FFmpeg merges everything into a final video

## Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **FFmpeg** — required for video processing

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Verify
ffmpeg -version
```

## Setup

### 1. Clone / enter the project

```bash
cd ai-video-generator
```

### 2. Configure environment variables

```bash
cp .env.example server/.env
```

Edit `server/.env` and add your API keys. **All keys are optional** — the app works fully with mock/placeholder functions when keys are missing.

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | No | Enables real AI scene generation |
| `PIKA_API_KEY` | No | Placeholder — mock is used regardless for now |
| `ELEVENLABS_API_KEY` | No | Enables real voice narration |
| `ELEVENLABS_VOICE_ID` | No | Defaults to "Rachel" voice |
| `PORT` | No | Backend port (default: 3001) |

### 3. Install dependencies

```bash
# Backend
cd server && npm install && cd ..

# Frontend
cd client && npm install && cd ..
```

### 4. Start the app

Open **two terminal tabs**:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

### 5. Open in browser

Go to **http://localhost:5173**

Enter a prompt and click "Generate Video". Progress steps will appear in real time.

## Project Structure

```
ai-video-generator/
├── client/                       # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx               # Main app with SSE streaming
│   │   ├── App.css               # Styles
│   │   ├── components/
│   │   │   ├── PromptInput.jsx   # Text input + generate button
│   │   │   ├── ProgressIndicator.jsx  # Step-by-step tracker
│   │   │   └── VideoPlayer.jsx   # HTML5 video display
│   │   ├── main.jsx
│   │   └── index.css
│   └── vite.config.js            # Proxy /api → backend
├── server/
│   ├── index.js                  # Express entry point
│   ├── routes/
│   │   └── video.js              # POST /api/generate (SSE), GET /api/video/*
│   ├── services/
│   │   ├── openai.js             # Scene description generation
│   │   ├── pika.js               # Video clip generation (mock + real stub)
│   │   ├── elevenlabs.js         # TTS narration
│   │   └── ffmpeg.js             # Clip concatenation + audio merge
│   ├── utils/
│   │   └── fileManager.js        # Temp directory lifecycle
│   └── tmp/                      # Generated files (auto-cleaned after 30 min)
├── .env.example
├── .gitignore
└── README.md
```

## How the Mock Mode Works

Without API keys, the app still runs end-to-end:

- **OpenAI mock** — returns pre-written cinematic scene descriptions based on your prompt
- **Pika mock** — generates colored placeholder video clips (4 seconds each) using FFmpeg
- **ElevenLabs mock** — generates a silent audio track

The final merged video will be a series of colored screens with "Scene N" labels — proving the full pipeline works.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| AI Scripts | OpenAI GPT-4o-mini |
| Video Gen | Pika API (mock available) |
| Narration | ElevenLabs TTS |
| Video Processing | FFmpeg via fluent-ffmpeg |
| Progress | Server-Sent Events (SSE) |
