const fs = require('fs');
let content = fs.readFileSync('b:/Org Structure - Axxel/backend/src/server.ts', 'utf8');

const fix = `          feedback_count: feedbackCount,
          chat_count: chatCount,
          login_days: loginDays,
          feedback_score: feedbackScore,
          chat_score: chatScore,
          login_score: loginScore,
          score,
          rating,
        };
      });

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to compute user engagement analytics', details: e.message });
  }
});`;

content = content.replace('          join_date: emp.join_date,\r\n  }\r\n});', '          join_date: emp.join_date,\n' + fix);
content = content.replace('          join_date: emp.join_date,\n  }\n});', '          join_date: emp.join_date,\n' + fix);

const garbageIdx1 = content.indexOf('/ /  \r\n R e s t a r t');
const garbageIdx2 = content.indexOf('/ / \r\n \r\n R e s t a r t');
const garbageIdx3 = content.indexOf('/ /');

// Let's just find the last app.listen and truncate after it.
const listenIdx = content.lastIndexOf('app.listen(port');
if (listenIdx !== -1) {
    const endIdx = content.indexOf('});', listenIdx);
    if (endIdx !== -1) {
        content = content.substring(0, endIdx + 3) + '\n';
    }
}

fs.writeFileSync('b:/Org Structure - Axxel/backend/src/server.ts', content);
console.log('Fixed server.ts');
