# Ficheiro: auth.py
# (Versão Completa com Proteção de Admin)

from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader 
from supabase_client import supabase
from gotrue.errors import AuthApiError
from gotrue.types import User as AuthUser
from models import Profile # Importa o modelo de Perfil
from uuid import UUID

api_key_header = APIKeyHeader(name="Authorization", auto_error=False)

def get_current_user(token: str = Depends(api_key_header)) -> AuthUser:
    """ Valida o token e retorna os dados do utilizador (da tabela auth). """
    
    if not token or not token.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token 'Bearer' em falta ou mal formatado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    jwt_token = token.split(" ")[1]

    try:
        user_response = supabase.auth.get_user(jwt_token)
        return user_response.user
        
    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ocorreu um erro interno: {str(e)}"
        )


# --- NOVA DEPENDÊNCIA DE ADMIN (Passo 10) ---

def get_current_admin_user(current_user: AuthUser = Depends(get_current_user)) -> Profile:
    """
    Dependência que verifica se o utilizador autenticado é um admin.
    Busca o perfil e levanta erro 403 se 'is_admin' == false.
    Retorna o perfil completo do admin.
    """
    try:
        # Busca o perfil do utilizador
        profile_res = supabase.table('profiles').select("*").eq('id', str(current_user.id)).single().execute()
        
        if not profile_res.data:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Perfil de utilizador não encontrado.")
        
        profile_data = profile_res.data
        
        # VERIFICAÇÃO DE ADMIN
        if not profile_data.get('is_admin'):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Acesso restrito a administradores."
            )
        
        # Adiciona o email (para o modelo Profile ficar completo)
        profile_data['email'] = current_user.email
        
        # Retorna o perfil Pydantic
        return Profile(**profile_data)

    except HTTPException as e:
        raise e # Re-lança os erros 403 e 404
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))