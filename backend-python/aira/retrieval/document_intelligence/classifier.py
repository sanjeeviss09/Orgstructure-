from aira.retrieval.contracts.models import DocumentAsset

class DocumentIntelligenceEngine:
    def process(self, document: DocumentAsset) -> DocumentAsset:
        """Classifies the document and extracts metadata before chunking."""
        # Mock logic: if title has policy, classify as policy
        if "policy" in document.filename.lower():
            document.classification = "Policy"
            document.department = "HR"
            document.sensitivity = "Internal"
        elif "resume" in document.filename.lower():
            document.classification = "Resume"
            document.department = "Recruitment"
            document.sensitivity = "Confidential"
        return document
