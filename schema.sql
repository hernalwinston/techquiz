-- ============================================================
-- QUIZBATTLE - COMPLETE DATABASE SETUP
-- Paste into Supabase SQL Editor, click Run
-- ============================================================

-- Clean slate
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'users' AND event_object_schema = 'auth' LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON auth.users CASCADE';
  END LOOP;
END $$;

DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION' LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS public.' || r.routine_name || '() CASCADE';
  END LOOP;
END $$;

DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
  END LOOP;
END $$;

DROP TABLE IF EXISTS game_answers CASCADE;
DROP TABLE IF EXISTS game_players CASCADE;
DROP TABLE IF EXISTS leaderboards CASCADE;
DROP TABLE IF EXISTS banned CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Tables
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  year_section TEXT DEFAULT '',
  is_guest BOOLEAN DEFAULT false,
  total_points INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pin TEXT NOT NULL,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE SET NULL,
  quiz_title TEXT DEFAULT '',
  host_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  mode TEXT DEFAULT 'individual',
  group_size INTEGER DEFAULT 1,
  status TEXT DEFAULT 'waiting',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_question INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

CREATE TABLE game_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL DEFAULT '',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(game_id, user_id)
);

CREATE TABLE game_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  answer TEXT,
  correct BOOLEAN DEFAULT false,
  score INTEGER DEFAULT 0,
  time_elapsed DOUBLE PRECISION DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(game_id, user_id, question_index)
);

CREATE TABLE leaderboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  player_name TEXT DEFAULT '',
  quiz_title TEXT DEFAULT '',
  total_score INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  played_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE banned (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  banned_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_quizzes_created_by ON quizzes(created_by);
CREATE INDEX idx_games_host_id ON games(host_id);
CREATE INDEX idx_games_pin ON games(pin);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_game_players_game_id ON game_players(game_id);
CREATE INDEX idx_game_players_user_id ON game_players(user_id);
CREATE INDEX idx_game_answers_game_id ON game_answers(game_id);
CREATE INDEX idx_game_answers_user_id ON game_answers(user_id);
CREATE INDEX idx_game_answers_question ON game_answers(game_id, user_id, question_index);
CREATE INDEX idx_leaderboards_user_id ON leaderboards(user_id);
CREATE INDEX idx_leaderboards_game_id ON leaderboards(game_id);

-- Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Allow insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow authenticated read admins" ON admins FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert admins" ON admins FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated all quizzes" ON quizzes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated all games" ON games FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated all game_players" ON game_players FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated all game_answers" ON game_answers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated all leaderboards" ON leaderboards FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated all banned" ON banned FOR ALL USING (auth.role() = 'authenticated');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_answers;
