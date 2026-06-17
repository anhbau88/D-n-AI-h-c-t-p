// lib/env-loader.ts
// Manual loading of .env.local for environments where Next.js loader has not run

import fs from 'fs';
import path from 'path';

function loadEnvManual() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
        if (match) {
          const key = match[1].trim();
          let val = match[2].trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
          
          // Only assign if it is not already defined in process.env
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
      console.log('[Env Loader] Loaded environment variables from .env.local manually.');
    }
  } catch (e) {
    console.warn('[Env Loader Warning] Failed to manually load env from .env.local:', e);
  }
}

loadEnvManual();
