const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/src/App.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /import \{ DetailedAnalytics \} from '.\/components\/DetailedAnalytics';[\s\S]*?import \{ fetchEmployees, Employee, AuthUser, DEFAULT_AVATAR \} from '.\/lib\/api';/,
  `import { DetailedAnalytics } from './components/DetailedAnalytics';
import { InternDashboard } from './components/InternDashboard';
import { ManageInterns } from './components/ManageInterns';
import { UserAnalytics } from './components/UserAnalytics';
import { fetchEmployees, Employee, AuthUser, DEFAULT_AVATAR } from './lib/api';`
);

fs.writeFileSync(file, content);
console.log('Fixed App.tsx imports');
