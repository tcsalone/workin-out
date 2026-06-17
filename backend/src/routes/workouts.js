import express from 'express';
import db from '../db/db.js';

const router = express.Router();

// Get all workouts with pagination
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const workouts = await db.allAsync(`
      SELECT * FROM workouts
      ORDER BY date DESC, created_at DESC
      LIMIT ? OFFSET ?
    `, limit, offset);

    const total = await db.getAsync('SELECT COUNT(*) as count FROM workouts');

    res.json({
      workouts,
      pagination: {
        limit,
        offset,
        total: total.count
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single workout with all sets
router.get('/:id', async (req, res) => {
  try {
    const workout = await db.getAsync('SELECT * FROM workouts WHERE id = ?', req.params.id);
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    const sets = await db.allAsync(`
      SELECT ws.*, e.name as exercise_name, e.bar_weight
      FROM workout_sets ws
      JOIN exercises e ON ws.exercise_id = e.id
      WHERE ws.workout_id = ?
      ORDER BY e.display_order, ws.set_number
    `, req.params.id);

    res.json({ ...workout, sets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new workout
router.post('/', (req, res) => {
  try {
    const { workout_type, date, notes } = req.body;

    if (!workout_type || !['A', 'B'].includes(workout_type)) {
      return res.status(400).json({ error: 'Valid workout_type (A or B) is required' });
    }

    const workoutDate = date || new Date().toISOString().split('T')[0];

    db.run(`
      INSERT INTO workouts (workout_type, date, started_at, notes)
      VALUES (?, ?, ?, ?)
    `, [workout_type, workoutDate, new Date().toISOString(), notes || null], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.get('SELECT * FROM workouts WHERE id = ?', [this.lastID], (err, workout) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json(workout);
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update workout
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { completed_at, notes } = req.body;

    const updates = [];
    const params = [];

    if (completed_at !== undefined) {
      updates.push('completed_at = ?');
      params.push(completed_at);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    db.run(`UPDATE workouts SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.get('SELECT * FROM workouts WHERE id = ?', [id], (err, workout) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(workout);
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete workout
router.delete('/:id', (req, res) => {
  try {
    db.run('DELETE FROM workouts WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Workout not found' });
      }
      res.status(204).send();
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add multiple sets at once (batch operation)
// IMPORTANT: This route MUST come before /:workout_id/sets to match /batch correctly
router.post('/:workout_id/sets/batch', async (req, res) => {
  try {
    const { workout_id } = req.params;
    const { sets } = req.body;

    if (!Array.isArray(sets) || sets.length === 0) {
      return res.status(400).json({ error: 'sets must be a non-empty array' });
    }

    // Validate all sets have required fields
    for (const set of sets) {
      if (!set.exercise_id || set.set_number === undefined) {
        return res.status(400).json({ error: 'Each set must have exercise_id and set_number' });
      }
    }

    // Insert all sets in a single transaction
    await db.runAsync('BEGIN TRANSACTION');

    try {
      const insertedSets = [];

      for (const set of sets) {
        const { exercise_id, set_number, is_warmup = 0, reps, weight, completed = 0, notes } = set;

        const result = await db.runAsync(`
          INSERT INTO workout_sets (workout_id, exercise_id, set_number, is_warmup, reps, weight, completed, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [workout_id, exercise_id, set_number, is_warmup, reps, weight, completed, notes || null]);

        const insertedSet = await db.getAsync('SELECT * FROM workout_sets WHERE id = ?', result.lastID);
        insertedSets.push(insertedSet);
      }

      await db.runAsync('COMMIT');
      res.status(201).json({ sets: insertedSets });
    } catch (err) {
      await db.runAsync('ROLLBACK');
      throw err;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a single set to a workout
router.post('/:workout_id/sets', (req, res) => {
  try {
    const { workout_id } = req.params;
    const { exercise_id, set_number, is_warmup = 0, reps, weight, completed = 0, notes } = req.body;

    if (!exercise_id || set_number === undefined) {
      return res.status(400).json({ error: 'exercise_id and set_number are required' });
    }

    db.run(`
      INSERT INTO workout_sets (workout_id, exercise_id, set_number, is_warmup, reps, weight, completed, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [workout_id, exercise_id, set_number, is_warmup, reps, weight, completed, notes || null], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.get('SELECT * FROM workout_sets WHERE id = ?', [this.lastID], (err, set) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json(set);
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a set
router.put('/sets/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { reps, weight, completed, notes } = req.body;

    const updates = [];
    const params = [];

    if (reps !== undefined) {
      updates.push('reps = ?');
      params.push(reps);
    }
    if (weight !== undefined) {
      updates.push('weight = ?');
      params.push(weight);
    }
    if (completed !== undefined) {
      updates.push('completed = ?');
      params.push(completed ? 1 : 0);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    db.run(`UPDATE workout_sets SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.get('SELECT * FROM workout_sets WHERE id = ?', [id], (err, set) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(set);
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a set
router.delete('/sets/:id', (req, res) => {
  try {
    db.run('DELETE FROM workout_sets WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Set not found' });
      }
      res.status(204).send();
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset all data (workouts and sets)
router.delete('/reset/all', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM workout_sets');
    await db.runAsync('DELETE FROM workouts');
    // Reset sqlite_sequence for auto-increment IDs
    await db.runAsync("DELETE FROM sqlite_sequence WHERE name IN ('workouts', 'workout_sets')");
    res.json({ message: 'All workout data reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear workout history (same as reset/all for now since exercises are separate)
router.delete('/reset/history', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM workout_sets');
    await db.runAsync('DELETE FROM workouts');
    await db.runAsync("DELETE FROM sqlite_sequence WHERE name IN ('workouts', 'workout_sets')");
    res.json({ message: 'Workout history cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
