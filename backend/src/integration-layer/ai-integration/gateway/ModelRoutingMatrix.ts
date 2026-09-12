import { ModelRegistry, AIModelDefinition } from '../registries/ModelRegistry';

export class ModelRoutingMatrix {
    constructor(private registry: ModelRegistry) {}

    /**
     * Intelligently selects the optimal model based on intent, complexity, and security requirements.
     */
    public selectOptimalModel(intentCategory: string, complexity: string, requiresEnterprisePrivacy: boolean): AIModelDefinition {
        console.log(`[RoutingMatrix] Routing intent: ${intentCategory}, Complexity: ${complexity}, Privacy: ${requiresEnterprisePrivacy}`);

        let candidates = Array.from(this.registry['models'].values());

        // Hard requirement: Privacy
        if (requiresEnterprisePrivacy) {
            candidates = candidates.filter(m => m.isEnterpriseLocal);
        }

        // Capability Matching
        if (complexity === 'Complex' || intentCategory === 'Executive Analytics') {
            const reasoningModels = candidates.filter(m => m.capabilities.includes('reasoning'));
            if (reasoningModels.length > 0) return reasoningModels[0];
        }

        if (intentCategory === 'Document Generation' || intentCategory === 'Knowledge Search') {
            const fastModels = candidates.filter(m => m.capabilities.includes('fast') || m.capabilities.includes('long-context'));
            if (fastModels.length > 0) return fastModels[0];
        }

        // Fallback to the cheapest/fastest available local model
        const fallback = candidates.filter(m => m.isEnterpriseLocal)[0];
        if (!fallback) throw new Error("No suitable model found in the routing matrix.");
        
        return fallback;
    }
}
