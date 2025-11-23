
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Carrega as variáveis de ambiente do ficheiro .env
    """
    
    # Define o nome do ficheiro .env
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Mapeia as variáveis que queremos ler
    SUPABASE_URL: str
    SUPABASE_KEY: str

# cria uma instância única das configurações para ser usada por toda a app
settings = Settings()