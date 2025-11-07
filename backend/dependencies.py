from typing import Optional
from fastapi import Header
from firebase_config import firebase_service


async def get_current_user(authorization: Optional[str] = Header(None)):
    """Dependency to get current user from Firebase token"""
    if not authorization:
        return None
    
    try:
        # Extract token from "Bearer <token>"
        token = authorization.replace("Bearer ", "")
        decoded_token = firebase_service.verify_token(token)
        
        if decoded_token:
            return decoded_token
        return None
    except Exception as e:
        print(f"Auth error: {e}")
        return None
