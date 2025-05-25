-- Add planner-related fields to tasks table
ALTER TABLE tasks
ADD COLUMN scheduled_day DATE,
ADD COLUMN estimated_minutes INT;
 
-- Create an index for faster queries by scheduled_day
CREATE INDEX idx_tasks_scheduled_day ON tasks(scheduled_day); 