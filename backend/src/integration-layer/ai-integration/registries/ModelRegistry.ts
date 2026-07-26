export interface AIModelDefinition {
    id: string;
    provider: string;
    capabilities: ('reasoning' | 'fast' | 'long-context' | 'vision' | 'speech' | 'embedding' | 'ocr')[];
    contextWindow: number;
    costPer1kTokens: number;
    isEnterpriseLocal: boolean;
}

export class ModelRegistry {
    private models: Map<string, AIModelDefinition> = new Map();

    constructor() {
        this.registerDefaultModels();
    }

    private registerDefaultModels() {
        this.register({ id: 'gpt-4o', provider: 'OpenAI', capabilities: ['reasoning', 'vision'], contextWindow: 128000, costPer1kTokens: 0.01, isEnterpriseLocal: false });
        this.register({ id: 'claude-3-opus', provider: 'Anthropic', capabilities: ['reasoning', 'long-context'], contextWindow: 200000, costPer1kTokens: 0.015, isEnterpriseLocal: false });
        this.register({ id: 'titan-embed-text-v1', provider: 'AWSBedrock', capabilities: ['embedding'], contextWindow: 8000, costPer1kTokens: 0.0001, isEnterpriseLocal: true });
        this.register({ id: 'llama-3-8b-instruct', provider: 'Ollama', capabilities: ['fast'], contextWindow: 8192, costPer1kTokens: 0, isEnterpriseLocal: true });
    }

    public register(model: AIModelDefinition) {
        this.models.set(model.id, model);
        console.log(`[ModelRegistry] Registered model: ${model.id} from ${model.provider}`);
    }

    public getModelsByCapability(capability: string): AIModelDefinition[] {
        return Array.from(this.models.values()).filter(m => m.capabilities.includes(capability as any));
    }
}
