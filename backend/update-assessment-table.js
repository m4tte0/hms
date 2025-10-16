const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'handover.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Updating assessment_scores table schema...\n');

db.serialize(() => {
  // Check if columns already exist
  db.all("PRAGMA table_info(assessment_scores)", [], (err, columns) => {
    if (err) {
      console.error('❌ Error checking table schema:', err);
      db.close();
      return;
    }

    const columnNames = columns.map(col => col.name);
    console.log('📋 Current columns:', columnNames.join(', '));

    const needsPhase = !columnNames.includes('phase');
    const needsCategoryWeight = !columnNames.includes('category_weight');

    if (!needsPhase && !needsCategoryWeight) {
      console.log('✅ Table already has all required columns. No migration needed.');
      db.close();
      return;
    }

    console.log('\n🔧 Adding missing columns...');

    if (needsPhase) {
      db.run(
        "ALTER TABLE assessment_scores ADD COLUMN phase TEXT DEFAULT 'Phase 1'",
        (err) => {
          if (err) {
            console.error('❌ Error adding phase column:', err);
          } else {
            console.log('✅ Added "phase" column');
          }
        }
      );
    }

    if (needsCategoryWeight) {
      db.run(
        "ALTER TABLE assessment_scores ADD COLUMN category_weight INTEGER DEFAULT 10",
        (err) => {
          if (err) {
            console.error('❌ Error adding category_weight column:', err);
          } else {
            console.log('✅ Added "category_weight" column');
          }

          // Final verification
          setTimeout(() => {
            db.all("PRAGMA table_info(assessment_scores)", [], (err, updatedColumns) => {
              if (!err) {
                console.log('\n📊 Updated columns:', updatedColumns.map(col => col.name).join(', '));
              }
              db.close(() => {
                console.log('\n🔒 Database connection closed');
                console.log('✅ Migration complete! The server should now start successfully.');
              });
            });
          }, 500);
        }
      );
    } else {
      // Close if only phase needed
      setTimeout(() => {
        db.all("PRAGMA table_info(assessment_scores)", [], (err, updatedColumns) => {
          if (!err) {
            console.log('\n📊 Updated columns:', updatedColumns.map(col => col.name).join(', '));
          }
          db.close(() => {
            console.log('\n🔒 Database connection closed');
            console.log('✅ Migration complete! The server should now start successfully.');
          });
        });
      }, 500);
    }
  });
});
