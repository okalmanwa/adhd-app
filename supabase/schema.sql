-- Drop existing tables if they exist
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;

-- Create tasks table
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    urgency TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high')),
    category TEXT NOT NULL CHECK (category IN ('study', 'chores', 'self-care', 'work', 'other')),
    deadline TIMESTAMP WITH TIME ZONE,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    hero TEXT,
    avatar TEXT,
    obstacles TEXT[] DEFAULT '{}',
    win_condition TEXT,
    reward TEXT
);

-- Add deadline column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'deadline'
    ) THEN
        ALTER TABLE tasks ADD COLUMN deadline TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add start_time column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'start_time'
    ) THEN
        ALTER TABLE tasks ADD COLUMN start_time TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add end_time column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'end_time'
    ) THEN
        ALTER TABLE tasks ADD COLUMN end_time TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create rewards table
CREATE TABLE rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    xp_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    last_completed TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    last_claimed DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add last_completed column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rewards' 
        AND column_name = 'last_completed'
    ) THEN
        ALTER TABLE rewards ADD COLUMN last_completed TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
    END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at
    BEFORE UPDATE ON rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate level from XP
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR(xp / 50) + 1;
END;
$$ language 'plpgsql';

-- Create function to grant XP
CREATE OR REPLACE FUNCTION grant_xp(
    p_user_id UUID,
    p_xp_amount INTEGER
)
RETURNS VOID AS $$
DECLARE
    current_xp INTEGER;
    new_xp INTEGER;
    new_level INTEGER;
BEGIN
    -- Get current XP
    SELECT xp_points INTO current_xp
    FROM rewards
    WHERE user_id = p_user_id;

    -- Calculate new XP and level
    new_xp := COALESCE(current_xp, 0) + p_xp_amount;
    new_level := calculate_level(new_xp);

    -- Insert or update rewards
    INSERT INTO rewards (user_id, xp_points, level)
    VALUES (p_user_id, new_xp, new_level)
    ON CONFLICT (user_id)
    DO UPDATE SET
        xp_points = new_xp,
        level = new_level,
        updated_at = TIMEZONE('utc'::text, NOW());
END;
$$ language 'plpgsql';

-- Create function to update streak
CREATE OR REPLACE FUNCTION update_streak(
    p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    last_claim DATE;
    current_streak INTEGER;
BEGIN
    -- Get current streak and last claim
    SELECT streak, last_claimed INTO current_streak, last_claim
    FROM rewards
    WHERE user_id = p_user_id;

    -- If no record exists, create one
    IF current_streak IS NULL THEN
        INSERT INTO rewards (user_id, streak, last_claimed)
        VALUES (p_user_id, 1, CURRENT_DATE);
        RETURN;
    END IF;

    -- Check if last claim was yesterday
    IF last_claim = CURRENT_DATE - INTERVAL '1 day' THEN
        -- Increment streak
        UPDATE rewards
        SET streak = current_streak + 1,
            last_claimed = CURRENT_DATE
        WHERE user_id = p_user_id;
    ELSIF last_claim < CURRENT_DATE - INTERVAL '1 day' THEN
        -- Reset streak
        UPDATE rewards
        SET streak = 1,
            last_claimed = CURRENT_DATE
        WHERE user_id = p_user_id;
    END IF;
END;
$$ language 'plpgsql';

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks table
CREATE POLICY "Users can read their own tasks"
ON tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
ON tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
ON tasks FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
ON tasks FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for rewards table
CREATE POLICY "Users can read their own rewards"
ON rewards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rewards"
ON rewards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards"
ON rewards FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rewards"
ON rewards FOR DELETE
USING (auth.uid() = user_id); 