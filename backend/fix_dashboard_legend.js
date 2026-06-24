const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/src/components/DashboardStats.tsx');
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings to LF
const originalLineEndings = content.includes('\r\n') ? '\r\n' : '\n';
content = content.replace(/\r\n/g, '\n');

// 1. Add Tag import
content = content.replace(
  '  Target, ShieldAlert, Settings, Bot, Sparkles, X,',
  '  Target, ShieldAlert, Settings, Bot, Sparkles, X, Tag,'
);

// 2. Insert Position Status Legend before SECTION 2: Workforce Analytics
const oldSectionStart = '      {/* SECTION 2: Workforce Analytics */}';
const legendBlock = `      {/* Position Status Legend */}
      <div className="glass-panel p-6 mb-6">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-slate-500" /> Position Status Legend
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {Object.entries(STATUS_CONFIG).map(([key, sc]) => {
            if (key === 'Inactive' || key === 'Under Notice Period') return null;
            return (
              <div 
                key={key} 
                className="flex items-center gap-2.5 p-3 bg-white/60 border border-slate-200/80 rounded-xl hover:shadow-md transition-all duration-300"
                style={{ boxShadow: \`0 0 8px \${sc.glow}15\` }}
              >
                <span 
                  className={\`w-7 h-7 flex items-center justify-center rounded-full text-xs font-black border select-none shrink-0 \${sc.bg} \${sc.text} \${sc.border}\`}
                  style={{ boxShadow: \`0 0 6px \${sc.glow}40\` }}
                >
                  {sc.letter}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-slate-800 truncate">{sc.label}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{key}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
`;

content = content.replace(oldSectionStart, legendBlock + '\n' + oldSectionStart);

// Re-normalize line endings
content = content.replace(/\n/g, originalLineEndings);

fs.writeFileSync(file, content);
console.log('DashboardStats status legend successfully added!');
