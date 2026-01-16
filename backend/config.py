from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
from pathlib import Path
import os

# Get the directory of this file
BASE_DIR = Path(__file__).resolve().parent

# Explicitly load .env file BEFORE anything else
env_path = BASE_DIR / ".env"

# Force load .env using os.environ
if env_path.exists():
    print(f"🔍 Loading .env from: {env_path}")
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()
                print(f"✅ Set {key.strip()}")
else:
    print(f"❌ .env file not found at: {env_path}")

# Verify API key is loaded
api_key = os.getenv('GEMINI_API_KEY')
print(f"🔍 GEMINI_API_KEY loaded: {'✅ Yes' if api_key else '❌ No'}")
if api_key:
    print(f"🔑 Key preview: {api_key[:10]}...{api_key[-4:]}")


class Settings(BaseSettings):
    """Application settings and configuration"""
    
    # Gemini Configuration
    gemini_api_key: str
    gemini_model: str = "gemini-2.5-flash-lite"
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    # Allow localhost and Vercel preview/deployed origins by default
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,https://*.vercel.app,https://ai-chat-bot-brown.vercel.app,https://ai-chat-bot-1-m0uq.onrender.com"
    
    # Application Settings
    debug: bool = True
    max_tokens: int = 2048
    temperature: float = 0.7
    
    # Firebase Configuration
    firebase_credentials_path: str = "firebase-credentials.json"
    
    # Pydantic v2 configuration
    model_config = SettingsConfigDict(
        case_sensitive=False,
        extra="ignore",
        env_file=".env",
        env_file_encoding="utf-8"
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    @property
    def firebase_credentials_full_path(self) -> Path:
        """Get full path to Firebase credentials"""
        return BASE_DIR / self.firebase_credentials_path


# Create settings instance
try:
    settings = Settings()
    print("✅ Settings loaded successfully")
except Exception as e:
    print(f"❌ Error loading settings: {e}")
    print(f"📋 Available env vars: {list(os.environ.keys())[:10]}")
    raise
