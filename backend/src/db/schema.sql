-- Workouts table: each gym session
CREATE TABLE IF NOT EXISTS workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_type TEXT NOT NULL CHECK(workout_type IN ('A', 'B')),
  date TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Exercise templates: the exercises for each workout type
CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  workout_type TEXT NOT NULL CHECK(workout_type IN ('A', 'B')),
  default_warmup_sets INTEGER NOT NULL DEFAULT 2,
  default_working_sets INTEGER NOT NULL DEFAULT 3,
  default_reps INTEGER NOT NULL DEFAULT 5,
  is_weight_tracked INTEGER NOT NULL DEFAULT 1,
  bar_weight REAL NOT NULL DEFAULT 45,
  display_order INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Workout sets: actual sets performed in a workout
CREATE TABLE IF NOT EXISTS workout_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  set_number INTEGER NOT NULL,
  is_warmup INTEGER NOT NULL DEFAULT 0,
  reps INTEGER,
  weight REAL,
  completed INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_type ON workouts(workout_type);
CREATE INDEX IF NOT EXISTS idx_workout_sets_workout ON workout_sets(workout_id);
CREATE INDEX IF NOT EXISTS idx_exercises_workout_type ON exercises(workout_type, display_order);
