const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL });

async function migrate() {
  console.log('Running staff email schema migration...');

  // 1. Add staff_email column to profiles table
  await pool.query(`
    ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS staff_email text;
  `);
  console.log('✓ profiles table updated with staff_email column');

  // 2. Add staff_profile_id and status to inbox_messages
  await pool.query(`
    ALTER TABLE inbox_messages 
    ADD COLUMN IF NOT EXISTS staff_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'unread';
  `);
  console.log('✓ inbox_messages table updated with staff_profile_id and status');

  // 3. Create index for fast mailbox lookups
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_inbox_messages_staff_profile_id ON inbox_messages(staff_profile_id);
    CREATE INDEX IF NOT EXISTS idx_inbox_messages_to_email ON inbox_messages(to_email);
    CREATE INDEX IF NOT EXISTS idx_profiles_staff_email ON profiles(staff_email);
  `);
  console.log('✓ indices created for mailbox lookups');

  // 4. Auto-generate staff_email for existing staff/admins who do not have one
  const staffRows = await pool.query(`
    SELECT id, first_name, last_name, username, email, role, is_employee, is_admin 
    FROM profiles 
    WHERE (role IN ('admin', 'staff') OR is_employee = true OR is_admin = true)
      AND staff_email IS NULL;
  `);

  for (const member of staffRows.rows) {
    let baseHandle = '';
    if (member.first_name && member.first_name.trim()) {
      baseHandle = member.first_name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    } else if (member.username && member.username.trim()) {
      baseHandle = member.username.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    } else if (member.email) {
      baseHandle = member.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    } else {
      baseHandle = 'staff';
    }

    let staffEmail = `${baseHandle}.staff@starcast.online`;

    // Check if duplicate
    const check = await pool.query(`SELECT id FROM profiles WHERE staff_email = $1`, [staffEmail]);
    if (check.rows.length > 0) {
      if (member.last_name && member.last_name.trim()) {
        const lastInitial = member.last_name.trim().toLowerCase().charAt(0);
        staffEmail = `${baseHandle}.${lastInitial}.staff@starcast.online`;
      } else {
        staffEmail = `${baseHandle}${Math.floor(10 + Math.random() * 90)}.staff@starcast.online`;
      }
    }

    await pool.query(`UPDATE profiles SET staff_email = $1 WHERE id = $2`, [staffEmail, member.id]);
    console.log(`✓ Assigned staff email [${staffEmail}] to profile ${member.first_name || member.username || member.email} (${member.id})`);
  }

  await pool.end();
  console.log('Staff email migration completed successfully!');
}

migrate().catch((err) => {
  console.error('Staff email migration failed:', err);
  process.exit(1);
});
