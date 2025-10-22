// Database types for Parklopedia

export type UserRole = 'USER' | 'GARAGE_OPERATOR' | 'PARKING_OPERATOR' | 'ADMIN';

export type DocumentType = 
  | 'RC' 
  | 'INSURANCE' 
  | 'PUC' 
  | 'DRIVING_LICENSE' 
  | 'PERMIT' 
  | 'FITNESS_CERTIFICATE' 
  | 'OTHER';

export type VehicleType = 'TWO_WHEELER' | 'FOUR_WHEELER';

export type FuelType = 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'CNG' | 'HYBRID';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export type ServiceType = 'QUICK_SERVICE' | 'MAINTENANCE' | 'GARAGE' | 'SHOWROOM';

export type ParkingType = 'GENERAL' | 'EVENT_BASED';

export type NotificationType = 
  | 'DOCUMENT_EXPIRY' 
  | 'BOOKING_CONFIRMATION' 
  | 'BOOKING_REMINDER' 
  | 'PAYMENT' 
  | 'CHALLAN' 
  | 'PROMOTIONAL';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  vehicle_type: VehicleType;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  registration_number: string;
  fuel_type: FuelType;
  color: string | null;
  vin_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  vehicle_id: string;
  document_type: DocumentType;
  document_number: string;
  issue_date: string;
  expiry_date: string;
  file_url: string;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  type: ServiceType;
  description: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string | null;
  logo_url: string | null;
  rating: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceOffering {
  id: string;
  provider_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceBooking {
  id: string;
  user_id: string;
  vehicle_id: string;
  provider_id: string;
  offering_id: string;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParkingSpot {
  id: string;
  name: string;
  type: ParkingType;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  total_spots: number;
  available_spots: number;
  price_per_hour: number;
  event_name: string | null;
  event_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ParkingBooking {
  id: string;
  user_id: string;
  vehicle_id: string;
  spot_id: string;
  booking_date: string;
  start_time: string;
  end_time: string | null;
  status: BookingStatus;
  total_amount: number;
  qr_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface EncyclopediaVehicle {
  id: string;
  vehicle_type: VehicleType;
  make: string;
  model: string;
  variant: string;
  year: number;
  fuel_type: FuelType;
  body_type: string | null;
  seating_capacity: number | null;
  engine_capacity: string | null;
  power: string | null;
  torque: string | null;
  mileage: string | null;
  transmission: string | null;
  base_price: number;
  colors_available: string[] | null;
  features: string[] | null;
  images: string[] | null;
  is_upcoming: boolean;
  launch_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Challan {
  id: string;
  user_id: string;
  vehicle_id: string;
  challan_number: string;
  violation: string;
  amount: number;
  issue_date: string;
  due_date: string;
  is_paid: boolean;
  payment_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface FastagRecharge {
  id: string;
  user_id: string;
  vehicle_id: string;
  fastag_number: string;
  amount: number;
  transaction_id: string;
  status: BookingStatus;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
}
