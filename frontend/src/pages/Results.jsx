import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Results = () => {
  const { resultId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [resultsList, setResultsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // If viewing a specific result (after exam submission)
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
      // View all results for current user
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

  // Single result view
  if (result) {
    const percentage = ((result.score / result.totalMarks) * 100).toFixed(1);
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Exam Completed!</h1>
          <p className="text-gray-600 mb-6">{result.Exam?.title}</p>
          <div className="text-6xl font-bold text-blue-600 mb-4">{percentage}%</div>
          <p className="text-xl">
            Score: <span className="font-bold">{result.score}</span> / {result.totalMarks}
          </p>
          <p className="text-gray-500 mt-2">
            Submitted: {new Date(result.submittedAt).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  // List of all results
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Exam Results</h1>
      {resultsList.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-gray-600 mb-4">You haven't taken any exams yet.</p>
          <Link to="/dashboard" className="btn-primary">Browse Exams</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {resultsList.map((res) => {
            const percentage = ((res.score / res.totalMarks) * 100).toFixed(1);
            return (
              <div key={res.id} className="card flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h3 className="font-semibold text-lg">{res.Exam?.title}</h3>
                  <p className="text-gray-600 text-sm">
                    Taken on {new Date(res.submittedAt).toLocaleDateString()}
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