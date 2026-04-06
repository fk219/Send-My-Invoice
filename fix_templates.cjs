const fs = require('fs');
let content = fs.readFileSync('components/InvoiceTemplates.tsx', 'utf8');

// Replace table cells
content = content.replace(
  /({item\.description})<\/td>/g, 
  `<div>$1</div>{item.details && <div className="text-xs opacity-70 mt-1 whitespace-pre-wrap leading-tight">{item.details}</div>}</td>`
);

// Replace divs (Minimal Template and Bold Template)
content = content.replace(
  /({item\.description})<\/div>/g, 
  `<div>$1</div>{item.details && <div className="text-xs opacity-70 mt-1 whitespace-pre-wrap leading-tight">{item.details}</div>}</div>`
);

fs.writeFileSync('components/InvoiceTemplates.tsx', content);
