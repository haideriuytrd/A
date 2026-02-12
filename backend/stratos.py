from __future__ import annotations

from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse, HTMLResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import os
import logging
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Union, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Allow an external process (packager) to override the frontend build path.
# When packaged with PyInstaller we'll set FRONTEND_BUILD_DIR env var to the
# location where the static build files are available inside the bundle.
FRONTEND_BUILD_DIR = Path(os.environ.get('FRONTEND_BUILD_DIR', ROOT_DIR / 'frontend' / 'build'))

# Configure logging to file for production debugging
log_file = ROOT_DIR / "stratos_backend.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)
logger.info(f"Frontend build directory: {FRONTEND_BUILD_DIR}")
logger.info(f"Directory exists: {FRONTEND_BUILD_DIR.exists()}")

# Create FastAPI app before any mounts or decorators
app = FastAPI()

api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Serve other frontend static files if present (production build)
if FRONTEND_BUILD_DIR.exists():
    app.mount('/static', StaticFiles(directory=str(FRONTEND_BUILD_DIR / "static")), name='frontend')

# MongoDB connection
# Allow missing environment variables when running the bundled executable.
# Fall back to empty/default values to avoid crashing at import time.
mongo_url = os.environ.get('MONGO_URL', '')
db_name = os.environ.get('DB_NAME', 'stratos')
client = AsyncIOMotorClient(mongo_url) if mongo_url else None
db: Optional[Any] = client[db_name] if client else None

# Helper to check database availability
def require_db() -> Any:
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    return db

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'stratos-secret-key-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days


# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    xp: int = 0
    level: int = 1
    streak: int = 0
    hearts: int = 5
    current_language: Optional[str] = None
    languages_learning: List[str] = []
    achievements: List[str] = []
    last_practice_date: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LanguageInfo(BaseModel):
    code: str
    name: str
    flag: str
    lessons_count: int = 0
    progress: int = 0

class LessonContent(BaseModel):
    type: str  # "multiple_choice", "written", "voice", "flashcard"
    question: str
    options: Optional[List[str]] = None
    correct_answer: str
    voice_url: Optional[str] = None
    hint: Optional[str] = None

class Lesson(BaseModel):
    id: str
    language: str
    title: str
    description: str
    order: int
    xp_reward: int = 10
    content: List[LessonContent]

class LessonProgress(BaseModel):
    lesson_id: str
    completed: bool = False
    score: int = 0
    completed_at: Optional[str] = None

class QuizSubmission(BaseModel):
    lesson_id: str
    answers: List[str]

class QuizResult(BaseModel):
    correct: int
    total: int
    xp_earned: int
    passed: bool
    new_level: Optional[int] = None
    streak_bonus: int = 0

class FlashcardSet(BaseModel):
    id: str
    language: str
    title: str
    cards: List[dict]

class Achievement(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    unlocked: bool = False
    unlocked_at: Optional[str] = None

class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    name: str
    xp: int
    level: int
    streak: int

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        'sub': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[dict]:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('sub')
        db_conn = require_db()
        user = await db_conn.users.find_one({'id': user_id}, {'_id': 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ SEED DATA ============

LANGUAGES = [
    {"code": "es", "name": "Spanish", "flag": "🇪🇸"},
    {"code": "fr", "name": "French", "flag": "🇫🇷"},
    {"code": "de", "name": "German", "flag": "🇩🇪"},
    {"code": "ja", "name": "Japanese", "flag": "🇯🇵"},
    {"code": "zh", "name": "Chinese", "flag": "🇨🇳"},
    {"code": "it", "name": "Italian", "flag": "🇮🇹"},
    {"code": "pt", "name": "Portuguese", "flag": "🇧🇷"},
    {"code": "ko", "name": "Korean", "flag": "🇰🇷"},
    {"code": "ru", "name": "Russian", "flag": "🇷🇺"},
    {"code": "ar", "name": "Arabic", "flag": "🇸🇦"},
]

SAMPLE_LESSONS = {
    "es": [
        {
            "id": "es-basics-1",
            "language": "es",
            "title": "Greetings",
            "description": "Learn basic Spanish greetings",
            "order": 1,
            "xp_reward": 15,
            "content": [
                {"type": "voice", "question": "Listen and repeat: Hola", "correct_answer": "hola", "voice_url": "/audio/es/hola.mp3", "hint": "Hello"},
                {"type": "multiple_choice", "question": "What does 'Buenos días' mean?", "options": ["Good night", "Good morning", "Goodbye", "Thank you"], "correct_answer": "Good morning"},
                {"type": "written", "question": "Write 'Thank you' in Spanish", "correct_answer": "gracias", "hint": "Starts with 'gra'"},
                {"type": "multiple_choice", "question": "How do you say 'Goodbye' in Spanish?", "options": ["Hola", "Gracias", "Adiós", "Por favor"], "correct_answer": "Adiós"},
            ]
        },
        {
            "id": "es-basics-2",
            "language": "es",
            "title": "Numbers",
            "description": "Count from 1 to 10 in Spanish",
            "order": 2,
            "xp_reward": 15,
            "content": [
                {"type": "voice", "question": "Listen and repeat: Uno, Dos, Tres", "correct_answer": "uno dos tres", "voice_url": "/audio/es/numbers.mp3"},
                {"type": "multiple_choice", "question": "What is 'Cinco' in English?", "options": ["Three", "Four", "Five", "Six"], "correct_answer": "Five"},
                {"type": "written", "question": "Write the number 7 in Spanish", "correct_answer": "siete", "hint": "Starts with 'si'"},
                {"type": "multiple_choice", "question": "What comes after 'ocho'?", "options": ["Siete", "Nueve", "Diez", "Seis"], "correct_answer": "Nueve"},
            ]
        },
        {
            "id": "es-basics-3",
            "language": "es",
            "title": "Colors",
            "description": "Learn colors in Spanish",
            "order": 3,
            "xp_reward": 20,
            "content": [
                {"type": "voice", "question": "Listen: Rojo means Red", "correct_answer": "rojo", "voice_url": "/audio/es/rojo.mp3"},
                {"type": "multiple_choice", "question": "What color is 'Azul'?", "options": ["Red", "Green", "Blue", "Yellow"], "correct_answer": "Blue"},
                {"type": "written", "question": "Write 'Green' in Spanish", "correct_answer": "verde", "hint": "Starts with 'ver'"},
                {"type": "multiple_choice", "question": "'Amarillo' is which color?", "options": ["Black", "White", "Yellow", "Orange"], "correct_answer": "Yellow"},
            ]
        },
    ],
    "fr": [
        {
            "id": "fr-basics-1",
            "language": "fr",
            "title": "Salutations",
            "description": "Learn French greetings",
            "order": 1,
            "xp_reward": 15,
            "content": [
                {"type": "voice", "question": "Listen and repeat: Bonjour", "correct_answer": "bonjour", "voice_url": "/audio/fr/bonjour.mp3", "hint": "Hello/Good day"},
                {"type": "multiple_choice", "question": "What does 'Merci' mean?", "options": ["Hello", "Goodbye", "Thank you", "Please"], "correct_answer": "Thank you"},
                {"type": "written", "question": "Write 'Goodbye' in French", "correct_answer": "au revoir", "hint": "Two words"},
                {"type": "multiple_choice", "question": "How do you say 'Please' in French?", "options": ["Merci", "S'il vous plaît", "Bonjour", "Pardon"], "correct_answer": "S'il vous plaît"},
            ]
        },
    ],
    "de": [
        {
            "id": "de-basics-1",
            "language": "de",
            "title": "Begrüßungen",
            "description": "Learn German greetings",
            "order": 1,
            "xp_reward": 15,
            "content": [
                {"type": "voice", "question": "Listen and repeat: Guten Tag", "correct_answer": "guten tag", "voice_url": "/audio/de/guten-tag.mp3"},
                {"type": "multiple_choice", "question": "What does 'Danke' mean?", "options": ["Hello", "Goodbye", "Thank you", "Please"], "correct_answer": "Thank you"},
                {"type": "written", "question": "Write 'Goodbye' in German", "correct_answer": "auf wiedersehen", "hint": "Means 'until we see again'"},
                {"type": "multiple_choice", "question": "How do you say 'Good morning'?", "options": ["Guten Abend", "Guten Morgen", "Gute Nacht", "Guten Tag"], "correct_answer": "Guten Morgen"},
            ]
        },
    ],
    "ja": [
        {
            "id": "ja-basics-1",
            "language": "ja",
            "title": "あいさつ (Greetings)",
            "description": "Learn Japanese greetings",
            "order": 1,
            "xp_reward": 15,
            "content": [
                {"type": "voice", "question": "Listen and repeat: こんにちは (Konnichiwa)", "correct_answer": "konnichiwa", "voice_url": "/audio/ja/konnichiwa.mp3"},
                {"type": "multiple_choice", "question": "What does 'ありがとう' mean?", "options": ["Hello", "Goodbye", "Thank you", "Please"], "correct_answer": "Thank you"},
                {"type": "written", "question": "Write 'Hello' in romaji", "correct_answer": "konnichiwa", "hint": "Starts with 'kon'"},
                {"type": "multiple_choice", "question": "How do you say 'Goodbye'?", "options": ["Ohayou", "Sayounara", "Arigatou", "Sumimasen"], "correct_answer": "Sayounara"},
            ]
        },
    ],
}

# Ensure every language has at least 4 meaningful sample lessons (generate greetings, numbers, colors, phrases)
common_phrases = {
    'es': {
        'hello': 'hola', 'thank': 'gracias', 'goodbye': 'adiós', 'please': 'por favor',
        'numbers': ['uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez'],
        'colors': ['rojo','azul','verde','amarillo','negro','blanco','naranja','morado'],
        'family': {'father': 'padre', 'mother': 'madre', 'brother': 'hermano', 'sister': 'hermana'},
        'travel': {'airport': 'aeropuerto', 'hotel': 'hotel', 'ticket': 'boleto', 'map': 'mapa'}
    },
    'fr': {
        'hello': 'bonjour', 'thank': 'merci', 'goodbye': 'au revoir', 'please': "s'il vous plaît",
        'numbers': ['un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix'],
        'colors': ['rouge','bleu','vert','jaune','noir','blanc','orange','violet'],
        'family': {'father': 'père', 'mother': 'mère', 'brother': 'frère', 'sister': 'sœur'},
        'travel': {'airport': 'aéroport', 'hotel': 'hôtel', 'ticket': 'billet', 'map': 'carte'}
    },
    'de': {
        'hello': 'hallo', 'thank': 'danke', 'goodbye': 'auf wiedersehen', 'please': 'bitte',
        'numbers': ['eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn'],
        'colors': ['rot','blau','grün','gelb','schwarz','weiß','orange','lila'],
        'family': {'father': 'vater', 'mother': 'mutter', 'brother': 'bruder', 'sister': 'schwester'},
        'travel': {'airport': 'flughafen', 'hotel': 'hotel', 'ticket': 'ticket', 'map': 'karte'}
    },
    'ja': {
        'hello': 'konnichiwa', 'thank': 'arigatou', 'goodbye': 'sayounara', 'please': 'onegaishimasu',
        'numbers': ['ichi','ni','san','shi','go','roku','shichi','hachi','kyuu','juu'],
        'colors': ['aka','ao','midori','ki','kuro','shiro','daidai','murasaki'],
        'family': {'father': 'otousan', 'mother': 'okaasan', 'brother': 'oniisan', 'sister': 'oneesan'},
        'travel': {'airport': 'kuukou', 'hotel': 'hoteru', 'ticket': 'kippu', 'map': 'chizu'}
    },
    'zh': {
        'hello': 'nǐ hǎo', 'thank': 'xièxie', 'goodbye': 'zàijiàn', 'please': 'qǐng',
        'numbers': ['yi','er','san','si','wu','liu','qi','ba','jiu','shi'],
        'colors': ['hóng','lán','lǜ','huáng','hēi','bái','chéng','zǐ'],
        'family': {'father': 'bàba', 'mother': 'māmā', 'brother': 'gēgē', 'sister': 'jiějiě'},
        'travel': {'airport': 'jīchǎng', 'hotel': 'jiǔdiàn', 'ticket': 'piào', 'map': 'dìtú'}
    },
    'it': {
        'hello': 'ciao', 'thank': 'grazie', 'goodbye': 'arrivederci', 'please': 'per favore',
        'numbers': ['uno','due','tre','quattro','cinque','sei','sette','otto','nove','dieci'],
        'colors': ['rosso','blu','verde','giallo','nero','bianco','arancione','viola'],
        'family': {'father': 'padre', 'mother': 'madre', 'brother': 'fratello', 'sister': 'sorella'},
        'travel': {'airport': 'aeroporto', 'hotel': 'hotel', 'ticket': 'biglietto', 'map': 'mappa'}
    },
    'pt': {
        'hello': 'olá', 'thank': 'obrigado', 'goodbye': 'adeus', 'please': 'por favor',
        'numbers': ['um','dois','três','quatro','cinco','seis','sete','oito','nove','dez'],
        'colors': ['vermelho','azul','verde','amarelo','preto','branco','laranja','roxo'],
        'family': {'father': 'pai', 'mother': 'mãe', 'brother': 'irmão', 'sister': 'irmã'},
        'travel': {'airport': 'aeroporto', 'hotel': 'hotel', 'ticket': 'bilhete', 'map': 'mapa'}
    },
    'ko': {
        'hello': 'annyeong', 'thank': 'gamsahamnida', 'goodbye': 'annyeonghi gaseyo', 'please': 'butakamnida',
        'numbers': ['hana','dul','set','net','daseot','yeoseot','ilgop','yeodal','ahop','yeol'],
        'colors': ['ppalgan','paran','nok','hwang','geomjeong','hayan','juhwang','bora'],
        'family': {'father': 'abeoji', 'mother': 'eomeoni', 'brother': 'hyeong', 'sister': 'nuna'},
        'travel': {'airport': 'gonghang', 'hotel': 'hotel', 'ticket': 'pyo', 'map': 'jido'}
    },
    'ru': {
        'hello': 'privet', 'thank': 'spasibo', 'goodbye': 'do svidaniya', 'please': 'pozhaluysta',
        'numbers': ['odin','dva','tri','chetyre','pyat','shest','sem','vosem','devyat','desyat'],
        'colors': ['krasnyy','siniy','zelyonyy','zholtyy','chernyy','belyy','oranzhevyy','fioletovyy'],
        'family': {'father': 'otez', 'mother': 'mat', 'brother': 'brat', 'sister': 'sestra'},
        'travel': {'airport': 'aeroport', 'hotel': 'otel', 'ticket': 'bilet', 'map': 'karta'}
    },
    'ar': {
        'hello': 'marhaba', 'thank': 'shukran', 'goodbye': 'maʿa s-salāma', 'please': 'min fadlak',
        'numbers': ['wahid','ithnan','thalatha','arbaʿa','khamsa','sitta','sab\'a','thamaniya','tis\'a','ashara'],
        'colors': ['ahmar','azraq','akhḍar','asfar','aswad','abyad','burtuqaali','banafsaji'],
        'family': {'father': 'ab', 'mother': 'umm', 'brother': 'akh', 'sister': 'ukht'},
        'travel': {'airport': 'mataar', 'hotel': 'funduq', 'ticket': 'tadhkira', 'map': 'kharita'}
    },
}

def make_greetings_lesson(code, name, data, order):
    hello = data.get('hello', f'hello_{code}')
    goodbye = data.get('goodbye', 'goodbye')
    thank = data.get('thank', 'thank you')
    return {
        'id': f"{code}-greetings-{order}",
        'language': code,
        'title': 'Greetings',
        'description': f'Basic greetings in {name}',
        'order': order,
        'xp_reward': 15,
        'content': [
            {'type': 'voice', 'question': f'Listen and repeat: {hello}', 'correct_answer': hello, 'voice_url': f'/audio/{code}/hello.mp3'},
            {'type': 'multiple_choice', 'question': f"What does '{hello}' mean?", 'options': ['Hello', 'Goodbye', 'Thank you', 'Please'], 'correct_answer': 'Hello'},
            {'type': 'written', 'question': f"How do you say 'Thank you' in {name}?", 'correct_answer': thank},
            {'type': 'multiple_choice', 'question': f"How do you say 'Goodbye' in {name}?", 'options': [goodbye, hello, thank, 'please'], 'correct_answer': goodbye},
        ]
    }

def make_numbers_lesson(code, name, data, order):
    nums = data.get('numbers', ['one','two','three','four','five'])
    return {
        'id': f"{code}-numbers-{order}",
        'language': code,
        'title': 'Numbers',
        'description': f'Counting basics in {name}',
        'order': order,
        'xp_reward': 15,
        'content': [
            {'type': 'voice', 'question': f'Listen and repeat: {nums[0]}, {nums[1]}, {nums[2]}', 'correct_answer': ' '.join(nums[:3])},
            {'type': 'multiple_choice', 'question': f"What is '{nums[2]}' in English?", 'options': ['One', 'Two', 'Three', 'Four'], 'correct_answer': 'Three'},
            {'type': 'written', 'question': f"Write the number 5 in {name}", 'correct_answer': nums[4]},
        ]
    }

def make_colors_lesson(code, name, data, order):
    cols = data.get('colors', ['red','blue','green','yellow'])
    return {
        'id': f"{code}-colors-{order}",
        'language': code,
        'title': 'Colors',
        'description': f'Common colors in {name}',
        'order': order,
        'xp_reward': 15,
        'content': [
            {'type': 'voice', 'question': f'Listen: {cols[0]} means {cols[0]}', 'correct_answer': cols[0]},
            {'type': 'multiple_choice', 'question': f"Which color is '{cols[1]}'?", 'options': ['Red','Green','Blue','Yellow'], 'correct_answer': 'Blue'},
            {'type': 'written', 'question': f"Write 'Green' in {name}", 'correct_answer': cols[2]},
        ]
    }

def make_phrases_lesson(code, name, data, order):
    return {
        'id': f"{code}-phrases-{order}",
        'language': code,
        'title': 'Useful Phrases',
        'description': f'Useful everyday phrases in {name}',
        'order': order,
        'xp_reward': 20,
        'content': [
            {'type': 'multiple_choice', 'question': 'How would you politely ask for help?', 'options': ['Can you help me?', 'I do not know', 'Goodbye', 'Thank you'], 'correct_answer': 'Can you help me?'},
            {'type': 'written', 'question': f"Translate 'Please' into {name}", 'correct_answer': data.get('please', 'please')},
            {'type': 'multiple_choice', 'question': 'Which phrase shows gratitude?', 'options': ['Hello','Thank you','Goodbye','Please'], 'correct_answer': 'Thank you'},
        ]
    }

def make_family_lesson(code, name, data, order):
    family = data.get('family', {})
    return {
        'id': f"{code}-family-{order}",
        'language': code,
        'title': 'Family Members',
        'description': f'Learn family vocabulary in {name}',
        'order': order,
        'xp_reward': 20,
        'content': [
            {'type': 'multiple_choice', 'question': f"How do you say 'Mother' in {name}?", 'options': [family.get('mother', 'mother'), family.get('father', 'father'), 'cousin', 'aunt'], 'correct_answer': family.get('mother', 'mother')},
            {'type': 'written', 'question': f"Write 'Father' in {name}", 'correct_answer': family.get('father', 'father')},
            {'type': 'multiple_choice', 'question': f"'{family.get('brother', 'brother')}' means:", 'options': ['Sister', 'Brother', 'Uncle', 'Grandfather'], 'correct_answer': 'Brother'},
        ]
    }

def make_travel_lesson(code, name, data, order):
    travel = data.get('travel', {})
    return {
        'id': f"{code}-travel-{order}",
        'language': code,
        'title': 'Travel & Directions',
        'description': f'Useful travel words in {name}',
        'order': order,
        'xp_reward': 25,
        'content': [
            {'type': 'multiple_choice', 'question': f"Where would you go to catch a flight in {name}?", 'options': [travel.get('hotel', 'hotel'), travel.get('airport', 'airport'), 'beach', 'park'], 'correct_answer': travel.get('airport', 'airport')},
            {'type': 'written', 'question': f"How do you say 'Ticket' in {name}?", 'correct_answer': travel.get('ticket', 'ticket')},
            {'type': 'multiple_choice', 'question': f"You need a '{travel.get('map', 'map')}' to find your way. What is it?", 'options': ['Compass', 'Phone', 'Map', 'Guide'], 'correct_answer': 'Map'},
        ]
    }

for lang in LANGUAGES:
    code = lang['code']
    name = lang['name']
    data = common_phrases.get(code, {})
    if code not in SAMPLE_LESSONS:
        SAMPLE_LESSONS[code] = []
    # Ensure at least 6 lessons with meaningful content
    while len(SAMPLE_LESSONS[code]) < 6:
        idx = len(SAMPLE_LESSONS[code]) + 1
        if idx == 1:
            SAMPLE_LESSONS[code].append(make_greetings_lesson(code, name, data, idx))
        elif idx == 2:
            SAMPLE_LESSONS[code].append(make_numbers_lesson(code, name, data, idx))
        elif idx == 3:
            SAMPLE_LESSONS[code].append(make_colors_lesson(code, name, data, idx))
        elif idx == 4:
            SAMPLE_LESSONS[code].append(make_phrases_lesson(code, name, data, idx))
        elif idx == 5:
            SAMPLE_LESSONS[code].append(make_family_lesson(code, name, data, idx))
        else:
            SAMPLE_LESSONS[code].append(make_travel_lesson(code, name, data, idx))

FLASHCARD_SETS = {
    "es": [
        {
            "id": "es-flash-1",
            "language": "es",
            "title": "Basic Words",
            "cards": [
                {"front": "Hello", "back": "Hola", "voice_url": "/audio/es/hola.mp3"},
                {"front": "Goodbye", "back": "Adiós", "voice_url": "/audio/es/adios.mp3"},
                {"front": "Thank you", "back": "Gracias", "voice_url": "/audio/es/gracias.mp3"},
                {"front": "Please", "back": "Por favor", "voice_url": "/audio/es/porfavor.mp3"},
                {"front": "Yes", "back": "Sí", "voice_url": "/audio/es/si.mp3"},
                {"front": "No", "back": "No", "voice_url": "/audio/es/no.mp3"},
            ]
        },
        {
            "id": "es-flash-2",
            "language": "es",
            "title": "Travel Essentials",
            "cards": [
                {"front": "Airport", "back": "Aeropuerto"},
                {"front": "Passport", "back": "Pasaporte"},
                {"front": "Ticket", "back": "Boleto"},
                {"front": "Bag", "back": "Maleta"},
            ]
        }
    ],
    "fr": [
        {
            "id": "fr-flash-1",
            "language": "fr",
            "title": "Basic Words",
            "cards": [
                {"front": "Hello", "back": "Bonjour", "voice_url": "/audio/fr/bonjour.mp3"},
                {"front": "Goodbye", "back": "Au revoir", "voice_url": "/audio/fr/aurevoir.mp3"},
                {"front": "Thank you", "back": "Merci", "voice_url": "/audio/fr/merci.mp3"},
                {"front": "Please", "back": "S'il vous plaît", "voice_url": "/audio/fr/svp.mp3"},
            ]
        }
    ],
    "it": [
        {
            "id": "it-flash-1",
            "language": "it",
            "title": "Common Phrases",
            "cards": [
                {"front": "How much does it cost?", "back": "Quanto costa?"},
                {"front": "Where is the bathroom?", "back": "Dov'è il bagno?"},
                {"front": "I don't understand", "back": "Non capisco"},
            ]
        }
    ],
    "ja": [
        {
            "id": "ja-flash-1",
            "language": "ja",
            "title": "Essential Verbs",
            "cards": [
                {"front": "To eat", "back": "Taberu"},
                {"front": "To drink", "back": "Nomu"},
                {"front": "To go", "back": "Iku"},
                {"front": "To come", "back": "Kuru"},
            ]
        }
    ]
}

ACHIEVEMENTS = [
    {"id": "first-lesson", "name": "First Steps", "description": "Complete your first lesson", "icon": "baby"},
    {"id": "streak-3", "name": "On Fire", "description": "Maintain a 3-day streak", "icon": "flame"},
    {"id": "streak-7", "name": "Week Warrior", "description": "Maintain a 7-day streak", "icon": "calendar"},
    {"id": "streak-30", "name": "Monthly Master", "description": "Maintain a 30-day streak", "icon": "trophy"},
    {"id": "xp-100", "name": "Century Club", "description": "Earn 100 XP", "icon": "zap"},
    {"id": "xp-500", "name": "XP Master", "description": "Earn 500 XP", "icon": "star"},
    {"id": "xp-1000", "name": "Legend", "description": "Earn 1000 XP", "icon": "crown"},
    {"id": "perfect-lesson", "name": "Perfectionist", "description": "Complete a lesson with 100% accuracy", "icon": "target"},
    {"id": "multi-language", "name": "Polyglot", "description": "Start learning 3 languages", "icon": "globe"},
    {"id": "level-5", "name": "Rising Star", "description": "Reach level 5", "icon": "sparkles"},
    {"id": "level-10", "name": "Expert Learner", "description": "Reach level 10", "icon": "award"},
]

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    db_conn = require_db()
    existing = await db_conn.users.find_one({'email': user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        'id': user_id,
        'email': user_data.email,
        'name': user_data.name,
        'password': hash_password(user_data.password),
        'xp': 0,
        'level': 1,
        'streak': 0,
        'hearts': 5,
        'current_language': None,
        'languages_learning': [],
        'achievements': [],
        'last_practice_date': None,
        'created_at': now
    }
    
    await db_conn.users.insert_one(user_doc)
    
    token = create_token(user_id)
    user_response = UserResponse(**{k: v for k, v in user_doc.items() if k != 'password'})
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    db_conn = require_db()
    user = await db_conn.users.find_one({'email': credentials.email}, {'_id': 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user['id'])
    user_response = UserResponse(**{k: v for k, v in user.items() if k != 'password'})
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**{k: v for k, v in user.items() if k != 'password'})

# ============ LANGUAGE ROUTES ============

@api_router.get("/languages", response_model=List[LanguageInfo])
async def get_languages(user: dict = Depends(get_current_user)):
    db_conn = require_db()
    result = []
    for lang in LANGUAGES:
        lessons = SAMPLE_LESSONS.get(lang['code'], [])
        progress_docs = await db_conn.lesson_progress.find({
            'user_id': user['id'],
            'language': lang['code'],
            'completed': True
        }, {'_id': 0}).to_list(100)
        
        progress_pct = int((len(progress_docs) / max(len(lessons), 1)) * 100) if lessons else 0
        
        result.append(LanguageInfo(
            code=lang['code'],
            name=lang['name'],
            flag=lang['flag'],
            lessons_count=len(lessons),
            progress=progress_pct
        ))
    return result

@api_router.post("/languages/{code}/start")
async def start_language(code: str, user: dict = Depends(get_current_user)):
    db_conn = require_db()
    lang = next((l for l in LANGUAGES if l['code'] == code), None)
    if not lang:
        raise HTTPException(status_code=404, detail="Language not found")
    
    languages = user.get('languages_learning', [])
    if code not in languages:
        languages.append(code)
    
    await db_conn.users.update_one(
        {'id': user['id']},
        {'$set': {'current_language': code, 'languages_learning': languages}}
    )
    
    # Check polyglot achievement
    if len(languages) >= 3:
        await check_and_award_achievement(user['id'], 'multi-language')
    
    return {"message": f"Started learning {lang['name']}", "language": lang}

# ============ LESSON ROUTES ============

@api_router.get("/lessons/{language}", response_model=List[dict])
async def get_lessons(language: str, user: dict = Depends(get_current_user)):
    db_conn = require_db()
    lessons = SAMPLE_LESSONS.get(language, [])
    
    # Get user progress
    progress_docs = await db_conn.lesson_progress.find({
        'user_id': user['id'],
        'language': language
    }, {'_id': 0}).to_list(100)
    
    progress_map = {p['lesson_id']: p for p in progress_docs}
    
    result = []
    for lesson in lessons:
        lesson_data = {
            'id': lesson['id'],
            'title': lesson['title'],
            'description': lesson['description'],
            'order': lesson['order'],
            'xp_reward': lesson['xp_reward'],
            'completed': progress_map.get(lesson['id'], {}).get('completed', False),
            'score': progress_map.get(lesson['id'], {}).get('score', 0),
            'locked': False,
        }
        # First lesson always unlocked
        if lesson['order'] == 1:
            lesson_data['locked'] = False
        else:
            # Lesson is locked if previous-order lessons are not completed
            if lesson['order'] > 1:
                prev_ids = {l['id'] for l in lessons if l.get('order') == lesson['order'] - 1}
                lesson_data['locked'] = not any(progress_map.get(pid, {}).get('completed', False) for pid in prev_ids)
        result.append(lesson_data)
    
    return result

@api_router.get("/lessons/{language}/{lesson_id}")
async def get_lesson_detail(language: str, lesson_id: str, user: dict = Depends(get_current_user)):
    lessons = SAMPLE_LESSONS.get(language, [])
    lesson = next((l for l in lessons if l['id'] == lesson_id), None)
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    return lesson

@api_router.post("/lessons/{language}/{lesson_id}/complete", response_model=QuizResult)
async def complete_lesson(language: str, lesson_id: str, submission: QuizSubmission, user: dict = Depends(get_current_user)):
    db_conn = require_db()
    lessons = SAMPLE_LESSONS.get(language, [])
    lesson = next((l for l in lessons if l['id'] == lesson_id), None)
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Calculate score
    correct = 0
    for i, answer in enumerate(submission.answers):
        if i < len(lesson['content']):
            expected = lesson['content'][i]['correct_answer'].lower().strip()
            if answer.lower().strip() == expected:
                correct += 1
    
    total = len(lesson['content'])
    score_pct = int((correct / total) * 100)
    passed = score_pct >= 70
    
    # Calculate XP
    base_xp = lesson['xp_reward'] if passed else lesson['xp_reward'] // 2
    streak_bonus = 0
    
    # Update streak
    now = datetime.now(timezone.utc)
    today = now.date().isoformat()
    last_practice = user.get('last_practice_date')
    
    new_streak = user.get('streak', 0)
    if last_practice:
        last_date = datetime.fromisoformat(last_practice).date()
        days_diff = (now.date() - last_date).days
        if days_diff == 1:
            new_streak += 1
            streak_bonus = min(new_streak * 2, 20)  # Max 20 bonus XP
        elif days_diff > 1:
            new_streak = 1
        # Same day: keep streak
    else:
        new_streak = 1
    
    total_xp = base_xp + streak_bonus
    new_total_xp = user.get('xp', 0) + total_xp
    
    # Calculate level (100 XP per level)
    new_level = (new_total_xp // 100) + 1
    old_level = user.get('level', 1)
    
    # Update user
    update_data = {
        'xp': new_total_xp,
        'level': new_level,
        'streak': new_streak,
        'last_practice_date': today
    }
    
    # Deduct heart if failed
    if not passed:
        hearts = user.get('hearts', 5)
        if hearts > 0:
            update_data['hearts'] = hearts - 1
    
    await db_conn.users.update_one({'id': user['id']}, {'$set': update_data})
    
    # Save progress
    await db_conn.lesson_progress.update_one(
        {'user_id': user['id'], 'lesson_id': lesson_id},
        {'$set': {
            'user_id': user['id'],
            'lesson_id': lesson_id,
            'language': language,
            'completed': passed,
            'score': score_pct,
            'completed_at': now.isoformat()
        }},
        upsert=True
    )
    
    # Check achievements
    await check_lesson_achievements(user['id'], new_streak, new_total_xp, new_level, score_pct == 100)
    
    return QuizResult(
        correct=correct,
        total=total,
        xp_earned=total_xp,
        passed=passed,
        new_level=new_level if new_level > old_level else None,
        streak_bonus=streak_bonus
    )

# ============ FLASHCARD ROUTES ============

@api_router.get("/flashcards/{language}", response_model=List[FlashcardSet])
async def get_flashcards(language: str, user: dict = Depends(get_current_user)):
    sets = FLASHCARD_SETS.get(language, [])
    return [FlashcardSet(**s) for s in sets]

# ============ LEADERBOARD ROUTES ============

@api_router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(user: dict = Depends(get_current_user)):
    db_conn = require_db()
    users = await db_conn.users.find({}, {'_id': 0, 'password': 0}).sort('xp', -1).limit(50).to_list(50)
    
    result = []
    for i, u in enumerate(users):
        result.append(LeaderboardEntry(
            rank=i + 1,
            user_id=u['id'],
            name=u['name'],
            xp=u.get('xp', 0),
            level=u.get('level', 1),
            streak=u.get('streak', 0)
        ))
    
    return result

# ============ ACHIEVEMENTS ROUTES ============

@api_router.get("/achievements", response_model=List[Achievement])
async def get_achievements(user: dict = Depends(get_current_user)):
    user_achievements = user.get('achievements', [])
    
    result = []
    for ach in ACHIEVEMENTS:
        unlocked = ach['id'] in user_achievements
        result.append(Achievement(
            id=ach['id'],
            name=ach['name'],
            description=ach['description'],
            icon=ach['icon'],
            unlocked=unlocked
        ))
    
    return result

async def check_and_award_achievement(user_id: str, achievement_id: str):
    db_conn = require_db()
    user = await db_conn.users.find_one({'id': user_id}, {'_id': 0})
    if not user:
        return
    
    achievements = user.get('achievements', [])
    if achievement_id not in achievements:
        achievements.append(achievement_id)
        await db_conn.users.update_one({'id': user_id}, {'$set': {'achievements': achievements}})

async def check_lesson_achievements(user_id: str, streak: int, xp: int, level: int, perfect: bool):
    db_conn = require_db()
    # First lesson
    progress_count = await db_conn.lesson_progress.count_documents({'user_id': user_id, 'completed': True})
    if progress_count == 1:
        await check_and_award_achievement(user_id, 'first-lesson')
    
    # Streak achievements
    if streak >= 3:
        await check_and_award_achievement(user_id, 'streak-3')
    if streak >= 7:
        await check_and_award_achievement(user_id, 'streak-7')
    if streak >= 30:
        await check_and_award_achievement(user_id, 'streak-30')
    
    # XP achievements
    if xp >= 100:
        await check_and_award_achievement(user_id, 'xp-100')
    if xp >= 500:
        await check_and_award_achievement(user_id, 'xp-500')
    if xp >= 1000:
        await check_and_award_achievement(user_id, 'xp-1000')
    
    # Perfect lesson
    if perfect:
        await check_and_award_achievement(user_id, 'perfect-lesson')
    
    # Level achievements
    if level >= 5:
        await check_and_award_achievement(user_id, 'level-5')
    if level >= 10:
        await check_and_award_achievement(user_id, 'level-10')

# ============ PROFILE ROUTES ============

@api_router.put("/profile")
async def update_profile(name: str, user: dict = Depends(get_current_user)):
    db_conn = require_db()
    await db_conn.users.update_one({'id': user['id']}, {'$set': {'name': name}})
    return {"message": "Profile updated"}

@api_router.post("/hearts/refill")
async def refill_hearts(user: dict = Depends(get_current_user)):
    db_conn = require_db()
    # In a real app, this would cost gems or require waiting
    await db_conn.users.update_one({'id': user['id']}, {'$set': {'hearts': 5}})
    return {"message": "Hearts refilled", "hearts": 5}

# ============ ROOT ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Stratos API - Elevate Your Language Skills"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

if not FRONTEND_BUILD_DIR.exists():
    @app.get("/", include_in_schema=False)
    async def root_redirect():
        """Redirect root to /api/ so visiting the server base URL shows the API."""
        return RedirectResponse(url="/api/")

# Serve 404.html or index.html for any unmatched routes (SPA routing)
@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa_fallback(full_path: str):
    """Serve index.html for any unmatched routes (client-side routing)."""
    if full_path.startswith('api/'):
        # API routes should have been handled already, return 404
        return JSONResponse(status_code=404, content={"detail": "Not Found"})
    
    index_path = FRONTEND_BUILD_DIR / "index.html"
    if index_path.exists():
        with open(index_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        # Inject the API origin so the frontend knows where to call
        html_with_api = html_content.replace(
            '<div id="root"></div>',
            '<div id="root"></div><script>window.__API_ORIGIN = window.location.origin;</script>'
        )
        return HTMLResponse(content=html_with_api)
    return HTMLResponse(content="Not Found", status_code=404)

@app.on_event("shutdown")
async def shutdown_db_client():
    if client is not None:
        client.close()
