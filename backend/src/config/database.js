// backend/src/config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database/handover.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Projects table
    db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        handover_id TEXT UNIQUE NOT NULL,
        project_name TEXT NOT NULL,
        rd_lead TEXT,
        automation_lead TEXT,
        start_date DATE,
        target_date DATE,
        actual_completion_date DATE,
        business_priority TEXT,
        status TEXT DEFAULT 'active',
        current_phase TEXT DEFAULT 'Phase 1',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Checklist items table
    db.run(`
      CREATE TABLE IF NOT EXISTS checklist_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
		phase TEXT DEFAULT 'Phase 1',
        category TEXT NOT NULL,
        requirement TEXT NOT NULL,
        status TEXT DEFAULT 'Not Started',
        verification_date DATE,
        verified_by TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Knowledge transfer sessions table
    db.run(`
      CREATE TABLE IF NOT EXISTS knowledge_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        session_topic TEXT NOT NULL,
        scheduled_date DATE,
        duration TEXT,
        attendees TEXT,
        status TEXT DEFAULT 'Scheduled',
        effectiveness_rating INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Assessment scores table
    db.run(`
      CREATE TABLE IF NOT EXISTS assessment_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        phase TEXT DEFAULT 'Phase 1',
        category TEXT NOT NULL,
        category_weight INTEGER DEFAULT 10,
        criteria TEXT NOT NULL,
        score INTEGER,
        evidence TEXT,
        assessment_date DATE,
        assessed_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Team contacts table
    db.run(`
      CREATE TABLE IF NOT EXISTS team_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        department TEXT NOT NULL,
        role TEXT NOT NULL,
        name TEXT,
        email TEXT,
        phone TEXT,
        backup_contact TEXT,
        availability TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Issues table
    db.run(`
      CREATE TABLE IF NOT EXISTS issues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        issue_id TEXT UNIQUE NOT NULL,
        date_reported DATE,
        reporter TEXT,
        priority TEXT,
        description TEXT,
        assigned_to TEXT,
        target_resolution DATE,
        status TEXT DEFAULT 'Open',
        resolution TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Communication log table
    db.run(`
      CREATE TABLE IF NOT EXISTS communication_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        date DATE,
        type TEXT,
        participants TEXT,
        topics TEXT,
        decisions TEXT,
        action_items TEXT,
        next_meeting DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Resource allocation table
    db.run(`
      CREATE TABLE IF NOT EXISTS resource_allocation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        team_role TEXT NOT NULL,
        planned_hours DECIMAL(10,2),
        actual_hours DECIMAL(10,2),
        comments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Action items table
    db.run(`
      CREATE TABLE IF NOT EXISTS action_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        priority TEXT,
        description TEXT,
        responsible_party TEXT,
        target_date DATE,
        status TEXT DEFAULT 'Open',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Sign-offs table
    db.run(`
      CREATE TABLE IF NOT EXISTS sign_offs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        name TEXT,
        signature_date DATE,
        comments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Phase names table for custom phase names per project
    db.run(`
      CREATE TABLE IF NOT EXISTS phase_names (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        phase_id TEXT NOT NULL,
        phase_name TEXT NOT NULL,
        phase_color TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        UNIQUE(project_id, phase_id)
      )
    `);

    // Attachments table
    db.run(`
      CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        mime_type TEXT,
        description TEXT,
        uploaded_by TEXT,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Features table
    db.run(`
      CREATE TABLE IF NOT EXISTS features (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        feature_name TEXT NOT NULL,
        description TEXT,
        purpose TEXT,
        tech_specs TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Project criticalities table (for dynamic list)
    db.run(`
      CREATE TABLE IF NOT EXISTS project_criticalities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        criticality_text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Add complexity_level and project_score columns if they don't exist
    db.run(`
      ALTER TABLE projects ADD COLUMN complexity_level TEXT DEFAULT 'Media'
    `, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding complexity_level column:', err.message);
      }
    });

    db.run(`
      ALTER TABLE projects ADD COLUMN project_score INTEGER DEFAULT 0
    `, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding project_score column:', err.message);
      }
    });

    // Add start_time column to knowledge_sessions if it doesn't exist
    db.run(`
      ALTER TABLE knowledge_sessions ADD COLUMN start_time TEXT
    `, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding start_time column:', err.message);
      }
    });

    // Add new columns to projects table for Descrizione Generale and Osservazioni
    db.run(`
      ALTER TABLE projects ADD COLUMN funzioni_progettate TEXT
    `, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding funzioni_progettate column:', err.message);
      }
    });

    db.run(`
      ALTER TABLE projects ADD COLUMN finalita TEXT
    `, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding finalita column:', err.message);
      }
    });

    db.run(`
      ALTER TABLE projects ADD COLUMN specifiche_tecniche TEXT
    `, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding specifiche_tecniche column:', err.message);
      }
    });

    db.run(`
      ALTER TABLE projects ADD COLUMN osservazioni_note TEXT
    `, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding osservazioni_note column:', err.message);
      }
    });

    db.run(`
      ALTER TABLE projects ADD COLUMN azioni_correttive TEXT
    `, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding azioni_correttive column:', err.message);
      }
    });

    // Create indexes for better performance
    db.run('CREATE INDEX IF NOT EXISTS idx_project_handover_id ON projects(handover_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_checklist_project ON checklist_items(project_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_sessions_project ON knowledge_sessions(project_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_assessment_project ON assessment_scores(project_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_issues_project ON issues(project_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_phase_names_project ON phase_names(project_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_attachments_project ON attachments(project_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_features_project ON features(project_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_criticalities_project ON project_criticalities(project_id)');

    console.log('Database initialized successfully');
  });
}

// Helper function to run queries with promises
db.runAsync = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    this.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

db.getAsync = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    this.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

db.allAsync = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    this.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = db;