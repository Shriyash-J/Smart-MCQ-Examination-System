import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Timer from '../components/Timer';
import Proctor from '../components/Proctor';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TakeExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [violations, setViolations] = useState(0);
  const MAX_VIOLATIONS = 3;

  // New states for question navigation and review
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState(new Set());

  const examRef = useRef(exam);
  const answersRef = useRef(answers);
  const submittingRef = useRef(submitting);
  const markedRef = useRef(markedForReview);

  useEffect(() => { examRef.current = exam; }, [exam]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { submittingRef.current = submitting; }, [submitting]);
  useEffect(() => { markedRef.current = markedForReview; }, [markedForReview]);

  // Mark current question as visited
  useEffect(() => {
    if (exam) {
      setVisitedQuestions(prev => new Set(prev).add(currentQuestionIndex));
    }
  }, [currentQuestionIndex, exam]);

  // Fetch exam
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await axios.get(`${API_URL}/exams/${id}/take`);
        setExam(res.data);
        const initialAnswers = res.data.questions.map((q) => {
          if (q.questionType === 'msq') return [];
          if (q.questionType === 'manual') return '';
          return null;
        });
        setAnswers(initialAnswers);
        setLoading(false);
        // Mark first question as visited
        setVisitedQuestions(new Set([0]));
      } catch (err) {
        alert(err.response?.data?.message || 'Error loading exam.');
        navigate('/dashboard');
      }
    };
    fetchExam();

    const blockContextMenu = (e) => e.preventDefault();
    const blockCopy = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('keydown', blockCopy);

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('keydown', blockCopy);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [id, navigate]);

  // Submit logic
  const submitExam = useCallback(async () => {
    if (submittingRef.current) return;
    setSubmitting(true);
    submittingRef.current = true;

    const currentExam = examRef.current;
    const currentAnswers = answersRef.current;

    try {
      const formattedAnswers = currentAnswers.map((ans, idx) => {
        const qType = currentExam.questions[idx].questionType;
        if (qType === 'msq') return ans;
        if (qType === 'manual') return ans;
        return ans;
      });

      const res = await axios.post(`${API_URL}/exams/${id}/submit`, {
        answers: formattedAnswers,
      });

      const message = res.data.needsGrading
        ? 'Your exam has been submitted. Some questions require manual grading.'
        : 'Exam submitted successfully!';

      alert(message);
      navigate(`/result/${res.data.resultId}`);
    } catch (err) {
      alert('Submission failed: ' + (err.response?.data?.message || 'Server error'));
      setSubmitting(false);
      submittingRef.current = false;
    }
  }, [id, navigate]);

  const handleViolation = useCallback((violationData) => {
    setViolations(prev => {
      const newCount = prev + 1;
      if (newCount >= MAX_VIOLATIONS) {
        alert(`Too many violations (${newCount}). Exam will be auto-submitted.`);
        setTimeout(() => submitExam(), 100);
      }
      return newCount;
    });
  }, [MAX_VIOLATIONS, submitExam]);

  const handleAnswerSelect = (qIndex, value) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[qIndex] = value;
      return newAnswers;
    });
  };

  const handleMSQToggle = (qIndex, optIndex) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      let current = newAnswers[qIndex] || [];
      if (current.includes(optIndex)) {
        newAnswers[qIndex] = current.filter(i => i !== optIndex);
      } else {
        newAnswers[qIndex] = [...current, optIndex];
      }
      return newAnswers;
    });
  };

  const handleManualChange = (qIndex, text) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[qIndex] = text;
      return newAnswers;
    });
  };

  const toggleMarkForReview = (qIndex) => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(qIndex)) {
        newSet.delete(qIndex);
      } else {
        newSet.add(qIndex);
      }
      return newSet;
    });
  };

  const handleManualSubmit = () => {
    const unanswered = answers.filter((a, idx) => {
      const qType = exam.questions[idx].questionType;
      if (qType === 'msq') return a.length === 0;
      if (qType === 'manual') return !a || a.trim() === '';
      return a === null;
    }).length;

    if (unanswered > 0) {
      const confirmSubmit = window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`);
      if (!confirmSubmit) return;
    }
    submitExam();
  };

  const handleTimeUp = () => {
    alert('Time is up! Submitting automatically.');
    submitExam();
  };

  // Question status calculation
  const getQuestionStatus = (idx) => {
    const answer = answers[idx];
    const isAnswered = answer !== null && 
      (Array.isArray(answer) ? answer.length > 0 : (typeof answer === 'string' ? answer.trim() !== '' : true));
    const isMarked = markedForReview.has(idx);
    const isVisited = visitedQuestions.has(idx);
    return { isAnswered, isMarked, isVisited };
  };

  const getStatusColor = (idx) => {
    const { isAnswered, isMarked, isVisited } = getQuestionStatus(idx);
    if (isAnswered && isMarked) return 'bg-purple-500 text-white'; // Answered & Marked
    if (isAnswered) return 'bg-green-500 text-white';
    if (isMarked) return 'bg-yellow-500 text-white';
    if (isVisited) return 'bg-red-100 text-red-800 border border-red-300'; // Not Answered but visited
    return 'bg-gray-100 text-gray-600'; // Not Visited
  };

  // Stats
  const stats = exam ? {
    total: exam.questions.length,
    answered: answers.filter((a, idx) => {
      const qType = exam.questions[idx].questionType;
      if (qType === 'msq') return a.length > 0;
      if (qType === 'manual') return a && a.trim() !== '';
      return a !== null;
    }).length,
    marked: markedForReview.size,
    notVisited: exam.questions.length - visitedQuestions.size,
  } : { total: 0, answered: 0, marked: 0, notVisited: 0 };

  if (loading) return <div className="text-center p-8">Loading Exam...</div>;
  if (!exam) return null;

  const currentQuestion = exam.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Question Palette Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800">Question Palette</h3>
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Answered</span>
              <span className="font-medium">{stats.answered}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Not Answered</span>
              <span className="font-medium">{stats.total - stats.answered}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Marked for Review</span>
              <span className="font-medium">{stats.marked}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Not Visited</span>
              <span className="font-medium">{stats.notVisited}</span>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-5 gap-2">
            {exam.questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`h-10 w-10 rounded-lg flex items-center justify-center font-medium transition ${getStatusColor(idx)} ${currentQuestionIndex === idx ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 border-t">
          <button
            onClick={handleManualSubmit}
            disabled={submitting}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header with Timer and Proctor Status */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">{exam.title}</h1>
          <div className="flex items-center gap-6">
            <Timer duration={exam.duration} onTimeUp={handleTimeUp} />
            <div className="flex items-center gap-2">
              <Proctor examId={id} onViolation={handleViolation} compact />
              <span className="text-sm text-gray-600">
                Violations: {violations}/{MAX_VIOLATIONS}
              </span>
            </div>
          </div>
        </div>

        {/* Question Navigation */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              ← Previous
            </button>
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(exam.questions.length - 1, prev + 1))}
              disabled={currentQuestionIndex === exam.questions.length - 1}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Next →
            </button>
          </div>
          <button
            onClick={() => toggleMarkForReview(currentQuestionIndex)}
            className={`px-4 py-2 rounded-lg border ${markedForReview.has(currentQuestionIndex) ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'bg-white border-gray-300 text-gray-700'}`}
          >
            {markedForReview.has(currentQuestionIndex) ? '✓ Marked for Review' : 'Mark for Review'}
          </button>
        </div>

        {/* Current Question */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold">
              Question {currentQuestionIndex + 1} of {exam.questions.length}
            </h2>
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {currentQuestion.marks} mark{currentQuestion.marks > 1 ? 's' : ''}
            </span>
          </div>

          <p className="text-gray-800 mb-4">{currentQuestion.questionText}</p>

          {currentQuestion.diagramUrl && (
            <img src={currentQuestion.diagramUrl} alt="Diagram" className="mb-4 max-h-60 rounded" />
          )}

          {/* Answer Input */}
          <div className="mt-4">
            {currentQuestion.questionType === 'manual' ? (
              <textarea
                value={answers[currentQuestionIndex] || ''}
                onChange={(e) => handleManualChange(currentQuestionIndex, e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="4"
                placeholder="Type your answer here..."
              />
            ) : currentQuestion.questionType === 'msq' ? (
              <div className="space-y-3">
                {currentQuestion.options.map((opt, optIndex) => (
                  <label key={optIndex} className={`flex items-center p-3 border rounded-lg cursor-pointer ${answers[currentQuestionIndex]?.includes(optIndex) ? 'bg-blue-50 border-blue-400' : 'hover:bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      checked={answers[currentQuestionIndex]?.includes(optIndex) || false}
                      onChange={() => handleMSQToggle(currentQuestionIndex, optIndex)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="ml-3">
                      <span className="font-medium mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                      {opt}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {currentQuestion.options.map((opt, optIndex) => (
                  <label key={optIndex} className={`flex items-center p-3 border rounded-lg cursor-pointer ${answers[currentQuestionIndex] === optIndex ? 'bg-blue-50 border-blue-400' : 'hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name={`question-${currentQuestionIndex}`}
                      checked={answers[currentQuestionIndex] === optIndex}
                      onChange={() => handleAnswerSelect(currentQuestionIndex, optIndex)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-3">
                      <span className="font-medium mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                      {opt}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeExam;