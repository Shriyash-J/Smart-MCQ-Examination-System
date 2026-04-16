import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { PlusIcon, AcademicCapIcon, UserGroupIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [stats, setStats] = useState({ totalExams: 0, totalStudents: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const examsRes = await axios.get(`${API_URL}/exams`);
        setExams(examsRes.data);
        
        if (user?.role === 'instructor') {
          // Fetch additional stats for instructor
          const resultsRes = await axios.get(`${API_URL}/results`);
          const results = resultsRes.data;
          const uniqueStudents = new Set(results.map(r => r.studentId)).size;
          const avg = results.length > 0 
            ? (results.reduce((sum, r) => sum + (r.score / r.totalMarks) * 100, 0) / results.length).toFixed(1)
            : 0;
          setStats({
            totalExams: examsRes.data.length,
            totalStudents: uniqueStudents,
            avgScore: avg
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-12 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {user?.role === 'instructor' && (
          <Link to="/create-exam" className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Create Exam
          </Link>
        )}
      </div>

      {/* Stats Cards (Instructor Only) */}
      {user?.role === 'instructor' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Exams</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalExams}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <AcademicCapIcon className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Students</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Average Score</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.avgScore}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exams Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {user?.role === 'instructor' ? 'Your Exams' : 'Available Exams'}
        </h2>
        {exams.length === 0 ? (
          <div className="card text-center py-12">
            <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No exams available</p>
            {user?.role === 'instructor' && (
              <Link to="/create-exam" className="btn-primary inline-flex items-center gap-2">
                <PlusIcon className="w-4 h-4" />
                Create Your First Exam
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <div key={exam.id} className="card group hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary transition">
                    {exam.title}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${exam.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {exam.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {exam.description || 'No description'}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    {exam.duration} mins
                  </span>
                  <span>{exam.questions?.length || 0} questions</span>
                </div>
                {user?.role === 'student' ? (
                  <Link
                    to={`/exam/${exam.id}`}
                    className="block w-full text-center bg-primary text-white py-2 rounded-xl hover:bg-primary-dark transition"
                  >
                    Take Exam
                  </Link>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      to={`/results/exam/${exam.id}`}
                      className="flex-1 text-center bg-gray-100 text-gray-700 py-2 rounded-xl hover:bg-gray-200 transition"
                    >
                      Results
                    </Link>
                    <Link
                      to={`/edit-exam/${exam.id}`}
                      className="flex-1 text-center bg-primary/10 text-primary py-2 rounded-xl hover:bg-primary/20 transition"
                    >
                      Edit
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;