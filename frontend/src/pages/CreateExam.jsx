import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import QuestionForm from '../components/QuestionForm';
import { PlusIcon, DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CreateExam = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    duration: 30,
    isPublished: true,
  });
  const [questions, setQuestions] = useState([
    {
      questionType: 'mcq',
      questionText: '',
      options: ['', '', '', ''],
      correctAnswers: [0],
      marks: 1,
    },
  ]);

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
      {
        questionType: 'mcq',
        questionText: '',
        options: ['', '', '', ''],
        correctAnswers: [0],
        marks: 1,
      },
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

    setLoading(true);
    try {
      const payload = {
        ...examData,
        questions: questions.map((q) => ({
          ...q,
          correctAnswers: q.correctAnswers || [],
          options: q.options || null,
        })),
      };
      await axios.post(`${API_URL}/exams`, payload);
      toast.success('Exam created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating exam:', error);
      toast.error(error.response?.data?.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Toaster position="top-right" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Exam</h1>
        <p className="text-gray-600 mt-2">Design your assessment with various question types</p>
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
                <span className="text-sm font-medium text-gray-700">Publish immediately</span>
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
              key={qIndex}
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
            disabled={loading}
            className="btn-primary px-8 py-3 text-base disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              'Create Exam'
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

export default CreateExam;