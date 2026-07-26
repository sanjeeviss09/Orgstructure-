"""
main.py — AIRA Python Orchestrator with Neural Brain

Flow per request:
  1. Receive message + userId from Node.js backend
  2. Load user's last 10 DB messages  → inject as LLM history
  3. Load personalization note        → inject into system prompt
  4. Load recent global learnings     → inject into system prompt
  5. Call NVIDIA LLaMA 3.1 8B
  6. Persist exchange to DB           → async (no latency impact)
  7. Run self-improvement analysis    → async (no latency impact)
  8. Return reply to Node.js

New endpoints:
  GET  /api/brain/health           → neural brain stats
  GET  /api/brain/memory/{userId}  → user's last 10 messages (for frontend restore)
"""

import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from aira.orchestrator.registry.capability_registry import CapabilityRegistry
from aira.orchestrator.providers.nvidia import NvidiaAIProvider
from aira.shared.logger import get_aira_logger
from aira.agents.manager.sdk import AgentManager
from aira.memory.neural_brain_memory import NeuralBrainMemory
from aira.memory.self_improvement import SelfImprovementEngine

logger = get_aira_logger("python_api_server")

app = FastAPI(title="AIRA Enterprise Python Backend — Neural Brain v2")

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── AI Provider ──────────────────────────────────────────────────────────────
from aira.orchestrator.providers.mock import MockAIProvider
capability_registry = CapabilityRegistry()
mock_provider = MockAIProvider(simulate_latency=1.0)
capability_registry.register("reasoning", mock_provider)

# ── Agent Manager ────────────────────────────────────────────────────────────
agent_manager = AgentManager()

# ── Neural Brain (initialized on startup) ────────────────────────────────────
neural_memory = NeuralBrainMemory()
improvement_engine = SelfImprovementEngine(memory=neural_memory)


@app.on_event("startup")
async def startup_event():
    """Initialize the SQLite memory tables on first run."""
    await neural_memory.initialize()
    stats = await neural_memory.get_brain_stats()
    logger.info(
        f"[NeuralBrain] ✅ Online — "
        f"{stats['total_conversations']} total exchanges, "
        f"{stats['unique_users']} unique users"
    )


# ── Request / Response models ─────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    role: str
    activeTab: str
    context: str
    history: List[Dict[str, str]] = []
    # NEW: user identity forwarded from Node.js
    userId: Optional[str] = "anonymous"
    userName: Optional[str] = "User"


# ── Helper: detect intent for memory tagging ──────────────────────────────────
def _detect_intent(msg: str) -> str:
    from aira.memory.self_improvement import detect_intent
    return detect_intent(msg)


# ──────────────────────────────────────────────────────────────────────────────
# Main chat orchestration endpoint
# ──────────────────────────────────────────────────────────────────────────────

@app.post("/api/orchestrate")
async def orchestrate_chat(req: ChatRequest):
    logger.info(f"[Brain] Incoming: user={req.userName} ({req.userId}) role={req.role}")

    user_id = req.userId or "anonymous"
    user_name = req.userName or "User"

    # ── 1. Detect intent for tagging ─────────────────────────────────────────
    intent = _detect_intent(req.message)

    # ── 2. Load persistent memory from DB (last 10 exchanges) ────────────────
    db_history = await neural_memory.get_user_history(user_id=user_id, limit=10)
    logger.info(f"[Brain] Loaded {len(db_history)//2} past exchanges for {user_id}")

    # ── 3. Load personalization note ─────────────────────────────────────────
    personalization_note = await neural_memory.get_personalization_note(user_id)

    # ── 4. Load recent global learnings ──────────────────────────────────────
    recent_learnings = await neural_memory.get_recent_learnings(limit=3)

    # ── 5. Build system prompt ────────────────────────────────────────────────
    role_personality: dict[str, str] = {
        "Admin":      "You are assisting an Admin who has full platform access.",
        "Management": "You are assisting a Senior Executive/Management user focused on strategic workforce insights.",
        "HOD":        "You are assisting a Head of Department focused on their team and department metrics.",
        "Manager":    "You are assisting a Team Manager focused on their direct team.",
        "Employee":   "You are assisting an Employee with their personal HR queries.",
        "Intern":     "You are assisting an Intern with their internship queries.",
    }

    # Personalization block (only shown when note exists)
    personalization_block = (
        f"\n\n## USER PERSONALIZATION (learned from {user_name}'s history):\n{personalization_note}"
        if personalization_note
        else ""
    )

    # Global learning block
    learnings_block = (
        "\n\n## AIRA SELF-LEARNED IMPROVEMENTS:\n" + "\n".join(f"- {l}" for l in recent_learnings)
        if recent_learnings
        else ""
    )

    system_prompt = f"""You are Aira, the Enterprise AI Companion built into the ORG Enterprise Intelligence Platform. ORG is a leading Pharmaceutical Science and Research Company. All your examples, generated roles, departments, and responses must strictly reflect the pharma and life sciences industry (e.g., Clinical Research, R&D, Pharmacovigilance, Lab Scientists, etc.). Never use IT or Software Engineering roles as defaults.
{role_personality.get(req.role, role_personality['Employee'])}

Platform Context:
{req.context}

Currency: Always use ₹ (Indian Rupee / INR). Never use $ or USD.

## YOUR PERSONA & MISSION:
- You have full platform access and deep intelligence across all modules.
- You are highly proactive: whenever possible, offer your own intelligent suggestions, strategic insights, and future planning advice tailored to the user's role.
- You exist in real-time, working alongside the user as a living digital employee, not just a static bot.
- You must interact deeply with Managers, HODs, and Employees, motivating them, celebrating their successes, and providing a highly friendly, warm, and engaging feel.

## CRITICAL RESPONSE RULES - YOU MUST FOLLOW THESE:
1. **NEVER tell the user to navigate, click tabs, or go to a page.**
2. **ALWAYS answer the question directly here**, inline in this chat panel. If you have data, use it.
3. **Use markdown formatting for clean presentation:**
   - Use **bold** for labels and key numbers
   - Use bullet lists (- item) for lists of items
   - Use markdown tables (| Col | Col |) for comparative or multi-column data
4. **If seeing the full page/report would give extra value**, add ONE navigation token at the very END of your reply in this exact format:
   [NAVIGATE:tabname:Button Label]
   Valid tab names ONLY: dashboard, orgchart, directory, recruitment, wellness, reports, templates, targets, manage_interns, user_analytics
5. **Role-Based Action Boundaries**: Admins, Managers, HR, and Employees DO NOT accept job offers. NEVER generate \"Accept Offer\" instructions.
6. **Use the context data to give real answers.**
7. **Budget/CTC**: Always format in Indian format (₹ X,XX,XXX or ₹ X Lakh).
8. **Be concise but complete.** 3-8 lines is ideal.
9. **Tone**: Warm, professional, confident. You are an expert HR partner.{personalization_block}{learnings_block}"""

    # ── 6. Assemble LLM messages ──────────────────────────────────────────────
    # Priority order: system → DB long-term history → in-flight short-term history → current message
    messages = [{"role": "system", "content": system_prompt}]

    # Long-term: from DB
    messages.extend(db_history)

    # Short-term: from the current session (sent by Node.js / ChatPanel)
    # Avoid duplicating if DB history already covers recent turns
    if not db_history:
        for h in req.history[-8:]:
            messages.append({"role": h["role"], "content": h["content"]})

    # Current user message
    messages.append({"role": "user", "content": req.message})

    # ── 7. Call AI provider ───────────────────────────────────────────────────
    provider = capability_registry.get_provider_for("reasoning")
    try:
        reply = await provider.generate(prompt=req.message, context={"messages": messages})
    except Exception as e:
        logger.error(f"[Brain] Provider failed: {e}")
        return {"error": str(e)}

    # ── 8. Persist exchange to DB (async, doesn't block response) ─────────────
    asyncio.create_task(
        neural_memory.save_exchange(
            user_id=user_id,
            user_name=user_name,
            role=req.role,
            user_msg=req.message,
            ai_reply=reply,
            intent=intent,
        )
    )

    # ── 9. Run self-improvement analysis (async, doesn't block response) ──────
    improvement_engine.schedule(
        user_id=user_id,
        user_name=user_name,
        role=req.role,
        user_msg=req.message,
        ai_reply=reply,
    )

    logger.info(f"[Brain] ✅ Response sent to {user_name} (intent={intent})")
    return {"reply": reply}


# ──────────────────────────────────────────────────────────────────────────────
# Neural Brain Health Endpoint
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/api/brain/health")
async def brain_health():
    """
    Real-time neural brain status.
    Returns memory stats, user counts, and learning log size.
    """
    stats = await neural_memory.get_brain_stats()
    return stats


# ──────────────────────────────────────────────────────────────────────────────
# Per-User History Endpoint (used by ChatPanel on mount to restore conversation)
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/api/brain/memory/{user_id}")
async def get_user_memory(user_id: str, limit: int = 10):
    """
    Returns the last `limit` exchanges for a user in raw format.
    Frontend uses this to restore the chat window on load.
    """
    history = await neural_memory.get_raw_history(user_id=user_id, limit=limit)
    return {
        "user_id": user_id,
        "count": len(history),
        "history": history,
    }


# ──────────────────────────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
