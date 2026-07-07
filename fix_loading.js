const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/Si/OneDrive/Desktop/sms/SMS-Solar-Frontend/src/pages';
const files = ['category.tsx', 'product.tsx', 'inquiry.tsx', 'lead-sources.tsx', 'lead-labels.tsx', 'stock-in.tsx', 'stock-out.tsx', 'organizations.tsx', 'task-status.tsx', 'teams.tsx'];

let updatedCount = 0;
for (const file of files) {
  const fp = path.join(dir, file);
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');

  let changed = false;

  // 1. Add isLoading state
  if (!content.includes('setIsLoading')) {
    content = content.replace(/const \[search, setSearch\] = useState[^;]+;/, match => { changed = true; return match + '\n  const [isLoading, setIsLoading] = useState(true);' });
    if (!content.includes('setIsLoading') && !changed) {
       content = content.replace(/const \[currentPage, setCurrentPage\] = useState[^;]+;/, match => { changed = true; return match + '\n  const [isLoading, setIsLoading] = useState(true);' });
    }
  }

  // 2. Add setIsLoading(true) inside fetch
  if (!content.match(/setIsLoading\(true\)/)) {
    content = content.replace(/(const fetch[A-Za-z0-9_]*\s*=\s*(?:async\s*\([^)]*\)\s*=>|useCallback\(\s*async\s*\([^)]*\)\s*=>)\s*\{)/, match => { changed = true; return match + '\n    setIsLoading(true);' });
  }

  // 3. Add setIsLoading(false) after catch block
  if (!content.match(/setIsLoading\(false\)/)) {
    content = content.replace(/(catch\s*\([^)]*\)\s*\{[\s\S]*?\})\s*(?=\}\, \[|\};)/, match => {
      if (match.includes('finally')) return match;
      changed = true;
      return match + ' finally {\n      setIsLoading(false);\n    }';
    });
  }

  // 4. Add loading={isLoading} to DataTable
  if (!content.includes('loading={isLoading}')) {
    content = content.replace(/(<DataTable[\s\S]*?)(pageSize=\{[^}]+\})/, match => { changed = true; return match + '\n        loading={isLoading}' });
  }

  if (changed) {
    fs.writeFileSync(fp, content);
    console.log('Updated ' + file);
    updatedCount++;
  }
}
console.log('Done. Updated ' + updatedCount + ' files.');
