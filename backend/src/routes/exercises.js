import express from 'express';
import db from '../db/db.js';

const router = express.Router();

// Get all exercises or filter by workout type
router.get('/', async (req, res) => {
  try {
    const { workout_type } = req.query;

    let query = 'SELECT * FROM exercises';
    const params = [];

    if (workout_type) {
      query += ' WHERE workout_type = ?';
      params.push(workout_type);
    }

    query += ' ORDER BY display_order ASC';

    const exercises = await db.allAsync(query, params);
    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single exercise
router.get('/:id', async (req, res) => {
  try {
    const exercise = await db.getAsync('SELECT * FROM exercises WHERE id = ?', req.params.id);
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    res.json(exercise);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create exercise
router.post('/', (req, res) => {
  try {
    const {
      name,
      workout_type,
      default_warmup_sets = 2,
      default_working_sets = 3,
      default_reps = 5,
      is_weight_tracked = 1,
      bar_weight = 45,
      display_order
    } = req.body;

    if (!name || !workout_type) {
      return res.status(400).json({ error: 'Name and workout_type are required' });
    }

    db.run(`
      INSERT INTO exercises (name, workout_type, default_warmup_sets, default_working_sets,
                            default_reps, is_weight_tracked, bar_weight, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, workout_type, default_warmup_sets, default_working_sets,
        default_reps, is_weight_tracked, bar_weight, display_order], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.get('SELECT * FROM exercises WHERE id = ?', [this.lastID], (err, exercise) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json(exercise);
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update exercise
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      default_warmup_sets,
      default_working_sets,
      default_reps,
      is_weight_tracked,
      bar_weight,
      display_order
    } = req.body;

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (default_warmup_sets !== undefined) {
      updates.push('default_warmup_sets = ?');
      params.push(default_warmup_sets);
    }
    if (default_working_sets !== undefined) {
      updates.push('default_working_sets = ?');
      params.push(default_working_sets);
    }
    if (default_reps !== undefined) {
      updates.push('default_reps = ?');
      params.push(default_reps);
    }
    if (is_weight_tracked !== undefined) {
      updates.push('is_weight_tracked = ?');
      params.push(is_weight_tracked);
    }
    if (bar_weight !== undefined) {
      updates.push('bar_weight = ?');
      params.push(bar_weight);
    }
    if (display_order !== undefined) {
      updates.push('display_order = ?');
      params.push(display_order);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    db.run(`UPDATE exercises SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.get('SELECT * FROM exercises WHERE id = ?', [id], (err, exercise) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(exercise);
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete exercise
router.delete('/:id', (req, res) => {
  try {
    db.run('DELETE FROM exercises WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Exercise not found' });
      }
      res.status(204).send();
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
