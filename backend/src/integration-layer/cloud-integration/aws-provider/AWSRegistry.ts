import { ServiceRegistry } from '../../enterprise-integration';
import { 
    AWSCognitoAdapter, AWSRDSAdapter, AWSCloudWatchAdapter, 
    AWSSecretsManagerAdapter, AWSKMSAdapter, AWSWAFAdapter, AWSTextractAdapter,
    AWSS3Adapter
} from './AWSAdapters';

/**
 * Registers all AWS-specific implementations into the IoC container.
 * This ensures no business logic ever imports these classes directly.
 */
export class AWSRegistry {
    public static register(registry: ServiceRegistry): void {
        console.log(`[AWSRegistry] Registering AWS infrastructure adapters into ServiceRegistry...`);
        
        registry.register('IAuthenticationService', AWSCognitoAdapter);
        registry.register('IEnterpriseDatabaseService', AWSRDSAdapter);
        registry.register('ILoggingService', AWSCloudWatchAdapter);
        registry.register('ISecretManagerService', AWSSecretsManagerAdapter);
        registry.register('IEncryptionService', AWSKMSAdapter);
        registry.register('ISecurityFirewallService', AWSWAFAdapter);
        registry.register('IOcrExtractionService', AWSTextractAdapter);
        registry.register('IStorageService', AWSS3Adapter);
        
        // Similarly we would register EventBridge for IEventService, etc.
    }
}
