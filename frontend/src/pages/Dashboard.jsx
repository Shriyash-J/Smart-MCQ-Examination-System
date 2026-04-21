import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  PlusIcon, AcademicCapIcon, UserGroupIcon, ChartBarIcon, ClockIcon, 
  ArrowRightIcon, SparklesIcon, TrophyIcon, BookOpenIcon, 
  ChevronRightIcon, CalendarIcon, FireIcon, CursorArrowRaysIcon
} from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [stats, setStats] = useState({ totalExams: 0, totalStudents: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [counts, setCounts] = useState({ exams: 0, students: 0, score: 0 });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning ☀️');
    else if (hour < 18) setGreeting('Good afternoon 🌤️');
    else setGreeting('Good evening 🌙');
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const examsRes = await axios.get(`${API_URL}/exams`);
        setExams(examsRes.data);
        
        if (user?.role === 'instructor') {
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
          // Animate counts
          animateValue(0, examsRes.data.length, 'exams');
          animateValue(0, uniqueStudents, 'students');
          animateValue(0, parseFloat(avg), 'score');
        }
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const animateValue = (start, end, type) => {
    if (start === end) return;
    const duration = 1000;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = (end - start) / steps;
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        clearInterval(timer);
        current = end;
      }
      setCounts(prev => ({ ...prev, [type]: type === 'score' ? current.toFixed(1) : Math.floor(current) }));
    }, stepTime);
  };

  const statCards = [
    { icon: AcademicCapIcon, label: 'Total Exams', value: counts.exams, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { icon: UserGroupIcon, label: 'Total Students', value: counts.students, color: 'from-green-500 to-emerald-500', bg: 'bg-green-50', iconColor: 'text-green-600' },
    { icon: ChartBarIcon, label: 'Average Score', value: `${counts.score}%`, color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50', iconColor: 'text-purple-600' }
  ];

  if (loading) {
    return (
      <div className="space-y-8 p-6 md:p-8">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="skeleton h-8 w-64 rounded-lg" />
            <div className="skeleton h-4 w-48 rounded-lg" />
          </div>
          <div className="skeleton h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6 md:p-8 relative overflow-x-hidden">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse animation-delay-1000" />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 relative z-10 animate-fadeInUp">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
            {greeting}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <div className="flex items-center gap-2 mt-2 text-gray-500">
            <CalendarIcon className="w-4 h-4" />
            <span className="text-sm font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <FireIcon className="w-4 h-4 ml-2 text-orange-500" />
            <span className="text-sm">7 day streak</span>
          </div>
        </div>
        {user?.role === 'instructor' && (
          <Link to="/create-exam" className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95">
            <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Create Exam
            <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      {user?.role === 'instructor' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fadeInUp animation-delay-200">
          {statCards.map((stat, idx) => (
            <div key={idx} className="group relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              <div className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`w-7 h-7 ${stat.iconColor}`} />
                  </div>
                </div>
                <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${stat.color} transition-all duration-1000 ease-out`}
                    style={{ width: `${Math.min(100, typeof stat.value === 'number' ? stat.value : 75)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exams Section */}
      <div className="animate-fadeInUp animation-delay-400">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-yellow-500" />
            {user?.role === 'instructor' ? 'Your Exam Collection' : 'Available Challenges'}
          </h2>
          {exams.length > 0 && (
            <button className="text-sm text-primary font-medium flex items-center gap-1 hover:translate-x-1 transition-transform">
              View all <ArrowRightIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {exams.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-gray-50 shadow-xl border border-gray-200 p-12 text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <AcademicCapIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-6">No exams available yet</p>
            {user?.role === 'instructor' && (
              <Link to="/create-exam" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <PlusIcon className="w-5 h-5" />
                Create Your First Exam
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exams.map((exam) => (
              <div 
                key={exam.id}
                className="group relative rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 overflow-hidden border border-gray-100"
                onMouseEnter={() => setHoveredCard(exam.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Animated Border Gradient */}
                <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-r from-primary via-secondary to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative bg-white rounded-2xl p-5 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-xl text-gray-800 group-hover:text-primary transition-colors line-clamp-1">
                      {exam.title}
                    </h3>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium transition-transform duration-300 ${hoveredCard === exam.id ? 'scale-105' : ''} ${
                      exam.isPublished 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {exam.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
                    {exam.description || 'No description provided'}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-5">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      <span>{exam.duration} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpenIcon className="w-4 h-4" />
                      <span>{exam.questions?.length || 0} questions</span>
                    </div>
                    {exam.isPublished && (
                      <div className="flex items-center gap-1 text-green-600">
                        <TrophyIcon className="w-4 h-4" />
                        <span>Active</span>
                      </div>
                    )}
                  </div>

                  {user?.role === 'student' ? (
                    <Link
                      to={`/exam/${exam.id}`}
                      className="group/btn relative flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-primary to-primary-dark rounded-xl text-white font-semibold overflow-hidden shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <span className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-20 transition-opacity" />
                      <CursorArrowRaysIcon className="w-5 h-5" />
                      Take Exam
                      <ArrowRightIcon className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  ) : (
                    <div className="flex gap-3">
                      <Link
                        to={`/results/exam/${exam.id}`}
                        className="flex-1 text-center py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-all hover:scale-105"
                      >
                        Results
                      </Link>
                      <Link
                        to={`/edit-exam/${exam.id}`}
                        className="flex-1 text-center py-2.5 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-all border border-primary/20 hover:scale-105"
                      >
                        Edit
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button for mobile */}
      {user?.role === 'instructor' && (
        <Link to="/create-exam" className="fixed bottom-6 right-6 md:hidden flex items-center justify-center w-14 h-14 bg-gradient-to-r from-primary to-primary-dark rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95">
          <PlusIcon className="w-6 h-6 text-white" />
        </Link>
      )}

      {/* Custom CSS Animations (add to your global CSS or inside <style> tag) */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;