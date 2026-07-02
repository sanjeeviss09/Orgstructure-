import express from 'express';
import crypto from 'crypto';
import { 
  getOpbieKnowledge, 
  addOpbieKnowledge, 
  updateOpbieKnowledge, 
  deleteOpbieKnowledge 
} from './data/database';

export const opbieRouter = express.Router();

opbieRouter.get('/knowledge', (req, res) => {
  res.json(getOpbieKnowledge());
});

opbieRouter.post('/knowledge', (req, res) => {
  const { title, content, category, created_by } = req.body;
  
  if (!title || !content || !category) {
    return res.status(400).json({ error: 'Title, content, and category are required' });
  }

  const newItem = addOpbieKnowledge({
    id: `OPBIE_${crypto.randomUUID().substring(0, 8)}`,
    title,
    content,
    category,
    created_by: created_by || 'System',
    created_at: new Date().toISOString()
  });

  res.json(newItem);
});

opbieRouter.put('/knowledge/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const updated = updateOpbieKnowledge(id, updates);
  
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Knowledge item not found' });
  }
});

opbieRouter.delete('/knowledge/:id', (req, res) => {
  const { id } = req.params;
  const deleted = deleteOpbieKnowledge(id);
  
  if (deleted) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Knowledge item not found' });
  }
});
