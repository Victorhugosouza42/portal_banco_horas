# Ficheiro: main.py
from fastapi import FastAPI, HTTPException, status, Depends, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from supabase_client import supabase
from zoneinfo import ZoneInfo 


# Importações
from models import * 
from gotrue.errors import AuthApiError
import auth 
from gotrue.types import User as AuthUser
import ferias

app = FastAPI(
    title="Portal Banco de Horas API",
    description="API para o sistema de gamificação da 14ª Regional",
    version="1.1.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Modelos Locais ---
class AdminUserUpdate(BaseModel):
    role: str
    is_admin: bool
    name: str
    email: Optional[str] = None

class AdminPasswordReset(BaseModel):
    new_password: str

class AdminAdjustment(BaseModel):
    hours: int
    reason: str

class UserPasswordUpdate(BaseModel):
    password: str

# --- ROTAS PÚBLICAS ---
@app.get("/")
def read_root():
    return {"status": "online", "message": "Bem-vindo à API do Banco de Horas!"}

@app.get("/roles", response_model=List[Role])
def get_public_roles():
    try:
        res = supabase.table('roles').select("*").order('name', desc=False).execute()
        return [Role.model_validate(i) for i in res.data]
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/challenges", response_model=List[Challenge], tags=["Challenges"])
def get_challenges():
    try:
        response = supabase.table('challenges').select("*").order('created_at', desc=True).execute()
        return [Challenge.model_validate(item) for item in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno.")

@app.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def user_signup(credentials: UserCreate):
    try:
        session = supabase.auth.sign_up({"email": credentials.email, "password": credentials.password})
        new_user = session.user
        
        if not new_user:
             raise HTTPException(status_code=400, detail="Falha ao criar utilizador no Auth.")

        profile_data = {
            "id": str(new_user.id), 
            "name": credentials.name,
            "role": credentials.role, 
            "points": 0, 
            "hours": 0,
            "email": credentials.email 
        }
        supabase.table('profiles').insert(profile_data).execute()
        return new_user

    except Exception as e:
        error_message = str(e)
        if ("invalid" in error_message.lower() or "already exists" in error_message.lower()):
            raise HTTPException(status_code=400, detail="Utilizador já existe ou dados inválidos.")
        raise HTTPException(status_code=500, detail=f"Erro interno: {error_message}")

@app.post("/login", response_model=Token)
def user_login(credentials: UserLogin):
    try:
        session = supabase.auth.sign_in_with_password({"email": credentials.email, "password": credentials.password})
        return {"access_token": session.session.access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos.")

# --- ROTAS DE UTILIZADOR ---
user_router = APIRouter(prefix="/me", tags=["User"], dependencies=[Depends(auth.get_current_user)])

@user_router.get("/", response_model=Profile)
def read_users_me(current_user: AuthUser = Depends(auth.get_current_user)):
    try:
        res = supabase.table('profiles').select("*").eq('id', str(current_user.id)).single().execute()
        data = res.data
        if not data.get('email'): data['email'] = current_user.email
        return Profile.model_validate(data)
    except Exception: raise HTTPException(status_code=404, detail="Perfil não encontrado.")

@user_router.get("/settings", response_model=AdminSettingsResponse)
def get_user_settings(current_user: AuthUser = Depends(auth.get_current_user)):
    try:
        res = supabase.table('settings').select('*').eq('id', 1).single().execute()
        return AdminSettingsResponse.model_validate(res.data)
    except Exception:
        return AdminSettingsResponse(points_per_hour=10)

@user_router.put("/password")
def update_my_password(data: UserPasswordUpdate, current_user: AuthUser = Depends(auth.get_current_user)):
    try:
        supabase.rpc('admin_reset_password', {
            'p_user_id': str(current_user.id),
            'p_new_password': data.password
        }).execute()
        return {"message": "Senha atualizada com sucesso."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar senha: {str(e)}")

@user_router.get("/participations", response_model=List[ParticipantResponse])
def get_my_participations(current_user: AuthUser = Depends(auth.get_current_user)):
    try:
        res = supabase.table('participants').select("*").eq('user_id', str(current_user.id)).execute()
        return [ParticipantResponse.model_validate(i) for i in res.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@user_router.get("/requests", response_model=List[RequestResponse])
def get_my_requests(current_user: AuthUser = Depends(auth.get_current_user)):
    res = supabase.table('requests').select("*").eq('user_id', str(current_user.id)).order('created_at', desc=True).execute()
    return [RequestResponse.model_validate(i) for i in res.data]

@user_router.post("/requests", response_model=RequestResponse, status_code=status.HTTP_201_CREATED)
def create_request(request_data: RequestCreate, current_user: AuthUser = Depends(auth.get_current_user)):
    try:
        new_request_data = {
            "user_id": str(current_user.id), 
            "type": request_data.type.value,
            "hours": request_data.hours, 
            "reason": request_data.reason,
            "status": "pendente"
        }
        response = supabase.table('requests').insert(new_request_data).execute()
        return RequestResponse.model_validate(response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@user_router.post("/convert", response_model=Profile)
def convert_points(conversion_data: ConversionRequest, current_user: AuthUser = Depends(auth.get_current_user)):
    try:
        supabase.rpc('convert_points_to_hours', {
            'p_user_id': str(current_user.id),
            'p_hours_to_add': conversion_data.hours
        }).execute()
        return read_users_me(current_user)
    except Exception as e:
        error_msg = str(e)
        if "Pontos insuficientes" in error_msg:
             raise HTTPException(status_code=400, detail=error_msg)
        raise HTTPException(status_code=500, detail=f"Erro na conversão: {error_msg}")

@user_router.post("/challenges/{cid}/enroll", response_model=ParticipantResponse)
def enroll_in_challenge(cid: UUID, current_user: AuthUser = Depends(auth.get_current_user)):
    try:
        existing = supabase.table('participants').select("id").eq('user_id', str(current_user.id)).eq('challenge_id', str(cid)).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Já inscrito.")
        
        new_enrollment = {"user_id": str(current_user.id), "challenge_id": str(cid), "status": "inscrito"}
        response = supabase.table('participants').insert(new_enrollment).execute()
        return ParticipantResponse.model_validate(response.data[0])
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@user_router.post("/challenges/{cid}/proof", response_model=ParticipantResponse)
def submit_challenge_proof(cid: UUID, proof_data: ProofSubmit, current_user: AuthUser = Depends(auth.get_current_user)):
    try:
        response = supabase.table('participants') \
            .update({"status": "enviado", "proof_url": proof_data.proof_url}) \
            .eq('user_id', str(current_user.id)) \
            .eq('challenge_id', str(cid)) \
            .eq('status', 'inscrito') \
            .execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Participação não encontrada ou já enviada.")
        return ParticipantResponse.model_validate(response.data[0])
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

app.include_router(user_router) 

# --- ROTAS DE ADMIN ---
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
    return [AdminRequestDetails.model_validate(item) for item in res.data]

@admin_router.get("/users/{uid}/requests", response_model=List[RequestResponse])
def admin_get_user_requests(uid: UUID):
    res = supabase.table('requests').select("*").eq('user_id', str(uid)).order('created_at', desc=True).execute()
    return [RequestResponse.model_validate(i) for i in res.data]

@admin_router.post("/requests/{rid}/process", status_code=status.HTTP_204_NO_CONTENT)
def admin_process_request(rid: UUID, update_data: AdminRequestStatusUpdate):
    supabase.rpc('process_request', {'p_request_id': str(rid), 'p_new_status': update_data.status.value}).execute()

@admin_router.post("/challenges", response_model=Challenge, status_code=status.HTTP_201_CREATED)
def admin_create_challenge(challenge_data: AdminChallengeCreate):
    try:
        if challenge_data.due_at:
            aware_date = challenge_data.due_at.replace(tzinfo=ZoneInfo("America/Sao_Paulo"))
            challenge_data.due_at = aware_date
        res = supabase.table('challenges').insert(challenge_data.model_dump(mode='json')).execute()
        return Challenge.model_validate(res.data[0])
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@admin_router.delete("/challenges/{cid}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_challenge(cid: UUID):
    supabase.table('challenges').delete().eq('id', str(cid)).execute()

@admin_router.get("/participants/all", response_model=List[AdminParticipantDetails])
def admin_get_all_participants():
    res = supabase.table('participants').select('*, profiles!participants_user_id_fkey(*), challenges!participants_challenge_id_fkey(*)').order('created_at', desc=True).execute()
    return [AdminParticipantDetails.model_validate(item) for item in res.data]

@admin_router.get("/participants/pending", response_model=List[AdminParticipantDetails])
def admin_get_pending_validations():
    res = supabase.table('participants').select('*, profiles!participants_user_id_fkey(*), challenges!participants_challenge_id_fkey(*)').eq('status', 'enviado').order('created_at', desc=False).execute()
    return [AdminParticipantDetails.model_validate(item) for item in res.data]

@admin_router.post("/participants/{pid}/validate", status_code=status.HTTP_204_NO_CONTENT)
def admin_validate_participation(pid: UUID, validation_data: AdminParticipantValidation):
    supabase.rpc('validate_participation', {'p_participant_id': str(pid), 'p_approved': validation_data.approved}).execute()

@admin_router.get("/users", response_model=List[AdminUserListResponse])
def admin_list_users():
    res = supabase.table('profiles').select('*, vacation_balances(days)').order('name', desc=False).execute()
    users = []
    for i in res.data:
        vac_bal = i.get('vacation_balances')
        days = 0
        if vac_bal:
            if isinstance(vac_bal, list) and len(vac_bal) > 0:
                days = vac_bal[0].get('days', 0)
            elif isinstance(vac_bal, dict):
                days = vac_bal.get('days', 0)
        i['vacation_days'] = days
        users.append(AdminUserListResponse.model_validate(i))
    return users

@admin_router.put("/users/{uid}", response_model=Profile)
def admin_update_user(uid: UUID, user_data: AdminUserUpdate):
    res = supabase.table('profiles').update(user_data.model_dump(exclude_unset=True)).eq('id', str(uid)).execute()
    return Profile.model_validate(res.data[0])

@admin_router.delete("/users/{uid}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_user(uid: UUID):
    supabase.rpc('admin_delete_user', {'p_user_id': str(uid)}).execute()

@admin_router.post("/users/{uid}/reset_password")
def admin_reset_user_password(uid: UUID, data: AdminPasswordReset):
    supabase.rpc('admin_reset_password', {'p_user_id': str(uid), 'p_new_password': data.new_password}).execute()
    return {"message": "Senha alterada com sucesso."}

@admin_router.post("/users/{uid}/adjust")
def admin_adjust_hours(uid: UUID, data: AdminAdjustment):
    supabase.rpc('admin_add_hours', {'p_user_id': str(uid), 'p_hours': data.hours, 'p_reason': data.reason}).execute()
    return {"message": "Ajuste realizado."}

@admin_router.post("/roles")
def add_role(role: RoleBase):
    supabase.table('roles').insert({"name": role.name}).execute()
    return {"message": "Cargo criado."}

@admin_router.delete("/roles/{rid}")
def delete_role(rid: UUID):
    supabase.table('roles').delete().eq('id', str(rid)).execute()
    return {"message": "Cargo apagado."}

app.include_router(admin_router)
app.include_router(ferias.router)