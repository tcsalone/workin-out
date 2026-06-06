import express from 'express';
import db from '../db/db.js';

const router = express.Router();

// Get last weight lifted for an exercise
router.get('/last-weight', async (req, res) => {
  try {
    const { exercise_id } = req.query;

    if (!exercise_id) {
      return res.status(400).json({ error: 'exercise_id is required' });
    }

    const lastSet = await db.getAsync(`
      SELECT ws.weight, ws.reps, ws.is_warmup, w.date, w.workout_type
      FROM workout_sets ws
      JOIN workouts w ON ws.workout_id = w.id
      WHERE ws.exercise_id = ? AND ws.completed = 1 AND ws.is_warmup = 0
      ORDER BY w.date DESC, w.created_at DESC, ws.set_number DESC
      LIMIT 1
    `, exercise_id);

    if (!lastSet) {
      return res.json({ weight: null, reps: null, date: null });
    }

    res.json(lastSet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Suggest next workout type (A or B)
router.get('/next-workout', async (req, res) => {
  try {
    const lastWorkout = await db.getAsync(`
      SELECT workout_type FROM workouts
      ORDER BY date DESC, created_at DESC
      LIMIT 1
    `);

    let nextWorkoutType = 'A';
    if (lastWorkout) {
      nextWorkoutType = lastWorkout.workout_type === 'A' ? 'B' : 'A';
    }

    res.json({ next_workout_type: nextWorkoutType });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get workout history summary
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const history = await db.allAsync(`
      SELECT
        w.id,
        w.workout_type,
        w.date,
        w.completed_at,
        COUNT(DISTINCT ws.exercise_id) as exercises_count,
        COUNT(ws.id) as total_sets,
        SUM(CASE WHEN ws.completed = 1 THEN 1 ELSE 0 END) as completed_sets
      FROM workouts w
      LEFT JOIN workout_sets ws ON w.id = ws.workout_id
      GROUP BY w.id
      ORDER BY w.date DESC, w.created_at DESC
      LIMIT ?
    `, limit);

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get progress for an exercise (last N workouts)
router.get('/progress/:exercise_id', async (req, res) => {
  try {
    const { exercise_id } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const progress = await db.allAsync(`
      SELECT
        w.date,
        ws.set_number,
        ws.is_warmup,
        ws.weight,
        ws.reps,
        ws.completed
      FROM workout_sets ws
      JOIN workouts w ON ws.workout_id = w.id
      WHERE ws.exercise_id = ?
      ORDER BY w.date DESC, w.created_at DESC, ws.set_number ASC
      LIMIT ?
    `, exercise_id, limit * 5);

    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
