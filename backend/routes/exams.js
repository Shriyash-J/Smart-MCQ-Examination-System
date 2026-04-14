const express = require('express');
const router = express.Router();
const { Exam, Question, Result } = require('../models');
const { protect, instructor } = require('../middleware/auth');
const { Op } = require('sequelize');

// -------------------------------------------------------------------
// 1. CREATE EXAM (Instructor Only)
// -------------------------------------------------------------------
router.post('/', protect, instructor, async (req, res) => {
  try {
    const { title, description, duration, questions, isPublished } = req.body;

    // Create exam
    const exam = await Exam.create({
      title,
      description,
      duration,
      isPublished,
      createdBy: req.user.id
    });

    // Create questions
    if (questions && questions.length > 0) {
      const questionsData = questions.map(q => ({
        ...q,
        examId: exam.id,
        // Ensure correctAnswers is always an array
        correctAnswers: q.correctAnswers || [],
        // For manual type, options can be null
        options: q.options || null,
      }));
      await Question.bulkCreate(questionsData);
    }

    // Return full exam with questions
    const fullExam = await Exam.findByPk(exam.id, {
      include: { model: Question, as: 'questions' }
    });

    res.status(201).json(fullExam);
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(400).json({ message: error.message });
  }
});

// -------------------------------------------------------------------
// 2. GET ALL EXAMS (Filtered by Role)
// -------------------------------------------------------------------
router.get('/', protect, async (req, res) => {
  try {
    let where = {};

    if (req.user.role === 'student') {
      // Students see only published exams
      where.isPublished = true;
    } else if (req.user.role === 'instructor') {
      // Instructors see only their own exams
      where.createdBy = req.user.id;
    }

    const exams = await Exam.findAll({
      where,
      include: {
        model: Question,
        as: 'questions',
        attributes: { exclude: ['correctAnswers', 'expectedAnswer'] } // Hide answers from listing
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(exams);
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ message: error.message });
  }
});

// -------------------------------------------------------------------
// 3. GET SINGLE EXAM (Basic Info, Permission Checked)
// -------------------------------------------------------------------
router.get('/:id', protect, async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id, {
      attributes: ['id', 'title', 'description', 'duration', 'isPublished', 'createdBy', 'createdAt']
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Students can only view published exams
    if (req.user.role === 'student' && !exam.isPublished) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Instructors can only view their own exams
    if (req.user.role === 'instructor' && exam.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(exam);
  } catch (error) {
    console.error('Get single exam error:', error);
    res.status(500).json({ message: error.message });
  }
});

// -------------------------------------------------------------------
// 4. GET FULL EXAM FOR INSTRUCTOR (Includes Answers)
// -------------------------------------------------------------------
router.get('/:id/full', protect, instructor, async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id, {
      include: { model: Question, as: 'questions' }
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Ensure instructor owns this exam
    if (exam.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(exam);
  } catch (error) {
    console.error('Get full exam error:', error);
    res.status(500).json({ message: error.message });
  }
});

// -------------------------------------------------------------------
// 5. TAKE EXAM (Student View - No Answers)
// -------------------------------------------------------------------
router.get('/:id/take', protect, async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id, {
      include: { model: Question, as: 'questions' }
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Only published exams can be taken
    if (!exam.isPublished && req.user.role === 'student') {
      return res.status(403).json({ message: 'This exam is not yet published' });
    }

    // Check if student has already taken this exam
    const existingResult = await Result.findOne({
      where: { studentId: req.user.id, examId: exam.id }
    });

    if (existingResult) {
      return res.status(400).json({ message: 'You have already taken this exam' });
    }

    // Prepare exam without correct answers
    const examForStudent = {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      questions: exam.questions.map(q => ({
        id: q.id,
        questionType: q.questionType,
        questionText: q.questionText,
        diagramUrl: q.diagramUrl,
        options: q.options,
        marks: q.marks,
        // Do NOT send correctAnswers or expectedAnswer
      }))
    };

    res.json(examForStudent);
  } catch (error) {
    console.error('Take exam error:', error);
    res.status(500).json({ message: error.message });
  }
});

// -------------------------------------------------------------------
// 6. SUBMIT EXAM (Auto-Scoring with Support for All Types)
// -------------------------------------------------------------------
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id, {
      include: { model: Question, as: 'questions' }
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Prevent multiple submissions
    const existingResult = await Result.findOne({
      where: { studentId: req.user.id, examId: exam.id }
    });
    if (existingResult) {
      return res.status(400).json({ message: 'You have already submitted this exam' });
    }

    const { answers } = req.body; // Array of student responses
    let score = 0;
    let totalMarks = 0;
    let needsGrading = false;

    exam.questions.forEach((q, idx) => {
      totalMarks += q.marks;
      const studentAnswer = answers[idx];

      switch (q.questionType) {
        case 'mcq':
        case 'truefalse':
        case 'diagram':
          // Single correct answer expected (index)
          if (studentAnswer !== null && studentAnswer !== undefined &&
              q.correctAnswers && q.correctAnswers.length > 0 &&
              studentAnswer === q.correctAnswers[0]) {
            score += q.marks;
          }
          break;

        case 'msq':
          // Multiple correct answers
          if (Array.isArray(studentAnswer) && Array.isArray(q.correctAnswers)) {
            if (q.partialMarking) {
              // Partial marking: proportion of correctly selected options
              const correctSet = new Set(q.correctAnswers);
              let correctSelections = 0;
              let incorrectSelections = 0;
              studentAnswer.forEach(ans => {
                if (correctSet.has(ans)) correctSelections++;
                else incorrectSelections++;
              });
              // Some MSQ grading strategies penalize wrong selections; here we only give credit for correct ones
              const proportion = q.correctAnswers.length > 0
                ? correctSelections / q.correctAnswers.length
                : 0;
              score += proportion * q.marks;
            } else {
              // All-or-nothing: must select exactly the correct set (order doesn't matter)
              const sortedStudent = [...studentAnswer].sort();
              const sortedCorrect = [...q.correctAnswers].sort();
              if (sortedStudent.length === sortedCorrect.length &&
                  sortedStudent.every((val, i) => val === sortedCorrect[i])) {
                score += q.marks;
              }
            }
          }
          break;

        case 'manual':
          // Manual grading required
          needsGrading = true;
          // No auto-score for manual questions
          break;

        default:
          break;
      }
    });

    const gradingStatus = needsGrading ? 'pending' : 'graded';

    const result = await Result.create({
      studentId: req.user.id,
      examId: exam.id,
      answers,
      score,
      totalMarks,
      gradingStatus
    });

    res.json({
      score,
      totalMarks,
      resultId: result.id,
      needsGrading,
      message: needsGrading
        ? 'Your submission includes manually graded questions. Check back later for your final score.'
        : 'Exam submitted successfully!'
    });
  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({ message: error.message });
  }
});

// -------------------------------------------------------------------
// 7. UPDATE EXAM (Instructor Only)
// -------------------------------------------------------------------
router.put('/:id', protect, instructor, async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (exam.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, duration, isPublished, questions } = req.body;

    // Update exam details
    await exam.update({ title, description, duration, isPublished });

    // Replace questions: delete existing, create new ones
    await Question.destroy({ where: { examId: exam.id } });

    if (questions && questions.length > 0) {
      const questionsData = questions.map(q => ({
        ...q,
        examId: exam.id,
        correctAnswers: q.correctAnswers || [],
        options: q.options || null,
      }));
      await Question.bulkCreate(questionsData);
    }

    const updatedExam = await Exam.findByPk(exam.id, {
      include: { model: Question, as: 'questions' }
    });

    res.json(updatedExam);
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(400).json({ message: error.message });
  }
});

// -------------------------------------------------------------------
// 8. DELETE EXAM (Instructor Only)
// -------------------------------------------------------------------
router.delete('/:id', protect, instructor, async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (exam.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if any results exist (prevent deletion of taken exams if desired)
    const resultCount = await Result.count({ where: { examId: exam.id } });
    if (resultCount > 0) {
      return res.status(400).json({ message: 'Cannot delete exam with existing submissions' });
    }

    await exam.destroy();
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;