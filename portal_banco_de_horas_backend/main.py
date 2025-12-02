# Ficheiro: main.py
# (Versão 1.0.9 - Com Gestão de Cargos)

from zoneinfo import ZoneInfo
from fastapi import FastAPI, HTTPException, status, Depends, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from supabase_client import supabase
from models import *
from gotrue.errors import AuthApiError
import auth 
from gotrue.types import User as AuthUser

app = FastAPI(title="Portal Banco de Horas API", version="1.0.9")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# Modelos Locais
class AdminUserUpdate(BaseModel): role: str; is_admin: bool; name: str; email: Optional[str] = None
class AdminPasswordReset(BaseModel): new_password: str
class AdminAdjustment(BaseModel): hours: int; reason: str

# --- Rotas Públicas ---
@app.get("/")
def read_root(): return {"status": "online"}

# NOVO: Rota pública para listar cargos (para o LoginScreen)
@app.get("/roles", response_model=List[Role])
def get_public_roles():
    try:
        res = supabase.table('roles').select("*").order('name', desc=False).execute()
        return [Role.model_validate(i) for i in res.data]
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/challenges", response_model=List[Challenge], tags=["Challenges"])
def get_challenges():
    try:
        res = supabase.table('challenges').select("*").order('created_at', desc=True).execute()
        return [Challenge.model_validate(i) for i in res.data]
    except Exception: raise HTTPException(status_code=500)

@app.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def user_signup(c: UserCreate):
    try:
        s = supabase.auth.sign_up({"email": c.email, "password": c.password})
        if not s.user: raise HTTPException(400, "Falha Auth")
        supabase.table('profiles').insert({"id": str(s.user.id), "name": c.name, "role": c.role, "points": 0, "hours": 0, "email": c.email}).execute()
        return s.user
    except Exception as e: raise HTTPException(500, str(e))

@app.post("/login", response_model=Token)
def user_login(c: UserLogin):
    try:
        s = supabase.auth.sign_in_with_password({"email": c.email, "password": c.password})
        return {"access_token": s.session.access_token, "token_type": "bearer"}
    except Exception: raise HTTPException(401, "Erro login")

# --- Rotas de Usuário ---
user_router = APIRouter(prefix="/me", tags=["User"], dependencies=[Depends(auth.get_current_user)])

@user_router.get("/", response_model=Profile)
def read_users_me(current_user: AuthUser = Depends(auth.get_current_user)):
    try:
        res = supabase.table('profiles').select("*").eq('id', str(current_user.id)).single().execute()
        data = res.data
        if not data.get('email'): data['email'] = current_user.email
        return Profile.model_validate(data)
    except Exception: raise HTTPException(404)

@user_router.get("/participations", response_model=List[ParticipantResponse])
def get_my_participations(current_user: AuthUser = Depends(auth.get_current_user)):
    res = supabase.table('participants').select("*").eq('user_id', str(current_user.id)).execute()
    return [ParticipantResponse.model_validate(i) for i in res.data]

@user_router.get("/requests", response_model=List[RequestResponse])
def get_my_requests(current_user: AuthUser = Depends(auth.get_current_user)):
    res = supabase.table('requests').select("*").eq('user_id', str(current_user.id)).order('created_at', desc=True).execute()
    return [RequestResponse.model_validate(i) for i in res.data]

@user_router.post("/requests", response_model=RequestResponse)
def create_request(r: RequestCreate, current_user: AuthUser = Depends(auth.get_current_user)):
    res = supabase.table('requests').insert({"user_id": str(current_user.id), "type": r.type.value, "hours": r.hours, "reason": r.reason, "status": "pendente"}).execute()
    return RequestResponse.model_validate(res.data[0])

@user_router.post("/convert", response_model=Profile)
def convert_points(c: ConversionRequest, current_user: AuthUser = Depends(auth.get_current_user)):
    try:
        supabase.rpc('convert_points_to_hours', {'p_user_id': str(current_user.id), 'p_hours_to_add': c.hours}).execute()
        return read_users_me(current_user)
    except Exception as e: raise HTTPException(400, str(e))

@user_router.post("/challenges/{cid}/enroll", response_model=ParticipantResponse)
def enroll(cid: UUID, current_user: AuthUser = Depends(auth.get_current_user)):
    try:
        check = supabase.table('participants').select("id").eq('user_id', str(current_user.id)).eq('challenge_id', str(cid)).execute()
        if check.data: raise HTTPException(400, "Ja inscrito")
        supabase.table('participants').insert({"user_id": str(current_user.id), "challenge_id": str(cid), "status": "inscrito"}).execute()
        res = supabase.table('participants').select("*").eq('user_id', str(current_user.id)).eq('challenge_id', str(cid)).single().execute()
        return ParticipantResponse.model_validate(res.data)
    except Exception as e: raise HTTPException(500, str(e))

@user_router.post("/challenges/{cid}/proof", response_model=ParticipantResponse)
def submit_proof(cid: UUID, proof: ProofSubmit, current_user: AuthUser = Depends(auth.get_current_user)):
    supabase.table('participants').update({"status": "enviado", "proof_url": proof.proof_url}).eq('user_id', str(current_user.id)).eq('challenge_id', str(cid)).execute()
    res = supabase.table('participants').select("*").eq('user_id', str(current_user.id)).eq('challenge_id', str(cid)).single().execute()
    return ParticipantResponse.model_validate(res.data)

app.include_router(user_router) 

# --- Rotas de Admin ---
admin_router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(auth.get_current_admin_user)])

@admin_router.get("/settings", response_model=AdminSettingsResponse)
def admin_get_settings():
    res = supabase.table('settings').select('*').eq('id', 1).single().execute()
    return AdminSettingsResponse.model_validate(res.data)

@admin_router.put("/settings", response_model=AdminSettingsResponse)
def admin_update_settings(settings: AdminSettingsUpdate):
    res = supabase.table('settings').update(settings.model_dump(mode='json')).eq('id', 1).execute()
    return AdminSettingsResponse.model_validate(res.data[0])

@admin_router.get("/requests", response_model=List[AdminRequestDetails])
def admin_get_all_requests():
    res = supabase.table('requests').select('*, profiles!requests_user_id_fkey(*)').order('created_at', desc=True).execute()
    return [AdminRequestDetails.model_validate(i) for i in res.data]

@admin_router.get("/users/{uid}/requests", response_model=List[RequestResponse])
def admin_get_user_requests(uid: UUID):
    res = supabase.table('requests').select("*").eq('user_id', str(uid)).order('created_at', desc=True).execute()
    return [RequestResponse.model_validate(i) for i in res.data]

@admin_router.post("/requests/{rid}/process", status_code=status.HTTP_204_NO_CONTENT)
def admin_process_request(rid: UUID, update_data: AdminRequestStatusUpdate):
    supabase.rpc('process_request', {'p_request_id': str(rid), 'p_new_status': update_data.status.value}).execute()

@admin_router.post("/challenges", response_model=Challenge, status_code=status.HTTP_201_CREATED)
def admin_create_challenge(challenge_data: AdminChallengeCreate):
    """ [ADMIN] Cria um novo desafio de gamificação com Fuso Horário Correto. """
    try:
        if challenge_data.due_at:
            naive_date = challenge_data.due_at
            aware_date = naive_date.replace(tzinfo=ZoneInfo("America/Sao_Paulo"))
            challenge_data.due_at = aware_date        
        response = supabase.table('challenges') \
            .insert(challenge_data.model_dump(mode='json')) \
            .execute()
            
        return Challenge.model_validate(response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.delete("/challenges/{cid}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_challenge(cid: UUID):
    supabase.table('challenges').delete().eq('id', str(cid)).execute()

@admin_router.get("/participants/all", response_model=List[AdminParticipantDetails])
def admin_get_all_participants():
    res = supabase.table('participants').select('*, profiles!participants_user_id_fkey(*), challenges!participants_challenge_id_fkey(*)').order('created_at', desc=True).execute()
    return [AdminParticipantDetails.model_validate(i) for i in res.data]

@admin_router.get("/participants/pending", response_model=List[AdminParticipantDetails])
def admin_get_pending():
    res = supabase.table('participants').select('*, profiles!participants_user_id_fkey(*), challenges!participants_challenge_id_fkey(*)').eq('status', 'enviado').execute()
    return [AdminParticipantDetails.model_validate(i) for i in res.data]

@admin_router.post("/participants/{pid}/validate")
def validate_part(pid: UUID, v: AdminParticipantValidation):
    supabase.rpc('validate_participation', {'p_participant_id': str(pid), 'p_approved': v.approved}).execute()
    return {"ok": True}

@admin_router.get("/users", response_model=List[Profile])
def list_users():
    res = supabase.table('profiles').select('*').order('name', desc=False).execute()
    return [Profile.model_validate(i) for i in res.data]

@admin_router.put("/users/{uid}", response_model=Profile)
def update_user(uid: UUID, u: AdminUserUpdate):
    res = supabase.table('profiles').update(u.model_dump(exclude_unset=True)).eq('id', str(uid)).execute()
    return Profile.model_validate(res.data[0])

@admin_router.delete("/users/{uid}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_user(uid: UUID):
    supabase.rpc('admin_delete_user', {'p_user_id': str(uid)}).execute()

@admin_router.post("/users/{uid}/reset_password")
def admin_reset_user_password(uid: UUID, data: AdminPasswordReset):
    supabase.rpc('admin_reset_password', {'p_user_id': str(uid), 'p_new_password': data.new_password}).execute()
    return {"message": "Senha alterada."}

@admin_router.post("/users/{uid}/adjust")
def admin_adjust_hours(uid: UUID, data: AdminAdjustment):
    supabase.rpc('admin_add_hours', {'p_user_id': str(uid), 'p_hours': data.hours, 'p_reason': data.reason}).execute()
    return {"message": "Ajuste realizado."}

# --- NOVO: Gerenciamento de Cargos (Roles) ---
@admin_router.post("/roles")
def add_role(role: RoleBase):
    try:
        supabase.table('roles').insert({"name": role.name}).execute()
        return {"message": "Cargo criado."}
    except Exception as e: raise HTTPException(500, str(e))

@admin_router.delete("/roles/{rid}")
def delete_role(rid: UUID):
    supabase.table('roles').delete().eq('id', str(rid)).execute()
    return {"message": "Cargo apagado."}

app.include_router(admin_router)