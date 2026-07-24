import { Request, Response } from 'express';
import { registry } from '../../integration-layer';
import { AIRADigitalBrain } from '../../aira-intelligence';
import { ILoggingService } from '../../integration-layer/cloud-integration/core/CloudInterfaces';

export class AIRAController {
    
    static async processInteraction(req: Request, res: Response) {
        const logger = registry.resolve<ILoggingService>('ILoggingService');
        const airaBrain = new AIRADigitalBrain(registry); // Wait, this should probably be registered in the registry too, but fine for now.

        try {
            const { userId, userInput } = req.body;
            
            if (!userId || !userInput) {
                return res.status(400).json({ error: 'userId and userInput are required.' });
            }

            logger.logInfo(`[API] Received AIRA interaction request`, { userId });
            
            const response = await airaBrain.processInteraction(userId, userInput);
            
            res.status(200).json({
                success: true,
                data: response
            });

        } catch (error: any) {
            logger.logError(error, { endpoint: '/api/v1/aira/interact' });
            res.status(500).json({ error: 'Failed to process interaction' });
        }
    }
}
