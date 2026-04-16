import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import QuestionForm from '../components/QuestionForm';

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

  // Fetch exam data on mount
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

        // Normalize question data for the form
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
          {
            questionType: 'mcq',
            questionText: '',
            options: ['', '', '', ''],
            correctAnswers: [0],
            marks: 1,
          },
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching exam:', error);
        alert('Failed to load exam data. You may not have permission to edit this exam.');
        navigate('/dashboard');
      }
    };
    fetchExam();
  }, [id, navigate]);

  // Handle exam detail changes
  const handleExamChange = (e) => {
    const { name, value, type, checked } = e.target;
    setExamData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle question updates from QuestionForm
  const handleQuestionChange = (index, updates) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], ...updates };
    setQuestions(updatedQuestions);
  };

  // Add a new blank question
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

  // Remove a question
  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  // Submit updated exam
  const handleSubmit = async (e) => {
    e.preventDefault();
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
      alert('Exam updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating exam:', error);
      alert('Failed to update exam: ' + (error.response?.data?.message || 'Server error'));
    } finally {
      setSaving(false);
    }
  };

  // Delete exam with confirmation
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/exams/${id}`);
      alert('Exam deleted successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert('Failed to delete exam: ' + (error.response?.data?.message || 'Server error'));
    } finally {
      setDeleting(false);
    }
  };

  

  if (loading) {
    return <div className="text-center py-10">Loading exam data...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Exam</h1>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Delete Exam'}
        </button>
      </div>

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
                <span className="text-sm font-medium">Published (visible to students)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Questions */}
        <h2 className="text-xl font-semibold mb-4">Questions</h2>
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
            disabled={saving}
            className="btn-primary px-6 py-2 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Update Exam'}
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

export default EditExam;