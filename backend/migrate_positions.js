const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'src', 'data', 'db.json');

const migratePositions = () => {
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  const db = JSON.parse(data);

  if (!db.positions) db.positions = [];
  
  const existingPositions = db.positions;
  const hrTargets = db.hr_targets;

  if (!hrTargets || !hrTargets.departments) {
    console.log("No HR targets found to migrate.");
    return;
  }

  const newPositions = [];
  const empIdToPosId = new Map();

  hrTargets.departments.forEach(dept => {
    // If they have designations configured
    if (dept.designations && dept.designations.length > 0) {
      dept.designations.forEach(desig => {
        const hc = Number(desig.budgeted_hc) || 0;
        const totalBudget = Number(desig.budget_allocated) || 0;
        const avgBudget = hc > 0 ? Math.round(totalBudget / hc) : 0;
        
        for (let i = 0; i < hc; i++) {
          newPositions.push({
            id: `P_${crypto.randomUUID().substring(0, 8)}`,
            title: desig.designation,
            department: dept.department,
            business_unit: '',
            reporting_to_position_id: null,
            status: 'V', // Will update later based on employees
            budgeted_ctc: avgBudget,
            is_budget_approved: true
          });
        }
      });
    } else {
      // Just department level
      const hc = Number(dept.budgeted_hc) || 0;
      const totalBudget = Number(dept.budget_allocated) || 0;
      const avgBudget = hc > 0 ? Math.round(totalBudget / hc) : 0;
      
      for (let i = 0; i < hc; i++) {
        newPositions.push({
          id: `P_${crypto.randomUUID().substring(0, 8)}`,
          title: "Unspecified Role",
          department: dept.department,
          business_unit: '',
          reporting_to_position_id: null,
          status: 'V',
          budgeted_ctc: avgBudget,
          is_budget_approved: true
        });
      }
    }
  });

  // Now assign existing active employees to these positions
  db.employees.forEach(emp => {
    if (emp.employment_status === 'Inactive') return;
    
    // Find a matching vacant position
    const match = newPositions.find(p => p.status === 'V' && p.department === emp.department && (p.title === emp.designation || p.title === "Unspecified Role"));
    
    if (match) {
      match.status = 'A';
      match.title = emp.designation || match.title; // update title if unspecified
      match.business_unit = emp.business_unit || '';
      emp.position_id = match.id;
    } else {
      // No budgeted position available for this employee! Create an unbudgeted one.
      const unbudgetedPos = {
        id: `P_${crypto.randomUUID().substring(0, 8)}`,
        title: emp.designation || 'Unknown Role',
        department: emp.department || '',
        business_unit: emp.business_unit || '',
        reporting_to_position_id: null,
        status: 'A',
        budgeted_ctc: 0, // Unbudgeted!
        is_budget_approved: false
      };
      newPositions.push(unbudgetedPos);
      emp.position_id = unbudgetedPos.id;
    }
  });

  // Also preserve any vacant positions that were somehow created and not caught above? 
  // No, we are fully regenerating the budgeted positions from hr_targets!

  db.positions = newPositions;
  
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  console.log(`Migrated ${newPositions.length} positions based on HR Targets.`);
};

migratePositions();
