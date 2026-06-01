const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'data', 'db.json');
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Find Anand (Tier 1) to act as root
const anand = data.employees.find(e => e.full_name === 'Anand');
const muthu = data.employees.find(e => e.full_name === 'Muthu'); // Supply Chain Tier 3
const rameshS = data.employees.find(e => e.full_name === 'Ramesh S'); // Finance Tier 3
const gubendran = data.employees.find(e => e.full_name === 'Gubendran'); // HR Tier 3

data.employees.forEach(emp => {
  if (emp.full_name === 'Anand' || emp.id === '1') {
    emp.reporting_to_id = null;
  } else if (emp.department === 'Supply Chain Management' && emp.full_name !== 'Muthu') {
    emp.reporting_to_id = muthu ? muthu.id : (anand ? anand.id : null);
  } else if (emp.department === 'Finance & Accounts' && emp.full_name !== 'Ramesh S') {
    emp.reporting_to_id = rameshS ? rameshS.id : (anand ? anand.id : null);
  } else if (emp.department === 'HR & Admin' && emp.full_name !== 'Anand' && emp.full_name !== 'Gubendran') {
    emp.reporting_to_id = gubendran ? gubendran.id : (anand ? anand.id : null);
  } else if (emp.full_name === 'Gubendran') {
    emp.reporting_to_id = anand ? anand.id : null;
  } else if (emp.role_tier > 1) {
    emp.reporting_to_id = anand ? anand.id : null;
  }
});

// Also reset hr_targets as requested
data.hr_targets = {
  target_hiring_velocity: 4,
  target_attrition_rate: 8.5,
  departments: []
};

fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Database relationships fixed and targets reset.');
