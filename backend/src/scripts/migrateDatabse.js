// backend/src/scripts/migrateDatabase.js
require('dotenv').config();
const db = require('../config/database');

async function migrateDatabase() {
  console.log('🔄 Starting database migration...');

  try {
    // Check if phase column exists
    const tableInfo = await db.allAsync("PRAGMA table_info(checklist_items)");
    const hasPhaseColumn = tableInfo.some(col => col.name === 'phase');

    if (hasPhaseColumn) {
      console.log('✅ Phase column already exists, skipping migration');
      process.exit(0);
    }

    console.log('📝 Adding phase column to checklist_items...');

    // Add phase column with default value
    await db.runAsync(`
      ALTER TABLE checklist_items 
      ADD COLUMN phase TEXT DEFAULT 'Phase 1'
    `);

    console.log('✅ Phase column added successfully');

    // Update existing items based on category
    console.log('📝 Updating existing items with appropriate phases...');

    // Phase 1: Pre-Handover Assessment
    await db.runAsync(`
      UPDATE checklist_items 
      SET phase = 'Phase 1' 
      WHERE category IN ('Technical Prerequisites', 'Documentation Prerequisites')
    `);

    // Phase 2: Knowledge Transfer Sessions
    await db.runAsync(`
      UPDATE checklist_items 
      SET phase = 'Phase 2' 
      WHERE category = 'Knowledge Transfer'
    `);

    // Phase 3: Final Sign-offs
    await db.runAsync(`
      UPDATE checklist_items 
      SET phase = 'Phase 3' 
      WHERE category = 'Sign-offs'
    `);

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log('  - Added "phase" column to checklist_items');
    console.log('  - Updated existing items with appropriate phases');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Wait for database to be ready
setTimeout(() => {
  migrateDatabase();
}, 1000);