
-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    type TEXT NOT NULL, -- 'COMMENT', 'STATUS_CHANGE', 'ACHIEVEMENT'
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger: Notify followers on new comment
CREATE OR REPLACE FUNCTION handle_new_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    report_title TEXT;
    follower_id UUID;
BEGIN
    -- Get report title
    SELECT title INTO report_title FROM reports WHERE id = NEW.report_id;

    -- Loop through followers (excluding the commenter)
    FOR follower_id IN 
        SELECT user_id FROM follows 
        WHERE report_id = NEW.report_id 
        AND user_id != NEW.user_id
    LOOP
        INSERT INTO notifications (user_id, type, message, link)
        VALUES (
            follower_id,
            'COMMENT',
            'New comment on: ' || report_title,
            '/report/' || NEW.report_id
        );
    END LOOP;
    
    -- Also notify report owner if they are not the commenter
    IF (SELECT user_id FROM reports WHERE id = NEW.report_id) != NEW.user_id THEN
         INSERT INTO notifications (user_id, type, message, link)
        VALUES (
            (SELECT user_id FROM reports WHERE id = NEW.report_id),
            'COMMENT',
            'New comment on your report: ' || report_title,
            '/report/' || NEW.report_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_comment_notify ON comments;
CREATE TRIGGER on_comment_notify
AFTER INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION handle_new_comment_notification();

-- Trigger: Notify owner on status change
CREATE OR REPLACE FUNCTION handle_status_change_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO notifications (user_id, type, message, link)
        VALUES (
            NEW.user_id,
            'STATUS_CHANGE',
            'Your report status changed to ' || NEW.status,
            '/report/' || NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_status_change_notify ON reports;
CREATE TRIGGER on_status_change_notify
AFTER UPDATE ON reports
FOR EACH ROW EXECUTE FUNCTION handle_status_change_notification();
