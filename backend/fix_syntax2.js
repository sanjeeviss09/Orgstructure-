const fs = require('fs');
let content = fs.readFileSync('b:/Org Structure - Axxel/backend/src/server.ts', 'utf8');

// Fix the 'e.message'
content = content.replace("details: e.message", "details: (e as any).message");

// Cut off the garbage at the bottom
const marker = "app.listen(port, () => {\r\n  console.log(`\\n✅ Antigravity Backend running on http://localhost:${port}`);\r\n});";
const marker2 = "app.listen(port, () => {\n  console.log(`\\n✅ Antigravity Backend running on http://localhost:${port}`);\n});";

let idx = content.lastIndexOf("app.listen(port");
if (idx !== -1) {
    let endIdx = content.indexOf("});", idx);
    if (endIdx !== -1) {
        content = content.substring(0, endIdx + 3) + '\n';
    }
}

fs.writeFileSync('b:/Org Structure - Axxel/backend/src/server.ts', content);
console.log('Fixed server.ts');
