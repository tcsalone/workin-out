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

// Suggest next workout type (A or B) - only based on completed workouts
router.get('/next-workout', async (req, res) => {
  try {
    const lastWorkout = await db.getAsync(`
      SELECT workout_type FROM workouts
      WHERE completed_at IS NOT NULL
      ORDER BY date DESC, completed_at DESC
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

// Get all in-progress workouts
router.get('/in-progress', async (req, res) => {
  try {
    const inProgress = await db.allAsync(`
      SELECT
        w.id,
        w.workout_type,
        w.date,
        w.started_at,
        w.completed_at,
        COUNT(DISTINCT ws.exercise_id) as exercises_count,
        COUNT(ws.id) as total_sets,
        SUM(CASE WHEN ws.completed = 1 THEN 1 ELSE 0 END) as completed_sets
      FROM workouts w
      LEFT JOIN workout_sets ws ON w.id = ws.workout_id
      WHERE w.completed_at IS NULL
      GROUP BY w.id
      ORDER BY w.date DESC, w.created_at DESC
    `);

    res.json(inProgress);
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

// Get PR (personal record) for an exercise
router.get('/pr/:exercise_id', async (req, res) => {
  try {
    const { exercise_id } = req.params;

    // Query for max weight from working sets (is_warmup = 0) for this exercise
    const pr = await db.getAsync(`
      SELECT
        ws.weight as pr_weight,
        ws.reps as pr_reps,
        w.date as pr_date,
        w.completed_at as pr_time
      FROM workout_sets ws
      JOIN workouts w ON ws.workout_id = w.id
      WHERE ws.exercise_id = ?
        AND ws.is_warmup = 0
        AND ws.completed = 1
        AND ws.weight IS NOT NULL
      ORDER BY ws.weight DESC, w.date DESC
      LIMIT 1
    `, exercise_id);

    if (!pr || !pr.pr_weight) {
      return res.json({ pr: null });
    }

    res.json({
      pr: {
        weight: pr.pr_weight,
        reps: pr.pr_reps,
        date: pr.pr_date,
        time: pr.pr_time
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get last completed workout dates for Workout A and B
router.get('/last-completed', async (req, res) => {
  try {
    // Get last completed workout for type A
    const lastA = await db.getAsync(`
      SELECT date, completed_at
      FROM workouts
      WHERE workout_type = 'A'
        AND completed_at IS NOT NULL
      ORDER BY date DESC, completed_at DESC
      LIMIT 1
    `);

    // Get last completed workout for type B
    const lastB = await db.getAsync(`
      SELECT date, completed_at
      FROM workouts
      WHERE workout_type = 'B'
        AND completed_at IS NOT NULL
      ORDER BY date DESC, completed_at DESC
      LIMIT 1
    `);

    res.json({
      workoutA: lastA ? { date: lastA.date, completedAt: lastA.completed_at } : null,
      workoutB: lastB ? { date: lastB.date, completedAt: lastB.completed_at } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get complete last session for an exercise (set structure, reps, weights)
router.get('/last-session/:exercise_id', async (req, res) => {
  try {
    const { exercise_id } = req.params;

    // Single optimized query with JOIN - fetches workout + sets in one round-trip
    const sets = await db.allAsync(`
      SELECT
        ws.set_number,
        ws.is_warmup,
        ws.reps,
        ws.weight,
        ws.completed,
        w.date
      FROM workout_sets ws
      JOIN workouts w ON ws.workout_id = w.id
      WHERE ws.exercise_id = ?
        AND w.completed_at IS NOT NULL
        AND ws.workout_id = (
          SELECT w2.id
          FROM workouts w2
          JOIN workout_sets ws2 ON w2.id = ws2.workout_id
          WHERE ws2.exercise_id = ?
            AND w2.completed_at IS NOT NULL
          ORDER BY w2.date DESC, w2.completed_at DESC
          LIMIT 1
        )
      ORDER BY ws.set_number ASC
    `, exercise_id, exercise_id);

    if (!sets || sets.length === 0) {
      return res.json({ session: null });
    }

    res.json({
      session: {
        date: sets[0].date,
        warmupSets: sets.filter(s => s.is_warmup),
        workingSets: sets.filter(s => !s.is_warmup)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
