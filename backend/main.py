from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json
from datetime import datetime
from typing import Optional
from config import settings
from models import (
    ChatRequest, 
    ChatResponse, 
    CodeGenerationRequest, 
    ErrorResponse,
    TokenVerifyRequest,
    UserProfileResponse,
    ChatHistoryResponse
)
from services.ai_service import ai_service
from firebase_config import firebase_service
from routes import auth
from dependencies import get_current_user

# Create FastAPI app
app = FastAPI(
    title="AI Code Generator Chatbot API",
    description="Backend API for AI-powered code generation chatbot",
    version="1.0.0",
    debug=settings.debug
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Code Generator Chatbot API",
        "version": "2.0.0",
        "status": "running",
        "firebase_enabled": firebase_service.db is not None,
        "endpoints": {
            "chat": "/api/chat",
            "code": "/api/generate-code",
            "stream": "/api/chat/stream",
            "auth": "/api/auth/verify",
            "history": "/api/chat/history"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ai-chatbot-backend"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, current_user: Optional[dict] = Depends(get_current_user)):
    """
    Main chat endpoint for AI code generation and conversation
    
    - **message**: User's message/prompt
    - **conversation_history**: Previous messages in the conversation
    - **language**: Programming language (default: python)
    - **mode**: Chat mode - code/chat/explain (default: code)
    - **user_id**: Firebase UID (optional, from auth token)
    """
    try:
        print(f"📨 Chat request: mode={request.mode}, lang={request.language}, msg={request.message[:50]}...")
        result = await ai_service.generate_chat_response(
            message=request.message,
            conversation_history=request.conversation_history,
            language=request.language,
            mode=request.mode,
            api_key=request.api_key
        )
        print(f"✅ AI response received, has_code={result.get('has_code')}")
        
        response = ChatResponse(
            message=result["message"],
            language=result["language"],
            has_code=result["has_code"]
        )
        
        # Save to Firebase if user is authenticated
        if current_user and firebase_service.db:
            uid = current_user.get('uid')
            
            # Save user message
            firebase_service.save_chat_message(uid, {
                'role': 'user',
                'content': request.message,
                'language': request.language,
                'mode': request.mode,
                'timestamp': datetime.now()
            })
            
            # Save assistant response
            firebase_service.save_chat_message(uid, {
                'role': 'assistant',
                'content': result["message"],
                'language': result["language"],
                'has_code': result["has_code"],
                'timestamp': datetime.now()
            })
        
        return response
        
    except Exception as e:
        import traceback
        print(f"❌ Chat error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error processing chat request: {str(e)}"
        )


@app.post("/api/generate-code")
async def generate_code(request: CodeGenerationRequest):
    """
    Generate code based on a specific prompt
    
    - **prompt**: Description of the code to generate
    - **language**: Programming language
    - **include_comments**: Whether to include comments
    - **include_tests**: Whether to include unit tests
    """
    try:
        code = await ai_service.generate_code(
            prompt=request.prompt,
            language=request.language,
            include_comments=request.include_comments,
            include_tests=request.include_tests,
            api_key=request.api_key
        )
        
        return {
            "code": code,
            "language": request.language,
            "success": True
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating code: {str(e)}"
        )


@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Stream chat responses for real-time interaction
    
    Returns a stream of text chunks for progressive display
    """
    try:
        async def generate():
            async for chunk in ai_service.stream_chat_response(
                message=request.message,
                conversation_history=request.conversation_history,
                language=request.language,
                mode=request.mode,
                api_key=request.api_key
            ):
                yield f"data: {json.dumps({'content': chunk})}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error streaming response: {str(e)}"
        )


@app.get("/api/languages")
async def get_supported_languages():
    """Get list of supported programming languages"""
    return {
        "languages": [
            {"id": "python", "name": "Python", "icon": "🐍"},
            {"id": "javascript", "name": "JavaScript", "icon": "📜"},
            {"id": "typescript", "name": "TypeScript", "icon": "📘"},
            {"id": "java", "name": "Java", "icon": "☕"},
            {"id": "csharp", "name": "C#", "icon": "#️⃣"},
            {"id": "cpp", "name": "C++", "icon": "⚡"},
            {"id": "go", "name": "Go", "icon": "🔷"},
            {"id": "rust", "name": "Rust", "icon": "🦀"},
            {"id": "ruby", "name": "Ruby", "icon": "💎"},
            {"id": "php", "name": "PHP", "icon": "🐘"},
            {"id": "swift", "name": "Swift", "icon": "🕊️"},
            {"id": "kotlin", "name": "Kotlin", "icon": "🟣"},
            {"id": "sql", "name": "SQL", "icon": "🗄️"},
            {"id": "html", "name": "HTML", "icon": "🌐"},
            {"id": "css", "name": "CSS", "icon": "🎨"},
        ]
    }


@app.get("/api/chat/history", response_model=ChatHistoryResponse)
async def get_chat_history(limit: int = 50, current_user: Optional[dict] = Depends(get_current_user)):
    """Get user's chat history"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        uid = current_user.get('uid')
        messages = firebase_service.get_chat_history(uid, limit)
        return ChatHistoryResponse(messages=messages, total=len(messages))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting chat history: {str(e)}")


@app.delete("/api/chat/history")
async def delete_chat_history(current_user: Optional[dict] = Depends(get_current_user)):
    """Delete all chat history for the user"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        uid = current_user.get('uid')
        success = firebase_service.delete_chat_history(uid)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete chat history")
        return {"message": "Chat history deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting chat history: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
