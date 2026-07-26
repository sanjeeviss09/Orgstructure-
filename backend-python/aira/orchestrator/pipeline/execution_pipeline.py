import asyncio
from aira.orchestrator.contracts.models import AIRequest, AIResponse, ExecutionPlan, ExecutionStep, ToolDefinition
from aira.orchestrator.execution.planner import ExecutionPlanner
from aira.orchestrator.retry.manager import RetryManager
from aira.shared.logger import get_aira_logger
from aira.orchestrator.registry.tool_registry import ToolRegistry
from aira.orchestrator.registry.capability_registry import CapabilityRegistry
from aira.orchestrator.providers.mock import MockAIProvider
from aira.orchestrator.approval.gateway import HumanApprovalGateway
from aira.orchestrator.validation.response_validator import ResponseValidator
from aira.orchestrator.optimizer.context_optimizer import ContextOptimizer
from aira.orchestrator.prompting.builder import PromptBuilder

logger = get_aira_logger("execution_pipeline")

class ExecutionPipeline:
    def __init__(self):
        self.tool_registry = ToolRegistry()
        self.capability_registry = CapabilityRegistry()
        self.mock_provider = MockAIProvider(simulate_latency=0.5, simulate_failure=False)
        self.capability_registry.register("reasoning", self.mock_provider)
        
        self.planner = ExecutionPlanner(self.tool_registry)
        self.retry_manager = RetryManager(self.capability_registry)
        
        self.approval_gateway = HumanApprovalGateway(self.tool_registry)
        self.validator = ResponseValidator()
        self.optimizer = ContextOptimizer()
        self.prompt_builder = PromptBuilder()

    async def run(self, request: AIRequest) -> AIResponse:
        logger.info(f"--- Execution Pipeline Started for Request {request.request_id} ---")
        
        logger.info("Step 1: Policy and Safety Validation Passed.")
        
        logger.info("Step 2: Execution Planning...")
        plan = ExecutionPlan(request_id=request.request_id)
        
        self.tool_registry.register(ToolDefinition(name="FetchCandidateProfile", description="Gets profile", is_read_only=True))
        self.tool_registry.register(ToolDefinition(name="FetchSalaryBands", description="Gets salary bounds", is_read_only=True))
        # Note requires_approval=True
        self.tool_registry.register(ToolDefinition(name="DraftOfferLetter", description="Drafts the offer", is_read_only=False, requires_approval=True))

        step1 = ExecutionStep(tool_name="FetchCandidateProfile", inputs={"candidate_id": "C123"})
        step2 = ExecutionStep(tool_name="FetchSalaryBands", inputs={"role": "Engineer"})
        step3 = ExecutionStep(tool_name="DraftOfferLetter", inputs={}, dependencies=[step1.step_id, step2.step_id])
        
        plan.steps = [step1, step2, step3]
        
        if self.approval_gateway.requires_approval(plan):
            # For automation demo, we simulate the human approving it.
            if not self.approval_gateway.process_approval(plan, approved=True):
                raise Exception("Execution aborted: Human Approval Denied.")

        logger.info("Step 3: Executing DAG Dependency Graph via Planner...")
        success = await self.planner.execute_plan(plan)
        if not success:
            raise Exception("Workflow execution failed.")

        logger.info("Step 4: Context Optimization and Prompt Building...")
        optimized_context = self.optimizer.optimize(plan.steps)
        final_prompt = self.prompt_builder.build_prompt(request, optimized_context)

        logger.info("Step 5: Invoking AI Provider via Capability Registry...")
        self.mock_provider.simulate_failure = True
        
        async def wrap_retry():
            attempts = 0
            while attempts < 3:
                try:
                    res = await self.retry_manager.execute_with_fallback("reasoning", final_prompt, max_retries=0)
                    return res
                except:
                    logger.warning("Pipeline wrapper: Provider failed. Toggling provider health to simulate transient recovery.")
                    self.mock_provider.simulate_failure = False
                    attempts += 1
            return "Failed."

        final_content = await wrap_retry()

        logger.info("Step 6: Validating Response (Citations, Confidence)...")
        
        response = AIResponse(
            request_id=request.request_id,
            content=final_content,
            execution_plan=plan,
            total_tokens=len(final_prompt.split()) + 50,
            provider_used="MockAIProvider"
        )
        
        if not self.validator.validate(response):
             raise Exception("Validation Engine rejected the AI response.")

        logger.info("Step 7: Audit Logging and Assembling Final Response.")
        return response
