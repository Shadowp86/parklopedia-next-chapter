/*
  # Parklopedia Initial Database Schema

  ## Overview
  This migration creates the foundational database structure for Parklopedia,
  a comprehensive vehicle and parking management solution.

  ## New Tables

  ### 1. `users`
  Stores user profile information linked to authentication provider (Clerk).
  - `id` (uuid, primary key) - Unique user identifier
  - `clerk_user_id` (text, unique) - Reference to Clerk authentication ID
  - `email` (text, unique) - User email address
  - `full_name` (text) - User's full name
  - `phone` (text) - Contact phone number
  - `date_of_birth` (date) - User's date of birth
  - `address` (text) - User's address
  - `role` (text) - User role (owner, driver, fleet_manager)
  - `avatar_url` (text) - Profile picture URL
  - `preferences` (jsonb) - User preferences (notifications, language, theme)
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `vehicles`
  Stores registered vehicle information.
  - `id` (uuid, primary key) - Unique vehicle identifier
  - `user_id` (uuid, foreign key) - Owner's user ID
  - `registration_number` (text, unique) - Vehicle registration/license plate
  - `brand` (text) - Vehicle manufacturer
  - `model` (text) - Vehicle model name
  - `variant` (text) - Specific variant/trim
  - `year` (integer) - Manufacturing year
  - `vehicle_type` (text) - Type (car, bike, truck, etc.)
  - `fuel_type` (text) - Fuel type (petrol, diesel, electric, hybrid)
  - `color` (text) - Vehicle color
  - `image_url` (text) - Vehicle photo URL
  - `current_mileage` (integer) - Current odometer reading
  - `created_at` (timestamptz) - Registration timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. `documents`
  Stores vehicle-related documents with secure references.
  - `id` (uuid, primary key) - Unique document identifier
  - `vehicle_id` (uuid, foreign key) - Associated vehicle
  - `user_id` (uuid, foreign key) - Document owner
  - `document_type` (text) - Type (rc, insurance, puc, license, etc.)
  - `document_number` (text) - Official document number
  - `file_url` (text) - Supabase Storage URL
  - `issue_date` (date) - Document issue date
  - `expiry_date` (date) - Document expiry date
  - `status` (text) - Status (valid, expiring_soon, expired)
  - `metadata` (jsonb) - Additional document metadata
  - `created_at` (timestamptz) - Upload timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. `parking_spots`
  Stores parking location information.
  - `id` (uuid, primary key) - Unique parking spot identifier
  - `name` (text) - Parking location name
  - `address` (text) - Full address
  - `latitude` (decimal) - GPS latitude
  - `longitude` (decimal) - GPS longitude
  - `total_capacity` (integer) - Total parking spaces
  - `available_spots` (integer) - Currently available spots
  - `hourly_rate` (decimal) - Price per hour
  - `daily_rate` (decimal) - Price per day
  - `features` (jsonb) - Features (ev_charging, 24x7, secured, roofed)
  - `rating` (decimal) - Average rating
  - `provider_id` (uuid) - Parking provider reference
  - `status` (text) - Status (active, inactive, full)
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 5. `bookings`
  Unified table for parking and service bookings.
  - `id` (uuid, primary key) - Unique booking identifier
  - `user_id` (uuid, foreign key) - User who made the booking
  - `vehicle_id` (uuid, foreign key) - Associated vehicle
  - `booking_type` (text) - Type (parking, service)
  - `parking_spot_id` (uuid, foreign key) - For parking bookings
  - `service_id` (uuid, foreign key) - For service bookings
  - `start_time` (timestamptz) - Booking start time
  - `end_time` (timestamptz) - Booking end time
  - `status` (text) - Status (pending, confirmed, in_progress, completed, cancelled)
  - `amount` (decimal) - Booking amount
  - `qr_code` (text) - QR code for entry/verification
  - `metadata` (jsonb) - Additional booking details
  - `created_at` (timestamptz) - Booking creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 6. `services`
  Stores available vehicle services.
  - `id` (uuid, primary key) - Unique service identifier
  - `service_type` (text) - Type (repair, wash, maintenance, roadside)
  - `provider_name` (text) - Service provider name
  - `description` (text) - Service description
  - `price` (decimal) - Service price
  - `duration` (integer) - Estimated duration in minutes
  - `address` (text) - Service location address
  - `latitude` (decimal) - GPS latitude
  - `longitude` (decimal) - GPS longitude
  - `rating` (decimal) - Average rating
  - `features` (jsonb) - Service features
  - `availability` (jsonb) - Available time slots
  - `status` (text) - Status (active, inactive)
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 7. `payments`
  Tracks payment transactions.
  - `id` (uuid, primary key) - Unique payment identifier
  - `user_id` (uuid, foreign key) - User making payment
  - `booking_id` (uuid, foreign key) - Associated booking
  - `amount` (decimal) - Payment amount
  - `currency` (text) - Currency code (INR, USD, etc.)
  - `payment_method` (text) - Payment method (upi, card, wallet)
  - `payment_gateway` (text) - Gateway used (razorpay, stripe)
  - `transaction_id` (text) - External transaction ID
  - `status` (text) - Status (pending, completed, failed, refunded)
  - `metadata` (jsonb) - Additional payment details
  - `created_at` (timestamptz) - Payment timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own data
  - Policies enforce authentication and ownership checks

  ## Indexes
  - Indexed on frequently queried columns for performance
  - Foreign keys properly indexed for join optimization
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text UNIQUE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  date_of_birth date,
  address text,
  role text DEFAULT 'owner',
  avatar_url text,
  preferences jsonb DEFAULT '{"notifications": true, "theme": "light", "language": "en"}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  registration_number text UNIQUE NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  variant text,
  year integer,
  vehicle_type text DEFAULT 'car',
  fuel_type text,
  color text,
  image_url text,
  current_mileage integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL,
  document_number text,
  file_url text NOT NULL,
  issue_date date,
  expiry_date date,
  status text DEFAULT 'valid',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create parking_spots table
CREATE TABLE IF NOT EXISTS parking_spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  total_capacity integer DEFAULT 0,
  available_spots integer DEFAULT 0,
  hourly_rate decimal(10, 2),
  daily_rate decimal(10, 2),
  features jsonb DEFAULT '{}'::jsonb,
  rating decimal(3, 2) DEFAULT 0,
  provider_id uuid,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type text NOT NULL,
  provider_name text NOT NULL,
  description text,
  price decimal(10, 2),
  duration integer,
  address text,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  rating decimal(3, 2) DEFAULT 0,
  features jsonb DEFAULT '{}'::jsonb,
  availability jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  booking_type text NOT NULL,
  parking_spot_id uuid REFERENCES parking_spots(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  status text DEFAULT 'pending',
  amount decimal(10, 2),
  qr_code text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  amount decimal(10, 2) NOT NULL,
  currency text DEFAULT 'INR',
  payment_method text,
  payment_gateway text,
  transaction_id text,
  status text DEFAULT 'pending',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_documents_vehicle_id ON documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for vehicles table
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

-- RLS Policies for documents table
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

-- RLS Policies for parking_spots table (public read)
CREATE POLICY "Anyone can view active parking spots"
  ON parking_spots FOR SELECT
  TO authenticated
  USING (status = 'active');

-- RLS Policies for services table (public read)
CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT
  TO authenticated
  USING (status = 'active');

-- RLS Policies for bookings table
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

-- RLS Policies for payments table
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parking_spots_updated_at BEFORE UPDATE ON parking_spots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
