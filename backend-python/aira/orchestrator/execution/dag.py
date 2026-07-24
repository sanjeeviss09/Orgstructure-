from typing import List, Dict
from aira.orchestrator.contracts.models import ExecutionStep

class DependencyGraph:
    def __init__(self, steps: List[ExecutionStep]):
        self.steps = {s.step_id: s for s in steps}
        self.completed = set()

    def get_executable_steps(self) -> List[ExecutionStep]:
        executable = []
        for step in self.steps.values():
            if step.status == "PENDING":
                # Check if all dependencies are met
                can_execute = all(dep in self.completed for dep in step.dependencies)
                if can_execute:
                    executable.append(step)
        return executable

    def mark_completed(self, step_id: str):
        if step_id in self.steps:
            self.steps[step_id].status = "COMPLETED"
            self.completed.add(step_id)
