from aira.intent.interfaces import IIntentClassifier
from aira.contracts.intent import IntentContext

class HeuristicIntentClassifier(IIntentClassifier):
    async def classify(self, text: str) -> IntentContext:
        # Simple heuristic mapping for Phase 1
        text_lower = text.lower()
        if "leave" in text_lower or "vacation" in text_lower:
            return IntentContext(
                primary_intent="RequestLeave",
                business_domain="HR",
                department="Human Resources",
                workflow_type="Leave Request"
            )
        elif "budget" in text_lower or "salary" in text_lower:
            return IntentContext(
                primary_intent="CheckBudget",
                business_domain="Finance",
                affects_sensitive_data=True,
                risk_level="High"
            )
        
        return IntentContext(
            primary_intent="GeneralQuery",
            business_domain="General"
        )
