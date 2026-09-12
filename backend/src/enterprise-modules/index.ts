import { ServiceRegistry, EnterpriseEventBus } from '../integration-layer';
import { IEnterpriseDatabaseService, IStorageService } from '../integration-layer/cloud-integration/core/CloudInterfaces';

// Enterprise Modules now rely strictly on the ServiceRegistry and EventBus.
// They do NOT import AWS or cloud dependencies directly.

export class RecruitmentModule {
    private db: IEnterpriseDatabaseService;
    private eventBus: EnterpriseEventBus;

    constructor(registry: ServiceRegistry) {
        this.db = registry.resolve('IEnterpriseDatabaseService');
        this.eventBus = registry.resolve('EnterpriseEventBus');
    }

    async createJobRequisition(jobData: any) {
        console.log(`[RecruitmentModule] Creating job requisition...`);
        await this.db.query('INSERT INTO job_requisitions ...', [jobData]);
        
        // Modules publish events instead of calling other modules directly.
        // E.g., The Notification Service and Workflow Engine subscribe to this event.
        this.eventBus.publish('RecruitmentRequestCreated', {
            eventId: `evt-${Date.now()}`,
            timestamp: new Date().toISOString(),
            sourceModule: 'RecruitmentModule',
            actorId: jobData.requestedBy,
            data: { jobId: 'REQ-123' }
        });
    }
}

export class EmployeeDirectoryModule {
    private db: IEnterpriseDatabaseService;
    private eventBus: EnterpriseEventBus;

    constructor(registry: ServiceRegistry) {
        this.db = registry.resolve('IEnterpriseDatabaseService');
        this.eventBus = registry.resolve('EnterpriseEventBus');
    }

    async hireEmployee(employeeData: any) {
        console.log(`[EmployeeModule] Hiring new employee...`);
        await this.db.query('INSERT INTO employees ...', [employeeData]);
        
        // This triggers IT provisioning, Knowledge Graph updates, and Payroll sync automatically via the EventBus
        this.eventBus.publish('EmployeeJoined', {
            eventId: `evt-${Date.now()}`,
            timestamp: new Date().toISOString(),
            sourceModule: 'EmployeeDirectoryModule',
            actorId: 'HR_SYSTEM',
            data: { employeeId: 'EMP-999', departmentId: employeeData.departmentId }
        });
    }
}
