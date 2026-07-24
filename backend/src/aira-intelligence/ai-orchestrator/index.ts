// ai-orchestrator/index.ts

import { AIGateway, AIProvider } from '../ai-gateway';
import { MultiRAGArchitecture, RAGRepository } from '../multi-rag';
import { PromptManagementSystem } from '../prompt-management';
import { DecisionIntelligenceEngine } from '../decision-intelligence';
import { EnterpriseContext } from '../context-builder';
import { IntentClassificationResult } from '../intent-engine';

export class AIOrchestrator {
    constructor(
        private gateway: AIGateway,
        private multiRag: MultiRAGArchitecture,
        private promptManager: PromptManagementSystem,
        private decisionEngine: DecisionIntelligenceEngine
    ) {}

    async execute(intent: IntentClassificationResult, context: EnterpriseContext, userInput: string) {
        console.log(`[AIOrchestrator] Orchestrating execution for intent: ${intent.primaryIntent}`);

        // 1. Retrieve RAG Knowledge based on intent mapping
        let ragKnowledge = '';
        if (intent.primaryIntent === 'Recruitment') {
            const docs = await this.multiRag.retrieveContext('recruitment', userInput);
            ragKnowledge = JSON.stringify(docs);
        } else if (intent.primaryIntent === 'Payroll') {
            const docs = await this.multiRag.retrieveContext('payroll', userInput);
            ragKnowledge = JSON.stringify(docs);
        }

        // 2. Fetch Prompt Template
        let promptTemplate = await this.promptManager.getActivePrompt(intent.department, intent.primaryIntent);
        
        // 3. Inject Context & Knowledge
        const finalPrompt = promptTemplate
            .replace('{{CONTEXT}}', JSON.stringify(context))
            .replace('{{KNOWLEDGE}}', ragKnowledge)
            + `\n\nUser Request: ${userInput}`;

        // 4. Select Optimal Model
        const { provider, modelId } = this.selectModelStrategy(intent);

        // 5. Execute Gateway Request
        const response = await this.gateway.executeRequest({
            provider,
            modelId,
            prompt: finalPrompt,
            systemContext: "You are AIRA, the central intelligence of Intelexp."
        });

        // 6. Pre-Execution Decision Validation (if workflow is triggered)
        let workflowExecuted = null;
        let approvalResult = true;

        if (intent.workflow !== 'GeneralInquiry') {
            // Mock confidence
            const mockConfidence = 0.95;
            approvalResult = await this.decisionEngine.evaluateExecutionReadiness(intent.workflow, context, mockConfidence);
            
            if (approvalResult) {
                console.log(`[AIOrchestrator] Triggering workflow: ${intent.workflow}`);
                workflowExecuted = intent.workflow;
            }
        }

        return {
            content: response.content,
            metadata: {
                provider,
                modelId,
                tokensUsed: response.tokensUsed,
                costIncurred: response.costIncurred,
                latencyMs: response.latencyMs,
                workflowExecuted,
                approvalResult
            }
        };
    }

    private selectModelStrategy(intent: IntentClassificationResult): { provider: AIProvider, modelId: string } {
        // High complexity requires heavy models
        if (intent.complexity === 'Complex') {
            return { provider: 'Anthropic', modelId: 'claude-3-opus' };
        }
        // General internal queries can use faster, cheaper models
        if (intent.primaryIntent === 'Knowledge Search') {
            return { provider: 'AWSBedrock', modelId: 'amazon.titan-text-express-v1' };
        }
        // Default to a balanced model
        return { provider: 'OpenAI', modelId: 'gpt-4o' };
    }
}
