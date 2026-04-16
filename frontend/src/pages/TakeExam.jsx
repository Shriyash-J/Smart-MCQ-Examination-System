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

  // Use refs to always have latest values for submit function
  const examRef = useRef(exam);
  const answersRef = useRef(answers);
  const submittingRef = useRef(submitting);

  useEffect(() => {
    examRef.current = exam;
  }, [exam]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  // Fetch exam data
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
      } catch (err) {
        alert(err.response?.data?.message || 'Error loading exam. You may have already taken it.');
        navigate('/dashboard');
      }
    };
    fetchExam();

    // Block right-click and copy shortcuts
    const blockContextMenu = (e) => e.preventDefault();
    const blockCopy = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('keydown', blockCopy);

    // Prevent refresh/close
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

  // Submit function wrapped in useCallback with refs for latest state
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
        ? 'Your exam has been submitted. Some questions require manual grading. Check back later for your final score.'
        : 'Exam submitted successfully!';

      alert(message);
      navigate(`/result/${res.data.resultId}`);
    } catch (err) {
      alert('Submission failed: ' + (err.response?.data?.message || 'Server error'));
      setSubmitting(false);
      submittingRef.current = false;
    }
  }, [id, navigate]);

// Inside TakeExam component:

// Handle proctoring violations
const handleViolation = useCallback((violationData) => {
  console.log('🔔 Parent received violation:', violationData);
  setViolations(prev => {
    const newCount = prev + 1;
    console.log(`📊 Violation count updated: ${newCount}/${MAX_VIOLATIONS}`);
    
    if (newCount >= MAX_VIOLATIONS) {
      alert(`Too many proctoring violations (${newCount}). Exam will be auto-submitted.`);
      setTimeout(() => {
        submitExam();
      }, 100);
    }
    return newCount;
  });
}, [MAX_VIOLATIONS, submitExam]); // Add submitExam to dependencies

  // Answer handlers
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

  // Manual submit button handler
  const handleManualSubmit = () => {
    const unanswered = answers.filter((a, idx) => {
      const qType = exam.questions[idx].questionType;
      if (qType === 'msq') return a.length === 0;
      if (qType === 'manual') return !a || a.trim() === '';
      return a === null;
    }).length;

    if (unanswered > 0) {
      const confirmSubmit = window.confirm(
        `You have ${unanswered} unanswered question(s). Submit anyway?`
      );
      if (!confirmSubmit) return;
    }
    submitExam();
  };

  const handleTimeUp = () => {
    alert('Time is up! Submitting automatically.');
    submitExam();
  };

  if (loading) return <div className="text-center p-8">Loading Exam...</div>;
  if (!exam) return null;

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="sticky top-0 bg-white shadow-md p-4 mb-6 flex justify-between items-center rounded z-20">
        <h1 className="text-xl font-bold">{exam.title}</h1>
        <div className="flex items-center space-x-4">
          <Timer duration={exam.duration} onTimeUp={handleTimeUp} />
          <button
            onClick={handleManualSubmit}
            disabled={submitting}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-grow space-y-6">
          {exam.questions.map((q, qIndex) => (
            <div key={q.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold text-lg">
                  Q{qIndex + 1}: {q.questionText}
                </p>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {q.marks} mark{q.marks > 1 ? 's' : ''}
                </span>
              </div>

              {q.diagramUrl && (
                <img
                  src={q.diagramUrl}
                  alt="Diagram"
                  className="mb-4 max-h-60 rounded border"
                />
              )}

              {q.questionType === 'manual' ? (
                <textarea
                  value={answers[qIndex] || ''}
                  onChange={(e) => handleManualChange(qIndex, e.target.value)}
                  className="w-full p-3 border rounded"
                  rows="4"
                  placeholder="Type your answer here..."
                />
              ) : q.questionType === 'msq' ? (
                <div className="space-y-2 mt-4">
                  <p className="text-sm text-gray-600 mb-2">Select all that apply:</p>
                  {q.options.map((opt, optIndex) => (
                    <label
                      key={optIndex}
                      className={`block p-3 border rounded-lg cursor-pointer transition ${
                        answers[qIndex]?.includes(optIndex)
                          ? 'bg-blue-50 border-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={answers[qIndex]?.includes(optIndex) || false}
                        onChange={() => handleMSQToggle(qIndex, optIndex)}
                        className="mr-3"
                      />
                      <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span> {opt}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 mt-4">
                  {q.options.map((opt, optIndex) => (
                    <label
                      key={optIndex}
                      className={`block p-3 border rounded-lg cursor-pointer transition ${
                        answers[qIndex] === optIndex
                          ? 'bg-blue-50 border-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${qIndex}`}
                        value={optIndex}
                        checked={answers[qIndex] === optIndex}
                        onChange={() => handleAnswerSelect(qIndex, optIndex)}
                        className="mr-3"
                      />
                      <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span> {opt}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Proctoring Sidebar */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="sticky top-24">
            <Proctor examId={id} onViolation={handleViolation} />
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="font-semibold text-sm text-yellow-800">⚠️ Proctoring Active</h4>
              <p className="text-xs text-yellow-700 mt-1">
                Violations: {violations}/{MAX_VIOLATIONS}
              </p>
              {violations >= MAX_VIOLATIONS && (
                <p className="text-xs text-red-600 mt-1 font-bold">
                  Max violations reached. Submitting...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeExam;