# Newsletter Feature Setup Guide

## Overview

The Handover Management System now includes an automated weekly newsletter feature that sends project updates to team members every Friday at 6 PM CET/CEST.

## Features

✅ **Weekly Digest** - One email per user containing updates from all their subscribed projects
✅ **Automated Scheduling** - Runs every Friday at 18:00 (6 PM) Europe/Rome timezone
✅ **Auto-Subscribe** - Team members are automatically subscribed when added to a project
✅ **Rich Metrics** - Includes tasks completed, issues resolved, team changes, and more
✅ **Upcoming Events** - Shows scheduled sessions and approaching deadlines
✅ **Phase Progress** - Visual progress indicators for all 3 project phases
✅ **Free Email Service** - Uses Brevo (300 emails/day free tier)

## Setup Instructions

### Step 1: Create Brevo Account

1. Go to [https://www.brevo.com](https://www.brevo.com)
2. Click "Sign up free"
3. Complete registration
4. Verify your email address

### Step 2: Get API Key

1. Log in to Brevo
2. Go to **Account** > **SMTP & API** > **API Keys**
3. Click **Generate a new API key**
4. Give it a name (e.g., "HMS Newsletter")
5. Copy the API key (you'll only see it once!)

### Step 3: Configure Sender Email

1. In Brevo, go to **Senders, Domains & Dedicated IPs** > **Senders**
2. Add a sender email (e.g., `noreply@yourcompany.com`)
3. Verify the email address (check your inbox for verification link)

### Step 4: Add Environment Variables

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a `.env` file (or edit existing one):
   ```bash
   nano .env
   ```

3. Add the following variables:
   ```env
   # Brevo Email Service
   BREVO_API_KEY=your_actual_api_key_here
   BREVO_SENDER_EMAIL=noreply@yourcompany.com

   # Optional: Set environment
   NODE_ENV=development
   ```

4. Save and close the file

### Step 5: Restart Backend Server

```bash
# Stop the server if running (Ctrl+C)

# Start the server
npm start
```

You should see:
```
✅ Newsletter scheduler started - Will run every Friday at 18:00 CET/CEST
```

If you see a warning instead, check that your `.env` file is correctly configured.

## Usage

### Auto-Subscribe Team Members

When you add a team member with an email address to a project, they are **automatically subscribed** to that project's newsletter.

### Manual Subscription Management

You can manually add/remove newsletter subscriptions via the API:

**Add a subscription:**
```bash
curl -X POST http://localhost:5000/api/newsletter/subscriptions/1 \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**Remove a subscription:**
```bash
curl -X DELETE http://localhost:5000/api/newsletter/subscriptions/1/SUBSCRIPTION_ID
```

### Newsletter Settings

Each project has individual newsletter settings (enabled by default):

- **Enabled** - Turn newsletter on/off for this project
- **Include Metrics** - Show weekly statistics
- **Include Tasks** - Show completed tasks
- **Include Issues** - Show created/resolved issues
- **Include Team Changes** - Show new team members
- **Include Attachments** - Show uploaded files
- **Include Upcoming Events** - Show scheduled sessions

### Testing the Newsletter

To manually trigger a newsletter (for testing purposes):

```bash
curl -X POST http://localhost:5000/api/newsletter/trigger
```

**Note:** This only works in development mode (`NODE_ENV=development`). It's disabled in production for safety.

## Newsletter Schedule

- **Day:** Every Friday
- **Time:** 18:00 (6 PM)
- **Timezone:** Europe/Rome (CET/CEST - automatic DST handling)
- **Week Coverage:** Monday 00:00 to Friday 23:59

## Newsletter Content

Each newsletter includes:

### 📊 Weekly Metrics
- Tasks completed
- Issues created
- Issues resolved
- Team members added
- Files uploaded

### 📈 Phase Progress
- Progress percentage for each of the 3 phases
- Visual progress bars

### ✅ What Happened This Week
- List of completed tasks (up to 5, with "...and X more")
- Resolved issues
- New team members with roles
- Uploaded documents (up to 3, with "...and X more")

### 📅 Upcoming Events
- Scheduled sessions with date, time, and duration
- Phase deadlines (if phase dates are configured)

## Troubleshooting

### Newsletter not sending

**Check 1: API Key**
```bash
# Verify BREVO_API_KEY is set
echo $BREVO_API_KEY
```

**Check 2: Server logs**
```bash
# Look for scheduler messages
tail -f backend/logs/server.log
```

**Check 3: Brevo dashboard**
- Log in to Brevo
- Go to **Transactional** > **Logs**
- Check for sent/failed emails

### No subscribers

**Check database:**
```bash
cd backend
sqlite3 database/handover.db
SELECT * FROM newsletter_subscriptions;
```

**Auto-subscribe team members:**
```bash
curl -X POST http://localhost:5000/api/newsletter/auto-subscribe/PROJECT_ID
```

### Emails going to spam

1. In Brevo, verify your sender domain
2. Add SPF and DKIM records to your DNS
3. Use a professional domain (not Gmail/Yahoo)

## Database Schema

### newsletter_subscriptions
```sql
CREATE TABLE newsletter_subscriptions (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  subscribed BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, email)
);
```

### newsletter_settings
```sql
CREATE TABLE newsletter_settings (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL,
  enabled BOOLEAN DEFAULT 1,
  include_metrics BOOLEAN DEFAULT 1,
  include_tasks BOOLEAN DEFAULT 1,
  include_issues BOOLEAN DEFAULT 1,
  include_team_changes BOOLEAN DEFAULT 1,
  include_attachments BOOLEAN DEFAULT 1,
  include_upcoming_events BOOLEAN DEFAULT 1,
  UNIQUE(project_id)
);
```

### newsletter_history
```sql
CREATE TABLE newsletter_history (
  id INTEGER PRIMARY KEY,
  project_id INTEGER,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  content_json TEXT
);
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/newsletter/subscriptions/:projectId` | Get all subscriptions |
| POST | `/api/newsletter/subscriptions/:projectId` | Add subscription |
| PUT | `/api/newsletter/subscriptions/:projectId/:id` | Update subscription |
| DELETE | `/api/newsletter/subscriptions/:projectId/:id` | Delete subscription |
| POST | `/api/newsletter/auto-subscribe/:projectId` | Auto-subscribe team |
| GET | `/api/newsletter/settings/:projectId` | Get settings |
| PUT | `/api/newsletter/settings/:projectId` | Update settings |
| GET | `/api/newsletter/history/:projectId` | Get history |
| POST | `/api/newsletter/trigger` | Manual trigger (dev only) |

## Costs

**Brevo Free Tier:**
- 300 emails/day
- Unlimited contacts
- Includes "Sent with Brevo" branding
- Perfect for small to medium teams

**Example:** If you have:
- 5 projects
- 10 team members per project
- Some members subscribed to multiple projects
- ~30-40 unique recipients total

You'll send **30-40 emails per week** = well within the 300/day limit!

## Future Enhancements

Potential features for future versions:

- [ ] PDF attachment with full report
- [ ] Configurable send time per project
- [ ] Unsubscribe link in emails
- [ ] Email templates customization
- [ ] Weekly summary dashboard in UI
- [ ] Export newsletter history to CSV

## Support

For issues or questions:
1. Check server logs
2. Verify Brevo API key is valid
3. Test with manual trigger endpoint
4. Check newsletter_history table for sent emails

## Security Notes

- ✅ API keys stored in `.env` (never commit to git)
- ✅ `.env` is in `.gitignore`
- ✅ Manual trigger disabled in production
- ✅ Email validation on subscription
- ✅ No-reply sender (users can't respond)
