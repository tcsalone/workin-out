-- Seed initial exercises for Workout A and Workout B

-- Workout A Exercises
INSERT INTO exercises (name, workout_type, default_warmup_sets, default_working_sets, default_reps, is_weight_tracked, bar_weight, display_order) VALUES
('Squats', 'A', 2, 3, 5, 1, 45, 1),
('Overhead Press', 'A', 2, 3, 5, 1, 45, 2),
('Lat Pull/Chinup', 'A', 0, 3, 10, 1, 0, 3),
('Pallof Press', 'A', 0, 3, 10, 1, 0, 4),
('Wrist/Calf', 'A', 0, 1, 1, 0, 0, 5);

-- Workout B Exercises
INSERT INTO exercises (name, workout_type, default_warmup_sets, default_working_sets, default_reps, is_weight_tracked, bar_weight, display_order) VALUES
('Squat', 'B', 2, 3, 5, 1, 45, 1),
('Bench Press', 'B', 2, 3, 5, 1, 45, 2),
('Deadlift', 'B', 2, 3, 5, 1, 45, 3),
('Dumbbell Goblet Squats', 'B', 0, 3, 10, 1, 0, 4),
('Suitcase Carries', 'B', 0, 3, 1, 1, 0, 5),
('Wrist/Calf', 'B', 0, 1, 1, 0, 0, 6);
