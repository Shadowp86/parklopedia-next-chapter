-- Migration: Extend Schema with Advanced Features for Parklopedia
-- Description: Adds tables for family groups, rewards, emergency logs, challans, insurance tracking, compliance documents, event parking, and other advanced features
-- Created: 2025-10-16

-- ===========================================
-- FAMILY GROUPS (Family Sharing Feature)
-- ===========================================

CREATE TABLE IF NOT EXISTS family_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  max_members integer DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS family_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id uuid REFERENCES family_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member', -- owner, admin, member
  joined_at timestamptz DEFAULT now(),
  UNIQUE(family_group_id, user_id)
);

-- ===========================================
-- REWARDS & GAMIFICATION
-- ===========================================

CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reward_type text NOT NULL, -- parking_savings, safe_driving, referral, etc.
  points integer NOT NULL DEFAULT 0,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  earned_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reward_id uuid REFERENCES rewards(id) ON DELETE SET NULL,
  redemption_type text NOT NULL, -- discount, cashback, free_parking, etc.
  amount decimal(10, 2),
  status text DEFAULT 'pending', -- pending, approved, rejected, completed
  redeemed_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- ===========================================
-- EMERGENCY LOGS & CONTACTS
-- ===========================================

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  relationship text, -- spouse, parent, sibling, friend, etc.
  priority integer DEFAULT 1, -- 1=primary, 2=secondary, etc.
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emergency_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  incident_type text NOT NULL, -- breakdown, accident, theft, medical, etc.
  location jsonb, -- GPS coordinates and address
  description text,
  severity text DEFAULT 'medium', -- low, medium, high, critical
  status text DEFAULT 'reported', -- reported, in_progress, resolved
  emergency_contacts_notified jsonb DEFAULT '[]'::jsonb, -- array of contacted emergency contact IDs
  authorities_notified boolean DEFAULT false,
  reported_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- ===========================================
-- CHALLANS (Traffic Violations)
-- ===========================================

CREATE TABLE IF NOT EXISTS challans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  challan_number text UNIQUE NOT NULL,
  violation_type text NOT NULL, -- speeding, parking, signal_jump, etc.
  location text,
  amount decimal(10, 2) NOT NULL,
  status text DEFAULT 'pending', -- pending, paid, disputed, waived
  issue_date date NOT NULL,
  due_date date,
  paid_date date,
  payment_reference text,
  document_url text, -- challan document URL
  dispute_reason text,
  dispute_status text, -- none, filed, resolved, rejected
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================================
-- INSURANCE TRACKING
-- ===========================================

CREATE TABLE IF NOT EXISTS insurance_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  policy_number text UNIQUE NOT NULL,
  provider_name text NOT NULL,
  policy_type text NOT NULL, -- comprehensive, third_party, own_damage
  coverage_amount decimal(12, 2),
  premium_amount decimal(10, 2),
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'active', -- active, expired, cancelled, claimed
  document_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS insurance_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insurance_policy_id uuid REFERENCES insurance_policies(id) ON DELETE CASCADE NOT NULL,
  claim_number text UNIQUE,
  incident_date date NOT NULL,
  claim_type text NOT NULL, -- accident, theft, damage, etc.
  claim_amount decimal(12, 2),
  approved_amount decimal(12, 2),
  status text DEFAULT 'filed', -- filed, under_review, approved, rejected, paid
  description text,
  document_urls jsonb DEFAULT '[]'::jsonb,
  filed_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- ===========================================
-- COMPLIANCE DOCUMENTS
-- ===========================================

CREATE TABLE IF NOT EXISTS compliance_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  document_type text NOT NULL, -- rto_registration, fitness_certificate, permit, etc.
  document_number text,
  issuing_authority text,
  issue_date date,
  expiry_date date,
  status text DEFAULT 'valid', -- valid, expired, expiring_soon, suspended
  compliance_status text DEFAULT 'compliant', -- compliant, non_compliant, pending_verification
  document_url text,
  verification_status text DEFAULT 'pending', -- pending, verified, rejected
  verified_by text,
  verified_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================================
-- EVENT PARKING
-- ===========================================

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  event_type text NOT NULL, -- concert, sports, festival, corporate, etc.
  venue_name text NOT NULL,
  address text NOT NULL,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  expected_attendees integer,
  parking_capacity integer,
  organizer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status text DEFAULT 'upcoming', -- upcoming, active, completed, cancelled
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_parking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  parking_spot_id uuid REFERENCES parking_spots(id) ON DELETE CASCADE,
  zone_name text, -- VIP, General, Reserved, etc.
  capacity integer NOT NULL,
  available_spots integer NOT NULL,
  hourly_rate decimal(10, 2),
  daily_rate decimal(10, 2),
  features jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================================
-- NOTIFICATIONS SYSTEM
-- ===========================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL, -- booking, payment, reminder, alert, promotion
  priority text DEFAULT 'normal', -- low, normal, high, urgent
  is_read boolean DEFAULT false,
  read_at timestamptz,
  action_url text, -- URL to redirect on click
  action_text text, -- button text for action
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ===========================================
-- USER PREFERENCES
-- ===========================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL, -- notifications, privacy, parking, payments, etc.
  preference_key text NOT NULL,
  preference_value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category, preference_key)
);

-- ===========================================
-- VEHICLE MAINTENANCE
-- ===========================================

CREATE TABLE IF NOT EXISTS vehicle_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  maintenance_type text NOT NULL, -- oil_change, tire_rotation, brake_service, etc.
  service_provider text,
  description text,
  cost decimal(10, 2),
  mileage integer,
  next_service_mileage integer,
  next_service_date date,
  status text DEFAULT 'completed', -- scheduled, in_progress, completed, overdue
  document_urls jsonb DEFAULT '[]'::jsonb,
  performed_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- ===========================================
-- PARKING HISTORY
-- ===========================================

CREATE TABLE IF NOT EXISTS parking_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  parking_spot_id uuid REFERENCES parking_spots(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration_hours decimal(6, 2),
  amount decimal(10, 2),
  status text DEFAULT 'completed', -- active, completed, cancelled
  location jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ===========================================
-- PAYMENT METHODS
-- ===========================================

CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  method_type text NOT NULL, -- card, upi, wallet, net_banking
  provider text, -- visa, mastercard, gpay, phonepe, etc.
  last_four text, -- last 4 digits for cards
  token text, -- encrypted token for payment processing
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_family_groups_owner_id ON family_groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_family_group_members_user_id ON family_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_group_members_family_group_id ON family_group_members(family_group_id);

CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_type ON rewards(reward_type);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON reward_redemptions(user_id);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_logs_user_id ON emergency_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_logs_status ON emergency_logs(status);

CREATE INDEX IF NOT EXISTS idx_challans_user_id ON challans(user_id);
CREATE INDEX IF NOT EXISTS idx_challans_status ON challans(status);
CREATE INDEX IF NOT EXISTS idx_challans_due_date ON challans(due_date);

CREATE INDEX IF NOT EXISTS idx_insurance_policies_user_id ON insurance_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_end_date ON insurance_policies(end_date);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_policy_id ON insurance_claims(insurance_policy_id);

CREATE INDEX IF NOT EXISTS idx_compliance_documents_user_id ON compliance_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_expiry ON compliance_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_status ON compliance_documents(status);

CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_event_parking_event_id ON event_parking(event_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_vehicle_id ON vehicle_maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_next_service ON vehicle_maintenance(next_service_date);

CREATE INDEX IF NOT EXISTS idx_parking_history_user_id ON parking_history(user_id);
CREATE INDEX IF NOT EXISTS idx_parking_history_start_time ON parking_history(start_time);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);

-- ===========================================
-- ENABLE ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_parking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS POLICIES
-- ===========================================

-- Family Groups
CREATE POLICY "Users can view family groups they own or are members of"
  ON family_groups FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT family_group_id FROM family_group_members
      WHERE user_id = auth.uid()
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

-- Family Group Members
CREATE POLICY "Users can view members of groups they belong to"
  ON family_group_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    family_group_id IN (
      SELECT id FROM family_groups WHERE owner_id = auth.uid()
    ) OR
    family_group_id IN (
      SELECT family_group_id FROM family_group_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group owners can manage members"
  ON family_group_members FOR ALL
  TO authenticated
  USING (
    family_group_id IN (
      SELECT id FROM family_groups WHERE owner_id = auth.uid()
    )
  );

-- Rewards
CREATE POLICY "Users can view their own rewards"
  ON rewards FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert rewards"
  ON rewards FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Emergency Contacts
CREATE POLICY "Users can manage their emergency contacts"
  ON emergency_contacts FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Emergency Logs
CREATE POLICY "Users can view and create their emergency logs"
  ON emergency_logs FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Challans
CREATE POLICY "Users can view and manage their challans"
  ON challans FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Insurance Policies
CREATE POLICY "Users can manage their insurance policies"
  ON insurance_policies FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Compliance Documents
CREATE POLICY "Users can manage their compliance documents"
  ON compliance_documents FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Events (Public read, authenticated create)
CREATE POLICY "Anyone can view upcoming and active events"
  ON events FOR SELECT
  TO authenticated
  USING (status IN ('upcoming', 'active'));

CREATE POLICY "Users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Event organizers can update their events"
  ON events FOR UPDATE
  TO authenticated
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

-- Notifications
CREATE POLICY "Users can manage their notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User Preferences
CREATE POLICY "Users can manage their preferences"
  ON user_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Vehicle Maintenance
CREATE POLICY "Users can manage maintenance for their vehicles"
  ON vehicle_maintenance FOR ALL
  TO authenticated
  USING (
    vehicle_id IN (
      SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    vehicle_id IN (
      SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
  );

-- Parking History
CREATE POLICY "Users can view their parking history"
  ON parking_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert parking history"
  ON parking_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Payment Methods
CREATE POLICY "Users can manage their payment methods"
  ON payment_methods FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ===========================================
-- TRIGGERS FOR UPDATED_AT
-- ===========================================

CREATE TRIGGER update_family_groups_updated_at BEFORE UPDATE ON family_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challans_updated_at BEFORE UPDATE ON challans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_policies_updated_at BEFORE UPDATE ON insurance_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_documents_updated_at BEFORE UPDATE ON compliance_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_parking_updated_at BEFORE UPDATE ON event_parking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- FUNCTIONS AND TRIGGERS FOR BUSINESS LOGIC
-- ===========================================

-- Function to update document status based on expiry
CREATE OR REPLACE FUNCTION update_document_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update documents status
  UPDATE documents
  SET status = CASE
    WHEN expiry_date IS NULL THEN 'valid'
    WHEN expiry_date < CURRENT_DATE THEN 'expired'
    WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    ELSE 'valid'
  END
  WHERE expiry_date IS NOT NULL;

  -- Update compliance documents status
  UPDATE compliance_documents
  SET status = CASE
    WHEN expiry_date IS NULL THEN 'valid'
    WHEN expiry_date < CURRENT_DATE THEN 'expired'
    WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    ELSE 'valid'
  END
  WHERE expiry_date IS NOT NULL;

  -- Update insurance policies status
  UPDATE insurance_policies
  SET status = CASE
    WHEN end_date < CURRENT_DATE THEN 'expired'
    ELSE 'active'
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update document statuses
CREATE TRIGGER trigger_update_document_status
  AFTER INSERT OR UPDATE ON documents
  FOR EACH STATEMENT EXECUTE FUNCTION update_document_status();

CREATE TRIGGER trigger_update_compliance_status
  AFTER INSERT OR UPDATE ON compliance_documents
  FOR EACH STATEMENT EXECUTE FUNCTION update_document_status();

CREATE TRIGGER trigger_update_insurance_status
  AFTER INSERT OR UPDATE ON insurance_policies
  FOR EACH STATEMENT EXECUTE FUNCTION update_document_status();

-- Function to create notification for expiring documents
CREATE OR REPLACE FUNCTION notify_expiring_documents()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify about expiring documents
  IF NEW.status = 'expiring_soon' AND OLD.status != 'expiring_soon' THEN
    INSERT INTO notifications (user_id, title, message, notification_type, priority, action_url)
    VALUES (
      NEW.user_id,
      'Document Expiring Soon',
      'Your ' || NEW.document_type || ' document is expiring within 30 days',
      'reminder',
      'high',
      '/documents'
    );
  END IF;

  -- Notify about expired documents
  IF NEW.status = 'expired' AND OLD.status != 'expired' THEN
    INSERT INTO notifications (user_id, title, message, notification_type, priority, action_url)
    VALUES (
      NEW.user_id,
      'Document Expired',
      'Your ' || NEW.document_type || ' document has expired',
      'alert',
      'urgent',
      '/documents'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for document expiry notifications
CREATE TRIGGER trigger_notify_expiring_documents
  AFTER UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION notify_expiring_documents();

-- Function to award parking rewards
CREATE OR REPLACE FUNCTION award_parking_rewards()
RETURNS TRIGGER AS $$
BEGIN
  -- Award points for completed parking bookings
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO rewards (user_id, reward_type, points, description)
    VALUES (
      NEW.user_id,
      'parking_completed',
      10,
      'Points for completing parking booking'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for parking rewards
CREATE TRIGGER trigger_award_parking_rewards
  AFTER UPDATE ON bookings
  FOR EACH ROW
  WHEN (NEW.booking_type = 'parking')
  EXECUTE FUNCTION award_parking_rewards();
