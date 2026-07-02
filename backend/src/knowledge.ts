import express from 'express';
import crypto from 'crypto';

export const knowledgeRouter = express.Router();

export interface KnowledgeDocument {
  id: string;
  filename: string;
  type: string;
  size: number;
  uploadDate: string;
  status: 'Processing' | 'Active' | 'Failed';
  contentSnippet?: string;
}

// In-memory store for Aira's knowledge documents
let knowledgeDb: KnowledgeDocument[] = [];

// Get all uploaded knowledge documents
knowledgeRouter.get('/', (req, res) => {
  res.json(knowledgeDb);
});

// Upload a new document (Base64)
knowledgeRouter.post('/upload', (req, res) => {
  const { filename, type, size, contentBase64 } = req.body;
  if (!filename || !type || size === undefined || !contentBase64) {
    return res.status(400).json({ error: 'Missing document payload properties.' });
  }

  const newDoc: KnowledgeDocument = {
    id: crypto.randomUUID(),
    filename,
    type,
    size,
    uploadDate: new Date().toISOString(),
    status: 'Processing'
  };

  knowledgeDb.push(newDoc);

  // Simulate parsing and embedding (3 seconds delay)
  setTimeout(() => {
    const docIndex = knowledgeDb.findIndex(d => d.id === newDoc.id);
    if (docIndex !== -1) {
      knowledgeDb[docIndex].status = 'Active';
      // In a real scenario, this is where we'd parse the base64, extract text, and chunk to a vector DB.
      knowledgeDb[docIndex].contentSnippet = "Simulated parsed content of " + filename;
    }
  }, 3000);

  res.status(201).json(newDoc);
});

// Delete a document
knowledgeRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  knowledgeDb = knowledgeDb.filter(doc => doc.id !== id);
  res.json({ success: true });
});

// Function to get active knowledge summary (used by Aira chat endpoint)
export const getActiveKnowledgeContext = () => {
  const activeDocs = knowledgeDb.filter(d => d.status === 'Active');
  if (activeDocs.length === 0) return '';
  return `You have been trained on ${activeDocs.length} custom company documents: ` + 
         activeDocs.map(d => `"${d.filename}"`).join(', ') + 
         `. Use this knowledge conceptually to assist the user.`;
};
