# ferias.py
import re
from fastapi import APIRouter
from pydantic import BaseModel
from supabase_client import supabase
from datetime import date
from typing import Optional

router = APIRouter(prefix="/ferias", tags=["Ferias"])

class AjusteSaldo(BaseModel):
    user_id: str
    tipo: str
    dias: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class NovaFerias(BaseModel):
    user_id: str
    start_date: date
    end_date: date
    notes: Optional[str] = None

@router.get("/meu-saldo/{user_id}")
def obter_saldo_usuario(user_id: str):
    r = supabase.table("vacation_balances").select("days").eq("user_id", user_id).execute()
    return {"dias": r.data[0]["days"] if r.data else 0}

@router.post("/admin/ajustar-saldo")
def ajustar_saldo_admin(dados: AjusteSaldo):
    r = supabase.table("vacation_balances").select("days").eq("user_id", dados.user_id).execute()
    saldo_atual = r.data[0]["days"] if r.data else 0
    hoje = date.today().isoformat()

    if dados.tipo == 'concessao':
        ajuste   = dados.dias
        nota     = f"CONCESSAO: +{dados.dias} dias"
        d_inicio = hoje
        d_fim    = hoje
    else:
        ajuste   = -dados.dias
        nota     = f"GOZO: -{dados.dias} dias"
        d_inicio = dados.start_date.isoformat() if dados.start_date else hoje
        d_fim    = dados.end_date.isoformat()   if dados.end_date   else hoje

    supabase.table("vacation_balances").upsert({"user_id": dados.user_id, "days": saldo_atual + ajuste}).execute()
    supabase.table("vacation_history").insert({"user_id": dados.user_id, "start_date": d_inicio, "end_date": d_fim, "notes": nota}).execute()
    return {"mensagem": "OK", "novo_saldo": saldo_atual + ajuste}

@router.post("/admin/historico")
def registrar_periodo_ferias(dados: NovaFerias):
    supabase.table("vacation_history").insert({"user_id": dados.user_id, "start_date": dados.start_date.isoformat(), "end_date": dados.end_date.isoformat(), "notes": dados.notes}).execute()
    return {"mensagem": "OK"}

@router.get("/admin/relatorio")
def obter_relatorio_ferias():
    r = supabase.table("vacation_history").select("*, profiles(name)").order("start_date", desc=True).execute()
    return r.data

@router.delete("/admin/historico/{id}")
def excluir_registro_ferias(id: str):
    res = supabase.table("vacation_history").select("*").eq("id", id).execute()
    if not res.data:
        return {"mensagem": "Nao encontrado."}

    record  = res.data[0]
    notes   = record.get("notes") or ""
    user_id = record["user_id"]

    match = re.search(r'([+-]?\d+)\s*dias', notes)
    if match:
        try:
            dias = int(match.group(1))
            bal  = supabase.table("vacation_balances").select("days").eq("user_id", user_id).execute()
            saldo_atual = bal.data[0]["days"] if bal.data else 0
            supabase.table("vacation_balances").upsert({"user_id": user_id, "days": saldo_atual - dias}).execute()
        except Exception as e:
            print(f"[WARN] reversal failed: {e}")

    supabase.table("vacation_history").delete().eq("id", id).execute()
    return {"mensagem": "Excluido e saldo revertido."}