// integration-layer/index.ts

export * from './enterprise-integration';
export * from './cloud-integration/core/CloudInterfaces';
export * from './cloud-integration/aws-provider/AWSAdapters';
export * from './cloud-integration/aws-provider/AWSRegistry';
export * from './ai-integration/registries/ModelRegistry';
export * from './ai-integration/gateway/ModelRoutingMatrix';
export * from './ai-integration/pipeline/KnowledgePipeline';

// Global instances for the Integration Layer
import { ServiceRegistry, EnterpriseEventBus } from './enterprise-integration';
import { AWSRegistry } from './cloud-integration/aws-provider/AWSRegistry';

// 1. Initialize IoC Container
export const registry = ServiceRegistry.getInstance();

// 2. Initialize Centralized Event Bus
export const eventBus = new EnterpriseEventBus();
registry.registerSingleton('EnterpriseEventBus', eventBus);

// 3. Register Cloud Providers (AWS)
AWSRegistry.register(registry);
