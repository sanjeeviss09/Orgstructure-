import asyncio
from typing import List, Any
from aira.orchestrator.contracts.models import ExecutionPlan, ExecutionStep
from aira.orchestrator.registry.tool_registry import ToolRegistry
from aira.orchestrator.execution.dag import DependencyGraph
from aira.shared.logger import get_aira_logger

logger = get_aira_logger("execution_planner")

class ExecutionPlanner:
    def __init__(self, tool_registry: ToolRegistry):
        self.tool_registry = tool_registry

    async def execute_plan(self, plan: ExecutionPlan) -> bool:
        dag = DependencyGraph(plan.steps)
        logger.info(f"Execution Planner: Starting execution of plan {plan.plan_id}")

        while True:
            executable_steps = dag.get_executable_steps()
            if not executable_steps:
                # Check if all completed or if there is a deadlock
                all_completed = all(s.status == "COMPLETED" for s in plan.steps)
                if all_completed:
                    logger.info("Execution Planner: All tasks completed successfully.")
                    return True
                else:
                    logger.error("Execution Planner: Deadlock or unresolvable dependencies.")
                    return False

            # Separate into parallel (Read-Only) and sequential (State-Changing)
            parallel_tasks = []
            sequential_tasks = []

            for step in executable_steps:
                tool_def = self.tool_registry.get_tool(step.tool_name)
                if tool_def and tool_def.is_read_only:
                    parallel_tasks.append(step)
                else:
                    sequential_tasks.append(step)

            # 1. Execute Parallel Tasks
            if parallel_tasks:
                logger.info(f"Execution Planner: Running {len(parallel_tasks)} read-only tasks in parallel.")
                await asyncio.gather(*(self._execute_step(step, dag) for step in parallel_tasks))

            # 2. Execute Sequential Tasks
            for step in sequential_tasks:
                logger.info(f"Execution Planner: Running state-changing task sequentially: {step.tool_name}")
                # We await each sequentially
                await self._execute_step(step, dag)

    async def _execute_step(self, step: ExecutionStep, dag: DependencyGraph):
        step.status = "RUNNING"
        # Mocking tool execution delay
        await asyncio.sleep(0.5)
        step.result = f"Output of {step.tool_name}"
        logger.info(f"Execution Planner: Completed step {step.step_id} ({step.tool_name})")
        dag.mark_completed(step.step_id)
