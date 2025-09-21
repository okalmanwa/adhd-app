-- Add missing columns to tasks table if they don't exist
DO $$ 
BEGIN
    -- Add end_time column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'end_time'
    ) THEN
        ALTER TABLE tasks ADD COLUMN end_time TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add start_time column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'start_time'
    ) THEN
        ALTER TABLE tasks ADD COLUMN start_time TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add deadline column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'deadline'
    ) THEN
        ALTER TABLE tasks ADD COLUMN deadline TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add description column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE tasks ADD COLUMN description TEXT;
    END IF;

    -- Add avatar column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'avatar'
    ) THEN
        ALTER TABLE tasks ADD COLUMN avatar TEXT;
    END IF;

    -- Add hero column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'hero'
    ) THEN
        ALTER TABLE tasks ADD COLUMN hero TEXT;
    END IF;

    -- Add obstacles column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'obstacles'
    ) THEN
        ALTER TABLE tasks ADD COLUMN obstacles TEXT[] DEFAULT '{}';
    END IF;

    -- Add win_condition column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'win_condition'
    ) THEN
        ALTER TABLE tasks ADD COLUMN win_condition TEXT;
    END IF;

    -- Add reward column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'reward'
    ) THEN
        ALTER TABLE tasks ADD COLUMN reward TEXT;
    END IF;
END $$;
