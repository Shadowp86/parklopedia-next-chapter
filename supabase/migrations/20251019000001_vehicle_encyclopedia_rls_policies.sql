-- Phase 10.1: Row Level Security Policies for Vehicle Encyclopedia
-- Comprehensive RLS policies for secure multi-tenant access

-- Enable RLS on all tables
ALTER TABLE vehicles_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_bookmarks ENABLE ROW LEVEL SECURITY;

-- Vehicles Catalog: Read-only for all authenticated users
CREATE POLICY "vehicles_catalog_select" ON vehicles_catalog
    FOR SELECT USING (true);

-- Vehicle Variants: Read-only for all authenticated users
CREATE POLICY "vehicle_variants_select" ON vehicle_variants
    FOR SELECT USING (true);

-- Vehicle Reviews: Authenticated users can read all, but only edit their own
CREATE POLICY "vehicle_reviews_select" ON vehicle_reviews
    FOR SELECT USING (true);

CREATE POLICY "vehicle_reviews_insert" ON vehicle_reviews
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "vehicle_reviews_update" ON vehicle_reviews
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "vehicle_reviews_delete" ON vehicle_reviews
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Vehicle Comparisons: Users can manage their own comparisons
CREATE POLICY "vehicle_comparisons_select" ON vehicle_comparisons
    FOR SELECT USING (auth.uid()::text = user_id::text OR user_id IS NULL);

CREATE POLICY "vehicle_comparisons_insert" ON vehicle_comparisons
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text OR user_id IS NULL);

CREATE POLICY "vehicle_comparisons_update" ON vehicle_comparisons
    FOR UPDATE USING (auth.uid()::text = user_id::text OR user_id IS NULL);

CREATE POLICY "vehicle_comparisons_delete" ON vehicle_comparisons
    FOR DELETE USING (auth.uid()::text = user_id::text OR user_id IS NULL);

-- Vehicle Alerts: Users can manage their own alerts
CREATE POLICY "vehicle_alerts_select" ON vehicle_alerts
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "vehicle_alerts_insert" ON vehicle_alerts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "vehicle_alerts_update" ON vehicle_alerts
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "vehicle_alerts_delete" ON vehicle_alerts
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Vehicle News: Read-only for all users
CREATE POLICY "vehicle_news_select" ON vehicle_news
    FOR SELECT USING (true);

-- Vehicle Bookmarks: Users can manage their own bookmarks
CREATE POLICY "vehicle_bookmarks_select" ON vehicle_bookmarks
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "vehicle_bookmarks_insert" ON vehicle_bookmarks
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "vehicle_bookmarks_delete" ON vehicle_bookmarks
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create admin role policies (for future admin console)
-- These will be updated when admin roles are implemented

-- Function to check if user is admin (placeholder for future implementation)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Placeholder: will be updated when admin system is implemented
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies for content management (will be activated when admin console is ready)
-- CREATE POLICY "vehicle_news_admin_all" ON vehicle_news
--     FOR ALL USING (is_admin(auth.uid()));

-- CREATE POLICY "vehicles_catalog_admin_all" ON vehicles_catalog
--     FOR ALL USING (is_admin(auth.uid()));

-- Create indexes for RLS performance
CREATE INDEX idx_vehicle_reviews_user_id_rls ON vehicle_reviews(user_id);
CREATE INDEX idx_vehicle_comparisons_user_id_rls ON vehicle_comparisons(user_id);
CREATE INDEX idx_vehicle_alerts_user_id_rls ON vehicle_alerts(user_id);
CREATE INDEX idx_vehicle_bookmarks_user_id_rls ON vehicle_bookmarks(user_id);
