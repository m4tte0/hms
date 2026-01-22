// backend/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

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
      start_date, target_date, business_priority, machine_family,
      description, context_usage, deliverable
    } = req.body;

    const result = await db.runAsync(
      `INSERT INTO projects (handover_id, project_name, rd_lead, automation_lead,
       start_date, target_date, business_priority, machine_family, description,
       context_usage, deliverable)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [handover_id, project_name, rd_lead, automation_lead, start_date, target_date,
       business_priority, machine_family, description, context_usage, deliverable]
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
      start_date, target_date, business_priority, complexity_level,
      project_score, status, current_phase, machine_family, description,
      context_usage, deliverable, funzioni_progettate, finalita,
      specifiche_tecniche, osservazioni_note, azioni_correttive
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
       complexity_level = COALESCE(?, complexity_level),
       project_score = COALESCE(?, project_score),
       status = COALESCE(?, status),
       current_phase = COALESCE(?, current_phase),
       machine_family = COALESCE(?, machine_family),
       description = COALESCE(?, description),
       context_usage = COALESCE(?, context_usage),
       deliverable = COALESCE(?, deliverable),
       funzioni_progettate = COALESCE(?, funzioni_progettate),
       finalita = COALESCE(?, finalita),
       specifiche_tecniche = COALESCE(?, specifiche_tecniche),
       osservazioni_note = COALESCE(?, osservazioni_note),
       azioni_correttive = COALESCE(?, azioni_correttive),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [handover_id, project_name, rd_lead, automation_lead, start_date, target_date,
       business_priority, complexity_level, project_score, status, current_phase,
       machine_family, description, context_usage, deliverable, funzioni_progettate,
       finalita, specifiche_tecniche, osservazioni_note, azioni_correttive, req.params.id]
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

// Get comprehensive project report
app.get('/api/projects/:id/report', async (req, res) => {
  try {
    const projectId = req.params.id;

    // Fetch all related data in parallel for better performance
    const [
      project,
      checklistItems,
      knowledgeSessions,
      issues,
      teamContacts,
      attachments,
      phaseNames,
      features
    ] = await Promise.all([
      db.getAsync('SELECT * FROM projects WHERE id = ?', [projectId]),
      db.allAsync('SELECT * FROM checklist_items WHERE project_id = ? ORDER BY phase, category, id', [projectId]),
      db.allAsync('SELECT * FROM knowledge_sessions WHERE project_id = ? ORDER BY scheduled_date', [projectId]),
      db.allAsync('SELECT * FROM issues WHERE project_id = ? ORDER BY priority, date_reported DESC', [projectId]),
      db.allAsync('SELECT * FROM team_contacts WHERE project_id = ? ORDER BY department, role', [projectId]),
      db.allAsync('SELECT id, file_name, original_name, file_size, mime_type, description, uploaded_by, uploaded_at FROM attachments WHERE project_id = ? ORDER BY uploaded_at DESC', [projectId]),
      db.allAsync('SELECT * FROM phase_names WHERE project_id = ? ORDER BY phase_id', [projectId]),
      db.allAsync('SELECT * FROM features WHERE project_id = ? ORDER BY created_at DESC', [projectId])
    ]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Calculate statistics
    const totalChecklistItems = checklistItems.length;
    const completedChecklistItems = checklistItems.filter(item => item.status === 'Complete').length;
    const inProgressChecklistItems = checklistItems.filter(item => item.status === 'In Progress').length;
    const notStartedChecklistItems = checklistItems.filter(item => item.status === 'Not Started').length;

    const completionPercentage = totalChecklistItems > 0
      ? Math.round((completedChecklistItems / totalChecklistItems) * 100)
      : 0;

    // Group checklist by phase and category
    const checklistByPhase = {};
    checklistItems.forEach(item => {
      if (!checklistByPhase[item.phase]) {
        checklistByPhase[item.phase] = {};
      }
      if (!checklistByPhase[item.phase][item.category]) {
        checklistByPhase[item.phase][item.category] = [];
      }
      checklistByPhase[item.phase][item.category].push(item);
    });

    // Calculate phase completion percentages
    const phaseStats = {};
    Object.keys(checklistByPhase).forEach(phase => {
      const phaseItems = checklistItems.filter(item => item.phase === phase);
      const phaseCompleted = phaseItems.filter(item => item.status === 'Complete').length;
      phaseStats[phase] = {
        total: phaseItems.length,
        completed: phaseCompleted,
        inProgress: phaseItems.filter(item => item.status === 'In Progress').length,
        notStarted: phaseItems.filter(item => item.status === 'Not Started').length,
        percentage: phaseItems.length > 0 ? Math.round((phaseCompleted / phaseItems.length) * 100) : 0
      };
    });

    // Calculate days remaining
    let daysRemaining = null;
    if (project.target_date) {
      const targetDate = new Date(project.target_date);
      const today = new Date();
      const timeDiff = targetDate.getTime() - today.getTime();
      daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    // Aggregate report data
    const report = {
      project: {
        ...project,
        daysRemaining,
        completionPercentage
      },
      statistics: {
        checklist: {
          total: totalChecklistItems,
          completed: completedChecklistItems,
          inProgress: inProgressChecklistItems,
          notStarted: notStartedChecklistItems,
          completionPercentage
        },
        phases: phaseStats,
        knowledge: {
          total: knowledgeSessions.length,
          completed: knowledgeSessions.filter(s => s.status === 'Completed').length,
          scheduled: knowledgeSessions.filter(s => s.status === 'Scheduled').length
        },
        issues: {
          total: issues.length,
          open: issues.filter(i => i.status === 'Open').length,
          inProgress: issues.filter(i => i.status === 'In Progress').length,
          resolved: issues.filter(i => i.status === 'Resolved').length
        },
        attachments: {
          total: attachments.length,
          totalSize: attachments.reduce((sum, a) => sum + (a.file_size || 0), 0)
        }
      },
      teamContacts,
      checklistByPhase,
      knowledgeSessions,
      issues,
      attachments,
      phaseNames,
      features
    };

    res.json(report);
  } catch (error) {
    console.error('Error generating project report:', error);
    res.status(500).json({ error: 'Failed to generate project report' });
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
      session_topic, scheduled_date, start_time, duration, attendees,
      status, effectiveness_rating, notes
    } = req.body;

    const result = await db.runAsync(
      `INSERT INTO knowledge_sessions (project_id, session_topic, scheduled_date,
       start_time, duration, attendees, status, effectiveness_rating, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.projectId, session_topic, scheduled_date, start_time, duration, attendees,
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
    const { session_topic, scheduled_date, start_time, duration, attendees, status, effectiveness_rating, notes } = req.body;

    // Convert empty strings to null for proper COALESCE behavior
    const cleanStartTime = start_time === '' ? null : start_time;
    const cleanDuration = duration === '' ? null : duration;
    const cleanAttendees = attendees === '' ? null : attendees;
    const cleanNotes = notes === '' ? null : notes;

    await db.runAsync(
      `UPDATE knowledge_sessions SET
       session_topic = COALESCE(?, session_topic),
       scheduled_date = COALESCE(?, scheduled_date),
       start_time = COALESCE(?, start_time),
       duration = COALESCE(?, duration),
       attendees = COALESCE(?, attendees),
       status = COALESCE(?, status),
       effectiveness_rating = COALESCE(?, effectiveness_rating),
       notes = COALESCE(?, notes),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND project_id = ?`,
      [session_topic, scheduled_date, cleanStartTime, cleanDuration, cleanAttendees, status, effectiveness_rating, cleanNotes, req.params.sessionId, req.params.projectId]
    );

    res.json({ message: 'Session updated' });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Delete knowledge transfer session
app.delete('/api/knowledge/:projectId/:sessionId', async (req, res) => {
  try {
    console.log(`🗑️ Deleting knowledge session ${req.params.sessionId} from project ${req.params.projectId}`);

    await db.runAsync(
      'DELETE FROM knowledge_sessions WHERE id = ? AND project_id = ?',
      [req.params.sessionId, req.params.projectId]
    );

    res.json({ message: 'Knowledge session deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting knowledge session:', error);
    res.status(500).json({ error: 'Failed to delete knowledge session' });
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
      description, assigned_to, target_resolution, status
    } = req.body;

    const result = await db.runAsync(
      `INSERT INTO issues (project_id, issue_id, date_reported, reporter,
       priority, description, assigned_to, target_resolution, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.projectId, issue_id, date_reported, reporter, priority,
       description, assigned_to, target_resolution, status || 'Open']
    );

    res.status(201).json({ id: result.id, message: 'Issue created' });
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

// Update issue
app.put('/api/issues/:projectId/:issueId', async (req, res) => {
  try {
    const {
      issue_id, date_reported, reporter, priority,
      description, assigned_to, target_resolution, status
    } = req.body;

    console.log(`💾 Updating issue ${req.params.issueId}:`, req.body);

    await db.runAsync(
      `UPDATE issues SET
       issue_id = COALESCE(?, issue_id),
       date_reported = COALESCE(?, date_reported),
       reporter = COALESCE(?, reporter),
       priority = COALESCE(?, priority),
       description = COALESCE(?, description),
       assigned_to = COALESCE(?, assigned_to),
       target_resolution = COALESCE(?, target_resolution),
       status = COALESCE(?, status),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND project_id = ?`,
      [issue_id, date_reported, reporter, priority, description, assigned_to,
       target_resolution, status, req.params.issueId, req.params.projectId]
    );

    res.json({ message: 'Issue updated' });
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({ error: 'Failed to update issue' });
  }
});

// Delete issue
app.delete('/api/issues/:projectId/:issueId', async (req, res) => {
  try {
    console.log(`🗑️ Deleting issue ${req.params.issueId} from project ${req.params.projectId}`);

    await db.runAsync(
      'DELETE FROM issues WHERE id = ? AND project_id = ?',
      [req.params.issueId, req.params.projectId]
    );

    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting issue:', error);
    res.status(500).json({ error: 'Failed to delete issue' });
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

// ==================== PHASE DATES ROUTES ====================

// Get phase dates for project
app.get('/api/phase-dates/:projectId', async (req, res) => {
  try {
    const phaseDates = await db.allAsync(
      'SELECT * FROM phase_dates WHERE project_id = ? ORDER BY phase_id',
      [req.params.projectId]
    );
    res.json(phaseDates);
  } catch (error) {
    console.error('Error fetching phase dates:', error);
    res.status(500).json({ error: 'Failed to fetch phase dates' });
  }
});

// Update phase dates (upsert)
app.post('/api/phase-dates/:projectId', async (req, res) => {
  try {
    const { phaseId, startDate, endDate } = req.body;

    if (!phaseId) {
      return res.status(400).json({ error: 'Phase ID is required' });
    }

    // Check if record exists
    const existing = await db.getAsync(
      'SELECT * FROM phase_dates WHERE project_id = ? AND phase_id = ?',
      [req.params.projectId, phaseId]
    );

    if (existing) {
      // Update existing
      await db.runAsync(
        `UPDATE phase_dates
         SET start_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP
         WHERE project_id = ? AND phase_id = ?`,
        [startDate, endDate, req.params.projectId, phaseId]
      );
    } else {
      // Insert new
      await db.runAsync(
        `INSERT INTO phase_dates (project_id, phase_id, start_date, end_date)
         VALUES (?, ?, ?, ?)`,
        [req.params.projectId, phaseId, startDate, endDate]
      );
    }

    res.json({ message: 'Phase dates saved successfully' });
  } catch (error) {
    console.error('Error saving phase dates:', error);
    res.status(500).json({ error: 'Failed to save phase dates' });
  }
});

// Delete phase dates
app.delete('/api/phase-dates/:projectId/:phaseId', async (req, res) => {
  try {
    await db.runAsync(
      'DELETE FROM phase_dates WHERE project_id = ? AND phase_id = ?',
      [req.params.projectId, req.params.phaseId]
    );
    res.json({ message: 'Phase dates deleted successfully' });
  } catch (error) {
    console.error('Error deleting phase dates:', error);
    res.status(500).json({ error: 'Failed to delete phase dates' });
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

// ==================== ATTACHMENTS ROUTES ====================

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size
});

// Get attachments for project
app.get('/api/attachments/:projectId', async (req, res) => {
  try {
    const attachments = await db.allAsync(
      'SELECT * FROM attachments WHERE project_id = ? ORDER BY uploaded_at DESC',
      [req.params.projectId]
    );
    res.json(attachments);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

// Upload attachment
app.post('/api/attachments/:projectId', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { description, uploaded_by } = req.body;

    const result = await db.runAsync(
      `INSERT INTO attachments (project_id, file_name, original_name, file_path,
       file_size, mime_type, description, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.projectId,
        req.file.filename,
        req.file.originalname,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        description || null,
        uploaded_by || null
      ]
    );

    res.status(201).json({
      id: result.id,
      message: 'File uploaded successfully',
      filename: req.file.originalname
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    // Delete the uploaded file if database insert fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Download attachment
app.get('/api/attachments/:projectId/:attachmentId/download', async (req, res) => {
  try {
    const attachment = await db.getAsync(
      'SELECT * FROM attachments WHERE id = ? AND project_id = ?',
      [req.params.attachmentId, req.params.projectId]
    );

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    if (!fs.existsSync(attachment.file_path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.download(attachment.file_path, attachment.original_name);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Delete attachment
app.delete('/api/attachments/:projectId/:attachmentId', async (req, res) => {
  try {
    console.log(`🗑️ Deleting attachment ${req.params.attachmentId} from project ${req.params.projectId}`);

    // Get attachment info to delete file from disk
    const attachment = await db.getAsync(
      'SELECT * FROM attachments WHERE id = ? AND project_id = ?',
      [req.params.attachmentId, req.params.projectId]
    );

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Delete from database
    await db.runAsync(
      'DELETE FROM attachments WHERE id = ? AND project_id = ?',
      [req.params.attachmentId, req.params.projectId]
    );

    // Delete file from disk
    if (fs.existsSync(attachment.file_path)) {
      fs.unlinkSync(attachment.file_path);
    }

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting attachment:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// ==================== PROJECT CRITICALITIES ROUTES ====================

// Get all criticalities for a project
app.get('/api/criticalities/:projectId', async (req, res) => {
  try {
    const criticalities = await db.allAsync(
      'SELECT * FROM project_criticalities WHERE project_id = ? ORDER BY created_at ASC',
      [req.params.projectId]
    );
    res.json(criticalities);
  } catch (error) {
    console.error('Error fetching criticalities:', error);
    res.status(500).json({ error: 'Failed to fetch criticalities' });
  }
});

// Create new criticality
app.post('/api/criticalities/:projectId', async (req, res) => {
  try {
    const { criticality_text } = req.body;

    const result = await db.runAsync(
      `INSERT INTO project_criticalities (project_id, criticality_text)
       VALUES (?, ?)`,
      [req.params.projectId, criticality_text]
    );

    res.status(201).json({ id: result.id, message: 'Criticality added successfully' });
  } catch (error) {
    console.error('Error creating criticality:', error);
    res.status(500).json({ error: 'Failed to create criticality' });
  }
});

// Update criticality
app.put('/api/criticalities/:projectId/:criticalityId', async (req, res) => {
  try {
    const { criticality_text } = req.body;

    await db.runAsync(
      `UPDATE project_criticalities SET criticality_text = ? WHERE id = ? AND project_id = ?`,
      [criticality_text, req.params.criticalityId, req.params.projectId]
    );

    res.json({ message: 'Criticality updated successfully' });
  } catch (error) {
    console.error('Error updating criticality:', error);
    res.status(500).json({ error: 'Failed to update criticality' });
  }
});

// Delete criticality
app.delete('/api/criticalities/:projectId/:criticalityId', async (req, res) => {
  try {
    await db.runAsync(
      'DELETE FROM project_criticalities WHERE id = ? AND project_id = ?',
      [req.params.criticalityId, req.params.projectId]
    );

    res.json({ message: 'Criticality deleted successfully' });
  } catch (error) {
    console.error('Error deleting criticality:', error);
    res.status(500).json({ error: 'Failed to delete criticality' });
  }
});

// ==================== FEATURES ROUTES ====================

// Get all features for a project
app.get('/api/features/:projectId', async (req, res) => {
  try {
    const features = await db.allAsync(
      'SELECT * FROM features WHERE project_id = ? ORDER BY created_at DESC',
      [req.params.projectId]
    );
    res.json(features);
  } catch (error) {
    console.error('Error fetching features:', error);
    res.status(500).json({ error: 'Failed to fetch features' });
  }
});

// Create new feature
app.post('/api/features/:projectId', async (req, res) => {
  try {
    const { feature_name, description, purpose, tech_specs } = req.body;

    const result = await db.runAsync(
      `INSERT INTO features (project_id, feature_name, description, purpose, tech_specs)
       VALUES (?, ?, ?, ?, ?)`,
      [req.params.projectId, feature_name, description, purpose, tech_specs]
    );

    res.status(201).json({ id: result.id, message: 'Feature created successfully' });
  } catch (error) {
    console.error('Error creating feature:', error);
    res.status(500).json({ error: 'Failed to create feature' });
  }
});

// Update feature
app.put('/api/features/:projectId/:featureId', async (req, res) => {
  try {
    const { feature_name, description, purpose, tech_specs } = req.body;

    await db.runAsync(
      `UPDATE features SET
       feature_name = ?,
       description = ?,
       purpose = ?,
       tech_specs = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND project_id = ?`,
      [feature_name, description, purpose, tech_specs, req.params.featureId, req.params.projectId]
    );

    res.json({ message: 'Feature updated successfully' });
  } catch (error) {
    console.error('Error updating feature:', error);
    res.status(500).json({ error: 'Failed to update feature' });
  }
});

// Delete feature
app.delete('/api/features/:projectId/:featureId', async (req, res) => {
  try {
    await db.runAsync(
      'DELETE FROM features WHERE id = ? AND project_id = ?',
      [req.params.featureId, req.params.projectId]
    );

    res.json({ message: 'Feature deleted successfully' });
  } catch (error) {
    console.error('Error deleting feature:', error);
    res.status(500).json({ error: 'Failed to delete feature' });
  }
});

// ==================== NEWSLETTER ROUTES ====================

const newsletterService = require('./services/newsletterService');
const newsletterScheduler = require('./services/newsletterScheduler');

// Get newsletter subscriptions for a project
app.get('/api/newsletter/subscriptions/:projectId', async (req, res) => {
  try {
    const subscriptions = await db.allAsync(
      'SELECT * FROM newsletter_subscriptions WHERE project_id = ? ORDER BY email',
      [req.params.projectId]
    );
    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Add newsletter subscription
app.post('/api/newsletter/subscriptions/:projectId', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const result = await db.runAsync(
      `INSERT OR REPLACE INTO newsletter_subscriptions (project_id, email, subscribed, updated_at)
       VALUES (?, ?, 1, CURRENT_TIMESTAMP)`,
      [req.params.projectId, email.toLowerCase().trim()]
    );

    res.status(201).json({ id: result.id, message: 'Subscription added successfully' });
  } catch (error) {
    console.error('Error adding subscription:', error);
    res.status(500).json({ error: 'Failed to add subscription' });
  }
});

// Update subscription status (subscribe/unsubscribe)
app.put('/api/newsletter/subscriptions/:projectId/:subscriptionId', async (req, res) => {
  try {
    const { subscribed } = req.body;

    await db.runAsync(
      `UPDATE newsletter_subscriptions
       SET subscribed = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND project_id = ?`,
      [subscribed ? 1 : 0, req.params.subscriptionId, req.params.projectId]
    );

    res.json({ message: 'Subscription updated successfully' });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Delete subscription
app.delete('/api/newsletter/subscriptions/:projectId/:subscriptionId', async (req, res) => {
  try {
    await db.runAsync(
      'DELETE FROM newsletter_subscriptions WHERE id = ? AND project_id = ?',
      [req.params.subscriptionId, req.params.projectId]
    );

    res.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
});

// Auto-subscribe team members
app.post('/api/newsletter/auto-subscribe/:projectId', async (req, res) => {
  try {
    const result = await newsletterService.autoSubscribeTeamMembers(req.params.projectId);
    res.json(result);
  } catch (error) {
    console.error('Error auto-subscribing:', error);
    res.status(500).json({ error: 'Failed to auto-subscribe team members' });
  }
});

// Get newsletter settings for a project
app.get('/api/newsletter/settings/:projectId', async (req, res) => {
  try {
    let settings = await db.getAsync(
      'SELECT * FROM newsletter_settings WHERE project_id = ?',
      [req.params.projectId]
    );

    // Create default settings if none exist
    if (!settings) {
      await db.runAsync(
        `INSERT INTO newsletter_settings (project_id)
         VALUES (?)`,
        [req.params.projectId]
      );

      settings = await db.getAsync(
        'SELECT * FROM newsletter_settings WHERE project_id = ?',
        [req.params.projectId]
      );
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update newsletter settings
app.put('/api/newsletter/settings/:projectId', async (req, res) => {
  try {
    const {
      enabled,
      include_metrics,
      include_tasks,
      include_issues,
      include_team_changes,
      include_attachments,
      include_upcoming_events
    } = req.body;

    await db.runAsync(
      `INSERT OR REPLACE INTO newsletter_settings
       (project_id, enabled, include_metrics, include_tasks, include_issues,
        include_team_changes, include_attachments, include_upcoming_events, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        req.params.projectId,
        enabled ? 1 : 0,
        include_metrics ? 1 : 0,
        include_tasks ? 1 : 0,
        include_issues ? 1 : 0,
        include_team_changes ? 1 : 0,
        include_attachments ? 1 : 0,
        include_upcoming_events ? 1 : 0
      ]
    );

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get newsletter history
app.get('/api/newsletter/history/:projectId', async (req, res) => {
  try {
    const history = await db.allAsync(
      `SELECT * FROM newsletter_history
       WHERE project_id = ?
       ORDER BY sent_at DESC
       LIMIT 50`,
      [req.params.projectId]
    );
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Manual trigger newsletter (for testing)
app.post('/api/newsletter/trigger', async (req, res) => {
  try {
    // Only allow in development/testing
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Manual trigger not allowed in production' });
    }

    newsletterScheduler.triggerNow();
    res.json({ message: 'Newsletter generation triggered' });
  } catch (error) {
    console.error('Error triggering newsletter:', error);
    res.status(500).json({ error: 'Failed to trigger newsletter' });
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`💾 Database: ${process.env.DATABASE_PATH || './database/handover.db'}`);

  // Start newsletter scheduler
  if (process.env.BREVO_API_KEY) {
    newsletterScheduler.start();
  } else {
    console.log('⚠️  Newsletter scheduler not started - BREVO_API_KEY not configured');
    console.log('   Add BREVO_API_KEY to .env file to enable weekly newsletters');
  }
});