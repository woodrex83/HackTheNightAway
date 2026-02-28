-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (linked to Supabase anonymous auth)
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  supabase_id uuid unique,
  username text,
  ib_subjects text[] default '{}',
  interests text default '',
  xp integer default 0,
  streak integer default 0,
  last_active date default current_date,
  onboarded boolean default false,
  created_at timestamptz default now()
);

-- IB topic library
create table if not exists topics (
  id uuid primary key default uuid_generate_v4(),
  subject text not null,
  title text not null,
  curriculum_tag text default '',
  difficulty integer default 1 check (difficulty between 1 and 3),
  created_at timestamptz default now()
);

-- Video library (Minimax-generated)
create table if not exists videos (
  id uuid primary key default uuid_generate_v4(),
  topic_id uuid references topics(id) on delete cascade,
  prompt text not null,
  task_id text,
  file_id text,
  url text,
  status text default 'pending' check (status in ('pending', 'processing', 'ready', 'failed')),
  duration integer default 60,
  created_at timestamptz default now()
);

-- Quiz questions per video
create table if not exists quizzes (
  id uuid primary key default uuid_generate_v4(),
  video_id uuid references videos(id) on delete cascade,
  questions jsonb not null default '[]',
  created_at timestamptz default now()
);

-- Per-user video history and spaced repetition
create table if not exists user_video_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  video_id uuid references videos(id) on delete cascade,
  watched_at timestamptz default now(),
  quiz_score integer default 0,
  next_review_at timestamptz default now() + interval '1 day',
  mastery integer default 0 check (mastery between 0 and 100),
  unique(user_id, video_id)
);

-- Seed demo topics (3 subjects: Physics, Mathematics, Biology)
insert into topics (subject, title, curriculum_tag, difficulty) values
  ('Physics', 'Newton''s Laws of Motion', 'Mechanics', 1),
  ('Physics', 'Electromagnetic Induction', 'Electromagnetism', 2),
  ('Physics', 'Quantum and Nuclear Physics', 'Modern Physics', 3),
  ('Mathematics', 'Differentiation Fundamentals', 'Calculus', 1),
  ('Mathematics', 'Integration Techniques', 'Calculus', 2),
  ('Mathematics', 'Probability Distributions', 'Statistics', 2),
  ('Biology', 'Cell Structure and Function', 'Cells', 1),
  ('Biology', 'DNA Replication and Transcription', 'Genetics', 2),
  ('Biology', 'Enzyme Kinetics', 'Biochemistry', 2)
on conflict do nothing;
