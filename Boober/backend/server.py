from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, WebSocket, WebSocketDisconnect, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from enum import Enum
import os
import uuid
import jwt
import bcrypt
import logging
import json
import secrets
from pathlib import Path
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# Environment setup
ROOT_DIR = Path(__file__).parent
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'boober_db')
# Generate secure JWT secret if not provided
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_urlsafe(32))
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address)

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {
            "DRIVERS": [],
            "MARSHALS": [],
            "PASSENGERS": [],
            "ALL": []
        }
        self.user_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, channel: str, user_id: str = None):
        await websocket.accept()
        if channel in self.active_connections:
            self.active_connections[channel].append(websocket)
        self.active_connections["ALL"].append(websocket)
        if user_id:
            self.user_connections[user_id] = websocket

    def disconnect(self, websocket: WebSocket, channel: str, user_id: str = None):
        if channel in self.active_connections:
            if websocket in self.active_connections[channel]:
                self.active_connections[channel].remove(websocket)
        if websocket in self.active_connections["ALL"]:
            self.active_connections["ALL"].remove(websocket)
        if user_id and user_id in self.user_connections:
            del self.user_connections[user_id]

    async def broadcast_to_channel(self, message: dict, channel: str):
        message_json = json.dumps(message, default=str)
        disconnected = []
        for connection in self.active_connections.get(channel, []):
            try:
                await connection.send_text(message_json)
            except:
                disconnected.append(connection)
        for conn in disconnected:
            if conn in self.active_connections.get(channel, []):
                self.active_connections[channel].remove(conn)

    async def broadcast_to_all(self, message: dict):
        message_json = json.dumps(message, default=str)
        disconnected = []
        for connection in self.active_connections["ALL"]:
            try:
                await connection.send_text(message_json)
            except:
                disconnected.append(connection)
        for conn in disconnected:
            if conn in self.active_connections["ALL"]:
                self.active_connections["ALL"].remove(conn)

    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.user_connections:
            try:
                await self.user_connections[user_id].send_text(json.dumps(message, default=str))
            except:
                del self.user_connections[user_id]

manager = ConnectionManager()

# MongoDB connection
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Create the main app
app = FastAPI(title="Boober API", version="1.0.0")

# SECURITY: Add rate limiter state to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Enums
class UserRole(str, Enum):
    DRIVER = "DRIVER"
    PASSENGER = "PASSENGER"
    MARSHAL = "MARSHAL"

class OnboardingStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    PENDING_DETAILS = "PENDING_DETAILS"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"

class QueueCapacity(str, Enum):
    EMPTY = "EMPTY"
    MOVING = "MOVING"
    HALF_FULL = "HALF_FULL"
    FULL_HOUSE = "FULL_HOUSE"
    OVERFLOWING = "OVERFLOWING"

class Channel(str, Enum):
    DRIVERS = "DRIVERS"
    MARSHALS = "MARSHALS"
    PASSENGERS = "PASSENGERS"

class AlertType(str, Enum):
    POLICE = "POLICE"
    TRAFFIC = "TRAFFIC"
    ALT_ROUTE = "ALT_ROUTE"
    GENERAL = "GENERAL"

# Models
class UserBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: UserRole = UserRole.PASSENGER

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str

class VehicleDetails(BaseModel):
    type: str = "MINIBUS"
    brand: str
    color: str
    plate: Optional[str] = None
    front_photo: Optional[str] = None
    side_photo: Optional[str] = None
    back_photo: Optional[str] = None
    condition_rating: Optional[float] = None
    cleanliness_rating: Optional[float] = None

class LogEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    action: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    points_earned: int = 0

class UserInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole = UserRole.PASSENGER
    points: int = 0
    rank_title: str = "New Scout"
    is_verified: bool = False
    warning_count: int = 0
    is_banned: bool = False
    suspension_end_date: Optional[datetime] = None
    suspension_reason: Optional[str] = None
    onboarding_status: OnboardingStatus = OnboardingStatus.NOT_STARTED
    vehicle: Optional[VehicleDetails] = None
    selfie: Optional[str] = None
    approving_drivers: List[str] = []
    onboarding_date: Optional[datetime] = None
    trips_completed: int = 0
    average_rating: float = 5.0
    monthly_logs: List[Dict] = []
    current_streak: int = 0
    last_active_date: Optional[str] = None
    geo_tracking_enabled: bool = False
    hashed_password: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserResponse(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole
    points: int
    rank_title: str
    is_verified: bool
    warning_count: int
    is_banned: bool
    onboarding_status: OnboardingStatus
    vehicle: Optional[VehicleDetails] = None
    trips_completed: int
    average_rating: float
    current_streak: int
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class Rank(BaseModel):
    id: str
    name: str
    location: str
    category: str
    coords: Dict[str, float]

class RoutePath(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    origin_id: str
    destination_id: str
    path: List[Dict[str, float]] = []
    price: Optional[float] = None
    last_updated_by: Optional[str] = None
    custom_destination_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ActivePing(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    passenger_id: str
    passenger_name: str
    rank_id: Optional[str] = None
    custom_coords: Optional[Dict[str, float]] = None
    is_custom: bool = False
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    intercept_point: Optional[Dict[str, float]] = None
    is_marshal_ping: bool = False
    message: Optional[str] = None
    destination_id: Optional[str] = None
    price: Optional[float] = None
    accepted_by: List[str] = []
    accepted_driver_names: List[str] = []
    selected_marshal_id: Optional[str] = None
    status: str = "ACTIVE"  # ACTIVE, ACCEPTED, COMPLETED, CANCELLED

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    sender_name: str
    role: UserRole
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    channel: Channel = Channel.PASSENGERS
    rank_tag: Optional[str] = None
    route_id: Optional[str] = None
    is_alert: bool = False
    alert_type: Optional[AlertType] = None
    is_flagged: bool = False
    flag_reason: Optional[str] = None

class SocialReply(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    author: str
    author_id: str
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_flagged: bool = False

class SocialPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    author: str
    author_id: str
    content: str
    is_anonymous: bool = False
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    likes: int = 0
    liked_by: List[str] = []
    replies: List[Dict] = []
    image: Optional[str] = None
    post_type: str = "GENERAL"  # GENERAL, TAXI_WASH
    wash_photos: Optional[Dict[str, str]] = None
    is_flagged: bool = False
    flag_reason: Optional[str] = None

class RankStatus(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rank_id: str
    capacity: QueueCapacity = QueueCapacity.MOVING
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    marshal_name: str
    marshal_id: str
    load_estimate: int = 50

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reviewer_id: str
    reviewer_name: str
    reviewer_role: UserRole
    target_id: str
    target_name: str
    target_role: UserRole
    rating: float
    comment: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FAQ(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    answer: Optional[str] = None
    answered_by: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    price_update: Optional[Dict] = None
    verified_by: List[str] = []
    verification_count: int = 0
    question_type: str = "CUSTOM"  # TEMPLATE, CUSTOM
    route_info: Optional[Dict] = None

class Suggestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    content: str
    suggestion_type: str = "IMPROVE"  # IMPROVE, REMOVE
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    votes: int = 0
    voted_by: List[str] = []

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserInDB:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return UserInDB(**user_doc)

def serialize_datetime(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj

# Auth routes
@api_router.post("/auth/register", response_model=Token)
@limiter.limit("3/minute")
async def register(request: Request, user: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"$or": [{"email": user.email}, {"phone": user.phone}]})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_password = hash_password(user.password)
    user_dict = user.model_dump()
    user_dict["hashed_password"] = hashed_password
    user_dict["id"] = str(uuid.uuid4())
    user_dict["points"] = 0
    user_dict["rank_title"] = "New Scout"
    user_dict["is_verified"] = user.role == UserRole.DRIVER
    user_dict["warning_count"] = 0
    user_dict["is_banned"] = False
    user_dict["onboarding_status"] = OnboardingStatus.PENDING_DETAILS
    user_dict["approving_drivers"] = []
    user_dict["trips_completed"] = 0
    user_dict["average_rating"] = 5.0
    user_dict["monthly_logs"] = [{"id": "init", "action": "Account Created", "timestamp": datetime.now(timezone.utc).isoformat(), "points_earned": 0}]
    user_dict["current_streak"] = 0
    user_dict["geo_tracking_enabled"] = False
    user_dict["created_at"] = datetime.now(timezone.utc)
    user_dict["updated_at"] = datetime.now(timezone.utc)
    
    # Convert datetime to ISO string for MongoDB
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    user_dict["updated_at"] = user_dict["updated_at"].isoformat()
    
    del user_dict["password"]
    
    await db.users.insert_one(user_dict)
    
    access_token = create_access_token(user_dict["id"])
    
    user_response = {
        "id": user_dict["id"],
        "name": user_dict["name"],
        "email": user_dict.get("email"),
        "phone": user_dict.get("phone"),
        "role": user_dict["role"],
        "points": user_dict["points"],
        "rank_title": user_dict["rank_title"],
        "is_verified": user_dict["is_verified"],
        "warning_count": user_dict["warning_count"],
        "is_banned": user_dict["is_banned"],
        "onboarding_status": user_dict["onboarding_status"],
        "vehicle": user_dict.get("vehicle"),
        "trips_completed": user_dict["trips_completed"],
        "average_rating": user_dict["average_rating"],
        "current_streak": user_dict["current_streak"],
        "created_at": datetime.fromisoformat(user_dict["created_at"])
    }
    
    return {"access_token": access_token, "user": user_response}

@api_router.post("/auth/login", response_model=Token)
@limiter.limit("5/minute")
async def login(request: Request, credentials: UserLogin):
    # Find user by email or phone
    query = {}
    if credentials.email:
        query["email"] = credentials.email
    elif credentials.phone:
        query["phone"] = credentials.phone
    else:
        raise HTTPException(status_code=400, detail="Email or phone required")
    
    user_doc = await db.users.find_one(query)
    if not user_doc or not user_doc.get("hashed_password"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(user_doc["id"])
    
    user_response = {
        "id": user_doc["id"],
        "name": user_doc["name"],
        "email": user_doc.get("email"),
        "phone": user_doc.get("phone"),
        "role": user_doc["role"],
        "points": user_doc["points"],
        "rank_title": user_doc["rank_title"],
        "is_verified": user_doc["is_verified"],
        "warning_count": user_doc["warning_count"],
        "is_banned": user_doc["is_banned"],
        "onboarding_status": user_doc["onboarding_status"],
        "vehicle": user_doc.get("vehicle"),
        "trips_completed": user_doc["trips_completed"],
        "average_rating": user_doc["average_rating"],
        "current_streak": user_doc["current_streak"],
        "created_at": datetime.fromisoformat(user_doc["created_at"])
    }
    
    return {"access_token": access_token, "user": user_response}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: UserInDB = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role,
        "points": current_user.points,
        "rank_title": current_user.rank_title,
        "is_verified": current_user.is_verified,
        "warning_count": current_user.warning_count,
        "is_banned": current_user.is_banned,
        "onboarding_status": current_user.onboarding_status,
        "vehicle": current_user.vehicle,
        "trips_completed": current_user.trips_completed,
        "average_rating": current_user.average_rating,
        "current_streak": current_user.current_streak,
        "created_at": current_user.created_at
    }

# User routes
@api_router.put("/users/me", response_model=UserResponse)
async def update_user(
    update_data: Dict[str, Any],
    current_user: UserInDB = Depends(get_current_user)
):
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Handle vehicle details
    if "vehicle" in update_data:
        update_data["vehicle"] = VehicleDetails(**update_data["vehicle"]).model_dump()
    
    await db.users.update_one({"id": current_user.id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": current_user.id})
    return {
        "id": updated_user["id"],
        "name": updated_user["name"],
        "email": updated_user.get("email"),
        "phone": updated_user.get("phone"),
        "role": updated_user["role"],
        "points": updated_user["points"],
        "rank_title": updated_user["rank_title"],
        "is_verified": updated_user["is_verified"],
        "warning_count": updated_user["warning_count"],
        "is_banned": updated_user["is_banned"],
        "onboarding_status": updated_user["onboarding_status"],
        "vehicle": updated_user.get("vehicle"),
        "trips_completed": updated_user["trips_completed"],
        "average_rating": updated_user["average_rating"],
        "current_streak": updated_user["current_streak"],
        "created_at": datetime.fromisoformat(updated_user["created_at"])
    }

@api_router.post("/users/me/add-points")
async def add_points(
    points: int,
    action: str,
    current_user: UserInDB = Depends(get_current_user)
):
    log_entry = {
        "id": str(uuid.uuid4()),
        "action": action,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "points_earned": points
    }
    
    await db.users.update_one(
        {"id": current_user.id},
        {
            "$inc": {"points": points, "trips_completed": 1 if "trip" in action.lower() else 0},
            "$push": {"monthly_logs": {"$each": [log_entry], "$slice": -50}},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"success": True, "points_added": points, "total_points": current_user.points + points}

@api_router.get("/users/leaderboard")
async def get_leaderboard(limit: int = 50):
    users = await db.users.find(
        {"is_banned": False},
        {"_id": 0, "id": 1, "name": 1, "role": 1, "points": 1, "rank_title": 1, "trips_completed": 1}
    ).sort("points", -1).limit(limit).to_list(limit)
    
    return users

# Pings/Trips routes
@api_router.post("/pings", response_model=ActivePing)
async def create_ping(
    ping: ActivePing,
    current_user: UserInDB = Depends(get_current_user)
):
    ping_dict = ping.model_dump()
    ping_dict["timestamp"] = ping_dict["timestamp"].isoformat()
    ping_dict["passenger_id"] = current_user.id
    ping_dict["passenger_name"] = current_user.name
    
    await db.pings.insert_one(ping_dict)
    return ping

@api_router.get("/pings", response_model=List[ActivePing])
async def get_active_pings(
    status: str = "ACTIVE",
    limit: int = 20
):
    pings = await db.pings.find(
        {"status": status},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    for ping in pings:
        if isinstance(ping.get("timestamp"), str):
            ping["timestamp"] = datetime.fromisoformat(ping["timestamp"])
    
    return pings

@api_router.post("/pings/{ping_id}/accept")
async def accept_ping(
    ping_id: str,
    price: float,
    current_user: UserInDB = Depends(get_current_user)
):
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Only drivers can accept pings")
    
    ping = await db.pings.find_one({"id": ping_id})
    if not ping:
        raise HTTPException(status_code=404, detail="Ping not found")
    
    if current_user.id in ping.get("accepted_by", []):
        raise HTTPException(status_code=400, detail="Already accepted")
    
    await db.pings.update_one(
        {"id": ping_id},
        {
            "$push": {
                "accepted_by": current_user.id,
                "accepted_driver_names": current_user.name
            },
            "$set": {"price": price, "updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"success": True, "message": "Ping accepted"}

@api_router.post("/pings/{ping_id}/complete")
async def complete_ping(
    ping_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    await db.pings.update_one(
        {"id": ping_id},
        {"$set": {"status": "COMPLETED", "completed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Add points
    points = 20 if current_user.role == UserRole.PASSENGER else 30
    await db.users.update_one(
        {"id": current_user.id},
        {
            "$inc": {"points": points, "trips_completed": 1},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"success": True, "points_earned": points}

# Chat routes
@api_router.post("/messages", response_model=ChatMessage)
async def send_message(
    message: ChatMessage,
    current_user: UserInDB = Depends(get_current_user)
):
    message_dict = message.model_dump()
    message_dict["sender_id"] = current_user.id
    message_dict["sender_name"] = current_user.name
    message_dict["role"] = current_user.role
    message_dict["timestamp"] = message_dict["timestamp"].isoformat()
    
    await db.messages.insert_one(message_dict)
    
    # Add points for sending message
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"points": 1}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    del message_dict["_id"]
    message_dict["timestamp"] = datetime.fromisoformat(message_dict["timestamp"])
    return message_dict

@api_router.get("/messages", response_model=List[ChatMessage])
async def get_messages(
    channel: Optional[Channel] = None,
    limit: int = 50
):
    query = {}
    if channel:
        query["channel"] = channel
    
    messages = await db.messages.find(
        query,
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    for msg in messages:
        if isinstance(msg.get("timestamp"), str):
            msg["timestamp"] = datetime.fromisoformat(msg["timestamp"])
    
    return messages

# Social routes
@api_router.post("/posts", response_model=SocialPost)
async def create_post(
    post: SocialPost,
    current_user: UserInDB = Depends(get_current_user)
):
    post_dict = post.model_dump()
    post_dict["author_id"] = current_user.id
    post_dict["author"] = "Anonymous" if post.is_anonymous else current_user.name
    post_dict["timestamp"] = post_dict["timestamp"].isoformat()
    
    await db.posts.insert_one(post_dict)
    
    # Add points for creating post
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"points": 10}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    del post_dict["_id"]
    post_dict["timestamp"] = datetime.fromisoformat(post_dict["timestamp"])
    return post_dict

@api_router.get("/posts", response_model=List[SocialPost])
async def get_posts(limit: int = 50):
    posts = await db.posts.find(
        {"is_flagged": False},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    for post in posts:
        if isinstance(post.get("timestamp"), str):
            post["timestamp"] = datetime.fromisoformat(post["timestamp"])
    
    return posts

@api_router.post("/posts/{post_id}/like")
async def like_post(
    post_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if current_user.id in post.get("liked_by", []):
        raise HTTPException(status_code=400, detail="Already liked")
    
    await db.posts.update_one(
        {"id": post_id},
        {
            "$inc": {"likes": 1},
            "$push": {"liked_by": current_user.id}
        }
    )
    
    # Add points
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"points": 1}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "likes": post["likes"] + 1}

@api_router.post("/posts/{post_id}/reply")
async def reply_to_post(
    post_id: str,
    content: str,
    current_user: UserInDB = Depends(get_current_user)
):
    reply = {
        "id": str(uuid.uuid4()),
        "author": current_user.name,
        "author_id": current_user.id,
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.posts.update_one(
        {"id": post_id},
        {"$push": {"replies": reply}}
    )
    
    # Add points
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"points": 5}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "reply": reply}

# Rank status routes
@api_router.post("/rank-status", response_model=RankStatus)
async def update_rank_status(
    status: RankStatus,
    current_user: UserInDB = Depends(get_current_user)
):
    if current_user.role != UserRole.MARSHAL:
        raise HTTPException(status_code=403, detail="Only marshals can update rank status")
    
    status_dict = status.model_dump()
    status_dict["marshal_id"] = current_user.id
    status_dict["marshal_name"] = current_user.name
    status_dict["timestamp"] = status_dict["timestamp"].isoformat()
    
    # Update or create
    existing = await db.rank_statuses.find_one({"rank_id": status.rank_id})
    if existing:
        await db.rank_statuses.update_one(
            {"rank_id": status.rank_id},
            {"$set": status_dict}
        )
    else:
        await db.rank_statuses.insert_one(status_dict)
    
    # Add points
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"points": 30}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    del status_dict["_id"]
    status_dict["timestamp"] = datetime.fromisoformat(status_dict["timestamp"])
    return status_dict

@api_router.get("/rank-status", response_model=List[RankStatus])
async def get_rank_statuses():
    statuses = await db.rank_statuses.find({}, {"_id": 0}).to_list(100)
    
    for status in statuses:
        if isinstance(status.get("timestamp"), str):
            status["timestamp"] = datetime.fromisoformat(status["timestamp"])
    
    return statuses

# Routes
@api_router.get("/routes", response_model=List[RoutePath])
async def get_routes():
    routes = await db.routes.find({}, {"_id": 0}).to_list(100)
    
    for route in routes:
        if isinstance(route.get("created_at"), str):
            route["created_at"] = datetime.fromisoformat(route["created_at"])
    
    return routes

@api_router.post("/routes", response_model=RoutePath)
async def create_route(
    route: RoutePath,
    current_user: UserInDB = Depends(get_current_user)
):
    route_dict = route.model_dump()
    route_dict["created_at"] = route_dict["created_at"].isoformat()
    route_dict["last_updated_by"] = f"{current_user.role} {current_user.name}"
    
    await db.routes.insert_one(route_dict)
    
    del route_dict["_id"]
    route_dict["created_at"] = datetime.fromisoformat(route_dict["created_at"])
    return route_dict

# Reviews
@api_router.post("/reviews", response_model=Review)
async def create_review(
    review: Review,
    current_user: UserInDB = Depends(get_current_user)
):
    review_dict = review.model_dump()
    review_dict["reviewer_id"] = current_user.id
    review_dict["reviewer_name"] = current_user.name
    review_dict["reviewer_role"] = current_user.role
    review_dict["timestamp"] = review_dict["timestamp"].isoformat()
    
    await db.reviews.insert_one(review_dict)
    
    # Add points
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"points": 15}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    del review_dict["_id"]
    review_dict["timestamp"] = datetime.fromisoformat(review_dict["timestamp"])
    return review_dict

@api_router.get("/reviews/{user_id}")
async def get_user_reviews(user_id: str):
    reviews = await db.reviews.find(
        {"target_id": user_id},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(50)
    
    for review in reviews:
        if isinstance(review.get("timestamp"), str):
            review["timestamp"] = datetime.fromisoformat(review["timestamp"])
    
    return reviews

# FAQ
@api_router.get("/faqs", response_model=List[FAQ])
async def get_faqs():
    faqs = await db.faqs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(100)
    
    for faq in faqs:
        if isinstance(faq.get("timestamp"), str):
            faq["timestamp"] = datetime.fromisoformat(faq["timestamp"])
    
    return faqs

@api_router.post("/faqs", response_model=FAQ)
async def create_faq(
    faq: FAQ,
    current_user: UserInDB = Depends(get_current_user)
):
    faq_dict = faq.model_dump()
    faq_dict["timestamp"] = faq_dict["timestamp"].isoformat()
    
    await db.faqs.insert_one(faq_dict)
    
    # Add points
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"points": 15}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    del faq_dict["_id"]
    faq_dict["timestamp"] = datetime.fromisoformat(faq_dict["timestamp"])
    return faq_dict

# Suggestions
@api_router.get("/suggestions", response_model=List[Suggestion])
async def get_suggestions():
    suggestions = await db.suggestions.find({}, {"_id": 0}).sort("votes", -1).to_list(100)
    
    for sugg in suggestions:
        if isinstance(sugg.get("timestamp"), str):
            sugg["timestamp"] = datetime.fromisoformat(sugg["timestamp"])
    
    return suggestions

@api_router.post("/suggestions", response_model=Suggestion)
async def create_suggestion(
    suggestion: Suggestion,
    current_user: UserInDB = Depends(get_current_user)
):
    sugg_dict = suggestion.model_dump()
    sugg_dict["user_id"] = current_user.id
    sugg_dict["user_name"] = current_user.name
    sugg_dict["timestamp"] = sugg_dict["timestamp"].isoformat()
    
    await db.suggestions.insert_one(sugg_dict)
    
    # Add points
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"points": 10}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    del sugg_dict["_id"]
    sugg_dict["timestamp"] = datetime.fromisoformat(sugg_dict["timestamp"])
    return sugg_dict

@api_router.post("/suggestions/{suggestion_id}/vote")
async def vote_suggestion(
    suggestion_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    suggestion = await db.suggestions.find_one({"id": suggestion_id})
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    if current_user.id in suggestion.get("voted_by", []):
        raise HTTPException(status_code=400, detail="Already voted")
    
    await db.suggestions.update_one(
        {"id": suggestion_id},
        {
            "$inc": {"votes": 1},
            "$push": {"voted_by": current_user.id}
        }
    )
    
    return {"success": True, "votes": suggestion["votes"] + 1}

# Health check
@api_router.get("/")
async def root():
    return {"message": "Boober API v1.0.0", "status": "healthy"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# WebSocket endpoint
@app.websocket("/api/ws/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str):
    user_id = None
    try:
        await manager.connect(websocket, channel, user_id)
        
        # Send initial connection message
        await websocket.send_text(json.dumps({
            "type": "connected",
            "channel": channel,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }))
        
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                
                # Handle different message types
                if message.get("type") == "auth":
                    # Authenticate user
                    token = message.get("token")
                    if token:
                        try:
                            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                            user_id = payload.get("sub")
                            # Update connection with user_id
                            manager.user_connections[user_id] = websocket
                            await websocket.send_text(json.dumps({
                                "type": "authenticated",
                                "user_id": user_id
                            }))
                        except jwt.JWTError:
                            await websocket.send_text(json.dumps({
                                "type": "error",
                                "message": "Invalid token"
                            }))
                
                elif message.get("type") == "chat":
                    # Broadcast chat message to channel
                    await manager.broadcast_to_channel(message, channel)
                
                elif message.get("type") == "ping_update":
                    # Broadcast ping updates to all
                    await manager.broadcast_to_all(message)
                
                elif message.get("type") == "rank_status_update":
                    # Broadcast rank status updates to all
                    await manager.broadcast_to_all(message)
                
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON"
                }))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel, user_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, channel, user_id)

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', 'http://localhost,http://127.0.0.1').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
