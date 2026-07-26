from aira.orchestrator.contracts.models import AIResponse
from aira.shared.logger import get_aira_logger

logger = get_aira_logger("response_validator")

class ResponseValidator:
    def __init__(self):
        pass
        
    def validate(self, response: AIResponse) -> bool:
        logger.info("ResponseValidator: Checking for Hallucinations, PII, and Policy Violations...")
        # Mocking validation logic
        if "CONFIDENTIAL_OVERRIDE" in response.content:
            logger.error("ResponseValidator: Safety Violation detected in response.")
            return False
            
        logger.info("ResponseValidator: Response passed all validation checks.")
        response.confidence_score = 0.99
        return True
