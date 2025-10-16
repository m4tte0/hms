// backend/src/scripts/verifyAssessmentSetup.js
require('dotenv').config();
const db = require('../config/database');

async function verifySetup() {
  console.log('🔍 Verifying Assessment Setup...\n');

  try {
    // 1. Check if assessment_scores table exists
    console.log('1️⃣ Checking if assessment_scores table exists...');
    const tables = await db.allAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='assessment_scores'"
    );
    
    if (tables.length === 0) {
      console.log('❌ assessment_scores table NOT FOUND');
      console.log('📝 Action: Table needs to be created in database.js');
      process.exit(1);
    }
    console.log('✅ assessment_scores table exists');

    // 2. Check table structure
    console.log('\n2️⃣ Checking table structure...');
    const columns = await db.allAsync("PRAGMA table_info(assessment_scores)");
    
    const columnNames = columns.map(col => col.name);
    console.log('   Columns found:', columnNames.join(', '));
    
    const requiredColumns = ['id', 'project_id', 'phase', 'category', 'category_weight', 'criteria', 'score', 'evidence'];
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('⚠️  Missing columns:', missingColumns.join(', '));
      console.log('📝 Action: Run migrateAssessmentDatabase.js');
    } else {
      console.log('✅ All required columns present');
    }

    // 3. Check for existing projects
    console.log('\n3️⃣ Checking for existing projects...');
    const projects = await db.allAsync('SELECT id, project_name FROM projects LIMIT 5');
    
    if (projects.length === 0) {
      console.log('⚠️  No projects found in database');
      console.log('📝 Action: Create a project first');
    } else {
      console.log('✅ Found', projects.length, 'project(s):');
      projects.forEach(p => console.log(`   - ${p.project_name} (ID: ${p.id})`));
    }

    // 4. Check for existing assessments
    console.log('\n4️⃣ Checking for existing assessments...');
    const assessments = await db.allAsync('SELECT COUNT(*) as count FROM assessment_scores');
    console.log(`   Total assessments: ${assessments[0].count}`);
    
    if (assessments[0].count === 0) {
      console.log('ℹ️  No assessments yet - this is normal for new projects');
      console.log('📝 The component will initialize default assessments automatically');
    } else {
      console.log('✅ Assessments exist in database');
      
      // Show breakdown by phase
      const byPhase = await db.allAsync(
        'SELECT phase, COUNT(*) as count FROM assessment_scores GROUP BY phase'
      );
      console.log('\n   Breakdown by phase:');
      byPhase.forEach(p => console.log(`   - ${p.phase}: ${p.count} items`));
    }

    // 5. Test a sample query
    console.log('\n5️⃣ Testing sample query...');
    if (projects.length > 0) {
      const projectId = projects[0].id;
      const sampleAssessments = await db.allAsync(
        'SELECT * FROM assessment_scores WHERE project_id = ? LIMIT 3',
        [projectId]
      );
      
      if (sampleAssessments.length > 0) {
        console.log('✅ Sample query successful - found', sampleAssessments.length, 'assessment(s)');
        console.log('   Sample data:');
        console.log('   - Phase:', sampleAssessments[0].phase || 'NULL');
        console.log('   - Category:', sampleAssessments[0].category);
        console.log('   - Criteria:', sampleAssessments[0].criteria);
      } else {
        console.log('ℹ️  No assessments for project', projectId);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(60));
    
    if (missingColumns.length > 0) {
      console.log('\n⚠️  ACTION REQUIRED:');
      console.log('Run: node src/scripts/migrateAssessmentDatabase.js');
    } else {
      console.log('\n✅ Database setup looks good!');
      console.log('If assessment tab is still blank, check:');
      console.log('1. Browser console (F12) for JavaScript errors');
      console.log('2. Backend logs for API errors');
      console.log('3. Network tab to see if API calls are successful');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Wait for database to be ready
setTimeout(() => {
  verifySetup();
}, 1000);
