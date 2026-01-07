
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Fallback usually won't work for DDL but worth a shot or if policy allows

  // Note: Standard Supabase client cannot run DDL (ALTER TABLE) directly usually. 
  // But we can try if there is a helper function or just hope the user has permissive setup.
  // Actually, without a 'rpc' function that executes SQL, we can't do this easily.
  // BUT, we can use the 'server.js' to do it if we had 'pg' installed.
  
  // Alternative: Just return the SQL to the user to run?
  // Or, assuming the user has the 'postgres' extension enabled and we can use 'rpc'.
  
  // Let's try to use the 'server.js' log to tell them.
  
  return NextResponse.json({ 
    message: "Por favor, execute o seguinte SQL no seu Supabase SQL Editor:",
    sql: `
      ALTER TABLE conversations 
      ADD COLUMN IF NOT EXISTS last_message_content TEXT;
      ADD COLUMN IF NOT EXISTS last_message_type TEXT DEFAULT 'text';
    `
  });
}
