/*
  # Parklopedia Extended Schema Migration

  ## Overview
  This migration extends the database schema with all missing tables for advanced features
  including family groups, rewards system, emergency management, challans, insurance tracking,
  compliance documents, event parking, notifications, and more.

  ## New Tables Added

  ### Family & Social Features
  - family_groups: Family sharing and group management
  - family_members: Members within family groups
  - shared_vehicles: Vehicles shared within family groups

  ### Rewards & Gamification
  - user_achievements: Achievement tracking
  - user_stats: User statistics and streaks
  - rewards: Points and rewards system
  - reward_redemptions: Reward redemption history

  ### Emergency & Safety
  - emergency_contacts: Emergency contact information
  - emergency_logs: Emergency incident logging
  - sos_requests: SOS emergency requests

  ### Traffic & Compliance
  - challans: Traffic violation records
  - challan_payments: Challan payment tracking
  - insurance_policies: Insurance policy management
  - insurance_claims: Insurance claim processing

  ### Compliance & Documentation
  - compliance_documents: Regulatory compliance documents
  - compliance_audits: Compliance audit trails
  - vehicle_inspections: Vehicle inspection records

  ### Event & Special Parking
  - event_parking: Special event parking management
  - parking_reservations: Advanced reservation system
  - parking_zones: Parking zone management

  ### Notifications & Communication
  - notifications: Push notification system
  - notification_preferences: User notification settings
  - user_referrals: Referral program tracking
  - referral_uses: Referral usage records

  ### Advanced Features
  - vehicle_maintenance: Maintenance history and scheduling
  - maintenance_schedules: Scheduled maintenance tasks
  - fuel_logs: Fuel consumption tracking
  - trip_logs: Trip and mileage tracking
  - parking_history: Parking usage history
  - payment_methods: Saved payment methods
  - user_preferences: Detailed user preferences
*/

-- ===========================================
-- FAMILY & SOCIAL FEATURES
-- ===========================================

-- Family Groups Table
CREATE TABLE family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  max_members INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Family Members Table
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(family_group_id, user_id)
);

-- Shared Vehicles Table
CREATE TABLE shared_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES users(id),
  permissions JSONB DEFAULT '{"can_book": true, "can_view": true, "can_edit": false}',
  shared_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(family_group_id, vehicle_id)
);

-- ===========================================
-- REWARDS & GAMIFICATION
-- ===========================================

-- User Achievements Table
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  points_awarded INTEGER DEFAULT 0,
  badge_url TEXT,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, achievement_type)
);

-- User Stats Table
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  achievements_count INTEGER DEFAULT 0,
  referrals_count INTEGER DEFAULT 0,
  bookings_count INTEGER DEFAULT 0,
  documents_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Rewards Table (Points System)
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_awarded INTEGER NOT NULL,
  points_spent INTEGER DEFAULT 0,
  action_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reward Redemptions Table
CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  reward_value TEXT NOT NULL,
  points_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'delivered', 'cancelled')),
  delivery_info JSONB DEFAULT '{}',
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ
);

-- ===========================================
-- EMERGENCY & SAFETY
-- ===========================================

-- Emergency Contacts Table
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Emergency Logs Table
CREATE TABLE emergency_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id),
  emergency_type TEXT NOT NULL,
  location JSONB,
  description TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'responding', 'resolved', 'cancelled')),
  responders_notified JSONB DEFAULT '[]',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SOS Requests Table
CREATE TABLE sos_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id),
  location JSONB NOT NULL,
  emergency_type TEXT DEFAULT 'general',
  message TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'responding', 'resolved', 'cancelled')),
  responders JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- ===========================================
-- TRAFFIC & COMPLIANCE
-- ===========================================

-- Challans Table (Traffic Violations)
CREATE TABLE challans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  challan_number TEXT NOT NULL UNIQUE,
  violation_type TEXT NOT NULL,
  violation_date DATE NOT NULL,
  location TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'disputed', 'cancelled')),
  due_date DATE,
  description TEXT,
  officer_details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Challan Payments Table
CREATE TABLE challan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challan_id UUID NOT NULL REFERENCES challans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  transaction_id TEXT,
  payment_date TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

-- Insurance Policies Table
CREATE TABLE insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  policy_number TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  coverage_amount DECIMAL(12,2),
  premium_amount DECIMAL(10,2),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  policy_document_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insurance Claims Table
CREATE TABLE insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES insurance_policies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  claim_number TEXT NOT NULL UNIQUE,
  incident_date DATE NOT NULL,
  claim_type TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_amount DECIMAL(12,2),
  approved_amount DECIMAL(12,2),
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'paid')),
  documents JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- COMPLIANCE & DOCUMENTATION
-- ===========================================

-- Compliance Documents Table
CREATE TABLE compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id),
  document_type TEXT NOT NULL,
  document_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'expiring_soon', 'expired', 'pending_review')),
  file_url TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Compliance Audits Table
CREATE TABLE compliance_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id),
  audit_type TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'failed')),
  scheduled_date DATE,
  completed_date DATE,
  auditor_id UUID REFERENCES users(id),
  findings JSONB DEFAULT '[]',
  recommendations TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vehicle Inspections Table
CREATE TABLE vehicle_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL,
  inspector_name TEXT,
  inspection_date DATE NOT NULL,
  expiry_date DATE,
  status TEXT DEFAULT 'passed' CHECK (status IN ('passed', 'failed', 'pending', 'expired')),
  findings JSONB DEFAULT '[]',
  recommendations TEXT,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- EVENT & SPECIAL PARKING
-- ===========================================

-- Event Parking Table
CREATE TABLE event_parking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  venue TEXT NOT NULL,
  organizer_id UUID REFERENCES users(id),
  total_spots INTEGER NOT NULL,
  available_spots INTEGER NOT NULL,
  price_per_hour DECIMAL(8,2) DEFAULT 0,
  description TEXT,
  rules TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Parking Reservations Table
CREATE TABLE parking_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  parking_spot_id UUID REFERENCES parking_spots(id),
  event_parking_id UUID REFERENCES event_parking(id),
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  total_amount DECIMAL(8,2),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Parking Zones Table
CREATE TABLE parking_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name TEXT NOT NULL,
  zone_code TEXT NOT NULL UNIQUE,
  location JSONB NOT NULL,
  total_spots INTEGER NOT NULL,
  available_spots INTEGER NOT NULL,
  zone_type TEXT DEFAULT 'public' CHECK (zone_type IN ('public', 'private', 'vip', 'disabled')),
  pricing JSONB DEFAULT '{}',
  operating_hours JSONB DEFAULT '{}',
  features JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- NOTIFICATIONS & COMMUNICATION
-- ===========================================

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notification Preferences Table
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  document_reminders BOOLEAN DEFAULT true,
  payment_reminders BOOLEAN DEFAULT true,
  booking_confirmations BOOLEAN DEFAULT true,
  emergency_alerts BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  weekly_digest BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- User Referrals Table
CREATE TABLE user_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  total_referrals INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Referral Uses Table
CREATE TABLE referral_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(referee_id)
);

-- ===========================================
-- ADVANCED FEATURES
-- ===========================================

-- Vehicle Maintenance Table
CREATE TABLE vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE,
  completed_date DATE,
  next_due_date DATE,
  cost DECIMAL(10,2),
  mileage INTEGER,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'overdue', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  service_provider TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Maintenance Schedules Table
CREATE TABLE maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL,
  frequency_months INTEGER,
  frequency_mileage INTEGER,
  last_completed DATE,
  next_due DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fuel Logs Table
CREATE TABLE fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  fuel_date DATE NOT NULL,
  fuel_type TEXT NOT NULL,
  quantity DECIMAL(6,2) NOT NULL,
  cost_per_unit DECIMAL(6,2),
  total_cost DECIMAL(8,2) NOT NULL,
  mileage INTEGER,
  fuel_station TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trip Logs Table
CREATE TABLE trip_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  trip_date DATE NOT NULL,
  start_location TEXT,
  end_location TEXT,
  distance_km DECIMAL(8,2),
  duration_minutes INTEGER,
  purpose TEXT,
  cost DECIMAL(8,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Parking History Table
CREATE TABLE parking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  parking_spot_id UUID REFERENCES parking_spots(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_hours DECIMAL(6,2),
  total_cost DECIMAL(8,2),
  payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'failed')),
  location JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payment Methods Table
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('card', 'upi', 'net_banking', 'wallet')),
  provider TEXT,
  last_four TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Preferences Table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'INR',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  notifications JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  accessibility JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- Family & Social Indexes
CREATE INDEX idx_family_groups_owner_id ON family_groups(owner_id);
CREATE INDEX idx_family_members_family_group_id ON family_members(family_group_id);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_shared_vehicles_family_group_id ON shared_vehicles(family_group_id);
CREATE INDEX idx_shared_vehicles_vehicle_id ON shared_vehicles(vehicle_id);

-- Rewards & Gamification Indexes
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX idx_rewards_user_id ON rewards(user_id);
CREATE INDEX idx_reward_redemptions_user_id ON reward_redemptions(user_id);

-- Emergency & Safety Indexes
CREATE INDEX idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX idx_emergency_logs_user_id ON emergency_logs(user_id);
CREATE INDEX idx_sos_requests_user_id ON sos_requests(user_id);
CREATE INDEX idx_sos_requests_status ON sos_requests(status);

-- Traffic & Compliance Indexes
CREATE INDEX idx_challans_user_id ON challans(user_id);
CREATE INDEX idx_challans_vehicle_id ON challans(vehicle_id);
CREATE INDEX idx_challans_status ON challans(status);
CREATE INDEX idx_challan_payments_challan_id ON challan_payments(challan_id);
CREATE INDEX idx_insurance_policies_user_id ON insurance_policies(user_id);
CREATE INDEX idx_insurance_policies_vehicle_id ON insurance_policies(vehicle_id);
CREATE INDEX idx_insurance_claims_policy_id ON insurance_claims(policy_id);

-- Compliance & Documentation Indexes
CREATE INDEX idx_compliance_documents_user_id ON compliance_documents(user_id);
CREATE INDEX idx_compliance_documents_vehicle_id ON compliance_documents(vehicle_id);
CREATE INDEX idx_compliance_audits_user_id ON compliance_audits(user_id);
CREATE INDEX idx_vehicle_inspections_user_id ON vehicle_inspections(user_id);
CREATE INDEX idx_vehicle_inspections_vehicle_id ON vehicle_inspections(vehicle_id);

-- Event & Special Parking Indexes
CREATE INDEX idx_event_parking_event_date ON event_parking(event_date);
CREATE INDEX idx_parking_reservations_user_id ON parking_reservations(user_id);
CREATE INDEX idx_parking_reservations_date ON parking_reservations(reservation_date);
CREATE INDEX idx_parking_zones_zone_type ON parking_zones(zone_type);

-- Notifications & Communication Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_user_referrals_referral_code ON user_referrals(referral_code);
CREATE INDEX idx_referral_uses_referrer_id ON referral_uses(referrer_id);

-- Advanced Features Indexes
CREATE INDEX idx_vehicle_maintenance_user_id ON vehicle_maintenance(user_id);
CREATE INDEX idx_vehicle_maintenance_vehicle_id ON vehicle_maintenance(vehicle_id);
CREATE INDEX idx_maintenance_schedules_vehicle_id ON maintenance_schedules(vehicle_id);
CREATE INDEX idx_fuel_logs_vehicle_id ON fuel_logs(vehicle_id);
CREATE INDEX idx_trip_logs_vehicle_id ON trip_logs(vehicle_id);
CREATE INDEX idx_parking_history_user_id ON parking_history(user_id);
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);

-- ===========================================
-- UPDATED AT TRIGGERS
-- ===========================================

-- Add updated_at triggers for all new tables
CREATE TRIGGER update_family_groups_updated_at BEFORE UPDATE ON family_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_logs_updated_at BEFORE UPDATE ON emergency_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challans_updated_at BEFORE UPDATE ON challans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_policies_updated_at BEFORE UPDATE ON insurance_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_claims_updated_at BEFORE UPDATE ON insurance_claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_documents_updated_at BEFORE UPDATE ON compliance_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_audits_updated_at BEFORE UPDATE ON compliance_audits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_inspections_updated_at BEFORE UPDATE ON vehicle_inspections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_parking_updated_at BEFORE UPDATE ON event_parking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parking_reservations_updated_at BEFORE UPDATE ON parking_reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parking_zones_updated_at BEFORE UPDATE ON parking_zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_referrals_updated_at BEFORE UPDATE ON user_referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_maintenance_updated_at BEFORE UPDATE ON vehicle_maintenance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
