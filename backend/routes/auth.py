from fastapi import APIRouter, HTTPException, Depends
from models import TokenVerifyRequest, UserProfileResponse, ChatHistoryResponse
from firebase_config import firebase_service
from dependencies import get_current_user
from typing import Optional

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/verify", response_model=UserProfileResponse)
async def verify_token(request: TokenVerifyRequest):
    """
    Verify Firebase ID token and return user info
    """
    try:
        decoded_token = firebase_service.verify_token(request.token)
        
        if not decoded_token:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        uid = decoded_token.get('uid')
        email = decoded_token.get('email', '')
        name = decoded_token.get('name', '')
        picture = decoded_token.get('picture', '')
        
        # Create/update user in Firestore
        user_data = {
            'uid': uid,
            'email': email,
            'display_name': name,
            'photo_url': picture,
            'last_login': firebase_service.db.SERVER_TIMESTAMP if firebase_service.db else None
        }
        
        firebase_service.create_or_update_user(uid, user_data)
        
        return UserProfileResponse(
            uid=uid,
            email=email,
            display_name=name,
            photo_url=picture
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error verifying token: {str(e)}"
        )


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(current_user: Optional[dict] = Depends(get_current_user)):
    """
    Get current user profile
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        uid = current_user.get('uid')
        user_data = firebase_service.get_user(uid)
        
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserProfileResponse(
            uid=user_data.get('uid'),
            email=user_data.get('email'),
            display_name=user_data.get('display_name'),
            photo_url=user_data.get('photo_url')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting profile: {str(e)}"
        )


@router.get("/chat/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    limit: int = 50,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get user's chat history
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        uid = current_user.get('uid')
        messages = firebase_service.get_chat_history(uid, limit)
        
        return ChatHistoryResponse(
            messages=messages,
            total=len(messages)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting chat history: {str(e)}"
        )


@router.delete("/chat/history")
async def delete_chat_history(current_user: Optional[dict] = Depends(get_current_user)):
    """
    Delete all chat history for the user
    """
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
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting chat history: {str(e)}"
        )
