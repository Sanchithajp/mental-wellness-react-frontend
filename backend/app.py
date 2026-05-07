from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from groq import Groq
import os
import json
import re
import secrets
import time
import requests
from urllib.parse import quote, urlencode
from dotenv import load_dotenv
from pathlib import Path
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import numpy as np
import sqlite3
from datetime import datetime
import smtplib
from email.mime.text import MIMEText

# Load environment variables from .env file in the backend directory
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

# Also try to read directly from .env file as fallback
if not os.getenv('GROQ_API_KEY') or os.getenv('GROQ_API_KEY') == 'your_groq_api_key_here':
    try:
        env_file = Path(__file__).parent / '.env'
        if env_file.exists():
            with open(env_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        key = key.strip()
                        value = value.strip().strip('"').strip("'")
                        if key == 'GROQ_API_KEY' and value and value != 'your_groq_api_key_here':
                            os.environ['GROQ_API_KEY'] = value
                            print(f"Loaded GROQ_API_KEY from .env file (length: {len(value)})")
                            break
    except Exception as e:
        print(f"Error reading .env file: {e}")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


def get_spotify_config() -> dict:
    """Fresh read from .env so OAuth works after env changes without restarting the server."""
    load_dotenv(dotenv_path=env_path, override=True)
    rid = (os.getenv("SPOTIFY_REDIRECT_URI") or "").strip()
    if not rid:
        rid = "http://127.0.0.1:5000/api/spotify/callback"
    return {
        "client_id": (os.getenv("SPOTIFY_CLIENT_ID") or "").strip(),
        "client_secret": (os.getenv("SPOTIFY_CLIENT_SECRET") or "").strip(),
        "redirect_uri": rid,
        "frontend_url": (os.getenv("FRONTEND_URL") or "http://localhost:3000").strip().rstrip("/"),
    }


# ---------- Spotify OAuth + playlist (one-time nonce after callback) ----------

_cfg0 = get_spotify_config()
SPOTIFY_CLIENT_ID = _cfg0["client_id"]
SPOTIFY_CLIENT_SECRET = _cfg0["client_secret"]
SPOTIFY_REDIRECT_URI = _cfg0["redirect_uri"]
FRONTEND_URL = _cfg0["frontend_url"]

SPOTIFY_SCOPES = "playlist-modify-public playlist-modify-private user-read-email"

# nonce -> {"at": str, "rt": str|None, "exp": float, "created": float}
SPOTIFY_PENDING_TOKENS: dict[str, dict] = {}
_PENDING_TTL_SEC = 300

MOOD_SEARCH_FALLBACK: dict[str, list[str]] = {
    "calm": [
        "ambient calm piano",
        "lofi hip hop chill",
        "Bon Iver mellow",
        "acoustic indie soft",
    ],
    "focus": [
        "deep focus electronic",
        "classical study music",
        "synth instrumental concentration",
        "minimal techno focus",
    ],
    "uplift": [
        "feel good indie pop",
        "disco funk upbeat",
        "Pharrell happy",
        "sunny day indie",
    ],
    "sleep": [
        "sleep meditation ambient",
        "white noise rain",
        "calm piano sleep",
        "binaural sleep",
    ],
}


def _cleanup_spotify_pending() -> None:
    now = time.time()
    for k, v in list(SPOTIFY_PENDING_TOKENS.items()):
        if now - v.get("created", 0) > _PENDING_TTL_SEC:
            del SPOTIFY_PENDING_TOKENS[k]


def _parse_llm_json(text: str) -> dict | None:
    text = (text or "").strip()
    m = re.search(r"\{[\s\S]*\}", text)
    if not m:
        return None
    try:
        return json.loads(m.group())
    except json.JSONDecodeError:
        return None


def _split_queries_into_genre_groups(queries: list[str], mood_hint: str) -> list[dict]:
    """Heuristic genre buckets when the model returns a flat query list only."""
    if not queries:
        return [{"genre": "Curated mix", "queries": [mood_hint or "chill music"]}]
    if len(queries) <= 3:
        return [
            {"genre": f"{mood_hint[:24]} — part 1", "queries": queries[:2] or queries},
            {"genre": f"{mood_hint[:24]} — part 2", "queries": queries[2:] or queries[-1:]},
        ]
    n = len(queries)
    a, b = max(1, n // 3), max(1, (2 * n) // 3)
    return [
        {"genre": "Atmospheric & soft", "queries": queries[:a]},
        {"genre": "Rhythm & melody", "queries": queries[a:b]},
        {"genre": "Energy & closer", "queries": queries[b:]},
    ]


def _normalize_genre_groups(parsed: dict | None, fallback_queries: list[str], mood_raw: str) -> list[dict]:
    """Build validated genre_groups: list of {genre, queries}."""
    groups: list[dict] = []
    if parsed and isinstance(parsed.get("genre_groups"), list):
        for g in parsed["genre_groups"]:
            if not isinstance(g, dict):
                continue
            label = str(g.get("genre") or "").strip()
            qs = [
                str(x).strip()
                for x in (g.get("queries") or [])
                if str(x).strip()
            ]
            if label and qs:
                groups.append({"genre": label[:80], "queries": qs[:8]})
    if len(groups) >= 2:
        return groups
    flat: list[str] = []
    if parsed and isinstance(parsed.get("search_queries"), list):
        flat = [str(x).strip() for x in parsed["search_queries"] if str(x).strip()]
    if not flat:
        flat = list(fallback_queries)
    return _split_queries_into_genre_groups(flat, mood_raw)


def best_album_art_url(images: list) -> str | None:
    if not images:
        return None
    best = None
    best_dist = 10_000
    for im in images:
        if not isinstance(im, dict):
            continue
        w = im.get("width") or 0
        try:
            w = int(w)
        except (TypeError, ValueError):
            w = 0
        dist = abs(w - 300) if w else 999
        if dist < best_dist and im.get("url"):
            best_dist = dist
            best = im.get("url")
    if best:
        return str(best)
    last = images[-1]
    if isinstance(last, dict) and last.get("url"):
        return str(last.get("url"))
    return None


def spotify_track_card(tr: dict) -> dict:
    """Serializable track + artwork for the website."""
    if not tr or not isinstance(tr, dict):
        return {
            "title": None,
            "artist": "",
            "duration_ms": None,
            "image_url": None,
            "spotify_url": None,
            "uri": None,
        }
    album = tr.get("album") or {}
    images = album.get("images") or []
    image_url = best_album_art_url(images)
    return {
        "title": tr.get("name"),
        "artist": ", ".join(
            a.get("name", "") for a in (tr.get("artists") or []) if a.get("name")
        ),
        "duration_ms": tr.get("duration_ms"),
        "image_url": image_url,
        "spotify_url": (tr.get("external_urls") or {}).get("spotify"),
        "uri": tr.get("uri"),
    }


def ai_mood_playlist_plan(mood: str, notes: str | None) -> dict:
    """
    Use Groq to turn a mood (+ optional notes) into playlist metadata and Spotify search queries.
    Falls back to static queries if the model is unavailable.
    """
    mood_raw = (mood or "calm").strip() or "calm"
    mood_key = mood_raw.lower()
    notes = (notes or "").strip()
    if mood_key in MOOD_SEARCH_FALLBACK:
        fallback_queries = MOOD_SEARCH_FALLBACK[mood_key]
    else:
        cue = mood_raw[:48] if mood_raw else "chill"
        fallback_queries = [
            f"{cue} songs",
            f"{cue} indie playlist",
            f"{cue} spotify",
            "chill relaxing mix",
            "acoustic emotional",
            "ambient calm",
        ]
    display_title = mood_raw[:40] + ("…" if len(mood_raw) > 40 else "")
    genre_groups_fb = _split_queries_into_genre_groups(list(fallback_queries), mood_raw)
    flat_fb = [q for g in genre_groups_fb for q in g["queries"]]
    base = {
        "playlist_name": f"MindEase — {display_title}",
        "description": "Curated by MindEase for your wellbeing.",
        "search_queries": flat_fb,
        "genre_groups": genre_groups_fb,
    }

    if not client:
        return base

    user_ctx = f'Mood / vibe (use this exactly for curation): "{mood_raw}"'
    if notes:
        user_ctx += f'\nExtra context from user: "{notes[:500]}"'

    prompt = f"""{user_ctx}

You are a music curator for mental wellness. Reply with ONLY a JSON object (no markdown) with exactly these keys:
- "playlist_name": short creative playlist title (max 60 chars)
- "description": one sentence (max 200 chars)
- "genre_groups": array of 3 to 5 objects. Each object must have:
    - "genre": a short style label (2-5 words, e.g. "Dreamy indie folk" or "Lo-fi focus beats"). Labels must be DISTINCT from each other.
    - "queries": array of 2 to 4 strings, each a compact Spotify search query (artist, genre, or mood) that fits ONLY that genre bucket.
  Together, all groups must support the user's mood. Order groups in a natural listening flow (e.g. gentler first if the mood is calm).
- Optionally you may also include "search_queries" as a flat backup array (ignored if genre_groups is valid).

No markdown, no text outside the JSON."""

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.85,
            max_tokens=1200,
        )
        raw = completion.choices[0].message.content or ""
        parsed = _parse_llm_json(raw)
        if not parsed:
            return base
        genre_groups = _normalize_genre_groups(parsed, list(fallback_queries), mood_raw)
        flat = [q for g in genre_groups for q in g["queries"]]
        if len(flat) < 4:
            return base
        name = str(parsed.get("playlist_name") or base["playlist_name"]).strip()[
            :100
        ]
        desc = str(parsed.get("description") or base["description"]).strip()[:300]
        return {
            "playlist_name": name,
            "description": desc,
            "search_queries": flat[:24],
            "genre_groups": genre_groups,
        }
    except Exception as e:
        print(f"Warning: ai_mood_playlist_plan failed: {e}")
        return base


def spotify_token_request(payload: dict) -> dict | None:
    cfg = get_spotify_config()
    if not cfg["client_id"] or not cfg["client_secret"]:
        return None
    r = requests.post(
        "https://accounts.spotify.com/api/token",
        data=payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        auth=(cfg["client_id"], cfg["client_secret"]),
        timeout=30,
    )
    if r.status_code != 200:
        print(f"Spotify token error: {r.status_code} {r.text}")
        return None
    return r.json()


def spotify_refresh_access_token(refresh_token: str) -> dict | None:
    return spotify_token_request(
        {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        }
    )


def spotify_api_request(
    method: str,
    url: str,
    access_token: str,
    **kwargs,
) -> requests.Response:
    headers = kwargs.pop("headers", {})
    headers["Authorization"] = f"Bearer {access_token}"
    return requests.request(method, url, headers=headers, timeout=30, **kwargs)


def spotify_error_body_message(resp: requests.Response) -> str:
    try:
        j = resp.json()
        err = j.get("error")
        if isinstance(err, dict) and err.get("message"):
            return str(err["message"])
        if isinstance(err, str):
            return err
    except Exception:
        pass
    return (resp.text or "").strip()[:600]


def spotify_developer_premium_hint(api_message: str) -> str | None:
    """Spotify Development Mode: app owner account may need Premium (policy change)."""
    if not api_message:
        return None
    low = api_message.lower()
    if "premium" in low and ("owner" in low or "development" in low or "subscription" in low):
        return (
            "The Spotify account that created this app on developer.spotify.com must have an active "
            "Spotify Premium subscription. Add Premium on that same account (not only the user logging in), "
            "wait a few hours for Spotify to refresh access, then use Connect Spotify again. "
            "See: https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security"
        )
    return None


# ---------- Email (Gmail) configuration ----------

GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")


def send_email(to_email: str, subject: str, body: str) -> None:
  """
  Send a plain-text email via Gmail SMTP.
  Requires:
    - GMAIL_USER
    - GMAIL_APP_PASSWORD (App Password, not your normal Gmail password)
  """
  if not GMAIL_USER or not GMAIL_APP_PASSWORD:
    raise RuntimeError("GMAIL_USER or GMAIL_APP_PASSWORD not configured")

  msg = MIMEText(body)
  msg["Subject"] = subject
  msg["From"] = GMAIL_USER
  msg["To"] = to_email

  with smtplib.SMTP("smtp.gmail.com", 587) as server:
    server.starttls()
    server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
    server.send_message(msg)

# ---------- Groq client setup ----------

groq_api_key = os.getenv('GROQ_API_KEY')
print(f"DEBUG: Looking for GROQ_API_KEY...")
print(f"DEBUG: GROQ_API_KEY found: {'Yes' if groq_api_key else 'No'}")
if groq_api_key:
    print(f"DEBUG: API key starts with: {groq_api_key[:10]}...")
    print(f"DEBUG: API key length: {len(groq_api_key)}")

client = None
if groq_api_key and groq_api_key != 'your_groq_api_key_here':
    try:
        client = Groq(api_key=groq_api_key)
        print("DEBUG: Groq client initialized successfully!")
    except Exception as e:
        print(f"Warning: Could not initialize Groq client: {e}")
else:
    print("Warning: GROQ_API_KEY not set or is placeholder. Chat functionality will not work.")
    print("Please set GROQ_API_KEY in your .env file to enable chat features.")


# ---------- SQLite database for daily check-ins ----------

DB_PATH = Path(__file__).parent / "checkins.db"


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS daily_checkins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mood TEXT NOT NULL,
                notes TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()
        conn.close()
        print(f"DEBUG: SQLite database initialized at {DB_PATH}")
    except Exception as e:
        print(f"Warning: Failed to initialize SQLite database: {e}")


init_db()


# ---------- NLP + Logistic Regression classifier setup ----------

VECTORIZER: TfidfVectorizer | None = None
CLASSIFIER: LogisticRegression | None = None
CLASS_LABELS: np.ndarray | None = None


def train_classifier() -> None:
    """
    Train a logistic regression classifier on the mental health dataset.
    Dataset path: Dataset/Mental Health Data.csv (relative to project root).
    """
    global VECTORIZER, CLASSIFIER, CLASS_LABELS

    try:
        project_root = Path(__file__).parent.parent
        data_path = project_root / "Dataset" / "Mental Health Data.csv"
        print(f"DEBUG: Loading dataset from {data_path}")

        df = pd.read_csv(data_path)

        if "statement" not in df.columns or "status" not in df.columns:
            raise ValueError(
                "Dataset must contain 'statement' and 'status' columns."
            )

        texts = df["statement"].astype(str).tolist()
        labels = df["status"].astype(str).tolist()

        VECTORIZER = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),
            lowercase=True,
            stop_words="english",
        )
        X = VECTORIZER.fit_transform(texts)

        CLASSIFIER = LogisticRegression(
            multi_class="multinomial",
            solver="lbfgs",
            max_iter=1000,
        )
        CLASSIFIER.fit(X, labels)

        CLASS_LABELS = CLASSIFIER.classes_

        print("DEBUG: Classifier trained successfully.")
        print(f"DEBUG: Classes: {list(CLASS_LABELS)}")
    except Exception as e:
        print(f"Warning: Failed to train classifier: {e}")
        VECTORIZER = None
        CLASSIFIER = None
        CLASS_LABELS = None


def classify_message(text: str):
    """
    Classify a single user message and return label and confidence.
    """
    if not text or VECTORIZER is None or CLASSIFIER is None or CLASS_LABELS is None:
        return None

    try:
        X = VECTORIZER.transform([text])
        probs = CLASSIFIER.predict_proba(X)[0]
        best_idx = int(np.argmax(probs))
        label = CLASS_LABELS[best_idx]
        confidence = float(probs[best_idx])

        probabilities = {
            str(CLASS_LABELS[i]): float(probs[i]) for i in range(len(CLASS_LABELS))
        }

        return {
            "label": str(label),
            "confidence": confidence,
            "probabilities": probabilities,
        }
    except Exception as e:
        print(f"Warning: Failed to classify message: {e}")
        return None


# Train classifier at startup
train_classifier()

# System prompt for the wellness chatbot
SYSTEM_PROMPT = """You are a compassionate and supportive mental wellness companion named MindEase. 
Your role is to:
- Provide empathetic, non-judgmental support
- Offer gentle guidance on mental health and wellness
- Suggest appropriate coping strategies and exercises
- Listen actively and validate feelings
- Maintain a warm, caring, and professional tone
- Never provide medical advice or diagnose conditions
- Encourage users to seek professional help when appropriate

Keep responses concise, supportive, and focused on the user's wellbeing."""

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "chatbot-api"}), 200


@app.route('/api/checkins', methods=['POST'])
def create_checkin():
    """
    Store a daily check-in entry in the SQLite database.
    Expected JSON body:
    {
        "mood": "😊",        # or any mood string
        "notes": "Had a good day",
        "email": "user@gmail.com"  # optional; if present, a notification email is sent
    }
    """
    try:
        data = request.get_json() or {}
        mood = (data.get("mood") or "").strip()
        notes = (data.get("notes") or "").strip()
        email = (data.get("email") or "").strip()

        if not mood or not notes:
            return jsonify({"error": "Both 'mood' and 'notes' are required."}), 400

        created_at = datetime.utcnow().isoformat()

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO daily_checkins (mood, notes, created_at) VALUES (?, ?, ?)",
            (mood, notes, created_at),
        )
        conn.commit()
        checkin_id = cur.lastrowid
        conn.close()

        # Send notification email if address provided
        email_sent = False
        if email:
            try:
                subject = "MindEase - New daily check-in"
                body = (
                    "Hi from MindEase!\n\n"
                    "Thank you for completing your daily check-in.\n\n"
                    f"Mood: {mood}\n"
                    f"Notes: {notes}\n"
                    f"Time (UTC): {created_at}\n\n"
                    "Keep taking care of yourself 💙"
                )
                send_email(email, subject, body)
                email_sent = True
            except Exception as e:
                # Log but do not fail the request if email sending fails
                print(f"Error sending notification email: {e}")

        return (
            jsonify(
                {
                    "id": checkin_id,
                    "mood": mood,
                    "notes": notes,
                    "created_at": created_at,
                    "email_sent": email_sent,
                }
            ),
            201,
        )
    except Exception as e:
        print(f"Error creating check-in: {e}")
        return (
            jsonify(
                {
                    "error": "Failed to create check-in entry.",
                    "details": str(e),
                }
            ),
            500,
        )


@app.route('/api/checkins', methods=['GET'])
def list_checkins():
    """
    Return recent daily check-ins, newest first.
    Optional query param: limit (default 30)
    """
    try:
        limit = request.args.get("limit", default=30, type=int)
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, mood, notes, created_at
            FROM daily_checkins
            ORDER BY datetime(created_at) DESC
            LIMIT ?
            """,
            (limit,),
        )
        rows = cur.fetchall()
        conn.close()

        items = [
            {
                "id": row["id"],
                "mood": row["mood"],
                "notes": row["notes"],
                "created_at": row["created_at"],
            }
            for row in rows
        ]

        return jsonify({"items": items}), 200
    except Exception as e:
        print(f"Error listing check-ins: {e}")
        return (
            jsonify(
                {
                    "error": "Failed to fetch check-in history.",
                    "details": str(e),
                }
            ),
            500,
        )


@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages and return AI responses"""
    try:
        # Check if Groq client is initialized
        if not client:
            return jsonify({
                "error": "Groq API key not configured",
                "message": "Please set GROQ_API_KEY in your .env file. Get your API key from https://console.groq.com/",
                "response": "I'm sorry, but the AI service is not configured. Please contact the administrator to set up the Groq API key."
            }), 503

        data = request.get_json()

        if not data or 'message' not in data:
            return jsonify({"error": "Missing 'message' field"}), 400

        user_message = data['message']
        conversation_history = data.get('history', [])

        # Classify the current user message using the trained model
        classification = classify_message(user_message)

        # Build messages array for Groq API
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Add conversation history (last 10 messages to avoid token limits)
        for msg in conversation_history[-10:]:
            role = "user" if msg.get("sender") == "user" else "assistant"
            messages.append({"role": role, "content": msg.get("text", "")})

        # Add classification result as an extra system message (if available)
        if classification is not None:
            messages.append({
                "role": "system",
                "content": (
                    "Automatic classification of the user's latest message:\n"
                    f"- Category: {classification['label']}\n"
                    f"- Confidence: {classification['confidence'] * 100:.1f}%\n\n"
                    "Use this as a hint to better tailor your response, "
                    "but do not make medical diagnoses."
                ),
            })

        # Add current user message
        messages.append({"role": "user", "content": user_message})

        # Call Groq API
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # You can change this to other Groq models
            messages=messages,
            temperature=0.7,
            max_tokens=500,
        )

        bot_response = completion.choices[0].message.content

        return jsonify({
            "response": bot_response,
            "success": True,
            "classification": classification,
        }), 200

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({
            "error": "An error occurred while processing your message",
            "details": str(e),
            "response": "I'm sorry, I encountered an error. Please try again later."
        }), 500


@app.route('/api/notifications/test-email', methods=['POST'])
def send_test_email():
    """
    Send a test notification email to verify Gmail settings.
    Expected JSON body:
    {
        "email": "user@gmail.com"
    }
    """
    try:
        data = request.get_json() or {}
        to_email = (data.get("email") or "").strip()

        if not to_email:
            return jsonify({"error": "Missing 'email' field."}), 400

        subject = "MindEase notification test"
        body = (
            "Hi from MindEase!\n\n"
            "This is a test notification email to confirm that your email settings are working.\n\n"
            "If you receive this, everything is configured correctly."
        )

        send_email(to_email, subject, body)

        return jsonify({"success": True, "message": "Test email sent."}), 200
    except Exception as e:
        print(f"Error sending test email: {e}")
        return jsonify({"error": "Failed to send test email.", "details": str(e)}), 500


@app.route("/api/spotify/status", methods=["GET"])
def spotify_status():
    """Whether Spotify API credentials are configured on the server."""
    cfg = get_spotify_config()
    ok = bool(cfg["client_id"] and cfg["client_secret"] and cfg["redirect_uri"])
    return jsonify(
        {
            "configured": ok,
            "authorize_path": "/api/spotify/login",
            "login_url": f"{request.url_root.rstrip('/')}/api/spotify/login",
        }
    ), 200


@app.route("/api/spotify/login", methods=["GET"])
def spotify_login():
    """
    Redirect user to Spotify authorization.
    Register SPOTIFY_REDIRECT_URI in the Spotify Developer Dashboard (must match exactly).
    """
    cfg = get_spotify_config()
    if not cfg["client_id"] or not cfg["redirect_uri"]:
        return (
            jsonify(
                {
                    "error": "Spotify is not configured.",
                    "hint": "Set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI in backend/.env",
                }
            ),
            503,
        )
    params = {
        "client_id": cfg["client_id"],
        "response_type": "code",
        "redirect_uri": cfg["redirect_uri"],
        "scope": SPOTIFY_SCOPES,
        "show_dialog": "false",
    }
    q = urlencode(params)
    url = f"https://accounts.spotify.com/authorize?{q}"
    return redirect(url)


@app.route("/api/spotify/callback", methods=["GET"])
def spotify_callback():
    """OAuth redirect target: exchange code and send user back to the app with a one-time nonce."""
    cfg = get_spotify_config()
    err = request.args.get("error")
    if err:
        return redirect(f"{cfg['frontend_url']}/playlist?spotify_error={quote(err)}")

    code = request.args.get("code")
    if not code:
        return redirect(f"{cfg['frontend_url']}/playlist?spotify_error=missing_code")

    token_json = spotify_token_request(
        {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": cfg["redirect_uri"],
        }
    )
    if not token_json or "access_token" not in token_json:
        return redirect(f"{cfg['frontend_url']}/playlist?spotify_error=token_exchange_failed")

    _cleanup_spotify_pending()
    nonce = secrets.token_urlsafe(32)
    SPOTIFY_PENDING_TOKENS[nonce] = {
        "at": token_json["access_token"],
        "rt": token_json.get("refresh_token"),
        "exp": time.time() + float(token_json.get("expires_in", 3600)),
        "created": time.time(),
    }
    return redirect(f"{cfg['frontend_url']}/playlist?spotify_nonce={nonce}")


@app.route("/api/spotify/claim", methods=["POST"])
def spotify_claim():
    """
    Exchange a one-time nonce (from ?spotify_nonce= after login) for tokens.
    Body: { "nonce": "..." }
    """
    _cleanup_spotify_pending()
    data = request.get_json() or {}
    nonce = (data.get("nonce") or "").strip()
    if not nonce or nonce not in SPOTIFY_PENDING_TOKENS:
        return jsonify({"error": "Invalid or expired session. Connect Spotify again."}), 400

    entry = SPOTIFY_PENDING_TOKENS.pop(nonce)
    return (
        jsonify(
            {
                "access_token": entry["at"],
                "refresh_token": entry.get("rt"),
                "expires_at": entry["exp"],
            }
        ),
        200,
    )


@app.route("/api/spotify/refresh", methods=["POST"])
def spotify_refresh_route():
    """Body: { "refresh_token": "..." } -> new access_token (and optional refresh_token)."""
    data = request.get_json() or {}
    rt = (data.get("refresh_token") or "").strip()
    if not rt:
        return jsonify({"error": "refresh_token required"}), 400
    token_json = spotify_refresh_access_token(rt)
    if not token_json or "access_token" not in token_json:
        return jsonify({"error": "Refresh failed"}), 401
    return (
        jsonify(
            {
                "access_token": token_json["access_token"],
                "refresh_token": token_json.get("refresh_token", rt),
                "expires_at": time.time() + float(token_json.get("expires_in", 3600)),
            }
        ),
        200,
    )


@app.route("/api/playlist/generate-spotify", methods=["POST"])
def generate_spotify_playlist():
    """
    Create a playlist on the user's Spotify account using AI-chosen search queries.
    JSON body:
    {
      "access_token": "...",
      "refresh_token": optional,
      "mood": "calm|focus|uplift|sleep",
      "notes": optional string,
      "target_tracks": optional int (default 18, max 40)
    }
    """
    try:
        data = request.get_json() or {}
        access_token = (data.get("access_token") or "").strip()
        refresh_token = (data.get("refresh_token") or "").strip() or None
        mood = (data.get("mood") or "calm").strip()
        notes = (data.get("notes") or "").strip() or None
        target = data.get("target_tracks", 18)
        try:
            target = int(target)
        except (TypeError, ValueError):
            target = 18
        target = max(8, min(target, 40))

        if not access_token:
            return jsonify({"error": "access_token required"}), 400

        # refresh if client sent expires_at and we're close to expiry
        exp = data.get("expires_at")
        if exp is not None:
            try:
                if time.time() > float(exp) - 60 and refresh_token:
                    refreshed = spotify_refresh_access_token(refresh_token)
                    if refreshed and refreshed.get("access_token"):
                        access_token = refreshed["access_token"]
                        refresh_token = refreshed.get("refresh_token") or refresh_token
            except (TypeError, ValueError):
                pass

        me = spotify_api_request(
            "GET", "https://api.spotify.com/v1/me", access_token
        )
        if me.status_code == 401 and refresh_token:
            refreshed = spotify_refresh_access_token(refresh_token)
            if refreshed and refreshed.get("access_token"):
                access_token = refreshed["access_token"]
                refresh_token = refreshed.get("refresh_token") or refresh_token
                me = spotify_api_request(
                    "GET", "https://api.spotify.com/v1/me", access_token
                )
        if me.status_code != 200:
            detail = spotify_error_body_message(me)
            hint = spotify_developer_premium_hint(detail)
            payload = {
                "error": "Spotify rejected this request. You may need to reconnect after fixing the issue.",
                "details": detail or me.text[:300],
            }
            if hint:
                payload["hint"] = hint
            http_code = 403 if me.status_code == 403 else 401
            return jsonify(payload), http_code
        user = me.json()
        user_id = user.get("id")
        if not user_id:
            return jsonify({"error": "Could not read Spotify user id."}), 500

        plan = ai_mood_playlist_plan(mood, notes)
        genre_groups = plan.get("genre_groups") or []
        if not genre_groups:
            genre_groups = [
                {
                    "genre": "Your picks",
                    "queries": plan.get("search_queries") or [],
                }
            ]

        def search_tracks(q: str, lim: int) -> requests.Response:
            nonlocal access_token, refresh_token
            r = spotify_api_request(
                "GET",
                "https://api.spotify.com/v1/search",
                access_token,
                params={"q": q, "type": "track", "limit": lim},
            )
            if r.status_code == 401 and refresh_token:
                refreshed = spotify_refresh_access_token(refresh_token)
                if refreshed and refreshed.get("access_token"):
                    access_token = refreshed["access_token"]
                    refresh_token = refreshed.get("refresh_token") or refresh_token
                r = spotify_api_request(
                    "GET",
                    "https://api.spotify.com/v1/search",
                    access_token,
                    params={"q": q, "type": "track", "limit": lim},
                )
            return r

        n_groups = len(genre_groups)
        base_cap = target // n_groups if n_groups else target
        rem = target % n_groups if n_groups else 0

        uris: list[str] = []
        seen: set[str] = set()
        tracks_by_genre: list[dict] = []

        for gi, group in enumerate(genre_groups):
            if len(uris) >= target:
                break
            genre_label = str(group.get("genre") or "Mix").strip() or "Mix"
            group_queries = group.get("queries") or []
            cap = base_cap + (1 if gi < rem else 0)
            cap = min(cap, max(0, target - len(uris)))
            if cap <= 0:
                continue
            section_tracks: list[dict] = []
            for q in group_queries:
                if len(section_tracks) >= cap or len(uris) >= target:
                    break
                lim = min(10, max(1, cap - len(section_tracks) + 2))
                r = search_tracks(q, lim)
                if r.status_code != 200:
                    continue
                items = (r.json().get("tracks") or {}).get("items") or []
                for tr in items:
                    if not tr or not isinstance(tr, dict):
                        continue
                    uri = tr.get("uri")
                    if not uri or uri in seen:
                        continue
                    if len(section_tracks) >= cap or len(uris) >= target:
                        break
                    seen.add(uri)
                    uris.append(uri)
                    section_tracks.append(spotify_track_card(tr))
            if section_tracks:
                tracks_by_genre.append({"genre": genre_label, "tracks": section_tracks})

        track_rows = [t for sec in tracks_by_genre for t in sec["tracks"]]

        if len(uris) < 5:
            return (
                jsonify(
                    {
                        "error": "Not enough tracks found. Try again or pick another mood.",
                    }
                ),
                502,
            )

        create = spotify_api_request(
            "POST",
            f"https://api.spotify.com/v1/users/{user_id}/playlists",
            access_token,
            json={
                "name": plan["playlist_name"],
                "description": plan["description"][:300],
                "public": False,
            },
        )
        if create.status_code not in (200, 201):
            if create.status_code == 401 and refresh_token:
                refreshed = spotify_refresh_access_token(refresh_token)
                if refreshed and refreshed.get("access_token"):
                    access_token = refreshed["access_token"]
                    refresh_token = refreshed.get("refresh_token") or refresh_token
                create = spotify_api_request(
                    "POST",
                    f"https://api.spotify.com/v1/users/{user_id}/playlists",
                    access_token,
                    json={
                        "name": plan["playlist_name"],
                        "description": plan["description"][:300],
                        "public": False,
                    },
                )
        if create.status_code not in (200, 201):
            return (
                jsonify(
                    {
                        "error": "Could not create playlist.",
                        "details": create.text[:300],
                    }
                ),
                create.status_code,
            )

        playlist = create.json()
        playlist_id = playlist.get("id")
        playlist_url = playlist.get("external_urls", {}).get("spotify")
        if not playlist_id:
            return jsonify({"error": "Spotify did not return a playlist id."}), 500

        for i in range(0, len(uris), 100):
            chunk = uris[i : i + 100]
            add = spotify_api_request(
                "POST",
                f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks",
                access_token,
                json={"uris": chunk},
            )
            if add.status_code not in (200, 201):
                return (
                    jsonify(
                        {
                            "error": "Playlist created but adding tracks failed.",
                            "playlist_id": playlist_id,
                            "playlist_url": playlist_url,
                            "details": add.text[:200],
                        }
                    ),
                    502,
                )

        # Re-fetch playlist from Spotify so the site gets full track objects (art, links).
        collected: list[dict] = []
        offset = 0
        while offset < len(uris):
            ptr = spotify_api_request(
                "GET",
                f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks",
                access_token,
                params={"limit": 50, "offset": offset},
            )
            if ptr.status_code == 401 and refresh_token:
                refreshed = spotify_refresh_access_token(refresh_token)
                if refreshed and refreshed.get("access_token"):
                    access_token = refreshed["access_token"]
                    refresh_token = refreshed.get("refresh_token") or refresh_token
                ptr = spotify_api_request(
                    "GET",
                    f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks",
                    access_token,
                    params={"limit": 50, "offset": offset},
                )
            if ptr.status_code != 200:
                print(f"playlist tracks fetch failed: {ptr.status_code} {ptr.text[:200]}")
                break
            batch = ptr.json().get("items") or []
            if not batch:
                break
            for it in batch:
                tr = it.get("track") if isinstance(it, dict) else None
                if tr and isinstance(tr, dict):
                    collected.append(spotify_track_card(tr))
            offset += len(batch)
            if len(batch) < 50:
                break

        if len(collected) >= len(uris) // 2 and len(collected) > 0:
            lens = [len(sec["tracks"]) for sec in tracks_by_genre]
            if lens and sum(lens) == len(collected):
                idx_run = 0
                rebuilt: list[dict] = []
                for si, sec in enumerate(tracks_by_genre):
                    n = lens[si]
                    chunk = collected[idx_run : idx_run + n]
                    idx_run += n
                    rebuilt.append({"genre": sec["genre"], "tracks": chunk})
                tracks_by_genre = rebuilt
            else:
                tracks_by_genre = [
                    {
                        "genre": "Your playlist",
                        "tracks": collected[: len(uris)],
                    }
                ]
            track_rows = [t for sec in tracks_by_genre for t in sec["tracks"]]

        return (
            jsonify(
                {
                    "success": True,
                    "playlist_name": plan["playlist_name"],
                    "playlist_id": playlist_id,
                    "playlist_url": playlist_url,
                    "track_count": len(uris),
                    "tracks_by_genre": tracks_by_genre,
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "tracks_preview": track_rows[:50],
                }
            ),
            200,
        )
    except Exception as e:
        print(f"generate_spotify_playlist error: {e}")
        return jsonify({"error": "Playlist generation failed.", "details": str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
