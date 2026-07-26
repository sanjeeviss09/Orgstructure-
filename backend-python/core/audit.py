import logging
from typing import Any, Dict, Optional
from datetime import datetime, timezone

audit_logger = logging.getLogger("intelexp_audit")

class AuditFramework:
    @staticmethod
    def log_action(
        user_id: str,
        action: str,
        resource: str,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        audit_event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_id": user_id,
            "action": action,
            "resource": resource,
            "resource_id": resource_id,
            "details": details or {}
        }
        # In a real system, this would write to an audit log table using an async queue
        # For now, we log to stdout
        audit_logger.info(f"AUDIT_EVENT: {audit_event}")
