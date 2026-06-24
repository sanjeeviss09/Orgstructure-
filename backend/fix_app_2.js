const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/src/App.tsx');
let content = fs.readFileSync(file, 'utf8');

// Remove setPositions(data) or anything starting with setPositions
content = content.replace(/setPositions\(.*?\);/g, '');
content = content.replace(/import \{.*Position.*\} from '\.\/lib\/api';/, (match) => {
    return match.replace(/Position,?\s*/, '');
});

fs.writeFileSync(file, content);
console.log('Fixed App.tsx leftovers');
