/*
  # Comprehensive RLS Policies Migration

  ## Overview
  This migration implements complete Row Level Security policies for all tables
  in the Parklopedia database, ensuring proper data isolation and security.

  ## Policy Structure
  - Users can only access their own data
  - Family group members can access shared resources
  - Public data (parking spots, services) is readable by authenticated users
  - Admin operations are restricted to appropriate roles
  - Emergency data has special access rules
*/

-- ===========================================
-- USERS TABLE POLICIES (already exists, but ensuring completeness)
-- ===========================================

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ===========================================
-- VEHICLES TABLE POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Users can view own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can insert own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Family members can view shared vehicles" ON vehicles;

CREATE POLICY "Users can view own vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles"
  ON vehicles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Family members can view vehicles shared with their family group
CREATE POLICY "Family members can view shared vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shared_vehicles sv
      JOIN family_members fm ON sv.family_group_id = fm.family_group_id
      WHERE sv.vehicle_id = vehicles.id
      AND fm.user_id = auth.uid()
    )
  );

-- ===========================================
-- DOCUMENTS TABLE POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ===========================================
-- FAMILY GROUPS POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Users can view family groups they belong to" ON family_groups;
DROP POLICY IF EXISTS "Users can create family groups" ON family_groups;
DROP POLICY IF EXISTS "Family group owners can update their groups" ON family_groups;
DROP POLICY IF EXISTS "Family group owners can delete their groups" ON family_groups;

CREATE POLICY "Users can view family groups they belong to"
  ON family_groups FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_group_id = family_groups.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create family groups"
  ON family_groups FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Family group owners can update their groups"
  ON family_groups FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Family group owners can delete their groups"
  ON family_groups FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ===========================================
-- FAMILY MEMBERS POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Users can view family members in their groups" ON family_members;
DROP POLICY IF EXISTS "Family group owners/admins can manage members" ON family_members;
DROP POLICY IF EXISTS "Users can join family groups" ON family_members;

CREATE POLICY "Users can view family members in their groups"
  ON family_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_group_id = family_members.family_group_id
      AND fm.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM family_groups fg
      WHERE fg.id = family_members.family_group_id
      AND fg.owner_id = auth.uid()
    )
  );

CREATE POLICY "Family group owners/admins can manage members"
  ON family_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_groups fg
      WHERE fg.id = family_members.family_group_id
      AND fg.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_group_id = family_members.family_group_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_groups fg
      WHERE fg.id = family_members.family_group_id
      AND fg.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_group_id = family_members.family_group_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can join family groups"
  ON family_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ===========================================
-- SHARED VEHICLES POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Family members can view shared vehicles" ON shared_vehicles;
DROP POLICY IF EXISTS "Users can share their vehicles" ON shared_vehicles;
DROP POLICY IF EXISTS "Vehicle owners can manage sharing" ON shared_vehicles;

CREATE POLICY "Family members can view shared vehicles"
  ON shared_vehicles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_group_id = shared_vehicles.family_group_id
      AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can share their vehicles"
  ON shared_vehicles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = shared_vehicles.vehicle_id
      AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "Vehicle owners can manage sharing"
  ON shared_vehicles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = shared_vehicles.vehicle_id
      AND v.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = shared_vehicles.vehicle_id
      AND v.user_id = auth.uid()
    )
  );

-- ===========================================
-- REWARDS & GAMIFICATION POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "System can insert achievements" ON user_achievements;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow service role to insert achievements (for edge functions)
CREATE POLICY "System can insert achievements"
  ON user_achievements FOR INSERT
  TO service_role
  WITH CHECK (true);

-- User Stats Policies
DROP POLICY IF EXISTS "Users can view own stats" ON user_stats;
DROP POLICY IF EXISTS "System can update user stats" ON user_stats;

CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can update user stats"
  ON user_stats FOR ALL
  TO service_role
  WITH CHECK (true);

-- Rewards Policies
DROP POLICY IF EXISTS "Users can view own rewards" ON rewards;
DROP POLICY IF EXISTS "System can insert rewards" ON rewards;

CREATE POLICY "Users can view own rewards"
  ON rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert rewards"
  ON rewards FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Reward Redemptions Policies
DROP POLICY IF EXISTS "Users can view own redemptions" ON reward_redemptions;
DROP POLICY IF EXISTS "Users can insert own redemptions" ON reward_redemptions;
DROP POLICY IF EXISTS "System can update redemptions" ON reward_redemptions;

CREATE POLICY "Users can view own redemptions"
  ON reward_redemptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own redemptions"
  ON reward_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update redemptions"
  ON reward_redemptions FOR UPDATE
  TO service_role
  WITH CHECK (true);

-- ===========================================
-- EMERGENCY & SAFETY POLICIES
-- ===========================================

-- Emergency Contacts Policies
DROP POLICY IF EXISTS "Users can manage own emergency contacts" ON emergency_contacts;

CREATE POLICY "Users can manage own emergency contacts"
  ON emergency_contacts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Emergency Logs Policies
DROP POLICY IF EXISTS "Users can view own emergency logs" ON emergency_logs;
DROP POLICY IF EXISTS "Emergency services can access logs" ON emergency_logs;

CREATE POLICY "Users can view own emergency logs"
  ON emergency_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow emergency services access (would need specific role)
CREATE POLICY "Emergency services can access logs"
  ON emergency_logs FOR ALL
  TO service_role
  WITH CHECK (true);

-- SOS Requests Policies
DROP POLICY IF EXISTS "Users can create SOS requests" ON sos_requests;
DROP POLICY IF EXISTS "Emergency services can manage SOS" ON sos_requests;

CREATE POLICY "Users can create SOS requests"
  ON sos_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Emergency services can manage SOS"
  ON sos_requests FOR ALL
  TO service_role
  WITH CHECK (true);

-- ===========================================
-- TRAFFIC & COMPLIANCE POLICIES
-- ===========================================

-- Challans Policies
DROP POLICY IF EXISTS "Users can view own challans" ON challans;
DROP POLICY IF EXISTS "Traffic authorities can manage challans" ON challans;

CREATE POLICY "Users can view own challans"
  ON challans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow traffic authorities to manage challans
CREATE POLICY "Traffic authorities can manage challans"
  ON challans FOR ALL
  TO service_role
  WITH CHECK (true);

-- Challan Payments Policies
DROP POLICY IF EXISTS "Users can view own challan payments" ON challan_payments;
DROP POLICY IF EXISTS "Users can insert own challan payments" ON challan_payments;

CREATE POLICY "Users can view own challan payments"
  ON challan_payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challan payments"
  ON challan_payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Insurance Policies Policies
DROP POLICY IF EXISTS "Users can manage own insurance policies" ON insurance_policies;

CREATE POLICY "Users can manage own insurance policies"
  ON insurance_policies FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insurance Claims Policies
DROP POLICY IF EXISTS "Users can manage own insurance claims" ON insurance_claims;

CREATE POLICY "Users can manage own insurance claims"
  ON insurance_claims FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- COMPLIANCE & DOCUMENTATION POLICIES
-- ===========================================

-- Compliance Documents Policies
DROP POLICY IF EXISTS "Users can manage own compliance documents" ON compliance_documents;
DROP POLICY IF EXISTS "Compliance officers can verify documents" ON compliance_documents;

CREATE POLICY "Users can manage own compliance documents"
  ON compliance_documents FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Compliance officers can verify documents"
  ON compliance_documents FOR UPDATE
  TO service_role
  WITH CHECK (true);

-- Compliance Audits Policies
DROP POLICY IF EXISTS "Users can view own compliance audits" ON compliance_audits;
DROP POLICY IF EXISTS "Auditors can manage compliance audits" ON compliance_audits;

CREATE POLICY "Users can view own compliance audits"
  ON compliance_audits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Auditors can manage compliance audits"
  ON compliance_audits FOR ALL
  TO service_role
  WITH CHECK (true);

-- Vehicle Inspections Policies
DROP POLICY IF EXISTS "Users can view own vehicle inspections" ON vehicle_inspections;
DROP POLICY IF EXISTS "Inspectors can manage vehicle inspections" ON vehicle_inspections;

CREATE POLICY "Users can view own vehicle inspections"
  ON vehicle_inspections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Inspectors can manage vehicle inspections"
  ON vehicle_inspections FOR ALL
  TO service_role
  WITH CHECK (true);

-- ===========================================
-- PARKING & BOOKINGS POLICIES
-- ===========================================

-- Parking Spots Policies (Public read)
DROP POLICY IF EXISTS "Anyone can view active parking spots" ON parking_spots;

CREATE POLICY "Anyone can view active parking spots"
  ON parking_spots FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Services Policies (Public read)
DROP POLICY IF EXISTS "Anyone can view active services" ON services;

CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Bookings Policies
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Payments Policies
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- EVENT PARKING POLICIES
-- ===========================================

-- Event Parking Policies (Public read for active events)
DROP POLICY IF EXISTS "Anyone can view active event parking" ON event_parking;
DROP POLICY IF EXISTS "Organizers can manage their events" ON event_parking;

CREATE POLICY "Anyone can view active event parking"
  ON event_parking FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Organizers can manage their events"
  ON event_parking FOR ALL
  TO authenticated
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

-- Parking Reservations Policies
DROP POLICY IF EXISTS "Users can view own reservations" ON parking_reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON parking_reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON parking_reservations;

CREATE POLICY "Users can view own reservations"
  ON parking_reservations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create reservations"
  ON parking_reservations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reservations"
  ON parking_reservations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- NOTIFICATIONS POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Notification Preferences Policies
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON notification_preferences;

CREATE POLICY "Users can manage own notification preferences"
  ON notification_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- REFERRAL SYSTEM POLICIES
-- ===========================================

-- User Referrals Policies
DROP POLICY IF EXISTS "Users can view own referral data" ON user_referrals;
DROP POLICY IF EXISTS "Users can create own referral codes" ON user_referrals;
DROP POLICY IF EXISTS "System can update referral stats" ON user_referrals;

CREATE POLICY "Users can view own referral data"
  ON user_referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own referral codes"
  ON user_referrals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update referral stats"
  ON user_referrals FOR UPDATE
  TO service_role
  WITH CHECK (true);

-- Referral Uses Policies
DROP POLICY IF EXISTS "Users can view referral uses they participated in" ON referral_uses;
DROP POLICY IF EXISTS "System can create referral uses" ON referral_uses;

CREATE POLICY "Users can view referral uses they participated in"
  ON referral_uses FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "System can create referral uses"
  ON referral_uses FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ===========================================
-- ADVANCED FEATURES POLICIES
-- ===========================================

-- Vehicle Maintenance Policies
DROP POLICY IF EXISTS "Users can manage own vehicle maintenance" ON vehicle_maintenance;

CREATE POLICY "Users can manage own vehicle maintenance"
  ON vehicle_maintenance FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fuel Logs Policies
DROP POLICY IF EXISTS "Users can manage own fuel logs" ON fuel_logs;

CREATE POLICY "Users can manage own fuel logs"
  ON fuel_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trip Logs Policies
DROP POLICY IF EXISTS "Users can manage own trip logs" ON trip_logs;

CREATE POLICY "Users can manage own trip logs"
  ON trip_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Parking History Policies
DROP POLICY IF EXISTS "Users can view own parking history" ON parking_history;

CREATE POLICY "Users can view own parking history"
  ON parking_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Payment Methods Policies
DROP POLICY IF EXISTS "Users can manage own payment methods" ON payment_methods;

CREATE POLICY "Users can manage own payment methods"
  ON payment_methods FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User Preferences Policies
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;

CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- ENABLE RLS ON ALL TABLES
-- ===========================================

-- Enable RLS on all new tables
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE challan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_parking ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
