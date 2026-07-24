import { EventEmitter } from 'events';

export type EnterpriseEventType = 
    | 'PositionCreated' | 'PositionUpdated' 
    | 'RecruitmentRequestCreated' | 'CandidateApplied' | 'CandidateShortlisted' 
    | 'InterviewScheduled' | 'OfferReleased' | 'OfferAccepted' 
    | 'EmployeeJoined' | 'PayrollGenerated' | 'PromotionApproved' 
    | 'PerformanceCompleted' | 'LearningAssigned' | 'EmployeeExited' 
    | 'VisitorRegistered' | 'AssetAssigned' | 'BudgetApproved' 
    | 'PolicyUpdated' | 'KnowledgeUploaded' | 'AIRecommendationGenerated' 
    | 'ExecutiveReportGenerated';

export interface EnterpriseEventPayload {
    eventId: string;
    timestamp: string;
    sourceModule: string;
    actorId: string;
    data: any;
}

/**
 * Centralized Enterprise Event Bus.
 * All modules must publish business events here rather than calling other modules directly.
 */
export class EnterpriseEventBus {
    private emitter: EventEmitter;

    constructor() {
        this.emitter = new EventEmitter();
        // Increase max listeners for an enterprise system to avoid memory leak warnings
        this.emitter.setMaxListeners(100); 
    }

    /**
     * Publishes an event to all internal subscribers.
     * (Future enhancement: This will forward to Amazon EventBridge/SQS via Cloud Integration)
     */
    public publish(eventType: EnterpriseEventType, payload: EnterpriseEventPayload): void {
        console.log(`[EventBus] Publishing: ${eventType} (ID: ${payload.eventId})`);
        this.emitter.emit(eventType, payload);
    }

    /**
     * Subscribes to an enterprise event.
     */
    public subscribe(eventType: EnterpriseEventType, handler: (payload: EnterpriseEventPayload) => void | Promise<void>): void {
        console.log(`[EventBus] New subscriber attached to: ${eventType}`);
        
        // Wrap handler to ensure async errors don't crash the Node process
        const safeHandler = async (payload: EnterpriseEventPayload) => {
            try {
                await handler(payload);
            } catch (error) {
                console.error(`[EventBus] Error in subscriber for ${eventType}:`, error);
                // In production, send to Dead Letter Queue (DLQ)
            }
        };

        this.emitter.on(eventType, safeHandler);
    }
}
