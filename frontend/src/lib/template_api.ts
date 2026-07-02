export interface DocumentTemplate {
  id: string;
  name: string;
  type: string;
  file_type: 'DOCX' | 'PDF' | 'HTML' | 'XLSX';
  file_url: string;
  parsed_html?: string;
  editable_fields: string[];
  field_mappings?: Record<string, string>;
  version: number;
  active: boolean;
  applicable_departments?: string[];
  applicable_grades?: string[];
  created_at: string;
  created_by: string;
}

export interface FormulaComponent {
  id: string;
  template_id: string;
  component_name: string;
  cell_ref?: string;
  expression: string;
  dependencies: string[];
}

export interface GeneratedDocument {
  id: string;
  employee_id: string;
  template_id: string;
  document_name: string;
  version: number;
  generated_at: string;
  generated_by: string;
  status: 'Draft' | 'Final';
  html_content: string;
  field_values: Record<string, any>;
}

const API_BASE = 'http://localhost:3001';

export const getTemplates = async (): Promise<DocumentTemplate[]> => {
  const res = await fetch(`${API_BASE}/api/templates`);
  return res.json();
};

export const getTemplateById = async (id: string): Promise<DocumentTemplate> => {
  const res = await fetch(`${API_BASE}/api/templates/${id}`);
  return res.json();
};

export const getFormulasByTemplateId = async (id: string): Promise<FormulaComponent[]> => {
  const res = await fetch(`${API_BASE}/api/templates/${id}/formulas`);
  return res.json();
};

export const uploadTemplate = async (data: FormData): Promise<DocumentTemplate> => {
  const res = await fetch(`${API_BASE}/api/templates/upload`, {
    method: 'POST',
    body: data
  });
  return res.json();
};

export const deleteTemplate = async (id: string): Promise<void> => {
  await fetch(`${API_BASE}/api/templates/${id}`, {
    method: 'DELETE'
  });
};

export const updateTemplateConfig = async (id: string, field_mappings: Record<string, string>): Promise<DocumentTemplate> => {
  const res = await fetch(`${API_BASE}/api/templates/${id}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field_mappings })
  });
  return res.json();
};

export const generateDocument = async (docData: Partial<GeneratedDocument>): Promise<GeneratedDocument> => {
  const res = await fetch(`${API_BASE}/api/templates/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(docData)
  });
  return res.json();
};

export const getEmployeeDocuments = async (empId: string): Promise<GeneratedDocument[]> => {
  const res = await fetch(`${API_BASE}/api/templates/employee/${empId}`);
  return res.json();
};
