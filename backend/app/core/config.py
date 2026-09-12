import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AIVOA Pharma QMS - Customer Complaint Management System"
    API_V1_STR: str = "/api"
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://stone@localhost:5432/pharma_qms")
    SYNC_DATABASE_URL: str = os.getenv("SYNC_DATABASE_URL", "postgresql://stone@localhost:5432/pharma_qms")
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
