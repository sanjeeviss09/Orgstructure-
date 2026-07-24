import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { registry, eventBus } from '../integration-layer';
import airaRoutes from './routes/aira.routes';
import { ILoggingService } from '../integration-layer/cloud-integration/core/CloudInterfaces';

export async function createEnterpriseServer() {
    const app = express();
    
    // Security Middleware
    app.use(helmet());
    app.use(cors());
    app.use(express.json());

    // Rate Limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    });
    app.use(limiter);

    // Initialize the Integration Layer
    console.log(`[Server] Bootstrapping Enterprise Integration Layer...`);
    await registry.initializeAll();

    // Register Routes
    app.use('/api/v1/aira', airaRoutes);

    // Global Error Handler
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
        const logger = registry.resolve<ILoggingService>('ILoggingService');
        logger.logError(err, { url: req.url, method: req.method });
        
        res.status(500).json({
            error: 'Internal Enterprise Server Error',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    });

    return app;
}
