import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ExamResults = () => {
  const { examId } = useParams();
  const { user } = useAuth();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExamResults = async () => {
      try {
        // Fetch exam details
        const examRes = await axios.get(`${API_URL}/exams/${examId}`);
        setExam(examRes.data);

        // Fetch results for this exam
        const resultsRes = await axios.get(`${API_URL}/results/exam/${examId}`);
        setResults(resultsRes.data.results);
        setAnalytics(resultsRes.data.analytics);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching exam results:', err);
        setError('Failed to load results. You may not have permission.');
        setLoading(false);
      }
    };
    fetchExamResults();
  }, [examId]);

  if (loading) {
    return <div className="text-center py-10">Loading results...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
        <h1 className="text-2xl font-bold mt-2">{exam?.title} - Results</h1>
        <p className="text-gray-600">{exam?.description}</p>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card bg-blue-50">
            <p className="text-sm text-gray-600">Total Students</p>
            <p className="text-3xl font-bold">{analytics.totalStudents}</p>
          </div>
          <div className="card bg-green-50">
            <p className="text-sm text-gray-600">Average Score</p>
            <p className="text-3xl font-bold">{analytics.averageScore}%</p>
          </div>
          <div className="card bg-yellow-50">
            <p className="text-sm text-gray-600">Highest Score</p>
            <p className="text-3xl font-bold">{analytics.highestScore}</p>
          </div>
          <div className="card bg-red-50">
            <p className="text-sm text-gray-600">Lowest Score</p>
            <p className="text-3xl font-bold">{analytics.lowestScore}</p>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Student Submissions</h2>
        {results.length === 0 ? (
          <p className="text-gray-500">No students have taken this exam yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result) => {
                  const percentage = ((result.score / result.totalMarks) * 100).toFixed(1);
                  return (
                    <tr key={result.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{result.student?.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{result.student?.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{result.score} / {result.totalMarks}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-sm ${
                          percentage >= 70 ? 'bg-green-100 text-green-800' :
                          percentage >= 40 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(result.submittedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/result/${result.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamResults;