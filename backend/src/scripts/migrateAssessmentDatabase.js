// backend/src/scripts/migrateAssessmentDatabase.js
require('dotenv').config();
const db = require('../config/database');

async function migrateAssessmentDatabase() {
  console.log('🔄 Starting assessment database migration...');

  try {
    // Check if columns exist
    const tableInfo = await db.allAsync("PRAGMA table_info(assessment_scores)");
    const hasPhaseColumn = tableInfo.some(col => col.name === 'phase');
    const hasCategoryWeightColumn = tableInfo.some(col => col.name === 'category_weight');

    if (hasPhaseColumn && hasCategoryWeightColumn) {
      console.log('✅ Phase and category_weight columns already exist, skipping migration');
      process.exit(0);
    }

    // Add phase column if it doesn't exist
    if (!hasPhaseColumn) {
      console.log('🔍 Adding phase column to assessment_scores...');
      await db.runAsync(`
        ALTER TABLE assessment_scores 
        ADD COLUMN phase TEXT DEFAULT 'Phase 1'
      `);
      console.log('✅ Phase column added successfully');
    }

    // Add category_weight column if it doesn't exist
    if (!hasCategoryWeightColumn) {
      console.log('🔍 Adding category_weight column to assessment_scores...');
      await db.runAsync(`
        ALTER TABLE assessment_scores 
        ADD COLUMN category_weight INTEGER DEFAULT 10
      `);
      console.log('✅ Category_weight column added successfully');
    }

    // Update existing items based on category
    console.log('🔍 Updating existing assessments with appropriate phases...');

    // Phase 1: Pre-Handover Assessment
    await db.runAsync(`
      UPDATE assessment_scores 
      SET phase = 'Phase 1' 
      WHERE category LIKE 'B%' OR category IN (
        'Code Quality', 'Testing Coverage', 'Performance & Security', 'Technical Debt'
      )
    `);

    // Phase 2: Documentation Quality
    await db.runAsync(`
      UPDATE assessment_scores 
      SET phase = 'Phase 2' 
      WHERE category LIKE 'C%' OR category IN (
        'Technical Documentation', 'User Documentation', 'Operational Documentation'
      )
    `);

    // Phase 3: Operational Readiness
    await db.runAsync(`
      UPDATE assessment_scores 
      SET phase = 'Phase 3' 
      WHERE category LIKE 'D%' OR category IN (
        'Deployment Readiness', 'Support Readiness', 'Team Readiness'
      )
    `);

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log('  - Added "phase" column to assessment_scores');
    console.log('  - Added "category_weight" column to assessment_scores');
    console.log('  - Updated existing assessments with appropriate phases');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Wait for database to be ready
setTimeout(() => {
  migrateAssessmentDatabase();
}, 1000);
