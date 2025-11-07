from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings and configuration"""
    
    # Gemini Configuration
    gemini_api_key: str
    gemini_model: str = "gemini-2.5-flash"
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: str = "http://localhost:3000"
    
    # Application Settings
    debug: bool = True
    max_tokens: int = 2048
    temperature: float = 0.7
    
    # Firebase Configuration
    firebase_credentials_path: str = "firebase-credentials.json"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
