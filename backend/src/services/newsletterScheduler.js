// Newsletter Scheduler - Runs every Friday at 6 PM UTC+1
const cron = require('node-cron');
const newsletterService = require('./newsletterService');
const db = require('../config/database');

class NewsletterScheduler {
  constructor() {
    this.job = null;
  }

  /**
   * Start the scheduler
   * Runs every Friday at 18:00 (6 PM) in Europe/Rome timezone (UTC+1/UTC+2 with DST)
   */
  start() {
    // Cron expression: minute hour day-of-month month day-of-week
    // '0 18 * * 5' = At 18:00 on Friday
    this.job = cron.schedule(
      '0 18 * * 5',
      async () => {
        console.log('📧 Starting weekly newsletter generation and sending...');
        await this.sendWeeklyNewsletters();
      },
      {
        scheduled: true,
        timezone: 'Europe/Rome' // UTC+1 (CET) / UTC+2 (CEST with DST)
      }
    );

    console.log('✅ Newsletter scheduler started - Will run every Friday at 18:00 CET/CEST');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.job) {
      this.job.stop();
      console.log('⏹️  Newsletter scheduler stopped');
    }
  }

  /**
   * Get week start and end dates (Monday to Friday)
   */
  getWeekDates() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 5 = Friday

    // Calculate last Monday (start of week)
    const weekStart = new Date(today);
    const daysToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1); // Days since Monday
    weekStart.setDate(today.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    // Calculate today (Friday end)
    const weekEnd = new Date(today);
    weekEnd.setHours(23, 59, 59, 999);

    return { weekStart, weekEnd };
  }

  /**
   * Send newsletters to all subscribed users
   */
  async sendWeeklyNewsletters() {
    try {
      const { weekStart, weekEnd } = this.getWeekDates();

      console.log(`📅 Generating newsletters for week: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);

      // Get all unique subscribers
      const subscribers = await db.allAsync(
        `SELECT DISTINCT email FROM newsletter_subscriptions
         WHERE subscribed = 1`
      );

      console.log(`👥 Found ${subscribers.length} subscribers`);

      let successCount = 0;
      let errorCount = 0;

      // Send digest newsletter to each subscriber
      for (const subscriber of subscribers) {
        try {
          console.log(`📤 Generating newsletter for ${subscriber.email}...`);

          const newsletterData = await newsletterService.generateDigestNewsletter(
            subscriber.email,
            weekStart,
            weekEnd
          );

          if (!newsletterData || newsletterData.projects.length === 0) {
            console.log(`⏭️  Skipping ${subscriber.email} - No active projects`);
            continue;
          }

          await newsletterService.sendNewsletter(newsletterData);
          successCount++;
          console.log(`✅ Newsletter sent to ${subscriber.email}`);

        } catch (error) {
          errorCount++;
          console.error(`❌ Error sending newsletter to ${subscriber.email}:`, error);
        }
      }

      console.log(`\n📊 Newsletter sending completed:`);
      console.log(`   ✅ Success: ${successCount}`);
      console.log(`   ❌ Errors: ${errorCount}`);
      console.log(`   📧 Total: ${subscribers.length}\n`);

    } catch (error) {
      console.error('❌ Error in newsletter scheduler:', error);
    }
  }

  /**
   * Manual trigger for testing (sends immediately)
   */
  async triggerNow() {
    console.log('🔧 Manual newsletter trigger');
    await this.sendWeeklyNewsletters();
  }
}

module.exports = new NewsletterScheduler();
