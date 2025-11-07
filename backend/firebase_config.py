import firebase_admin
from firebase_admin import credentials, firestore, auth
from config import settings
import os


class FirebaseService:
    """Firebase service for authentication and database operations"""
    
    def __init__(self):
        self.app = None
        self.db = None
        self.initialize_firebase()
    
    def initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if Firebase is already initialized
            if not firebase_admin._apps:
                cred_path = settings.firebase_credentials_path
                
                if os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    self.app = firebase_admin.initialize_app(cred)
                    self.db = firestore.client()
                    print("✅ Firebase initialized successfully")
                else:
                    print(f"⚠️ Firebase credentials not found at {cred_path}")
                    print("⚠️ Running without Firebase - authentication disabled")
                    self.app = None
                    self.db = None
            else:
                self.app = firebase_admin.get_app()
                self.db = firestore.client()
        except Exception as e:
            print(f"❌ Error initializing Firebase: {e}")
            self.app = None
            self.db = None
    
    def verify_token(self, token: str):
        """Verify Firebase ID token"""
        try:
            decoded_token = auth.verify_id_token(token)
            return decoded_token
        except Exception as e:
            print(f"Token verification error: {e}")
            return None
    
    def get_user(self, uid: str):
        """Get user data from Firestore"""
        if not self.db:
            return None
        
        try:
            user_ref = self.db.collection('users').document(uid)
            user_doc = user_ref.get()
            
            if user_doc.exists:
                return user_doc.to_dict()
            return None
        except Exception as e:
            print(f"Error getting user: {e}")
            return None
    
    def create_or_update_user(self, uid: str, user_data: dict):
        """Create or update user in Firestore"""
        if not self.db:
            return False
        
        try:
            user_ref = self.db.collection('users').document(uid)
            user_ref.set(user_data, merge=True)
            return True
        except Exception as e:
            print(f"Error creating/updating user: {e}")
            return False
    
    def save_chat_message(self, uid: str, message: dict):
        """Save chat message to user's history"""
        if not self.db:
            return False
        
        try:
            chat_ref = self.db.collection('users').document(uid).collection('chat_history')
            chat_ref.add(message)
            return True
        except Exception as e:
            print(f"Error saving chat message: {e}")
            return False
    
    def get_chat_history(self, uid: str, limit: int = 50):
        """Get user's chat history"""
        if not self.db:
            return []
        
        try:
            chat_ref = self.db.collection('users').document(uid).collection('chat_history')
            docs = chat_ref.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(limit).stream()
            
            messages = []
            for doc in docs:
                msg = doc.to_dict()
                msg['id'] = doc.id
                messages.append(msg)
            
            # Return in chronological order
            return list(reversed(messages))
        except Exception as e:
            print(f"Error getting chat history: {e}")
            return []
    
    def delete_chat_history(self, uid: str):
        """Delete all chat history for a user"""
        if not self.db:
            return False
        
        try:
            chat_ref = self.db.collection('users').document(uid).collection('chat_history')
            docs = chat_ref.stream()
            
            for doc in docs:
                doc.reference.delete()
            
            return True
        except Exception as e:
            print(f"Error deleting chat history: {e}")
            return False


# Singleton instance
firebase_service = FirebaseService()
