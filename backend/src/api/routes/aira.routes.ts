import { Router } from 'express';
import { AIRAController } from '../controllers/AIRAController';

const router = Router();

// POST /api/v1/aira/interact
router.post('/interact', AIRAController.processInteraction);

export default router;
