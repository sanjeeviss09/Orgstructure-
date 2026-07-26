// context-builder/index.ts

import { UserIdentityProfile } from '../identity-intelligence';
import { IntentClassificationResult } from '../intent-engine';

export interface EnterpriseContext {
    userProfile: Partial<UserIdentityProfile>;
    organizationHierarchy: any;
    budget?: number;
    salaryBand?: string;
    workflowStatus?: any;
    historicalInteractions: any[];
    businessRules: string[];
}

export class ContextBuilder {
    
    async assembleContext(identity: UserIdentityProfile, intent: IntentClassificationResult): Promise<EnterpriseContext> {
        console.log(`[ContextBuilder] Assembling secure enterprise context for AI consumption`);
        
        // Note: The ContextBuilder must aggressively filter sensitive PII
        // based on what the AI *actually* needs to fulfill the intent.
        
        const context: EnterpriseContext = {
            userProfile: {
                employeeId: identity.employeeId,
                designation: identity.designation,
                department: identity.department,
                userType: identity.userType
            },
            organizationHierarchy: {
                manager: identity.reportingHierarchy[0],
                directReports: []
            },
            historicalInteractions: [],
            businessRules: [
                "Always adhere to Intelexp Corporate Communication Guidelines.",
                "Do not disclose salary bands unless requested by HR."
            ]
        };

        if (intent.primaryIntent === 'Recruitment') {
            context.workflowStatus = { activeRequisitions: 2, pendingInterviews: 5 };
            context.businessRules.push("Recruitment SLAs demand 48-hour feedback cycles.");
        }

        if (intent.primaryIntent === 'Payroll' && identity.permissions.includes('VIEW_ALL_PAYROLL')) {
            context.budget = 5000000; // Mock budget retrieval
        }

        return context;
    }
}
