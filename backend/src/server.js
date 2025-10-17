// backend/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================== PROJECTS ROUTES ====================

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await db.allAsync('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project
app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await db.getAsync('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create new project
app.post('/api/projects', async (req, res) => {
  try {
    const {
      handover_id, project_name, rd_lead, automation_lead,
      start_date, target_date, business_priority
    } = req.body;

    const result = await db.runAsync(
      `INSERT INTO projects (handover_id, project_name, rd_lead, automation_lead, 
       start_date, target_date, business_priority) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [handover_id, project_name, rd_lead, automation_lead, start_date, target_date, business_priority]
    );

    res.status(201).json({ id: result.id, message: 'Project created successfully' });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
app.put('/api/projects/:id', async (req, res) => {
  try {
    const {
      handover_id, project_name, rd_lead, automation_lead,
      start_date, target_date, business_priority, status, current_phase
    } = req.body;

    await db.runAsync(
      `UPDATE projects SET 
       handover_id = COALESCE(?, handover_id),
       project_name = COALESCE(?, project_name),
       rd_lead = COALESCE(?, rd_lead),
       automation_lead = COALESCE(?, automation_lead),
       start_date = COALESCE(?, start_date),
       target_date = COALESCE(?, target_date),
       business_priority = COALESCE(?, business_priority),
       status = COALESCE(?, status),
       current_phase = COALESCE(?, current_phase),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [handover_id, project_name, rd_lead, automation_lead, start_date, target_date,
       business_priority, status, current_phase, req.params.id]
    );

    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// ==================== CHECKLIST ROUTES ====================

// Get checklist items for project
app.get('/api/checklist/:projectId', async (req, res) => {
  try {
    const items = await db.allAsync(
      'SELECT * FROM checklist_items WHERE project_id = ? ORDER BY category, id',
      [req.params.projectId]
    );
    res.json(items);
  } catch (error) {
    console.error('Error fetching checklist:', error);
    res.status(500).json({ error: 'Failed to fetch checklist' });
  }
});

// Add checklist item
app.post('/api/checklist/:projectId', async (req, res) => {
  try {
    const { phase, category, requirement, status, verification_date, verified_by, notes } = req.body;

    const result = await db.runAsync(
      `INSERT INTO checklist_items (project_id, phase, category, requirement, status,
       verification_date, verified_by, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.projectId, phase || 'Phase 1', category, requirement, status, verification_date, verified_by, notes]
    );

    res.status(201).json({ id: result.id, message: 'Checklist item added' });
  } catch (error) {
    console.error('Error adding checklist item:', error);
    res.status(500).json({ error: 'Failed to add checklist item' });
  }
});

// Update checklist item
app.put('/api/checklist/:projectId/:itemId', async (req, res) => {
  try {
    const { phase, category, requirement, status, verification_date, verified_by, notes } = req.body;

    console.log(`💾 Updating checklist item ${req.params.itemId}:`, req.body);

    await db.runAsync(
      `UPDATE checklist_items SET
       phase = COALESCE(?, phase),
       category = COALESCE(?, category),
       requirement = COALESCE(?, requirement),
       status = COALESCE(?, status),
       verification_date = COALESCE(?, verification_date),
       verified_by = COALESCE(?, verified_by),
       notes = COALESCE(?, notes),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND project_id = ?`,
      [phase, category, requirement, status, verification_date, verified_by, notes, req.params.itemId, req.params.projectId]
    );

    res.json({ message: 'Checklist item updated' });
  } catch (error) {
    console.error('Error updating checklist item:', error);
    res.status(500).json({ error: 'Failed to update checklist item' });
  }
});

// Delete checklist item
app.delete('/api/checklist/:projectId/:itemId', async (req, res) => {
  try {
    console.log(`🗑️ Deleting checklist item ${req.params.itemId} from project ${req.params.projectId}`);
    
    await db.runAsync(
      'DELETE FROM checklist_items WHERE id = ? AND project_id = ?',
      [req.params.itemId, req.params.projectId]
    );

    res.json({ message: 'Checklist item deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting checklist item:', error);
    res.status(500).json({ error: 'Failed to delete checklist item' });
  }
});

// ==================== KNOWLEDGE TRANSFER ROUTES ====================

// Get knowledge transfer sessions
app.get('/api/knowledge/:projectId', async (req, res) => {
  try {
    const sessions = await db.allAsync(
      'SELECT * FROM knowledge_sessions WHERE project_id = ? ORDER BY scheduled_date',
      [req.params.projectId]
    );
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Create knowledge transfer session
app.post('/api/knowledge/:projectId', async (req, res) => {
  try {
    const {
      session_topic, scheduled_date, duration, attendees,
      status, effectiveness_rating, notes
    } = req.body;

    const result = await db.runAsync(
      `INSERT INTO knowledge_sessions (project_id, session_topic, scheduled_date, 
       duration, attendees, status, effectiveness_rating, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.projectId, session_topic, scheduled_date, duration, attendees,
       status, effectiveness_rating, notes]
    );

    res.status(201).json({ id: result.id, message: 'Session created' });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Update knowledge transfer session
app.put('/api/knowledge/:projectId/:sessionId', async (req, res) => {
  try {
    const { status, effectiveness_rating, notes } = req.body;

    await db.runAsync(
      `UPDATE knowledge_sessions SET 
       status = COALESCE(?, status),
       effectiveness_rating = COALESCE(?, effectiveness_rating),
       notes = COALESCE(?, notes),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND project_id = ?`,
      [status, effectiveness_rating, notes, req.params.sessionId, req.params.projectId]
    );

    res.json({ message: 'Session updated' });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// ==================== ASSESSMENT ROUTES ====================

// Get assessment scores for project
app.get('/api/assessment/:projectId', async (req, res) => {
  try {
    const scores = await db.allAsync(
      'SELECT * FROM assessment_scores WHERE project_id = ? ORDER BY phase, category, criteria',
      [req.params.projectId]
    );
    res.json(scores);
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});

// Create assessment score
app.post('/api/assessment/:projectId', async (req, res) => {
  try {
    const { 
      phase, category, category_weight, criteria, score, evidence, 
      assessment_date, assessed_by 
    } = req.body;

    const result = await db.runAsync(
      `INSERT INTO assessment_scores 
      (project_id, phase, category, category_weight, criteria, score, evidence, 
       assessment_date, assessed_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.projectId, phase, category, category_weight || 10, criteria, 
       score, evidence, assessment_date, assessed_by]
    );

    res.status(201).json({ id: result.id, message: 'Assessment created' });
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

// Update assessment score
app.put('/api/assessment/:projectId/:assessmentId', async (req, res) => {
  try {
    const { category, category_weight, criteria, score, evidence, assessed_by } = req.body;

    await db.runAsync(
      `UPDATE assessment_scores SET 
       category = COALESCE(?, category),
       category_weight = COALESCE(?, category_weight),
       criteria = COALESCE(?, criteria),
       score = COALESCE(?, score),
       evidence = COALESCE(?, evidence),
       assessed_by = COALESCE(?, assessed_by),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND project_id = ?`,
      [category, category_weight, criteria, score, evidence, assessed_by, 
       req.params.assessmentId, req.params.projectId]
    );

    res.json({ message: 'Assessment updated' });
  } catch (error) {
    console.error('Error updating assessment:', error);
    res.status(500).json({ error: 'Failed to update assessment' });
  }
});

// Delete assessment score
app.delete('/api/assessment/:projectId/:assessmentId', async (req, res) => {
  try {
    console.log(`🗑️ Deleting assessment ${req.params.assessmentId} from project ${req.params.projectId}`);
    
    await db.runAsync(
      'DELETE FROM assessment_scores WHERE id = ? AND project_id = ?',
      [req.params.assessmentId, req.params.projectId]
    );

    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting assessment:', error);
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
});

// ==================== ISSUES ROUTES ====================

// Get issues for project
app.get('/api/issues/:projectId', async (req, res) => {
  try {
    const issues = await db.allAsync(
      'SELECT * FROM issues WHERE project_id = ? ORDER BY priority, date_reported DESC',
      [req.params.projectId]
    );
    res.json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// Create issue
app.post('/api/issues/:projectId', async (req, res) => {
  try {
    const {
      issue_id, date_reported, reporter, priority,
      description, assigned_to, target_resolution
    } = req.body;

    const result = await db.runAsync(
      `INSERT INTO issues (project_id, issue_id, date_reported, reporter,
       priority, description, assigned_to, target_resolution)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.projectId, issue_id, date_reported, reporter, priority,
       description, assigned_to, target_resolution]
    );

    res.status(201).json({ id: result.id, message: 'Issue created' });
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

// ==================== PHASE NAMES ROUTES ====================

// Get phase names for project
app.get('/api/phase-names/:projectId', async (req, res) => {
  try {
    const phaseNames = await db.allAsync(
      'SELECT * FROM phase_names WHERE project_id = ? ORDER BY phase_id',
      [req.params.projectId]
    );
    res.json(phaseNames);
  } catch (error) {
    console.error('Error fetching phase names:', error);
    res.status(500).json({ error: 'Failed to fetch phase names' });
  }
});

// Save or update phase names for project (upsert all phases)
app.post('/api/phase-names/:projectId', async (req, res) => {
  try {
    const { phases } = req.body; // Expecting array of { id, name, color }

    if (!Array.isArray(phases)) {
      return res.status(400).json({ error: 'Phases must be an array' });
    }

    // Delete existing phase names for this project
    await db.runAsync(
      'DELETE FROM phase_names WHERE project_id = ?',
      [req.params.projectId]
    );

    // Insert new phase names
    for (const phase of phases) {
      await db.runAsync(
        `INSERT INTO phase_names (project_id, phase_id, phase_name, phase_color)
         VALUES (?, ?, ?, ?)`,
        [req.params.projectId, phase.id, phase.name, phase.color]
      );
    }

    res.json({ message: 'Phase names saved successfully' });
  } catch (error) {
    console.error('Error saving phase names:', error);
    res.status(500).json({ error: 'Failed to save phase names' });
  }
});

// ==================== TEAM CONTACTS ROUTES ====================

// Get team contacts for project
app.get('/api/team-contacts/:projectId', async (req, res) => {
  try {
    const contacts = await db.allAsync(
      'SELECT * FROM team_contacts WHERE project_id = ? ORDER BY department, role',
      [req.params.projectId]
    );
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching team contacts:', error);
    res.status(500).json({ error: 'Failed to fetch team contacts' });
  }
});

// Create team contact
app.post('/api/team-contacts/:projectId', async (req, res) => {
  try {
    const { department, role, name, email, phone } = req.body;

    const result = await db.runAsync(
      `INSERT INTO team_contacts (project_id, department, role, name, email, phone)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.params.projectId, department, role, name, email, phone]
    );

    res.status(201).json({ id: result.id, message: 'Team contact added' });
  } catch (error) {
    console.error('Error adding team contact:', error);
    res.status(500).json({ error: 'Failed to add team contact' });
  }
});

// Update team contact
app.put('/api/team-contacts/:projectId/:contactId', async (req, res) => {
  try {
    const { department, role, name, email, phone } = req.body;

    await db.runAsync(
      `UPDATE team_contacts SET
       department = COALESCE(?, department),
       role = COALESCE(?, role),
       name = COALESCE(?, name),
       email = COALESCE(?, email),
       phone = COALESCE(?, phone),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND project_id = ?`,
      [department, role, name, email, phone, req.params.contactId, req.params.projectId]
    );

    res.json({ message: 'Team contact updated' });
  } catch (error) {
    console.error('Error updating team contact:', error);
    res.status(500).json({ error: 'Failed to update team contact' });
  }
});

// Delete team contact
app.delete('/api/team-contacts/:projectId/:contactId', async (req, res) => {
  try {
    console.log(`🗑️ Deleting team contact ${req.params.contactId} from project ${req.params.projectId}`);

    await db.runAsync(
      'DELETE FROM team_contacts WHERE id = ? AND project_id = ?',
      [req.params.contactId, req.params.projectId]
    );

    res.json({ message: 'Team contact deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting team contact:', error);
    res.status(500).json({ error: 'Failed to delete team contact' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`💾 Database: ${process.env.DATABASE_PATH || './database/handover.db'}`);
});