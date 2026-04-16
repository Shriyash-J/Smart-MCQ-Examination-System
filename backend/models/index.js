const sequelize = require('../config/database');
const User = require('./User');
const Exam = require('./Exam');
const Question = require('./Question');
const Result = require('./Result');

// Associations with CASCADE
User.hasMany(Exam, { foreignKey: 'createdBy', as: 'exams' });
Exam.belongsTo(User, { foreignKey: 'createdBy', as: 'instructor' });

Exam.hasMany(Question, { foreignKey: 'examId', as: 'questions', onDelete: 'CASCADE' });
Question.belongsTo(Exam, { foreignKey: 'examId' });

User.hasMany(Result, { foreignKey: 'studentId', as: 'results' });
Result.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

Exam.hasMany(Result, { foreignKey: 'examId', as: 'results', onDelete: 'CASCADE' });
Result.belongsTo(Exam, { foreignKey: 'examId' });

const syncDB = async () => {
  // Temporarily use force: true to recreate tables with CASCADE constraints
  await sequelize.sync({ alter: true });
  console.log('PostgreSQL tables recreated with CASCADE constraints');
};

module.exports = {
  sequelize,
  syncDB,
  User,
  Exam,
  Question,
  Result
};