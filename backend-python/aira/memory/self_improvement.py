"""
self_improvement.py — AIRA Self-Improvement Loop

Analyses completed conversation turns to detect intent, extract learning
signals, and feed improvements back into the NeuralBrainMemory.

This module runs asynchronously after each AI response — it never blocks
the user-facing request/response cycle.

Improvement signals detected:
  - Intent classification (keyword-based, fast)
  - Format-preference detection (tables vs. bullets vs. prose)
  - Ambiguity signals (user asking the same thing repeatedly)
  - Correction signals (user says "no, I meant..." or "that's wrong")
"""

import asyncio
from typing import TYPE_CHECKING, Optional

from aira.shared.logger import get_aira_logger

if TYPE_CHECKING:
    from aira.memory.neural_brain_memory import NeuralBrainMemory

logger = get_aira_logger("self_improvement")

# ──────────────────────────────────────────────────────────────────────────────
# Intent detector (lightweight keyword router — no extra model needed)
# ──────────────────────────────────────────────────────────────────────────────

INTENT_KEYWORDS: dict[str, list[str]] = {
    "Recruitment":      ["hire", "hiring", "candidate", "interview", "job", "vacancy", "offer letter", "jd", "requisition"],
    "Payroll":          ["salary", "ctc", "pay", "payslip", "payroll", "compensation", "increment", "appraisal"],
    "Attendance":       ["leave", "holiday", "attendance", "absent", "wfh", "work from home", "late"],
    "Performance":      ["performance", "kpi", "review", "goal", "target", "appraisal", "rating", "feedback"],
    "Workforce":        ["headcount", "workforce", "manpower", "attrition", "turnover", "retention"],
    "Analytics":        ["report", "dashboard", "analytics", "trend", "metric", "data", "statistics"],
    "Knowledge Search": ["policy", "sop", "manual", "guideline", "procedure", "document", "template"],
    "Organisation":     ["org chart", "department", "team", "structure", "reporting", "hierarchy"],
    "Learning":         ["training", "course", "learning", "certification", "skill", "upskill"],
}

CORRECTION_SIGNALS = [
    "no, i meant", "that's wrong", "incorrect", "not what i asked",
    "you misunderstood", "that's not right", "wrong answer",
]


def detect_intent(user_msg: str) -> str:
    """Fast keyword-based intent classifier. Returns the best-matching intent."""
    lower = user_msg.lower()
    scores: dict[str, int] = {}
    for intent, keywords in INTENT_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in lower)
        if score:
            scores[intent] = score
    return max(scores, key=lambda k: scores[k]) if scores else "General"


def detect_correction(user_msg: str) -> bool:
    """Returns True if the user appears to be correcting a previous AI response."""
    lower = user_msg.lower()
    return any(signal in lower for signal in CORRECTION_SIGNALS)


# ──────────────────────────────────────────────────────────────────────────────
# Self-Improvement Engine
# ──────────────────────────────────────────────────────────────────────────────

class SelfImprovementEngine:
    """
    Runs asynchronously after each conversation turn.

    Responsibilities:
      1. Detect intent from user message
      2. Update user preference profile in NeuralBrainMemory
      3. Log correction signals to the learning log
      4. Fire-and-forget: never blocks the response path
    """

    PERSONALIZATION_THRESHOLD = 20  # Conservative: personalise after 20 interactions

    def __init__(self, memory: "NeuralBrainMemory"):
        self.memory = memory

    def schedule(
        self,
        user_id: str,
        user_name: str,
        role: str,
        user_msg: str,
        ai_reply: str,
    ) -> None:
        """
        Schedule the improvement analysis as a non-blocking background task.
        Call this immediately after saving the exchange — it will not delay the response.
        """
        asyncio.create_task(
            self._analyse(user_id, user_name, role, user_msg, ai_reply)
        )

    async def _analyse(
        self,
        user_id: str,
        user_name: str,
        role: str,
        user_msg: str,
        ai_reply: str,
    ) -> None:
        """Core analysis logic — runs in the background."""
        try:
            intent = detect_intent(user_msg)
            logger.debug(f"[SelfImprovement] user={user_id} intent={intent}")

            # 1. Update preference & affinity profile
            await self.memory.update_preferences(
                user_id=user_id,
                user_name=user_name,
                intent=intent,
                ai_reply=ai_reply,
                personalization_threshold=self.PERSONALIZATION_THRESHOLD,
            )

            # 2. Log correction signals to the global learning log
            if detect_correction(user_msg):
                improvement_note = (
                    f"User {user_name} ({role}) indicated a correction on topic '{intent}'. "
                    f"Sample: \"{user_msg[:120]}\". "
                    f"Review responses for this intent for accuracy."
                )
                await self.memory.add_learning(
                    pattern_key=f"correction:{intent}",
                    sample_msg=user_msg[:200],
                    improvement_note=improvement_note,
                )
                logger.info(f"[SelfImprovement] 📝 Correction logged for intent={intent}")

        except Exception as e:
            # Never let background analysis crash the app
            logger.error(f"[SelfImprovement] Background analysis failed: {e}")
