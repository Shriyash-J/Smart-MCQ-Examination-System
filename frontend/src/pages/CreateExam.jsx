import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import QuestionForm from '../components/QuestionForm';

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
    setLoading(true);
    try {
      // Transform for backend (ensure correctAnswers is array)
      const payload = {
        ...examData,
        questions: questions.map((q) => ({
          ...q,
          correctAnswers: q.correctAnswers || [],
          // For manual type, options can be null
          options: q.options || null,
        })),
      };
      await axios.post(`${API_URL}/exams`, payload);
      alert('Exam created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating exam:', error);
      alert('Failed to create exam: ' + (error.response?.data?.message || 'Server error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Exam</h1>
      <form onSubmit={handleSubmit}>
        {/* Exam Details */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Exam Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={examData.title}
                onChange={handleExamChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
              <input
                type="number"
                name="duration"
                value={examData.duration}
                onChange={handleExamChange}
                min="1"
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={examData.description}
                onChange={handleExamChange}
                className="w-full p-2 border rounded"
                rows="2"
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={examData.isPublished}
                  onChange={handleExamChange}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Publish immediately</span>
              </label>
            </div>
          </div>
        </div>

        {/* Questions */}
        <h2 className="text-xl font-semibold mb-4">Questions</h2>
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

        <button
          type="button"
          onClick={addQuestion}
          className="mb-6 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          + Add Question
        </button>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 py-2 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Exam'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn-secondary px-6 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateExam;