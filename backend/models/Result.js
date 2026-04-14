const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Result = sequelize.define('Result', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  answers: {
    type: DataTypes.JSON,
    allowNull: false
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  totalMarks: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  gradingStatus: {
    type: DataTypes.ENUM('pending', 'graded'),
    defaultValue: 'pending'
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  submittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  },
  examId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Exams', key: 'id' }
  }
});

module.exports = Result;