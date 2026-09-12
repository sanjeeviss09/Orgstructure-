import express from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import {
  DocumentTemplate,
  FormulaComponent,
  addDocumentTemplate,
  getDocumentTemplates,
  getDocumentTemplateById,
  updateDocumentTemplate,
  deleteDocumentTemplate,
  getFormulaComponentsByTemplateId,
  addFormulaComponent,
  deleteFormulaComponent,
  getGeneratedDocumentsByEmployee,
  saveGeneratedDocument,
  GeneratedDocument
} from './data/database';
import { uploadFileToSupabase } from './recruitment';

export const templatesRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all templates
templatesRouter.get('/', (req, res) => {
  res.json(getDocumentTemplates());
});

// Get single template
templatesRouter.get('/:id', (req, res) => {
  const t = getDocumentTemplateById(req.params.id);
  if (t) res.json(t);
  else res.status(404).json({ error: 'Template not found' });
});

// Get formulas for a template
templatesRouter.get('/:id/formulas', (req, res) => {
  res.json(getFormulaComponentsByTemplateId(req.params.id));
});

// Upload and Parse Template
templatesRouter.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const body = req.body;
    const file = req.file;
    const templateId = `TPL-${Math.floor(10000 + Math.random() * 90000)}`;

    let fileType: DocumentTemplate['file_type'] = 'DOCX';
    if (file.mimetype.includes('pdf')) fileType = 'PDF';
    else if (file.mimetype.includes('html')) fileType = 'HTML';
    else if (file.originalname.endsWith('.xlsx')) fileType = 'XLSX';

    // Upload to Supabase
    const file_url = await uploadFileToSupabase(file, templateId) || '';

    let parsed_html = '';
    const editable_fields = new Set<string>();

    if (fileType === 'DOCX') {
      const result = await mammoth.convertToHtml({ buffer: file.buffer });
      parsed_html = result.value;

      const textResult = await mammoth.extractRawText({ buffer: file.buffer });
      const matches = textResult.value.match(/\{\{([a-zA-Z0-9_ -]+)\}\}/g);
      if (matches) {
        matches.forEach(m => editable_fields.add(m.replace(/[{}]/g, '').trim()));
      }
    } else if (fileType === 'XLSX') {
      const workbook = xlsx.read(file.buffer, { type: 'buffer', cellFormula: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      parsed_html = xlsx.utils.sheet_to_html(sheet, { id: 'template-table', editable: false });
      
      for (const cellAddress in sheet) {
        if (cellAddress[0] === '!') continue;
        const cell = sheet[cellAddress];
        if (cell && cell.f) {
          const formulaExp = cell.f;
          const deps = formulaExp.match(/[A-Z]+[0-9]+/g) || [];
          addFormulaComponent({
            id: `FC-${Math.floor(1000 + Math.random() * 9000)}`,
            template_id: templateId,
            component_name: `Calculated Cell ${cellAddress}`,
            cell_ref: cellAddress,
            expression: formulaExp,
            dependencies: deps
          });
        }
        
        if (cell && cell.t === 's' && cell.v) {
          const matches = String(cell.v).match(/\{\{([a-zA-Z0-9_ -]+)\}\}/g);
          if (matches) {
            matches.forEach((m: string) => editable_fields.add(m.replace(/[{}]/g, '').trim()));
          }
        }
      }
    } else if (fileType === 'HTML') {
      parsed_html = file.buffer.toString('utf-8');
      const matches = parsed_html.match(/\{\{([a-zA-Z0-9_ -]+)\}\}/g);
      if (matches) {
        matches.forEach((m: string) => editable_fields.add(m.replace(/[{}]/g, '').trim()));
      }
    }

    const newTemplate: DocumentTemplate = {
      id: templateId,
      name: body.name || file.originalname,
      type: body.type || 'Custom',
      file_type: fileType,
      file_url,
      parsed_html,
      editable_fields: Array.from(editable_fields),
      version: 1,
      active: true,
      created_at: new Date().toISOString(),
      created_by: body.created_by || 'Admin'
    };

    addDocumentTemplate(newTemplate);
    res.status(201).json(newTemplate);

  } catch (error) {
    console.error('Error uploading template:', error);
    res.status(500).json({ error: 'Failed to process template upload' });
  }
});

templatesRouter.delete('/:id', (req, res) => {
  const deleted = deleteDocumentTemplate(req.params.id);
  if (deleted) res.json({ success: true });
  else res.status(404).json({ error: 'Not found' });
});

// Update field mappings
templatesRouter.put('/:id/config', (req, res) => {
  const { field_mappings } = req.body;
  const updated = updateDocumentTemplate(req.params.id, { field_mappings });
  if (updated) res.json(updated);
  else res.status(404).json({ error: 'Not found' });
});

// Fetch employee document history
templatesRouter.get('/employee/:empId', (req, res) => {
  const docs = getGeneratedDocumentsByEmployee(req.params.empId);
  res.json(docs);
});

// Save a generated document
templatesRouter.post('/generate', (req, res) => {
  const body = req.body;
  const newDoc: GeneratedDocument = {
    id: `GEN-${Math.floor(100000 + Math.random() * 900000)}`,
    employee_id: body.employee_id,
    template_id: body.template_id,
    document_name: body.document_name,
    version: body.version || 1,
    generated_at: new Date().toISOString(),
    generated_by: body.generated_by || 'Admin',
    status: body.status || 'Final',
    html_content: body.html_content,
    field_values: body.field_values || {}
  };
  
  const saved = saveGeneratedDocument(newDoc);
  res.status(201).json(saved);
});
