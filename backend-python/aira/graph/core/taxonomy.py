from typing import Optional
from aira.graph.contracts.base import GraphNode

class EnterpriseObject(GraphNode):
    """
    The master root for all Graph Nodes. 
    Never instantiate a base node directly, always an EnterpriseObject derivative.
    """
    object_type: str = "EnterpriseObject"

# --- Person Entities ---
class Person(EnterpriseObject):
    object_type: str = "Person"
    email: Optional[str] = None

class Employee(Person):
    object_type: str = "Employee"
    label: str = "Employee"
    
class Manager(Employee):
    object_type: str = "Manager"
    label: str = "Manager"

class Candidate(Person):
    object_type: str = "Candidate"
    label: str = "Candidate"

# --- Document Entities ---
class Document(EnterpriseObject):
    object_type: str = "Document"

class Policy(Document):
    object_type: str = "Policy"
    label: str = "Policy"

class SOP(Document):
    object_type: str = "SOP"
    label: str = "SOP"

# --- Workflow Entities ---
class Workflow(EnterpriseObject):
    object_type: str = "Workflow"

class RecruitmentWorkflow(Workflow):
    object_type: str = "RecruitmentWorkflow"
    label: str = "Recruitment"

class PayrollWorkflow(Workflow):
    object_type: str = "PayrollWorkflow"
    label: str = "Payroll"
