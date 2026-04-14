import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Timer from '../components/Timer';

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

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await axios.get(`${API_URL}/exams/${id}/take`);
        setExam(res.data);
        // Initialize answers array based on question types
        const initialAnswers = res.data.questions.map((q) => {
          if (q.questionType === 'msq') return [];
          if (q.questionType === 'manual') return '';
          return null; // for MCQ/TF/Diagram single selection
        });
        setAnswers(initialAnswers);
        setLoading(false);
      } catch (err) {
        alert(err.response?.data?.message || 'Error loading exam. You may have already taken it.');
        navigate('/dashboard');
      }
    };
    fetchExam();

    // Proctoring: Tab switch detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolations((prev) => {
          const newCount = prev + 1;
          if (newCount >= MAX_VIOLATIONS) {
            alert('Too many tab switches. Exam will be auto-submitted.');
            handleSubmit();
          } else {
            alert(`Warning ${newCount}/${MAX_VIOLATIONS}: Do not switch tabs!`);
          }
          return newCount;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Prevent refresh/close
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [id, navigate]);

  const handleAnswerSelect = (qIndex, value) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = value;
    setAnswers(newAnswers);
  };

  const handleMSQToggle = (qIndex, optIndex) => {
    const newAnswers = [...answers];
    let current = newAnswers[qIndex] || [];
    if (current.includes(optIndex)) {
      newAnswers[qIndex] = current.filter((i) => i !== optIndex);
    } else {
      newAnswers[qIndex] = [...current, optIndex];
    }
    setAnswers(newAnswers);
  };

  const handleManualChange = (qIndex, text) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = text;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    // Check unanswered questions
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
      if (!confirmSubmit) {
        setSubmitting(false);
        return;
      }
    }

    try {
      // Format answers for backend (ensure arrays for MSQ, strings for manual, ints for others)
      const formattedAnswers = answers.map((ans, idx) => {
        const qType = exam.questions[idx].questionType;
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
    }
  };

  const handleTimeUp = () => {
    alert('Time is up! Submitting automatically.');
    handleSubmit();
  };

  if (loading) return <div className="text-center p-8">Loading Exam...</div>;
  if (!exam) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="sticky top-0 bg-white shadow-md p-4 mb-6 flex justify-between items-center rounded z-10">
        <h1 className="text-xl font-bold">{exam.title}</h1>
        <div className="flex items-center space-x-4">
          <Timer duration={exam.duration} onTimeUp={handleTimeUp} />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {exam.questions.map((q, qIndex) => (
          <div key={q.id} className="card">
            <div className="flex justify-between items-start mb-2">
              <p className="font-semibold text-lg">
                Q{qIndex + 1}: {q.questionText}
              </p>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {q.marks} mark{q.marks > 1 ? 's' : ''}
              </span>
            </div>

            {/* Diagram display */}
            {q.diagramUrl && (
              <img src={q.diagramUrl} alt="Diagram" className="mb-4 max-h-60 rounded border" />
            )}

            {/* Question Type Specific Input */}
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
                      answers[qIndex]?.includes(optIndex) ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
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
                      answers[qIndex] === optIndex ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
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
    </div>
  );
};

export default TakeExam;