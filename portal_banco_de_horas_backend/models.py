# Ficheiro: models.py
# (Versão com Modelo de Cargos - Roles)

from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from enum import Enum 

# --- Modelo de Cargos (NOVO) ---
class RoleBase(BaseModel):
    name: str

class Role(RoleBase):
    id: UUID
    created_at: datetime
    class Config: from_attributes = True

# --- Modelos de Desafios ---
class ChallengeBase(BaseModel):
    title: str
    description: Optional[str] = None
    points: int = Field(gt=0)
    allowed_roles: Optional[List[str]] = []
    allowed_user_ids: Optional[List[UUID]] = []
    due_at: Optional[datetime] = None

class Challenge(ChallengeBase):
    id: UUID
    created_at: datetime
    class Config: from_attributes = True

# --- Modelos de Autenticação ---
class UserCreate(BaseModel):
    email: EmailStr; password: str; name: str; role: Optional[str] = "Analista"
class UserLogin(BaseModel):
    email: EmailStr; password: str
class Token(BaseModel):
    access_token: str; token_type: str
class UserResponse(BaseModel):
    id: UUID; email: EmailStr; created_at: datetime

# --- Modelo de Perfil ---
class Profile(BaseModel):
    id: UUID; name: str; role: str; is_admin: bool; points: int; hours: int; email: Optional[EmailStr] = None
    class Config: from_attributes = True

# --- Modelos de Solicitações ---
class RequestType(str, Enum): concessao = "concessao"; gozo = "gozo"
class RequestStatus(str, Enum): pendente = "pendente"; aprovado = "aprovado"; negado = "negado"
class RequestCreate(BaseModel): type: RequestType; hours: int = Field(gt=0); reason: Optional[str] = None
class RequestResponse(BaseModel): id: UUID; user_id: UUID; type: RequestType; hours: int; reason: Optional[str] = None; status: RequestStatus; created_at: datetime
class Config: from_attributes = True

# --- Modelos de Participação ---
class ParticipantStatus(str, Enum): inscrito = "inscrito"; enviado = "enviado"; validado = "validado"; recusado = "recusado"
class ParticipantResponse(BaseModel): id: UUID; challenge_id: UUID; user_id: UUID; status: ParticipantStatus; proof_url: Optional[str] = None; created_at: datetime
class Config: from_attributes = True
class ProofSubmit(BaseModel): proof_url: str
class ConversionRequest(BaseModel): hours: int = Field(gt=0)

# --- Modelos Admin ---
class AdminRequestStatusUpdate(BaseModel): status: RequestStatus
class AdminChallengeCreate(ChallengeBase): pass
class AdminParticipantValidation(BaseModel): approved: bool
class AdminSettingsResponse(BaseModel): points_per_hour: int
class Config: from_attributes = True
class AdminSettingsUpdate(BaseModel): points_per_hour: int = Field(gt=0)
class AdminRequestDetails(RequestResponse): profiles: Optional[Profile] = None
class AdminParticipantDetails(ParticipantResponse): profiles: Optional[Profile] = None; challenges: Optional[Challenge] = None