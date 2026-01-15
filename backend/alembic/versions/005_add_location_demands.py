-- Migration: Create location_demands table
-- Date: 2026-01-15
-- Description: Adds the location_demands table for flexible demand management per location

-- Create enum for demand priority
DO $$ BEGIN
    CREATE TYPE demand_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for demand status
DO $$ BEGIN
    CREATE TYPE demand_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the location_demands table
CREATE TABLE IF NOT EXISTS location_demands (
    id SERIAL PRIMARY KEY,

    -- Relationships
    project_location_id INTEGER NOT NULL REFERENCES project_locations(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Demand data
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority demand_priority DEFAULT 'medium' NOT NULL,
    status demand_status DEFAULT 'pending' NOT NULL,
    category VARCHAR(100),

    -- Responsible users
    assigned_user_id INTEGER REFERENCES users(id),
    created_by_user_id INTEGER REFERENCES users(id),

    -- Dates
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Agenda integration
    agenda_event_id INTEGER REFERENCES agenda_events(id) ON DELETE SET NULL,

    -- Notes and attachments
    notes TEXT,
    attachments_json JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_location_demands_project_location ON location_demands(project_location_id);
CREATE INDEX IF NOT EXISTS idx_location_demands_project ON location_demands(project_id);
CREATE INDEX IF NOT EXISTS idx_location_demands_assigned_user ON location_demands(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_location_demands_due_date ON location_demands(due_date);
CREATE INDEX IF NOT EXISTS idx_location_demands_status ON location_demands(status);
CREATE INDEX IF NOT EXISTS idx_location_demands_priority ON location_demands(priority);

-- Add comment to table
COMMENT ON TABLE location_demands IS 'Flexible demands/tasks associated with project locations, replacing the fixed production stages system';

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_location_demands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_location_demands_updated_at ON location_demands;
CREATE TRIGGER trigger_location_demands_updated_at
    BEFORE UPDATE ON location_demands
    FOR EACH ROW
    EXECUTE FUNCTION update_location_demands_updated_at();
