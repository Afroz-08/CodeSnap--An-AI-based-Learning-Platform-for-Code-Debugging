/**
 * ActivityTracker - Tracks daily learning activities for CodeSnap
 * Stores data in localStorage with date-based keys
 */

class ActivityTracker {
  constructor() {
    this.currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  // Get activity data for a specific date
  getActivities(date = this.currentDate) {
    try {
      const data = localStorage.getItem(`codesnap_activities_${date}`);
      return data ? JSON.parse(data) : this.getDefaultActivityData();
    } catch (error) {
      console.error('Error loading activities:', error);
      return this.getDefaultActivityData();
    }
  }

  // Save activity data for a specific date
  saveActivities(activities, date = this.currentDate) {
    try {
      localStorage.setItem(`codesnap_activities_${date}`, JSON.stringify(activities));
    } catch (error) {
      console.error('Error saving activities:', error);
    }
  }

  // Get default activity structure
  getDefaultActivityData() {
    return {
      date: this.currentDate,
      codeRuns: 0,
      errorsExplained: 0,
      fixesApplied: 0,
      aiTutorInteractions: 0,
      quizQuestionsAnswered: 0,
      reportsDownloaded: 0,
      filesCreated: 0,
      filesImported: 0,
      timeSpentMinutes: 0,
      lastActivity: new Date().toISOString()
    };
  }

  // Track a code run
  trackCodeRun() {
    const activities = this.getActivities();
    activities.codeRuns += 1;
    activities.lastActivity = new Date().toISOString();
    this.saveActivities(activities);
  }

  // Track an error explanation
  trackErrorExplained() {
    const activities = this.getActivities();
    activities.errorsExplained += 1;
    activities.lastActivity = new Date().toISOString();
    this.saveActivities(activities);
  }

  // Track a fix application
  trackFixApplied() {
    const activities = this.getActivities();
    activities.fixesApplied += 1;
    activities.lastActivity = new Date().toISOString();
    this.saveActivities(activities);
  }

  // Track AI tutor interaction
  trackAITutorInteraction() {
    const activities = this.getActivities();
    activities.aiTutorInteractions += 1;
    activities.lastActivity = new Date().toISOString();
    this.saveActivities(activities);
  }

  // Track quiz question answered
  trackQuizAnswered() {
    const activities = this.getActivities();
    activities.quizQuestionsAnswered += 1;
    activities.lastActivity = new Date().toISOString();
    this.saveActivities(activities);
  }

  // Track report download
  trackReportDownloaded() {
    const activities = this.getActivities();
    activities.reportsDownloaded += 1;
    activities.lastActivity = new Date().toISOString();
    this.saveActivities(activities);
  }

  // Track file creation
  trackFileCreated() {
    const activities = this.getActivities();
    activities.filesCreated += 1;
    activities.lastActivity = new Date().toISOString();
    this.saveActivities(activities);
  }

  // Track file import
  trackFileImported() {
    const activities = this.getActivities();
    activities.filesImported += 1;
    activities.lastActivity = new Date().toISOString();
    this.saveActivities(activities);
  }

  // Update time spent (in minutes)
  updateTimeSpent(minutes) {
    const activities = this.getActivities();
    activities.timeSpentMinutes += minutes;
    this.saveActivities(activities);
  }

  // Get activity summary for a date range
  getActivitySummary(days = 7) {
    const summary = {
      totalCodeRuns: 0,
      totalErrorsExplained: 0,
      totalFixesApplied: 0,
      totalAITutorInteractions: 0,
      totalQuizQuestions: 0,
      totalReportsDownloaded: 0,
      totalFilesCreated: 0,
      totalTimeSpent: 0,
      dailyActivities: []
    };

    const endDate = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const activities = this.getActivities(dateStr);
      summary.dailyActivities.unshift({
        date: dateStr,
        ...activities
      });

      summary.totalCodeRuns += activities.codeRuns;
      summary.totalErrorsExplained += activities.errorsExplained;
      summary.totalFixesApplied += activities.fixesApplied;
      summary.totalAITutorInteractions += activities.aiTutorInteractions;
      summary.totalQuizQuestions += activities.quizQuestionsAnswered;
      summary.totalReportsDownloaded += activities.reportsDownloaded;
      summary.totalFilesCreated += activities.filesCreated;
      summary.totalTimeSpent += activities.timeSpentMinutes;
    }

    return summary;
  }

  // Get learning streak (consecutive days with activity)
  getLearningStreak() {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) { // Check up to a year back
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const activities = this.getActivities(dateStr);
      const hasActivity = activities.codeRuns > 0 ||
                         activities.errorsExplained > 0 ||
                         activities.fixesApplied > 0 ||
                         activities.aiTutorInteractions > 0;

      if (hasActivity) {
        streak++;
      } else if (i > 0) { // Don't break streak for today if no activity yet
        break;
      }
    }

    return streak;
  }

  // Export all activity data
  exportAllActivities() {
    const data = {};
    // Get all keys that match our activity pattern
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('codesnap_activities_')) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key));
        } catch (error) {
          console.error('Error parsing activity data:', error);
        }
      }
    }
    return data;
  }
}

// Create singleton instance
const activityTracker = new ActivityTracker();

export default activityTracker;