"""
neural_brain_memory.py — AIRA Neural Brain Memory Engine

Provides persistent, per-user conversation memory and a self-improvement
learning log backed by a local SQLite database (aira_memory.db).

Architecture:
  - conversations    : every user ↔ AIRA exchange, indexed by user_id
  - user_preferences : affinity scores and format preferences per user
  - learning_log     : patterns AIRA has learned, fed back into prompts
"""

import json
import os
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

import aiosqlite

from aira.shared.logger import get_aira_logger

logger = get_aira_logger("neural_brain_memory")

# DB lives at backend-python root level
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "aira_memory.db")


class NeuralBrainMemory:
    """
    The persistent memory layer for AIRA.

    Responsibilities:
      1. Save every conversation exchange (user message + AI reply) to SQLite
      2. Load a user's last N messages to inject as LLM chat history
      3. Track per-user intent affinity (what topics they ask about most)
      4. Build a personalization note injected into the system prompt
      5. Store learning log entries for the self-improvement loop
    """

    def __init__(self, db_path: str = DB_PATH):
        self.db_path = os.path.normpath(db_path)
        logger.info(f"[NeuralBrainMemory] DB path: {self.db_path}")

    # ──────────────────────────────────────────────────────────────────────────
    # Initialization
    # ──────────────────────────────────────────────────────────────────────────

    async def initialize(self) -> None:
        """Create tables if they don't exist. Called once on startup."""
        async with aiosqlite.connect(self.db_path) as db:
            # 1. Conversation history — every exchange stored permanently
            await db.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id     TEXT    NOT NULL,
                    user_name   TEXT    NOT NULL DEFAULT '',
                    role        TEXT    NOT NULL DEFAULT 'Employee',
                    user_msg    TEXT    NOT NULL,
                    ai_reply    TEXT    NOT NULL,
                    intent      TEXT    DEFAULT 'General',
                    ts          REAL    NOT NULL
                )
            """)

            # 2. Per-user preference & affinity profile
            await db.execute("""
                CREATE TABLE IF NOT EXISTS user_preferences (
                    user_id              TEXT    PRIMARY KEY,
                    user_name            TEXT    NOT NULL DEFAULT '',
                    interaction_count    INTEGER DEFAULT 0,
                    top_intent           TEXT    DEFAULT 'General',
                    intent_counts        TEXT    DEFAULT '{}',
                    prefers_tables       INTEGER DEFAULT 0,
                    prefers_bullets      INTEGER DEFAULT 0,
                    personalization_note TEXT    DEFAULT '',
                    last_seen            REAL    NOT NULL
                )
            """)

            # 3. Global learning / self-improvement log
            await db.execute("""
                CREATE TABLE IF NOT EXISTS learning_log (
                    id               INTEGER PRIMARY KEY AUTOINCREMENT,
                    pattern_key      TEXT    NOT NULL,
                    sample_msg       TEXT    NOT NULL,
                    improvement_note TEXT    NOT NULL,
                    applied_at       REAL    NOT NULL
                )
            """)

            await db.commit()
        logger.info("[NeuralBrainMemory] ✅ All tables initialized.")

    # ──────────────────────────────────────────────────────────────────────────
    # Conversation persistence
    # ──────────────────────────────────────────────────────────────────────────

    async def save_exchange(
        self,
        user_id: str,
        user_name: str,
        role: str,
        user_msg: str,
        ai_reply: str,
        intent: str = "General",
    ) -> None:
        """Persist one full turn (user message + AI reply) to the DB."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                INSERT INTO conversations (user_id, user_name, role, user_msg, ai_reply, intent, ts)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (user_id, user_name, role, user_msg, ai_reply, intent, time.time()),
            )
            await db.commit()
        logger.debug(f"[Memory] Saved exchange for user={user_id} intent={intent}")

    async def get_user_history(
        self, user_id: str, limit: int = 10
    ) -> List[Dict[str, str]]:
        """
        Load the last `limit` exchanges for a user formatted as
        OpenAI-style message dicts, ready to inject into LLM history.

        Returns:
            [ {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}, ... ]
        """
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute(
                """
                SELECT user_msg, ai_reply FROM conversations
                WHERE user_id = ?
                ORDER BY ts DESC
                LIMIT ?
                """,
                (user_id, limit),
            ) as cursor:
                rows = await cursor.fetchall()

        # Rows come back newest-first; reverse to chronological order
        rows = list(reversed(rows))
        messages: List[Dict[str, str]] = []
        for user_msg, ai_reply in rows:
            messages.append({"role": "user", "content": user_msg})
            messages.append({"role": "assistant", "content": ai_reply})
        return messages

    async def get_raw_history(
        self, user_id: str, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Load the last `limit` exchanges in raw dict form for the
        frontend history-restore API. Returns newest-first.
        """
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute(
                """
                SELECT id, user_msg, ai_reply, intent, ts FROM conversations
                WHERE user_id = ?
                ORDER BY ts DESC
                LIMIT ?
                """,
                (user_id, limit),
            ) as cursor:
                rows = await cursor.fetchall()

        return [
            {
                "id": r[0],
                "user_msg": r[1],
                "ai_reply": r[2],
                "intent": r[3],
                "ts": r[4],
            }
            for r in rows
        ]

    # ──────────────────────────────────────────────────────────────────────────
    # User preference & personalization
    # ──────────────────────────────────────────────────────────────────────────

    async def update_preferences(
        self,
        user_id: str,
        user_name: str,
        intent: str,
        ai_reply: str,
        personalization_threshold: int = 20,
    ) -> None:
        """
        Increment the user's interaction count and intent affinity.
        When count reaches a multiple of `personalization_threshold`,
        rebuild the personalization note. Fire-and-forget background task.
        """
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute(
                """
                SELECT interaction_count, intent_counts,
                       prefers_tables, prefers_bullets, personalization_note
                FROM user_preferences WHERE user_id = ?
                """,
                (user_id,),
            ) as cursor:
                row = await cursor.fetchone()

            if row:
                count, intent_json, prefers_tables, prefers_bullets, existing_note = row
                intent_counts: Dict[str, int] = json.loads(intent_json or "{}")
            else:
                count = 0
                intent_counts = {}
                prefers_tables = 0
                prefers_bullets = 0
                existing_note = ""

            # Update intent affinity
            intent_counts[intent] = intent_counts.get(intent, 0) + 1
            top_intent = max(intent_counts, key=lambda k: intent_counts[k])
            count += 1

            # Detect format preference signals from the AI reply
            if "| " in ai_reply and " |" in ai_reply:
                prefers_tables = min(prefers_tables + 1, 100)
            if "\n- " in ai_reply or "\n* " in ai_reply:
                prefers_bullets = min(prefers_bullets + 1, 100)

            # Rebuild personalization note when threshold is crossed
            personalization_note = existing_note
            if count > 0 and count % personalization_threshold == 0:
                personalization_note = self._build_personalization_note(
                    user_name, top_intent, count, prefers_tables, prefers_bullets
                )
                logger.info(
                    f"[Memory] 🧠 Personalization rebuilt for {user_id}: {personalization_note}"
                )

            if row:
                await db.execute(
                    """
                    UPDATE user_preferences
                    SET user_name=?, interaction_count=?, top_intent=?, intent_counts=?,
                        prefers_tables=?, prefers_bullets=?, personalization_note=?, last_seen=?
                    WHERE user_id=?
                    """,
                    (
                        user_name, count, top_intent, json.dumps(intent_counts),
                        prefers_tables, prefers_bullets, personalization_note,
                        time.time(), user_id,
                    ),
                )
            else:
                await db.execute(
                    """
                    INSERT INTO user_preferences
                        (user_id, user_name, interaction_count, top_intent, intent_counts,
                         prefers_tables, prefers_bullets, personalization_note, last_seen)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        user_id, user_name, count, top_intent, json.dumps(intent_counts),
                        prefers_tables, prefers_bullets, personalization_note, time.time(),
                    ),
                )
            await db.commit()

    def _build_personalization_note(
        self,
        user_name: str,
        top_intent: str,
        count: int,
        prefers_tables: int,
        prefers_bullets: int,
    ) -> str:
        """Generate a plain-English personalization note for injection into system prompt."""
        parts = []
        if top_intent and top_intent not in ("General", "Unknown"):
            parts.append(
                f"This user ({user_name}) frequently asks about {top_intent}. "
                f"Proactively offer {top_intent} insights when relevant."
            )
        if prefers_tables > prefers_bullets and prefers_tables > 5:
            parts.append(
                "This user engages well with tabular data. "
                "Prefer markdown tables over prose when comparing information."
            )
        elif prefers_bullets > prefers_tables and prefers_bullets > 5:
            parts.append(
                "This user prefers concise bullet-point lists. "
                "Use bullet lists rather than long paragraphs."
            )
        if count >= 50:
            parts.append(
                f"This is a power user with {count}+ interactions — "
                "assume high familiarity with the platform and skip basic explanations."
            )
        return " ".join(parts)

    async def get_personalization_note(self, user_id: str) -> str:
        """Retrieve the personalization note for a user (empty string if none yet)."""
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute(
                "SELECT personalization_note FROM user_preferences WHERE user_id = ?",
                (user_id,),
            ) as cursor:
                row = await cursor.fetchone()
        return row[0] if row and row[0] else ""

    # ──────────────────────────────────────────────────────────────────────────
    # Learning log
    # ──────────────────────────────────────────────────────────────────────────

    async def add_learning(
        self, pattern_key: str, sample_msg: str, improvement_note: str
    ) -> None:
        """Record a new learning pattern into the global improvement log."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                INSERT INTO learning_log (pattern_key, sample_msg, improvement_note, applied_at)
                VALUES (?, ?, ?, ?)
                """,
                (pattern_key, sample_msg, improvement_note, time.time()),
            )
            await db.commit()

    async def get_recent_learnings(self, limit: int = 5) -> List[str]:
        """Return the most recent improvement notes (for injection into system prompt)."""
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute(
                "SELECT improvement_note FROM learning_log ORDER BY applied_at DESC LIMIT ?",
                (limit,),
            ) as cursor:
                rows = await cursor.fetchall()
        return [r[0] for r in rows]

    # ──────────────────────────────────────────────────────────────────────────
    # Brain health & stats
    # ──────────────────────────────────────────────────────────────────────────

    async def get_brain_stats(self) -> Dict[str, Any]:
        """Return a summary of the brain's memory state for the /api/brain/health endpoint."""
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute("SELECT COUNT(*) FROM conversations") as c:
                total_conversations = (await c.fetchone())[0]
            async with db.execute("SELECT COUNT(DISTINCT user_id) FROM conversations") as c:
                unique_users = (await c.fetchone())[0]
            async with db.execute("SELECT COUNT(*) FROM user_preferences") as c:
                profiled_users = (await c.fetchone())[0]
            async with db.execute("SELECT COUNT(*) FROM learning_log") as c:
                learning_entries = (await c.fetchone())[0]
            async with db.execute(
                """
                SELECT user_id, user_name, interaction_count
                FROM user_preferences
                ORDER BY interaction_count DESC
                LIMIT 1
                """
            ) as c:
                top_row = await c.fetchone()

        return {
            "status": "active",
            "db_path": self.db_path,
            "total_conversations": total_conversations,
            "unique_users": unique_users,
            "profiled_users": profiled_users,
            "learning_entries": learning_entries,
            "top_user": (
                {
                    "user_id": top_row[0],
                    "user_name": top_row[1],
                    "interactions": top_row[2],
                }
                if top_row
                else None
            ),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
