const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'handover.db');
const db = new sqlite3.Database(dbPath);

// Phase 2 and Phase 3 items to add
const newItems = [
  // Phase 2: Knowledge Transfer Sessions
  { phase: 'Phase 2', category: 'Training Sessions', requirement: 'Architecture Overview session scheduled', status: 'Not Started' },
  { phase: 'Phase 2', category: 'Training Sessions', requirement: 'Code Walkthrough session completed', status: 'Not Started' },
  { phase: 'Phase 2', category: 'Training Sessions', requirement: 'Database/Data Management training', status: 'Not Started' },
  { phase: 'Phase 2', category: 'Training Sessions', requirement: 'Deployment Procedures training', status: 'Not Started' },
  { phase: 'Phase 2', category: 'Training Sessions', requirement: 'Troubleshooting & Support training', status: 'Not Started' },
  { phase: 'Phase 2', category: 'Training Sessions', requirement: 'Shadow Support Period completed', status: 'Not Started' },

  { phase: 'Phase 2', category: 'Team Competency', requirement: 'Team demonstrates system understanding', status: 'Not Started' },
  { phase: 'Phase 2', category: 'Team Competency', requirement: 'Can perform basic operations independently', status: 'Not Started' },
  { phase: 'Phase 2', category: 'Team Competency', requirement: 'Can troubleshoot common issues', status: 'Not Started' },

  // Phase 3: Final Sign-Offs
  { phase: 'Phase 3', category: 'Approvals', requirement: 'R&D Project Lead sign-off', status: 'Not Started' },
  { phase: 'Phase 3', category: 'Approvals', requirement: 'R&D Technical Lead sign-off', status: 'Not Started' },
  { phase: 'Phase 3', category: 'Approvals', requirement: 'Automation Operations Manager sign-off', status: 'Not Started' },
  { phase: 'Phase 3', category: 'Approvals', requirement: 'Automation Technical Lead sign-off', status: 'Not Started' },
  { phase: 'Phase 3', category: 'Approvals', requirement: 'Department Manager sign-off', status: 'Not Started' },

  { phase: 'Phase 3', category: 'Documentation Handover', requirement: 'All documentation transferred', status: 'Not Started' },
  { phase: 'Phase 3', category: 'Documentation Handover', requirement: 'Access credentials provided', status: 'Not Started' },
  { phase: 'Phase 3', category: 'Documentation Handover', requirement: 'Repository access transferred', status: 'Not Started' },

  { phase: 'Phase 3', category: 'Transition Activities', requirement: 'Support contacts established', status: 'Not Started' },
  { phase: 'Phase 3', category: 'Transition Activities', requirement: 'Escalation procedures documented', status: 'Not Started' },
  { phase: 'Phase 3', category: 'Transition Activities', requirement: 'Post-handover support schedule defined', status: 'Not Started' },
];

console.log('🔄 Starting migration to add Phase 2 and Phase 3 items...\n');

// Get all project IDs
db.all('SELECT DISTINCT project_id FROM checklist_items ORDER BY project_id', [], (err, projects) => {
  if (err) {
    console.error('❌ Error fetching projects:', err);
    db.close();
    return;
  }

  console.log(`📋 Found ${projects.length} projects with checklist items\n`);

  let totalInserted = 0;
  let projectsProcessed = 0;

  projects.forEach((project) => {
    const projectId = project.project_id;

    // Check if this project already has Phase 2 or Phase 3 items
    db.get(
      'SELECT COUNT(*) as count FROM checklist_items WHERE project_id = ? AND (phase = ? OR phase = ?)',
      [projectId, 'Phase 2', 'Phase 3'],
      (err, result) => {
        if (err) {
          console.error(`❌ Error checking project ${projectId}:`, err);
          return;
        }

        if (result.count > 0) {
          console.log(`⏭️  Project ${projectId}: Already has Phase 2/3 items (${result.count} items), skipping...`);
          projectsProcessed++;

          if (projectsProcessed === projects.length) {
            finishUp();
          }
          return;
        }

        // Insert new items for this project
        console.log(`✅ Project ${projectId}: Adding ${newItems.length} new items...`);

        const stmt = db.prepare(`
          INSERT INTO checklist_items (project_id, phase, category, requirement, status, verification_date, verified_by, notes)
          VALUES (?, ?, ?, ?, ?, NULL, '', '')
        `);

        let itemsInserted = 0;
        newItems.forEach((item) => {
          stmt.run([projectId, item.phase, item.category, item.requirement, item.status], (err) => {
            if (err) {
              console.error(`❌ Error inserting item for project ${projectId}:`, err);
            } else {
              itemsInserted++;
              totalInserted++;
            }

            if (itemsInserted === newItems.length) {
              console.log(`   ✓ Added ${itemsInserted} items to project ${projectId}`);
              projectsProcessed++;

              if (projectsProcessed === projects.length) {
                finishUp();
              }
            }
          });
        });

        stmt.finalize();
      }
    );
  });

  function finishUp() {
    console.log(`\n✅ Migration complete!`);
    console.log(`   Projects processed: ${projectsProcessed}`);
    console.log(`   Total items inserted: ${totalInserted}`);

    // Verify the results
    db.all('SELECT phase, COUNT(*) as count FROM checklist_items GROUP BY phase ORDER BY phase', [], (err, phaseCounts) => {
      if (!err) {
        console.log('\n📊 Current phase distribution:');
        phaseCounts.forEach(pc => {
          console.log(`   ${pc.phase}: ${pc.count} items`);
        });
      }

      db.close(() => {
        console.log('\n🔒 Database connection closed');
      });
    });
  }
});
