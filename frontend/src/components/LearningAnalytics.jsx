export default function LearningAnalytics({ errorCount, fixStatus, attempts, sessionProgress }) {
  const getProgressColor = (progress) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getFixStatusColor = (status) => {
    switch (status) {
      case 'fixed': return 'text-green-400 bg-green-900';
      case 'attempted': return 'text-yellow-400 bg-yellow-900';
      default: return 'text-red-400 bg-red-900';
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center">
        <span className="mr-2">📊</span>
        Learning Progress
      </h3>

      <div className="space-y-4">
        {/* Session Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">Session Progress</span>
            <span className="text-sm font-medium text-white">{sessionProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getProgressColor(sessionProgress)} transition-all duration-300`}
              style={{ width: `${sessionProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Error Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Errors Found</div>
            <div className="text-2xl font-bold text-red-400">{errorCount}</div>
          </div>

          <div className="bg-gray-900 rounded-lg p-3">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Attempts</div>
            <div className="text-2xl font-bold text-yellow-400">{attempts}</div>
          </div>
        </div>

        {/* Fix Status */}
        <div className="bg-gray-900 rounded-lg p-3">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Fix Status</div>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getFixStatusColor(fixStatus)}`}>
            {fixStatus === 'fixed' && '✅ Fixed'}
            {fixStatus === 'attempted' && '⚠️ In Progress'}
            {fixStatus === 'not_started' && '❌ Not Started'}
          </span>
        </div>

        {/* Encouraging Message */}
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
          <div className="text-sm text-purple-300">
            {sessionProgress < 30 && "Keep going! Every error is a learning opportunity! 💪"}
            {sessionProgress >= 30 && sessionProgress < 70 && "You're making great progress! Keep up the good work! 🚀"}
            {sessionProgress >= 70 && "Excellent work! You're becoming a coding expert! 🎉"}
          </div>
        </div>
      </div>
    </div>
  );
}