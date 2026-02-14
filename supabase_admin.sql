-- Add admin and ban columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- Add hidden column to reports
ALTER TABLE reports ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Policies for hidden reports
-- Only admins or the owner can see hidden reports
CREATE POLICY "Hidden reports are viewable by admins and owners" 
ON reports FOR SELECT 
USING (
    is_hidden = FALSE 
    OR 
    auth.uid() = user_id 
    OR 
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = TRUE
);

-- Policies for Admin Actions
-- Admins can update any report (to hide/unhide)
CREATE POLICY "Admins can update reports" 
ON reports FOR UPDATE 
USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = TRUE);

-- Admins can update profiles (to ban/unban)
CREATE POLICY "Admins can update profiles" 
ON profiles FOR UPDATE 
USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = TRUE);


-- Trigger: Resolver Badge (2 Resolved Reports)
CREATE OR REPLACE FUNCTION handle_status_change_badge()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changed to CLOSED
    IF OCR.status != 'CLOSED' AND NEW.status = 'CLOSED' THEN
        -- Check if user has 2 CLOSED reports
        IF (SELECT count(*) FROM reports WHERE user_id = NEW.user_id AND status = 'CLOSED') >= 2 THEN
             INSERT INTO user_badges (user_id, badge_type)
            VALUES (NEW.user_id, 'RESOLVER')
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_report_status_badge ON reports;
CREATE TRIGGER on_report_status_badge
AFTER UPDATE ON reports
FOR EACH ROW EXECUTE FUNCTION handle_status_change_badge();
