import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await axios.get(`${API_URL}/exams`);
        setExams(res.data);
      } catch (error) {
        console.error('Error fetching exams:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Loading exams...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}!</p>
      </div>

      {user?.role === 'instructor' && (
        <div className="mb-6">
          <Link to="/create-exam" className="btn-primary inline-block">
            + Create New Exam
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.length === 0 ? (
          <p className="text-gray-500 col-span-full text-center py-8">No exams available.</p>
        ) : (
          exams.map((exam) => (
            <div key={exam.id} className="card hover:shadow-lg transition">
              <h3 className="text-lg font-semibold mb-2">{exam.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{exam.description || 'No description'}</p>
              <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                <span>Duration: {exam.duration} mins</span>
                <span>Questions: {exam.questions?.length || 0}</span>
              </div>
              {user?.role === 'student' && (
                <Link
                  to={`/exam/${exam.id}`}
                  className="block w-full text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Take Exam
                </Link>
              )}

              
                {user?.role === 'instructor' && (
                <div className="flex space-x-2">
                    <Link
                    to={`/results/exam/${exam.id}`}
                    className="flex-1 text-center bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
                    >
                    View Results
                    </Link>
                    <Link
                    to={`/edit-exam/${exam.id}`}
                    className="flex-1 text-center bg-blue-100 text-blue-800 py-2 rounded hover:bg-blue-200"
                    >
                    Edit
                    </Link>
                </div>
                )}

              
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;