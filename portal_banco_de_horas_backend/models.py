# Ficheiro: models.py
# (Versão Corrigida do Passo 10 - Tornando email opcional no Profile)

from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from enum import Enum 

# --- Modelos de Desafios ---

class ChallengeBase(BaseModel):
    title: str
    description: Optional[str] = None
    points: int = Field(gt=0)
    allowed_roles: Optional[List[str]] = []
    allowed_user_ids: Optional[List[UUID]] = []
    due_at: Optional[datetime] = None

class Challenge(ChallengeBase):
    """ Modelo completo do desafio (retornado pela API) """
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# --- Modelos de Autenticação ---

class UserCreate(BaseModel):
    """ Modelo para registo """
    email: EmailStr
    password: str
    name: str
    role: Optional[str] = "Analista"

class UserLogin(BaseModel):
    """ Modelo para login """
    email: EmailStr
    password: str

class Token(BaseModel):
    """ Modelo de resposta do token de acesso """
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    """ Modelo para dados básicos do utilizador (auth) """
    id: UUID
    email: EmailStr
    created_at: datetime

# --- Modelo de Perfil ---

class Profile(BaseModel):
    """ Modelo completo do perfil do utilizador (com pontos/horas) """
    id: UUID
    name: str
    role: str
    is_admin: bool
    points: int
    hours: int
    
    # CORRIGIDO: O email é opcional, pois não existe na tabela 'profiles'
    email: Optional[EmailStr] = None 

    class Config:
        from_attributes = True

# --- Modelos de Solicitações (Requests) ---

class RequestType(str, Enum):
    concessao = "concessao"
    gozo = "gozo"

class RequestStatus(str, Enum):
    pendente = "pendente"
    aprovado = "aprovado"
    negado = "negado"


class RequestCreate(BaseModel):
    """ Modelo para 'criar' um pedido """
    type: RequestType
    hours: int = Field(gt=0, description="Horas deve ser > 0")
    reason: Optional[str] = None

class RequestResponse(BaseModel):
    """ Modelo para 'ler' um pedido """
    id: UUID
    user_id: UUID
    type: RequestType
    hours: int
    reason: Optional[str] = None
    status: RequestStatus
    created_at: datetime

    class Config:
        from_attributes = True

# --- Modelos de Participação em Desafios ---

class ParticipantStatus(str, Enum):
    inscrito = "inscrito"
    enviado = "enviado"
    validado = "validado"
    recusado = "recusado"

class ParticipantResponse(BaseModel):
    """ Modelo para 'ler' uma participação """
    id: UUID
    challenge_id: UUID
    user_id: UUID
    status: ParticipantStatus
    proof_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ProofSubmit(BaseModel):
    """ Modelo para 'enviar' uma prova """
    proof_url: str = Field(..., min_length=1, description="URL da comprovação (ex: Google Drive)")

class ConversionRequest(BaseModel):
    """ Modelo para 'converter' pontos """
    hours: int = Field(gt=0, description="Horas a adquirir (deve ser > 0)")


# --- NOVOS MODELOS DE ADMIN (Passo 10) ---

class AdminRequestStatusUpdate(BaseModel):
    """ Modelo para Admin aprovar/negar pedido """
    status: RequestStatus # Deve ser 'aprovado' ou 'negado'

class AdminChallengeCreate(ChallengeBase):
    """ Modelo para Admin criar um desafio (é igual ao ChallengeBase) """
    pass

class AdminParticipantValidation(BaseModel):
    """ Modelo para Admin validar uma prova """
    approved: bool # True para aprovar, False para recusar

class AdminSettingsResponse(BaseModel):
    """ Modelo para ler as configurações """
    points_per_hour: int
    
    class Config:
        from_attributes = True

class AdminSettingsUpdate(BaseModel):
    """ Modelo para atualizar as configurações """
    points_per_hour: int = Field(gt=0)
    
class AdminRequestDetails(RequestResponse):
    """ Modelo para Admin ver quem fez o pedido """
    profiles: Optional[Profile] = None # Para o Join

class AdminParticipantDetails(ParticipantResponse):
    """ Modelo para Admin ver quem participou """
    profiles: Optional[Profile] = None
    challenges: Optional[Challenge] = None