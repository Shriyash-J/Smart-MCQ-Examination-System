import React, { useState } from 'react';

const QuestionForm = ({ question, index, onChange, onRemove, showRemove }) => {
  const [diagramFile, setDiagramFile] = useState(null);

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    // Reset fields based on type
    let updates = { questionType: newType };
    
    switch (newType) {
      case 'mcq':
      case 'diagram':
        updates.options = ['', '', '', ''];
        updates.correctAnswers = [0];
        break;
      case 'msq':
        updates.options = ['', '', '', ''];
        updates.correctAnswers = [];
        break;
      case 'truefalse':
        updates.options = ['True', 'False'];
        updates.correctAnswers = [0];
        break;
      case 'manual':
        updates.options = null;
        updates.correctAnswers = [];
        updates.expectedAnswer = '';
        break;
    }
    onChange(index, updates);
  };

  const handleOptionChange = (optIndex, value) => {
    const newOptions = [...question.options];
    newOptions[optIndex] = value;
    onChange(index, { options: newOptions });
  };

  const handleCorrectAnswerChange = (optIndex, checked) => {
    if (question.questionType === 'msq') {
      let newCorrect = [...(question.correctAnswers || [])];
      if (checked) {
        if (!newCorrect.includes(optIndex)) newCorrect.push(optIndex);
      } else {
        newCorrect = newCorrect.filter(i => i !== optIndex);
      }
      onChange(index, { correctAnswers: newCorrect });
    } else {
      // Single answer types
      onChange(index, { correctAnswers: [optIndex] });
    }
  };

  const handleDiagramUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // In production, upload to cloud storage (S3/Cloudinary)
    // For now, create a local object URL for preview
    const url = URL.createObjectURL(file);
    onChange(index, { diagramUrl: url });
    setDiagramFile(file);
  };

  return (
    <div className="card mb-6 relative">
      {showRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="absolute top-2 right-2 text-red-600 hover:text-red-800"
        >
          ✕
        </button>
      )}
      
      {/* Question Type Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Question Type</label>
        <select
          value={question.questionType || 'mcq'}
          onChange={handleTypeChange}
          className="w-full p-2 border rounded"
        >
          <option value="mcq">Multiple Choice (Single Answer)</option>
          <option value="msq">Multiple Select (Multiple Answers)</option>
          <option value="truefalse">True / False</option>
          <option value="diagram">Diagram Based (with MCQ)</option>
          <option value="manual">Manual Answer (Subjective)</option>
        </select>
      </div>

      {/* Question Text */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Question {index + 1}</label>
        <textarea
          value={question.questionText || ''}
          onChange={(e) => onChange(index, { questionText: e.target.value })}
          className="w-full p-2 border rounded"
          rows="2"
          placeholder="Enter question text"
          required
        />
      </div>

      {/* Diagram Upload */}
      {question.questionType === 'diagram' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Upload Diagram</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleDiagramUpload}
            className="w-full p-2 border rounded"
          />
          {question.diagramUrl && (
            <img src={question.diagramUrl} alt="Diagram preview" className="mt-2 max-h-40" />
          )}
        </div>
      )}

      {/* Options for MCQ/MSQ/TF/Diagram */}
      {['mcq', 'msq', 'truefalse', 'diagram'].includes(question.questionType) && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Options</label>
          {question.questionType === 'truefalse' ? (
            <div className="space-y-2">
              {['True', 'False'].map((opt, optIndex) => (
                <div key={optIndex} className="flex items-center">
                  <input
                    type={question.questionType === 'msq' ? 'checkbox' : 'radio'}
                    name={`correct-${index}`}
                    checked={question.correctAnswers?.includes(optIndex) || false}
                    onChange={(e) => handleCorrectAnswerChange(optIndex, e.target.checked)}
                    className="mr-2"
                  />
                  <span className="flex-1 p-2 border rounded bg-gray-50">{opt}</span>
                </div>
              ))}
            </div>
          ) : (
            question.options?.map((opt, optIndex) => (
              <div key={optIndex} className="flex items-center mb-2">
                <input
                  type={question.questionType === 'msq' ? 'checkbox' : 'radio'}
                  name={`correct-${index}`}
                  checked={question.correctAnswers?.includes(optIndex) || false}
                  onChange={(e) => handleCorrectAnswerChange(optIndex, e.target.checked)}
                  className="mr-2"
                />
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(optIndex, e.target.value)}
                  className="flex-1 p-2 border rounded"
                  placeholder={`Option ${optIndex + 1}`}
                  required
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Manual Answer Guidelines */}
      {question.questionType === 'manual' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Expected Answer / Grading Rubric (Visible only to instructors)
          </label>
          <textarea
            value={question.expectedAnswer || ''}
            onChange={(e) => onChange(index, { expectedAnswer: e.target.value })}
            className="w-full p-2 border rounded"
            rows="3"
            placeholder="Describe what constitutes a correct answer..."
          />
        </div>
      )}

      {/* Marks */}
      <div className="w-32">
        <label className="block text-sm font-medium mb-1">Marks</label>
        <input
          type="number"
          value={question.marks || 1}
          onChange={(e) => onChange(index, { marks: parseInt(e.target.value) })}
          min="1"
          step="0.5"
          className="w-full p-2 border rounded"
          required
        />
      </div>
    </div>
  );
};

export default QuestionForm;