# Ficheiro: supabase_client.py

from supabase import create_client, Client
from settings import settings # <-- CORRIGIDO (sem o ponto)

# Inicializa a ligação com o Supabase usando as chaves do settings.py
try:
    supabase: Client = create_client(
        settings.SUPABASE_URL, 
        settings.SUPABASE_KEY
    )
    print("Ligação ao Supabase estabelecida com sucesso!")
except Exception as e:
    print(f"Erro a ligar ao Supabase: {e}")
    supabase = None