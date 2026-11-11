import * as fs from 'fs';
try {
  const fileContent = fs.readFileSync('/tmp/tsx-0/17793-cfa2bf6c4471b3a710df4bddb365994a35412fd7', 'utf8');
  const content = JSON.parse(fileContent);
  const code = content.code;
  const start = code.indexOf('[');
  const end = code.lastIndexOf(']');
  if (start === -1 || end === -1) {
    throw new Error('Could not find array brackets in the code string.');
  }
  const rawSlice = code.slice(start, end + 1);
  
  // Clean up any non-standard \xXX escapes into valid JSON \u00XX escapes
  const cleanSlice = rawSlice.replace(/\\x([0-9a-fA-F]{2})/g, (match, hex) => {
    return '\\u00' + hex.toUpperCase();
  });
  
  const products = JSON.parse(cleanSlice);
  
  // Map/strip products to include ONLY the 5 specific requested fields
  const stripped = products.map(({ id, name, category, supplier, desc }) => ({
    id: id || '',
    name: name || '',
    category: category || '',
    supplier: supplier || '',
    desc: desc || ''
  }));
  
  // Ensure the destination folder exists
  if (!fs.existsSync('./src/data')) {
    fs.mkdirSync('./src/data', { recursive: true });
  }
  
  fs.writeFileSync('./src/data/products.json', JSON.stringify(stripped, null, 2), 'utf8');
  console.log('SUCCESS: Extracted, cleaned, and wrote ' + stripped.length + ' products to ./src/data/products.json!');
} catch (e) {
  console.error('FAILED TO CONVERT:', e);
  process.exit(1);
}
