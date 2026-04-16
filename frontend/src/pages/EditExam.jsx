import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import QuestionForm from '../components/QuestionForm';
import { PlusIcon, DocumentTextIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EditExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    duration: 30,
    isPublished: true,
  });
  const [questions, setQuestions] = useState([]);

  // Fetch exam data
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await axios.get(`${API_URL}/exams/${id}/full`);
        const exam = res.data;
        
        setExamData({
          title: exam.title,
          description: exam.description || '',
          duration: exam.duration,
          isPublished: exam.isPublished,
        });
        
        const loadedQuestions = (exam.questions || []).map((q) => ({
          ...q,
          questionType: q.questionType || 'mcq',
          options: q.options || ['', '', '', ''],
          correctAnswers: q.correctAnswers || (q.correctAnswer !== undefined ? [q.correctAnswer] : []),
          diagramUrl: q.diagramUrl || null,
          expectedAnswer: q.expectedAnswer || '',
          partialMarking: q.partialMarking !== undefined ? q.partialMarking : true,
        }));
        
        setQuestions(loadedQuestions.length > 0 ? loadedQuestions : [
          { questionType: 'mcq', questionText: '', options: ['', '', '', ''], correctAnswers: [0], marks: 1 }
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching exam:', error);
        toast.error('Failed to load exam data');
        navigate('/dashboard');
      }
    };
    fetchExam();
  }, [id, navigate]);

  const handleExamChange = (e) => {
    const { name, value, type, checked } = e.target;
    setExamData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleQuestionChange = (index, updates) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], ...updates };
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { questionType: 'mcq', questionText: '', options: ['', '', '', ''], correctAnswers: [0], marks: 1 }
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!examData.title.trim()) {
      toast.error('Please enter an exam title');
      return;
    }
    if (questions.some(q => !q.questionText.trim())) {
      toast.error('All questions must have text');
      return;
    }
    if (questions.some(q => q.questionType !== 'manual' && q.options?.some(opt => !opt.trim()))) {
      toast.error('All options must be filled');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...examData,
        questions: questions.map((q) => ({
          ...q,
          correctAnswers: q.correctAnswers || [],
          options: q.options || null,
        })),
      };
      await axios.put(`${API_URL}/exams/${id}`, payload);
      toast.success('Exam updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating exam:', error);
      toast.error(error.response?.data?.message || 'Failed to update exam');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this exam? This will also delete all associated questions and student submissions. This action cannot be undone.')) {
      return;
    }
    
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/exams/${id}`);
      toast.success('Exam deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error(error.response?.data?.message || 'Failed to delete exam');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="skeleton h-10 w-48 mb-6" />
        <div className="card mb-8">
          <div className="skeleton h-8 w-32 mb-4" />
          <div className="space-y-4">
            <div className="skeleton h-12 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <div className="skeleton h-12 w-full" />
              <div className="skeleton h-12 w-full" />
            </div>
          </div>
        </div>
        <div className="skeleton h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Exam</h1>
          <p className="text-gray-600 mt-2">Modify exam details and questions</p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition disabled:opacity-50"
        >
          <TrashIcon className="w-5 h-5" />
          {deleting ? 'Deleting...' : 'Delete Exam'}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Exam Details Card */}
        <div className="card mb-8">
          <div className="flex items-center gap-2 mb-4">
            <DocumentTextIcon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Exam Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={examData.title}
                onChange={handleExamChange}
                placeholder="e.g., Midterm Examination"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <ClockIcon className="w-4 h-4 inline mr-1" />
                Duration (minutes)
              </label>
              <input
                type="number"
                name="duration"
                value={examData.duration}
                onChange={handleExamChange}
                min="1"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                required
              />
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={examData.isPublished}
                  onChange={handleExamChange}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">Published (visible to students)</span>
              </label>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea
                name="description"
                value={examData.description}
                onChange={handleExamChange}
                placeholder="Brief description of the exam..."
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                rows="2"
              />
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Questions</h2>
          {questions.map((q, qIndex) => (
            <QuestionForm
              key={q.id || qIndex}
              question={q}
              index={qIndex}
              onChange={handleQuestionChange}
              onRemove={removeQuestion}
              showRemove={questions.length > 1}
            />
          ))}
        </div>

        {/* Add Question Button */}
        <button
          type="button"
          onClick={addQuestion}
          className="mb-8 flex items-center gap-2 text-primary font-medium hover:text-primary-dark transition"
        >
          <PlusIcon className="w-5 h-5" />
          Add Another Question
        </button>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-8 py-3 text-base disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              'Update Exam'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn-secondary px-8 py-3 text-base"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditExam;