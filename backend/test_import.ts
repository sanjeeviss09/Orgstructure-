import { createClient } from '@supabase/supabase-js'; import dotenv from 'dotenv'; import ws from 'ws'; dotenv.config(); const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }, realtime: { transport: ws as any } }); 
const bulkImportEmployees = async (rawEmployees) => {
    const parsedEmployees = [];
    const positionsToCreate = [];

    rawEmployees.forEach(e => {
      const positionId = `P_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const empId = e.id || e.emp_id || `EMP_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const department = e.department || 'General';
      const designation = e.designation || 'Staff';
      const ctcAnnual = parseFloat(e.ctc_annual) || 0;
      const budgetAllocated = parseFloat(e.budget_allocated) || ctcAnnual * 1.2;
      const businessUnit = e.business_unit || 'General';
      const subFunction = e.sub_function || '';

      positionsToCreate.push({
        id: positionId,
        title: designation,
        department: department,
        business_unit: businessUnit,
        sub_function: subFunction,
        status: 'A',
        budgeted_ctc: budgetAllocated
      });

      parsedEmployees.push({
        id: empId,
        emp_id: e.emp_id || `EMP${Math.floor(1000 + Math.random() * 9000)}`,
        position_id: positionId,
        full_name: e.full_name || 'Unnamed Employee',
        company_name: e.company_name || 'Axxel Corp',
        business_unit: businessUnit,
        department: department,
        designation: designation,
        role_tier: parseInt(e.role_tier) || 5,
        employment_status: e.employment_status || 'Active',
        email_official: e.email_official || `emp_${Date.now()}@axxel.com`,
        ctc_annual: ctcAnnual,
        ctc_currency: e.ctc_currency || 'INR',
        budget_allocated: budgetAllocated,
        dashboard_access: e.dashboard_access || 'Employee',
        reporting_to_id: e.reporting_manager_emp_id || null,
        photo_url: e.photo_url || '',
        past_organization: e.past_organization || '',
        total_experience: e.total_experience || '',
        education_qualification: e.education_qualification || '',
        sub_function: subFunction
      });
    });

    const { error: posError } = await supabase.from('positions').upsert(positionsToCreate);
    if (posError) { console.error("POS ERROR", posError); throw new Error(posError.message || 'Failed to create positions for bulk import'); }

    const { data, error } = await supabase.from('employees').upsert(parsedEmployees).select();
    if (error) { console.error("EMP ERROR", error); throw new Error(error.message || 'Bulk import failed'); }
    return { added: data ? data.length : parsedEmployees.length, message: `Successfully imported.` };
};

bulkImportEmployees([{
  emp_id: 'APS0060', full_name: 'Ranjit Kumar', email_official: 'test@123', designation: 'Senior Manager', department: 'Analytical Dev', sub_function: 'Routine', business_unit: 'R&D', ctc_annual: '1000000'
}]).then(console.log).catch(console.error);
