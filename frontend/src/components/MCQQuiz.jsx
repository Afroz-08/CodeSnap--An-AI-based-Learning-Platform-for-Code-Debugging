import { useState } from 'react';

export default function MCQQuiz({ questions, onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answerIndex
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore();
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    const finalScore = Math.round((correctAnswers / questions.length) * 100);
    setScore(finalScore);
    setShowResults(true);
    onComplete?.(finalScore);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
  };

  if (showResults) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-purple-400 mb-4 text-center">
          🎯 Quiz Complete!
        </h3>

        <div className="text-center mb-6">
          <div className={`text-4xl font-bold mb-2 ${
            score >= 80 ? 'text-green-400' :
            score >= 60 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {score}%
          </div>
          <div className="text-gray-300">
            You got {Object.values(selectedAnswers).filter((answer, index) =>
              answer === questions[index].correctAnswer
            ).length} out of {questions.length} questions correct!
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {questions.map((question, index) => (
            <div key={index} className="bg-gray-900 rounded-lg p-4">
              <div className="text-sm text-gray-300 mb-2">
                Question {index + 1}: {question.question}
              </div>
              <div className="text-sm">
                <span className={selectedAnswers[index] === question.correctAnswer ? 'text-green-400' : 'text-red-400'}>
                  Your answer: {question.options[selectedAnswers[index] || 0]}
                </span>
                {selectedAnswers[index] !== question.correctAnswer && (
                  <div className="text-green-400 mt-1">
                    Correct: {question.options[question.correctAnswer]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={resetQuiz}
          className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg"
        >
          🔄 Try Again
        </button>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-purple-400">
          🧠 Learning Quiz
        </h3>
        <span className="text-sm text-gray-400">
          {currentQuestion + 1} of {questions.length}
        </span>
      </div>

      <div className="mb-6">
        <h4 className="text-lg text-white mb-4">{question.question}</h4>

        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(currentQuestion, index)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedAnswers[currentQuestion] === index
                  ? 'border-purple-500 bg-purple-900/50 text-purple-300'
                  : 'border-gray-600 hover:border-gray-500 text-gray-300'
              }`}
            >
              <span className="font-medium mr-3">
                {String.fromCharCode(65 + index)}.
              </span>
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={handlePrev}
          disabled={currentQuestion === 0}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-gray-300 rounded-lg"
        >
          ← Previous
        </button>

        <button
          onClick={handleNext}
          disabled={selectedAnswers[currentQuestion] === undefined}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg"
        >
          {currentQuestion === questions.length - 1 ? '🎯 Submit' : 'Next →'}
        </button>
      </div>
    </div>
  );
}