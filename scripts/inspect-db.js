const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
        if (match) {
          const key = match[1].trim();
          let val = match[2].trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
          process.env[key] = val;
        }
      });
    }
  }
}

loadEnv();

(async () => {
  console.log('--- DB INSPECTOR ---');
  
  // 1. Check local Excel
  const xlsxPath = path.join(__dirname, '..', 'users.xlsx');
  if (fs.existsSync(xlsxPath)) {
    try {
      const workbook = XLSX.readFile(xlsxPath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);
      console.log('Local Excel Users count:', data.length);
      console.log('Local Excel Users:', JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Error reading local excel:', err.message);
    }
  } else {
    console.log('Local Excel file does not exist.');
  }

  // 2. Check Vercel Blob
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const storeId = token.match(/^vercel_blob_rw_([a-zA-Z0-9]+)_/)?.[1]?.toLowerCase() || '8shvc32y7x3rg5st';
    const blobUrl = `https://${storeId}.public.blob.vercel-storage.com/users.json`;
    console.log('Fetching users from Vercel Blob:', blobUrl);
    try {
      const res = await fetch(blobUrl, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        console.log('Blob Users count:', data.length);
        console.log('Blob Users:', JSON.stringify(data, null, 2));
      } else {
        console.log('Blob users.json not found or error:', res.status, res.statusText);
      }
    } catch (err) {
      console.error('Error fetching Vercel Blob:', err.message);
    }
  } else {
    console.log('BLOB_READ_WRITE_TOKEN not defined.');
  }
})();
