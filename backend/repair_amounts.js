const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const corrections = {
  'APS0060': { ctc: 1637920, budget: 1800000 },
  'APS0110': { ctc: 608507, budget: 700000 },
  'APS0205': { ctc: 720372, budget: 750000 },
  'APS0238': { ctc: 405445, budget: 450000 },
  'APS0128': { ctc: 569444, budget: 594444 },
  'APS0258': { ctc: 814279, budget: 839279 },
  'APS0407': { ctc: 420755, budget: 445755 },
  'APS0977': { ctc: 320008, budget: 345008 },
  'APS0395': { ctc: 608507, budget: 700000 },
  'APS0718': { ctc: 720372, budget: 750000 },
  'APS0789': { ctc: 405445, budget: 450000 },
  'APS0806': { ctc: 569444, budget: 594444 }
};

let empCount = 0;
let posCount = 0;

// Update employees
db.employees.forEach(emp => {
  if (corrections[emp.emp_id]) {
    const corr = corrections[emp.emp_id];
    emp.ctc_annual = corr.ctc;
    emp.budget_allocated = corr.budget;
    empCount++;
  }
});

// Update positions
db.positions.forEach(pos => {
  const occupant = db.employees.find(e => e.position_id === pos.id);
  if (occupant && corrections[occupant.emp_id]) {
    pos.budgeted_ctc = corrections[occupant.emp_id].budget;
    posCount++;
  }
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log(`Successfully repaired ${empCount} employees and ${posCount} positions in db.json!`);
