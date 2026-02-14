
-- Add points column to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Create badges table
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    badge_type TEXT NOT NULL, -- 'FIRST_REPORT', 'HELPER', 'RESOLVER'
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_type)
);

-- Function to add points
CREATE OR REPLACE FUNCTION add_points(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET points = points + amount
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Points for New Report (+50)
CREATE OR REPLACE FUNCTION handle_new_report_points()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM add_points(NEW.user_id, 50);
    
    -- Check for First Report Badge
    IF (SELECT count(*) FROM reports WHERE user_id = NEW.user_id) = 1 THEN
        INSERT INTO user_badges (user_id, badge_type)
        VALUES (NEW.user_id, 'FIRST_REPORT')
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_report_created ON reports;
CREATE TRIGGER on_report_created
AFTER INSERT ON reports
FOR EACH ROW EXECUTE FUNCTION handle_new_report_points();

-- Trigger: Points for New Comment (+10)
CREATE OR REPLACE FUNCTION handle_new_comment_points()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM add_points(NEW.user_id, 10);
    
    -- Check for Helper Badge (5 comments)
    IF (SELECT count(*) FROM comments WHERE user_id = NEW.user_id) = 5 THEN
        INSERT INTO user_badges (user_id, badge_type)
        VALUES (NEW.user_id, 'HELPER')
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_comment_created ON comments;
CREATE TRIGGER on_comment_created
AFTER INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION handle_new_comment_points();
