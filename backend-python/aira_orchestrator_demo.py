import asyncio
import logging
from aira.shared.logger import get_aira_logger
from aira.contracts.identity import IdentityContext
from aira.orchestrator.contracts.models import AIRequest
from aira.orchestrator.manager.sdk import AIOrchestrator


logger = get_aira_logger("orchestrator_demo")

async def main():
    logger.info("==================================================")
    logger.info("  INTELEXP AIRA: Phase 5 Orchestrator Simulation  ")
    logger.info("==================================================")

    # 1. Initialize the Orchestrator SDK
    orchestrator = AIOrchestrator()

    # 2. Mocking an Identity Context (From Phase 1)
    identity = IdentityContext(
        employee_id="E12345",
        tenant_id="T001",
        active_roles=["HR_MANAGER"],
        department="Human Resources"
    )

    # 3. Create the AI Request
    # Scenario: The user wants to analyze a candidate and draft an offer letter.
    # This requires running two read-only tools to fetch Candidate + Salary, and one state-changing tool to Draft the Offer.
    request = AIRequest(
        tenant_id="T001",
        user_query="Analyze candidate A and draft an offer letter.",
        identity_context=identity
    )

    logger.info(f"User Query: {request.user_query}")
    logger.info("Submitting to AI Orchestrator...")
    logger.info("-" * 50)

    # 4. Execute the pipeline
    try:
        response = await orchestrator.execute(request)
        
        logger.info("-" * 50)
        logger.info("Final Approved AI Response:")
        logger.info(response.content)
        logger.info(f"Tokens Used: {response.total_tokens}")
        logger.info(f"Confidence Score: {response.confidence_score}")
        logger.info(f"Provider: {response.provider_used}")
        logger.info(f"Execution Plan length: {len(response.execution_plan.steps)} steps executed.")

    except Exception as e:
        logger.error(f"Orchestrator Execution Failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
