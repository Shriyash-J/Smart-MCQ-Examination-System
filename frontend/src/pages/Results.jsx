import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Results = () => {
  const { resultId } = useParams();
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [resultsList, setResultsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (resultId) {
      const fetchSingleResult = async () => {
        try {
          const res = await axios.get(`${API_URL}/results/${resultId}`);
          setResult(res.data);
        } catch (err) {
          setError('Failed to load result: ' + (err.response?.data?.message || 'Server error'));
        } finally {
          setLoading(false);
        }
      };
      fetchSingleResult();
    } else {
      const fetchAllResults = async () => {
        try {
          const res = await axios.get(`${API_URL}/results`);
          setResultsList(res.data);
        } catch (err) {
          setError('Failed to load results: ' + (err.response?.data?.message || 'Server error'));
        } finally {
          setLoading(false);
        }
      };
      fetchAllResults();
    }
  }, [resultId]);

  const renderAnswer = (question, studentAnswer) => {
    if (question.questionType === 'manual') {
      return (
        <div className="mt-2 p-3 bg-gray-50 rounded">
          <p className="font-medium text-sm text-gray-700">Student's Answer:</p>
          <p className="whitespace-pre-wrap">{studentAnswer || 'No answer provided'}</p>
          {question.expectedAnswer && (
            <div className="mt-2 pt-2 border-t">
              <p className="font-medium text-sm text-gray-700">Expected Answer / Rubric:</p>
              <p className="whitespace-pre-wrap text-green-800">{question.expectedAnswer}</p>
            </div>
          )}
        </div>
      );
    }

    if (question.questionType === 'msq') {
      return (
        <div className="mt-2 space-y-1">
          {question.options.map((opt, idx) => {
            const isSelected = studentAnswer?.includes(idx);
            const isCorrectOption = question.correctAnswer?.includes(idx);
            let className = 'p-2 border rounded ';
            if (isSelected && isCorrectOption) className += 'bg-green-50 border-green-300';
            else if (isSelected && !isCorrectOption) className += 'bg-red-50 border-red-300';
            else if (!isSelected && isCorrectOption) className += 'bg-yellow-50 border-yellow-300';
            else className += 'bg-gray-50';

            return (
              <div key={idx} className={className}>
                <span className="font-medium">{String.fromCharCode(65 + idx)}.</span> {opt}
                {isSelected && <span className="ml-2 text-sm text-blue-600">(Your answer)</span>}
                {isCorrectOption && !isSelected && (
                  <span className="ml-2 text-sm text-green-600">(Correct)</span>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // MCQ, True/False, Diagram
    return (
      <div className="mt-2 space-y-1">
        {question.options.map((opt, idx) => {
          const isSelected = studentAnswer === idx;
          const isCorrect = question.correctAnswer?.[0] === idx;
          let className = 'p-2 border rounded ';
          if (isSelected && isCorrect) className += 'bg-green-50 border-green-300';
          else if (isSelected && !isCorrect) className += 'bg-red-50 border-red-300';
          else if (isCorrect) className += 'bg-yellow-50 border-yellow-300';
          else className += 'bg-gray-50';

          return (
            <div key={idx} className={className}>
              <span className="font-medium">{String.fromCharCode(65 + idx)}.</span> {opt}
              {isSelected && <span className="ml-2 text-sm text-blue-600">(Your answer)</span>}
              {isCorrect && !isSelected && (
                <span className="ml-2 text-sm text-green-600">(Correct answer)</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <div className="text-center py-10">Loading results...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;

  if (result) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">{result.examTitle}</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Student</p>
              <p className="font-medium">{result.studentName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Submitted</p>
              <p className="font-medium">{new Date(result.submittedAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Score</p>
              <p className="font-medium text-xl">{result.score} / {result.totalMarks}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Percentage</p>
              <p className={`font-medium text-xl ${result.percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                {result.percentage}%
              </p>
            </div>
          </div>
          {result.gradingStatus === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
              <p className="text-yellow-800">⚠️ This exam contains manually graded questions. Score may be updated after instructor review.</p>
            </div>
          )}
          {result.feedback && (
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <p className="font-medium text-blue-800">Instructor Feedback:</p>
              <p className="text-blue-700">{result.feedback}</p>
            </div>
          )}
        </div>

        <h2 className="text-xl font-semibold mb-4">Question Breakdown</h2>
        <div className="space-y-4">
          {result.questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold">Q{idx + 1}: {q.questionText}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {q.marksObtained.toFixed(1)} / {q.marks} marks
                  </span>
                  {q.isCorrect === true && <span className="text-green-600">✓ Correct</span>}
                  {q.isCorrect === false && <span className="text-red-600">✗ Incorrect</span>}
                </div>
              </div>

              {q.diagramUrl && (
                <img src={q.diagramUrl} alt="Diagram" className="mb-3 max-h-48 rounded" />
              )}

              {renderAnswer(q, q.studentAnswer)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {user?.role === 'instructor' ? 'All Student Results' : 'My Exam Results'}
      </h1>
      {resultsList.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No results found.</p>
          <Link to="/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">Browse Exams</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {resultsList.map((res) => {
            const percentage = ((res.score / res.totalMarks) * 100).toFixed(1);
            return (
              <div key={res.id} className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h3 className="font-semibold text-lg">{res.Exam?.title}</h3>
                  <p className="text-sm text-gray-600">
                    {user?.role === 'instructor' && <span>Student: {res.student?.name} • </span>}
                    Submitted: {new Date(res.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4 mt-2 md:mt-0">
                  <div className="text-right">
                    <div className="font-bold text-xl">{percentage}%</div>
                    <div className="text-sm text-gray-600">{res.score}/{res.totalMarks}</div>
                  </div>
                  <Link
                    to={`/result/${res.id}`}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Results;