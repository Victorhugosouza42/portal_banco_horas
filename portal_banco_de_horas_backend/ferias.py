# ferias.py
from fastapi import APIRouter
from pydantic import BaseModel
from supabase_client import supabase # O nosso arquivo de conexão com o banco
from datetime import date
from typing import Optional

# Criamos um "roteador" para agrupar todas as rotas relacionadas a férias
router = APIRouter(prefix="/ferias", tags=["Férias"])

# ==========================================
# 1. MODELOS DE DADOS (Validação)
# ==========================================

# Como o Admin vai enviar o ajuste de saldo
class AjusteSaldo(BaseModel):
    user_id: str
    dias: int # Pode ser um número positivo (ex: 5) ou negativo (ex: -2)

# Como o Admin vai enviar o registo de um período de férias
class NovaFerias(BaseModel):
    user_id: str
    start_date: date
    end_date: date
    notes: Optional[str] = None # Observação opcional

# ==========================================
# 2. ROTAS DO UTILIZADOR (Estritamente Leitura)
# ==========================================

@router.get("/meu-saldo/{user_id}")
def obter_saldo_usuario(user_id: str):
    """
    Devolve apenas o saldo atual do servidor. 
    Não faz alterações no banco de dados.
    """
    resposta = supabase.table("vacation_balances").select("days").eq("user_id", user_id).execute()
    
    # Se o utilizador já tiver um registo, devolvemos os dias. Se não, devolvemos 0.
    if len(resposta.data) > 0:
        return {"dias": resposta.data[0]["days"]}
    else:
        return {"dias": 0}

# ==========================================
# 3. ROTAS DO ADMINISTRADOR (Leitura e Escrita)
# ==========================================

@router.post("/admin/ajustar-saldo")
def ajustar_saldo_admin(dados: AjusteSaldo):
    """
    O Admin adiciona ou remove dias do saldo do funcionário.
    """
    # Passo A: Descobrir quantos dias o funcionário já tem hoje
    resposta = supabase.table("vacation_balances").select("days").eq("user_id", dados.user_id).execute()
    
    saldo_atual = 0
    if len(resposta.data) > 0:
        saldo_atual = resposta.data[0]["days"]
        
    # Passo B: Calcular o novo saldo
    novo_saldo = saldo_atual + dados.dias
    
    # Passo C: Guardar o novo saldo no banco (upsert = atualiza se existir, cria se não existir)
    supabase.table("vacation_balances").upsert({
        "user_id": dados.user_id,
        "days": novo_saldo
    }).execute()
    
    # Passo D: Criar um registro no histórico
    hoje = date.today().isoformat()
    nota = f"AJUSTE MANUAL DE SALDO: {dados.dias} dias" if dados.dias >= 0 else f"AJUSTE MANUAL DE SALDO: {dados.dias} dias"
    
    supabase.table("vacation_history").insert({
        "user_id": dados.user_id,
        "start_date": hoje,
        "end_date": hoje,
        "notes": nota
    }).execute()
    
    return {"mensagem": "Saldo atualizado com sucesso!", "novo_saldo": novo_saldo}

@router.post("/admin/historico")
def registrar_periodo_ferias(dados: NovaFerias):
    """
    O Admin regista no histórico que o funcionário vai tirar férias.
    """
    supabase.table("vacation_history").insert({
        "user_id": dados.user_id,
        "start_date": dados.start_date.isoformat(),
        "end_date": dados.end_date.isoformat(),
        "notes": dados.notes
    }).execute()
    
    return {"mensagem": "Período de férias registado com sucesso!"}

@router.get("/admin/relatorio")
def obter_relatorio_ferias():
    """
    Gera o relatório com todos os períodos de férias agendados ou tirados.
    Puxa também o nome do perfil do utilizador.
    """
    # A magia do Supabase: com "profiles(name)", ele já traz o nome do funcionário junto!
    resposta = supabase.table("vacation_history").select("*, profiles(name)").order("start_date", desc=True).execute()
    return resposta.data

@router.delete("/admin/historico/{id}")
def excluir_registro_ferias(id: str):
    """
    Exclui um registro do histórico de férias pelo ID.
    O saldo de dias NÃO é alterado automaticamente, se necessário, o admin deve corrigir manualmente.
    """
    supabase.table("vacation_history").delete().eq("id", id).execute()
    return {"mensagem": "Registro excluído com sucesso!"}