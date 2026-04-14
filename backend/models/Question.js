const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  questionType: {
    type: DataTypes.ENUM('mcq', 'msq', 'truefalse', 'diagram', 'manual'),
    defaultValue: 'mcq',
    allowNull: false
  },
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  diagramUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  options: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  correctAnswers: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: true,
    defaultValue: []
  },
  marks: {
    type: DataTypes.FLOAT,
    defaultValue: 1
  },
  expectedAnswer: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  partialMarking: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  examId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Exams',
      key: 'id'
    }
  }
});

// Helper method to get single correct answer for MCQ/TF
Question.prototype.getCorrectAnswer = function() {
  if (this.correctAnswers && this.correctAnswers.length > 0) {
    return this.correctAnswers[0];
  }
  return null;
};

module.exports = Question;