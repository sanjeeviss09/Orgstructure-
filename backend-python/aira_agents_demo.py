import asyncio
import logging
from aira.shared.logger import get_aira_logger
from aira.agents.manager.sdk import AgentManager

logger = get_aira_logger("agents_demo")

async def main():
    logger.info("==================================================")
    logger.info("   INTELEXP AIRA: Phase 6 Enterprise Agents       ")
    logger.info("==================================================")
    
    goal = "Hire 10 Analytical Development Scientists within 60 days."
    logger.info(f"Business Goal: {goal}")
    logger.info("Submitting to Agent Manager SDK...")
    logger.info("--------------------------------------------------")
    
    agent_manager = AgentManager()
    
    try:
        final_plan = await agent_manager.execute(goal)
        
        logger.info("--------------------------------------------------")
        logger.info("Final Workflow Execution Summary:")
        logger.info(f"Plan ID: {final_plan.plan_id}")
        logger.info(f"Status: {final_plan.status}")
        
        for task in final_plan.tasks:
            logger.info(f"- [{task.assigned_to}] {task.goal}: {task.status}")
            
    except Exception as e:
        logger.error(f"Agent Execution Failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
