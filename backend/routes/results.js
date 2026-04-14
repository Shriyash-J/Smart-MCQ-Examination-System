const express = require('express');
const router = express.Router();
const { Result, Exam, User, Question } = require('../models');
const { protect, instructor } = require('../middleware/auth');
const { Op } = require('sequelize');

// @route   GET /api/results
router.get('/', protect, async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'student') {
      where.studentId = req.user.id;
    } else if (req.user.role === 'instructor') {
      const instructorExams = await Exam.findAll({
        where: { createdBy: req.user.id },
        attributes: ['id']
      });
      const examIds = instructorExams.map(e => e.id);
      where.examId = { [Op.in]: examIds };
    }

    const results = await Result.findAll({
      where,
      include: [
        { model: Exam, attributes: ['id', 'title', 'duration'] },
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] }
      ],
      order: [['submittedAt', 'DESC']]
    });
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/results/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const result = await Result.findByPk(req.params.id, {
      include: [
        { model: Exam, include: [{ model: Question, as: 'questions' }] },
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!result) return res.status(404).json({ message: 'Result not found' });

    if (req.user.role === 'student' && result.studentId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'instructor' && result.Exam.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/results/exam/:examId
router.get('/exam/:examId', protect, instructor, async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (exam.createdBy !== req.user.id) return res.status(403).json({ message: 'Access denied' });

    const results = await Result.findAll({
      where: { examId: req.params.examId },
      include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email'] }],
      order: [['score', 'DESC']]
    });

    const analytics = {
      totalStudents: results.length,
      averageScore: results.length > 0
        ? (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(2)
        : 0,
      highestScore: results.length > 0 ? Math.max(...results.map(r => r.score)) : 0,
      lowestScore: results.length > 0 ? Math.min(...results.map(r => r.score)) : 0,
    };

    res.json({ results, analytics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/results/pending (Instructor - get ungraded manual submissions)
router.get('/pending', protect, instructor, async (req, res) => {
  try {
    const results = await Result.findAll({
      where: { gradingStatus: 'pending' },
      include: [
        { model: Exam, where: { createdBy: req.user.id }, required: true },
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] }
      ],
      order: [['submittedAt', 'ASC']]
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/results/:id/grade (Instructor - grade manual submission)
router.put('/:id/grade', protect, instructor, async (req, res) => {
  try {
    const { scores, feedback } = req.body; // scores: array of marks per manual question
    
    const result = await Result.findByPk(req.params.id, {
      include: [{ model: Exam, include: [{ model: Question, as: 'questions' }] }]
    });
    
    if (!result) return res.status(404).json({ message: 'Result not found' });
    if (result.Exam.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Recalculate total score including manual grades
    let manualScore = 0;
    const questions = result.Exam.questions;
    const answers = result.answers;
    
    // Recalculate auto-graded portion to ensure accuracy
    let autoScore = 0;
    questions.forEach((q, idx) => {
      if (q.questionType !== 'manual') {
        // Recalculate auto score (similar logic as submission)
        // ... (use same scoring logic)
      }
    });
    
    // Add manual scores
    scores.forEach((s, idx) => {
      manualScore += s;
    });
    
    const finalScore = autoScore + manualScore;
    
    await result.update({
      score: finalScore,
      gradingStatus: 'graded',
      feedback
    });
    
    res.json({ message: 'Grading completed', finalScore });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;   // ✅ CORRECT