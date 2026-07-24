import { ServiceRegistry } from '../integration-layer';
import { IdentityIntelligenceEngine } from './identity-intelligence';
import { IntentClassificationEngine } from './intent-engine';
import { EnterprisePermissionEngine } from './permission-engine';
import { ContextBuilder } from './context-builder';
import { EnterpriseMemorySystem } from './enterprise-memory';
import { AIOrchestrator } from './ai-orchestrator';
import { AIAuditEngine } from './ai-audit-engine';

export class AIRADigitalBrain {
    private identityEngine: IdentityIntelligenceEngine;
    private intentEngine: IntentClassificationEngine;
    private permissionEngine: EnterprisePermissionEngine;
    private contextBuilder: ContextBuilder;
    private memorySystem: EnterpriseMemorySystem;
    private orchestrator: AIOrchestrator;
    private auditEngine: AIAuditEngine;

    /**
     * Dependency Injection via ServiceRegistry ensures AIRA never instantiates 
     * AWS adapters or external services directly.
     */
    constructor(registry: ServiceRegistry) {
        // Resolve core engines
        this.identityEngine = registry.resolve('IdentityIntelligenceEngine');
        this.intentEngine = registry.resolve('IntentClassificationEngine');
        this.permissionEngine = registry.resolve('EnterprisePermissionEngine');
        this.contextBuilder = registry.resolve('ContextBuilder');
        this.memorySystem = registry.resolve('EnterpriseMemorySystem');
        this.orchestrator = registry.resolve('AIOrchestrator');
        this.auditEngine = registry.resolve('AIAuditEngine');
    }

    async processInteraction(userId: string, userInput: string) {
        console.log(`[AIRA] Incoming Interaction via Service Registry for User: ${userId}`);
        
        const identity = await this.identityEngine.resolveIdentity(userId);
        const intent = await this.intentEngine.classify(userInput, []);
        const context = await this.contextBuilder.assembleContext(identity, intent);

        const isAuthorized = await this.permissionEngine.validateAccess(identity, intent, []);
        if (!isAuthorized) {
            return { error: 'Unauthorized intent.' };
        }

        const response = await this.orchestrator.execute(intent, context, userInput);

        await this.auditEngine.logInteraction({
            userId,
            intent: intent.primaryIntent,
            provider: response.metadata.provider,
            model: response.metadata.modelId,
            promptVersion: 'latest',
            tokensUsed: response.metadata.tokensUsed,
            costIncurred: response.metadata.costIncurred,
            latencyMs: response.metadata.latencyMs,
            workflowExecuted: response.metadata.workflowExecuted,
            approvalResult: response.metadata.approvalResult
        });

        return response.content;
    }
}
