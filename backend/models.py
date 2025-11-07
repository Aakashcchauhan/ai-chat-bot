from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Union
from datetime import datetime


class User(BaseModel):
    """User model"""
    uid: str
    email: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: Optional[datetime] = Field(default_factory=datetime.now)


class Message(BaseModel):
    """Chat message model"""
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: Optional[Union[str, datetime]] = Field(default_factory=lambda: datetime.now().isoformat())


class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    message: str = Field(..., min_length=1, max_length=10000)
    conversation_history: List[Message] = Field(default_factory=list)
    language: Optional[str] = Field(default="python", description="Programming language for code generation")
    mode: Literal["code", "chat", "explain", "roadmap"] = Field(default="code", description="Chat mode")
    user_id: Optional[str] = None  # Firebase UID


class CodeGenerationRequest(BaseModel):
    """Request model for code generation endpoint"""
    prompt: str = Field(..., min_length=1, max_length=5000)
    language: str = Field(default="python")
    include_comments: bool = Field(default=True)
    include_tests: bool = Field(default=False)


class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    message: str
    role: Literal["assistant"] = "assistant"
    timestamp: datetime = Field(default_factory=datetime.now)
    language: Optional[str] = None
    has_code: bool = False


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)


class TokenVerifyRequest(BaseModel):
    """Request model for token verification"""
    token: str


class UserProfileResponse(BaseModel):
    """Response model for user profile"""
    uid: str
    email: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None


class ChatHistoryResponse(BaseModel):
    """Response model for chat history"""
    messages: List[dict]
    total: int
