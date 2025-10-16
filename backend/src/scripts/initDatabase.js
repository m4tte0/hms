// backend/src/scripts/initDatabase.js
require('dotenv').config();
const db = require('../config/database');

async function initializeSampleData() {
  console.log('🚀 Initializing sample data...');

  try {
    // Create a sample project
    const projectResult = await db.runAsync(
      `INSERT INTO projects (
        handover_id, project_name, rd_lead, automation_lead,
        start_date, target_date, business_priority, status, current_phase
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'HTD-2025-001',
        'Customer Portal Redesign',
        'John Smith (john.smith@company.com)',
        'Maria Garcia (maria.garcia@company.com)',
        '2025-01-15',
        '2025-04-30',
        'Business Critical',
        'active',
        'Phase 2'
      ]
    );

    const projectId = projectResult.id;
    console.log(`✅ Sample project created with ID: ${projectId}`);

    // Add sample checklist items
    const checklistItems = [
      { category: 'Technical Prerequisites', requirement: 'Code follows company coding standards', status: 'Complete' },
      { category: 'Technical Prerequisites', requirement: 'Code coverage ≥80%', status: 'Complete' },
      { category: 'Technical Prerequisites', requirement: 'All critical/high bugs resolved', status: 'In Progress' },
      { category: 'Documentation Prerequisites', requirement: 'Technical architecture documentation', status: 'Complete' },
      { category: 'Documentation Prerequisites', requirement: 'API documentation', status: 'In Progress' },
    ];

    for (const item of checklistItems) {
      await db.runAsync(
        `INSERT INTO checklist_items (project_id, category, requirement, status) VALUES (?, ?, ?, ?)`,
        [projectId, item.category, item.requirement, item.status]
      );
    }
    console.log(`✅ Added ${checklistItems.length} checklist items`);

    // Add sample knowledge transfer sessions
    const sessions = [
      {
        topic: 'Architecture Overview',
        date: '2025-02-15',
        duration: '2 hours',
        attendees: 'Development Team',
        status: 'Complete',
        rating: 4
      },
      {
        topic: 'Code Walkthrough',
        date: '2025-02-20',
        duration: '3 hours',
        attendees: 'Development Team, QA Team',
        status: 'Complete',
        rating: 5
      },
      {
        topic: 'Deployment Procedures',
        date: '2025-03-10',
        duration: '2 hours',
        attendees: 'Operations Team',
        status: 'Scheduled',
        rating: null
      }
    ];

    for (const session of sessions) {
      await db.runAsync(
        `INSERT INTO knowledge_sessions 
        (project_id, session_topic, scheduled_date, duration, attendees, status, effectiveness_rating) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [projectId, session.topic, session.date, session.duration, session.attendees, session.status, session.rating]
      );
    }
    console.log(`✅ Added ${sessions.length} knowledge transfer sessions`);

    // Add sample issues
    const issues = [
      {
        issue_id: 'HTD-001',
        date: '2025-02-25',
        reporter: 'John Smith',
        priority: 'High',
        description: 'Database migration script needs review',
        assigned_to: 'Maria Garcia',
        target: '2025-03-05',
        status: 'In Progress'
      },
      {
        issue_id: 'HTD-002',
        date: '2025-03-01',
        reporter: 'Maria Garcia',
        priority: 'Medium',
        description: 'Missing error handling in API endpoints',
        assigned_to: 'John Smith',
        target: '2025-03-15',
        status: 'Open'
      }
    ];

    for (const issue of issues) {
      await db.runAsync(
        `INSERT INTO issues 
        (project_id, issue_id, date_reported, reporter, priority, description, assigned_to, target_resolution, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [projectId, issue.issue_id, issue.date, issue.reporter, issue.priority, 
         issue.description, issue.assigned_to, issue.target, issue.status]
      );
    }
    console.log(`✅ Added ${issues.length} issues`);

    // Add team contacts
    const contacts = [
      { dept: 'R&D', role: 'Project Lead', name: 'John Smith', email: 'john.smith@company.com', phone: '+1-555-0101' },
      { dept: 'R&D', role: 'Technical Lead', name: 'Sarah Johnson', email: 'sarah.j@company.com', phone: '+1-555-0102' },
      { dept: 'Automation', role: 'Operations Manager', name: 'Maria Garcia', email: 'maria.garcia@company.com', phone: '+1-555-0201' },
      { dept: 'Automation', role: 'Technical Lead', name: 'David Chen', email: 'david.chen@company.com', phone: '+1-555-0202' }
    ];

    for (const contact of contacts) {
      await db.runAsync(
        `INSERT INTO team_contacts (project_id, department, role, name, email, phone) VALUES (?, ?, ?, ?, ?, ?)`,
        [projectId, contact.dept, contact.role, contact.name, contact.email, contact.phone]
      );
    }
    console.log(`✅ Added ${contacts.length} team contacts`);

    console.log('\n✨ Sample data initialization complete!');
    console.log(`📊 Project ID: ${projectId}`);
    console.log('🌐 You can now start the server and view the sample project\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing sample data:', error);
    process.exit(1);
  }
}

// Wait for database to be ready
setTimeout(() => {
  initializeSampleData();
}, 1000);