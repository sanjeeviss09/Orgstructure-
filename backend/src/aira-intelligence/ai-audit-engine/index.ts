// ai-audit-engine/index.ts

import { IDatabaseService, IMonitoringService } from '../../cloud-abstraction';

export interface AuditRecord {
    userId: string;
    intent: string;
    provider: string;
    model: string;
    promptVersion: string;
    tokensUsed: number;
    costIncurred: number;
    latencyMs: number;
    workflowExecuted: string | null;
    approvalResult: boolean;
}

export class AIAuditEngine {
    constructor(
        private db: IDatabaseService,
        private monitoring: IMonitoringService
    ) {}

    async logInteraction(record: AuditRecord) {
        console.log(`[AIAuditEngine] Logging AI Interaction to secure ledger:`, record);
        
        // Write to structured CloudWatch Logs for real-time monitoring
        this.monitoring.logInfo(`AI Interaction Log`, record);

        // Write to Redshift/RDS for historical analytics and compliance
        const query = `
            INSERT INTO ai_audit_log 
            (user_id, intent, provider, model, tokens_used, cost, latency_ms, workflow_executed, approval_result) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        
        await this.db.execute(query, [
            record.userId, record.intent, record.provider, record.model, 
            record.tokensUsed, record.costIncurred, record.latencyMs, 
            record.workflowExecuted, record.approvalResult
        ]);
    }
}
