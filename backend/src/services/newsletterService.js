// Newsletter Service - Handles weekly newsletter generation and sending
const brevo = require('@getbrevo/brevo');
const db = require('../config/database');

class NewsletterService {
  constructor() {
    // Initialize Brevo API client
    this.apiInstance = new brevo.TransactionalEmailsApi();
    this.apiKey = this.apiInstance.authentications['apiKey'];
    // API key will be set from environment variable
    this.apiKey.apiKey = process.env.BREVO_API_KEY || '';
  }

  /**
   * Get weekly data for a project
   * @param {number} projectId - The project ID
   * @param {Date} weekStart - Start of the week
   * @param {Date} weekEnd - End of the week
   * @returns {Object} Weekly project data
   */
  async getWeeklyProjectData(projectId, weekStart, weekEnd) {
    try {
      const project = await db.getAsync('SELECT * FROM projects WHERE id = ?', [projectId]);

      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      // Get tasks completed this week
      const tasksCompleted = await db.allAsync(
        `SELECT * FROM checklist_items
         WHERE project_id = ?
         AND status = 'Complete'
         AND updated_at BETWEEN ? AND ?`,
        [projectId, weekStart.toISOString(), weekEnd.toISOString()]
      );

      // Get issues created/resolved this week
      const issuesCreated = await db.allAsync(
        `SELECT * FROM issues
         WHERE project_id = ?
         AND created_at BETWEEN ? AND ?`,
        [projectId, weekStart.toISOString(), weekEnd.toISOString()]
      );

      const issuesResolved = await db.allAsync(
        `SELECT * FROM issues
         WHERE project_id = ?
         AND status = 'Resolved'
         AND updated_at BETWEEN ? AND ?`,
        [projectId, weekStart.toISOString(), weekEnd.toISOString()]
      );

      // Get team members added this week
      const newTeamMembers = await db.allAsync(
        `SELECT * FROM team_contacts
         WHERE project_id = ?
         AND created_at BETWEEN ? AND ?`,
        [projectId, weekStart.toISOString(), weekEnd.toISOString()]
      );

      // Get attachments uploaded this week
      const newAttachments = await db.allAsync(
        `SELECT * FROM attachments
         WHERE project_id = ?
         AND uploaded_at BETWEEN ? AND ?`,
        [projectId, weekStart.toISOString(), weekEnd.toISOString()]
      );

      // Get project status change (if any)
      const statusChanged = project.updated_at >= weekStart.toISOString() &&
                           project.updated_at <= weekEnd.toISOString();

      // Get phase progress
      const allTasks = await db.allAsync(
        'SELECT * FROM checklist_items WHERE project_id = ?',
        [projectId]
      );

      const phaseProgress = this.calculatePhaseProgress(allTasks);

      // Get upcoming sessions (next 2 weeks) - handle missing table gracefully
      let upcomingSessions = [];
      try {
        upcomingSessions = await db.allAsync(
          `SELECT * FROM sessions
           WHERE project_id = ?
           AND scheduled_date >= ?
           AND status != 'Cancelled'
           ORDER BY scheduled_date ASC
           LIMIT 5`,
          [projectId, new Date().toISOString()]
        );
      } catch (error) {
        // Table doesn't exist yet, skip sessions
        console.log('ℹ️  Sessions table not found, skipping upcoming events');
      }

      // Get phase dates for deadlines
      const phaseDates = await db.allAsync(
        'SELECT * FROM phase_dates WHERE project_id = ?',
        [projectId]
      );

      return {
        project,
        weeklyActivity: {
          tasksCompleted: tasksCompleted.length,
          issuesCreated: issuesCreated.length,
          issuesResolved: issuesResolved.length,
          newTeamMembers: newTeamMembers.length,
          newAttachments: newAttachments.length,
          statusChanged
        },
        details: {
          tasksCompleted,
          issuesCreated,
          issuesResolved,
          newTeamMembers,
          newAttachments
        },
        phaseProgress,
        upcomingEvents: {
          sessions: upcomingSessions,
          phaseDates
        }
      };
    } catch (error) {
      console.error('Error getting weekly project data:', error);
      throw error;
    }
  }

  /**
   * Calculate progress by phase
   */
  calculatePhaseProgress(tasks) {
    const phases = ['Phase 1', 'Phase 2', 'Phase 3'];
    const progress = {};

    phases.forEach(phase => {
      const phaseTasks = tasks.filter(t => t.phase === phase);
      const completed = phaseTasks.filter(t => t.status === 'Complete').length;
      progress[phase] = phaseTasks.length > 0
        ? Math.round((completed / phaseTasks.length) * 100)
        : 0;
    });

    return progress;
  }

  /**
   * Generate newsletter content for a user (digest mode)
   * @param {string} email - Recipient email
   * @param {Date} weekStart - Start of the week
   * @param {Date} weekEnd - End of the week
   * @returns {Object} Newsletter data
   */
  async generateDigestNewsletter(email, weekStart, weekEnd) {
    try {
      // Get all projects this user is subscribed to
      const subscriptions = await db.allAsync(
        `SELECT DISTINCT project_id FROM newsletter_subscriptions
         WHERE email = ? AND subscribed = 1`,
        [email]
      );

      if (subscriptions.length === 0) {
        return null;
      }

      // Get data for each project
      const projectsData = [];
      for (const sub of subscriptions) {
        const settings = await db.getAsync(
          'SELECT * FROM newsletter_settings WHERE project_id = ?',
          [sub.project_id]
        );

        // Skip if newsletter disabled for this project
        if (settings && !settings.enabled) {
          continue;
        }

        const data = await this.getWeeklyProjectData(sub.project_id, weekStart, weekEnd);
        projectsData.push(data);
      }

      return {
        recipient: email,
        weekStart,
        weekEnd,
        projects: projectsData
      };
    } catch (error) {
      console.error('Error generating digest newsletter:', error);
      throw error;
    }
  }

  /**
   * Send newsletter email via Brevo
   * @param {Object} newsletterData - Newsletter data
   * @returns {Object} Send result
   */
  async sendNewsletter(newsletterData) {
    try {
      const htmlContent = this.generateHTMLContent(newsletterData);
      const subject = this.generateSubject(newsletterData);

      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlContent;
      sendSmtpEmail.sender = {
        name: 'Handover Management System',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@handover.com'
      };
      sendSmtpEmail.to = [{ email: newsletterData.recipient }];
      sendSmtpEmail.replyTo = null; // No reply

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

      // Log to history
      for (const projectData of newsletterData.projects) {
        await db.runAsync(
          `INSERT INTO newsletter_history
           (project_id, recipient_email, subject, week_start_date, week_end_date, content_json)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            projectData.project.id,
            newsletterData.recipient,
            subject,
            newsletterData.weekStart.toISOString().split('T')[0],
            newsletterData.weekEnd.toISOString().split('T')[0],
            JSON.stringify(newsletterData)
          ]
        );
      }

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending newsletter:', error);
      throw error;
    }
  }

  /**
   * Generate email subject
   */
  generateSubject(newsletterData) {
    const weekStart = newsletterData.weekStart.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });
    const weekEnd = newsletterData.weekEnd.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    if (newsletterData.projects.length === 1) {
      return `${newsletterData.projects[0].project.project_name} - Weekly Update (${weekStart} - ${weekEnd})`;
    } else {
      return `Weekly Project Updates - ${newsletterData.projects.length} Projects (${weekStart} - ${weekEnd})`;
    }
  }

  /**
   * Generate HTML email content
   */
  generateHTMLContent(newsletterData) {
    const weekStart = newsletterData.weekStart.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const weekEnd = newsletterData.weekEnd.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .project { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin-bottom: 30px; border-radius: 4px; }
        .project h2 { margin-top: 0; color: #667eea; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric { background: white; padding: 15px; border-radius: 6px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 32px; font-weight: bold; color: #667eea; }
        .metric-label { font-size: 12px; color: #666; text-transform: uppercase; margin-top: 5px; }
        .section { margin: 20px 0; }
        .section h3 { color: #444; border-bottom: 2px solid #667eea; padding-bottom: 8px; }
        .item { background: white; padding: 12px; margin: 8px 0; border-radius: 4px; border-left: 3px solid #ddd; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-warning { background: #fff3cd; color: #856404; }
        .badge-info { background: #d1ecf1; color: #0c5460; }
        .progress-bar { background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-fill { background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; text-align: center; color: white; font-size: 12px; line-height: 20px; font-weight: bold; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; color: #666; font-size: 12px; }
        .no-activity { color: #999; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Weekly Project Update</h1>
        <p>Week of ${weekStart} - ${weekEnd}</p>
      </div>
    `;

    // Add each project
    newsletterData.projects.forEach(projectData => {
      const { project, weeklyActivity, details, phaseProgress, upcomingEvents } = projectData;

      html += `
      <div class="project">
        <h2>${project.project_name}</h2>
        <p><strong>ID:</strong> ${project.handover_id} | <strong>Status:</strong> <span class="badge badge-info">${project.status || 'In Progress'}</span></p>

        <!-- Weekly Metrics -->
        <div class="metrics">
          <div class="metric">
            <div class="metric-value">${weeklyActivity.tasksCompleted}</div>
            <div class="metric-label">Tasks Completed</div>
          </div>
          <div class="metric">
            <div class="metric-value">${weeklyActivity.issuesCreated}</div>
            <div class="metric-label">Issues Created</div>
          </div>
          <div class="metric">
            <div class="metric-value">${weeklyActivity.issuesResolved}</div>
            <div class="metric-label">Issues Resolved</div>
          </div>
          <div class="metric">
            <div class="metric-value">${weeklyActivity.newTeamMembers}</div>
            <div class="metric-label">Team Members Added</div>
          </div>
          <div class="metric">
            <div class="metric-value">${weeklyActivity.newAttachments}</div>
            <div class="metric-label">Files Uploaded</div>
          </div>
        </div>

        <!-- Phase Progress -->
        <div class="section">
          <h3>📈 Phase Progress</h3>
          ${Object.entries(phaseProgress).map(([phase, progress]) => `
            <div style="margin: 10px 0;">
              <strong>${phase}</strong>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%">${progress}%</div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- What Happened This Week -->
        <div class="section">
          <h3>✅ What Happened This Week</h3>
      `;

      if (weeklyActivity.tasksCompleted === 0 && weeklyActivity.issuesResolved === 0 &&
          weeklyActivity.newTeamMembers === 0 && weeklyActivity.newAttachments === 0) {
        html += `<p class="no-activity">No significant activity this week</p>`;
      } else {
        if (details.tasksCompleted.length > 0) {
          html += `<h4>Completed Tasks (${details.tasksCompleted.length})</h4>`;
          details.tasksCompleted.slice(0, 5).forEach(task => {
            html += `<div class="item">✓ ${task.task_name}</div>`;
          });
          if (details.tasksCompleted.length > 5) {
            html += `<p><em>... and ${details.tasksCompleted.length - 5} more</em></p>`;
          }
        }

        if (details.issuesResolved.length > 0) {
          html += `<h4>Resolved Issues (${details.issuesResolved.length})</h4>`;
          details.issuesResolved.forEach(issue => {
            html += `<div class="item">🔧 ${issue.issue_title}</div>`;
          });
        }

        if (details.newTeamMembers.length > 0) {
          html += `<h4>New Team Members (${details.newTeamMembers.length})</h4>`;
          details.newTeamMembers.forEach(member => {
            html += `<div class="item">👤 ${member.name} - ${member.role} (${member.department})</div>`;
          });
        }

        if (details.newAttachments.length > 0) {
          html += `<h4>New Documents (${details.newAttachments.length})</h4>`;
          details.newAttachments.slice(0, 3).forEach(att => {
            html += `<div class="item">📎 ${att.original_name}</div>`;
          });
          if (details.newAttachments.length > 3) {
            html += `<p><em>... and ${details.newAttachments.length - 3} more</em></p>`;
          }
        }
      }

      html += `</div>`;

      // Upcoming Events
      html += `
        <div class="section">
          <h3>📅 Upcoming Events</h3>
      `;

      if (upcomingEvents.sessions.length === 0) {
        html += `<p class="no-activity">No upcoming sessions scheduled</p>`;
      } else {
        upcomingEvents.sessions.forEach(session => {
          const sessionDate = new Date(session.scheduled_date).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
          html += `
            <div class="item">
              <strong>${session.session_topic}</strong><br>
              📅 ${sessionDate}${session.start_time ? ` at ${session.start_time}` : ''}
              ${session.duration ? ` (${session.duration}h)` : ''}
            </div>
          `;
        });
      }

      html += `</div></div>`;
    });

    html += `
      <div class="footer">
        <p>This is an automated weekly newsletter from the Handover Management System.</p>
        <p>Generated with ❤️ by HMS</p>
      </div>
    </body>
    </html>
    `;

    return html;
  }

  /**
   * Auto-subscribe team members to project newsletter
   */
  async autoSubscribeTeamMembers(projectId) {
    try {
      const teamMembers = await db.allAsync(
        'SELECT email FROM team_contacts WHERE project_id = ? AND email IS NOT NULL AND email != ""',
        [projectId]
      );

      for (const member of teamMembers) {
        // Insert if not exists (ignore if already subscribed)
        await db.runAsync(
          `INSERT OR IGNORE INTO newsletter_subscriptions (project_id, email)
           VALUES (?, ?)`,
          [projectId, member.email]
        );
      }

      return { subscribed: teamMembers.length };
    } catch (error) {
      console.error('Error auto-subscribing team members:', error);
      throw error;
    }
  }
}

module.exports = new NewsletterService();
