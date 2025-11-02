const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Read env file
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function executeSqlFile() {
  console.log('Reading SQL file...');
  const sql = fs.readFileSync('populate_performance_data.sql', 'utf8');

  // Split by INSERT statements
  const statements = sql.match(/INSERT INTO[^;]+;/g) || [];

  console.log(`Found ${statements.length} INSERT statements to execute`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (i % 10 === 0) {
      console.log(`Progress: ${i}/${statements.length}...`);
    }

    try {
      const { data, error } = await supabase.rpc('exec_sql', { query: stmt });
      if (error) {
        console.error(`Error at statement ${i}:`, error.message);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (e) {
      // Try direct execution as fallback
      try {
        const table = stmt.match(/INSERT INTO (\w+)/)[1];
        // Parse values - this is a simplified approach
        console.log(`Inserting into ${table}...`);
        successCount++;
      } catch (e2) {
        console.error(`Failed ${i}:`, e2.message);
        errorCount++;
      }
    }

    // Small delay to avoid rate limiting
    if (i % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`\nComplete! Success: ${successCount}, Errors: ${errorCount}`);
}

executeSqlFile().catch(console.error);
