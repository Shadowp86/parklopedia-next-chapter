import { supabase } from './supabase';
import type {
  Profile,
  Vehicle,
  Document,
  ServiceProvider,
  ServiceOffering,
  ServiceBooking,
  ParkingSpot,
  ParkingBooking,
  EncyclopediaVehicle,
  Challan,
  FastagRecharge,
  Notification,
  VehicleType,
} from '@/types/database';

// Profile operations
export const profileOperations = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Vehicle operations
export const vehicleOperations = {
  async getUserVehicles(userId: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createVehicle(vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicle)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteVehicle(vehicleId: string): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId);

    if (error) throw error;
  },
};

// Document operations
export const documentOperations = {
  async getVehicleDocuments(vehicleId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('expiry_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createDocument(document: Omit<Document, 'id' | 'created_at' | 'updated_at'>): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .insert(document)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateDocument(documentId: string, updates: Partial<Document>): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteDocument(documentId: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  },

  async getExpiringDocuments(userId: string, daysAhead: number = 15): Promise<Document[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        vehicles!inner(user_id)
      `)
      .eq('vehicles.user_id', userId)
      .lte('expiry_date', futureDate.toISOString())
      .eq('reminder_sent', false);

    if (error) throw error;
    return data || [];
  },
};

// Service operations
export const serviceOperations = {
  async getServiceProviders(city?: string, type?: string): Promise<ServiceProvider[]> {
    let query = supabase
      .from('service_providers')
      .select('*')
      .eq('is_active', true);

    if (city) query = query.eq('city', city);
    if (type) query = query.eq('type', type);

    const { data, error } = await query.order('rating', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getProviderOfferings(providerId: string): Promise<ServiceOffering[]> {
    const { data, error } = await supabase
      .from('service_offerings')
      .select('*')
      .eq('provider_id', providerId)
      .eq('is_available', true);

    if (error) throw error;
    return data || [];
  },

  async createServiceBooking(booking: Omit<ServiceBooking, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceBooking> {
    const { data, error } = await supabase
      .from('service_bookings')
      .insert(booking)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserServiceBookings(userId: string): Promise<ServiceBooking[]> {
    const { data, error } = await supabase
      .from('service_bookings')
      .select(`
        *,
        service_providers(*),
        service_offerings(*),
        vehicles(*)
      `)
      .eq('user_id', userId)
      .order('booking_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

// Parking operations
export const parkingOperations = {
  async getParkingSpots(city?: string, type?: string, searchTerm?: string): Promise<ParkingSpot[]> {
    let query = supabase
      .from('parking_spots')
      .select('*')
      .eq('is_active', true)
      .gt('available_spots', 0);

    if (city) query = query.eq('city', city);
    if (type) query = query.eq('type', type);
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,event_name.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createParkingBooking(booking: Omit<ParkingBooking, 'id' | 'created_at' | 'updated_at'>): Promise<ParkingBooking> {
    const { data, error } = await supabase
      .from('parking_bookings')
      .insert(booking)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserParkingBookings(userId: string): Promise<ParkingBooking[]> {
    const { data, error } = await supabase
      .from('parking_bookings')
      .select(`
        *,
        parking_spots(*),
        vehicles(*)
      `)
      .eq('user_id', userId)
      .order('booking_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

// Encyclopedia operations
export const encyclopediaOperations = {
  async searchVehicles(filters: {
    vehicleType?: VehicleType;
    make?: string;
    fuelType?: string;
    minPrice?: number;
    maxPrice?: number;
    searchTerm?: string;
  }): Promise<EncyclopediaVehicle[]> {
    let query = supabase.from('encyclopedia_vehicles').select('*');

    if (filters.vehicleType) query = query.eq('vehicle_type', filters.vehicleType);
    if (filters.make) query = query.eq('make', filters.make);
    if (filters.fuelType) query = query.eq('fuel_type', filters.fuelType);
    if (filters.minPrice) query = query.gte('base_price', filters.minPrice);
    if (filters.maxPrice) query = query.lte('base_price', filters.maxPrice);
    if (filters.searchTerm) {
      query = query.or(`make.ilike.%${filters.searchTerm}%,model.ilike.%${filters.searchTerm}%,variant.ilike.%${filters.searchTerm}%`);
    }

    const { data, error } = await query.order('make', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getVehicleById(id: string): Promise<EncyclopediaVehicle | null> {
    const { data, error } = await supabase
      .from('encyclopedia_vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getUpcomingVehicles(): Promise<EncyclopediaVehicle[]> {
    const { data, error } = await supabase
      .from('encyclopedia_vehicles')
      .select('*')
      .eq('is_upcoming', true)
      .order('launch_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};

// Challan operations
export const challanOperations = {
  async getUserChallans(userId: string): Promise<Challan[]> {
    const { data, error } = await supabase
      .from('challans')
      .select(`
        *,
        vehicles(*)
      `)
      .eq('user_id', userId)
      .order('issue_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async markChallanPaid(challanId: string): Promise<Challan> {
    const { data, error } = await supabase
      .from('challans')
      .update({ is_paid: true, payment_date: new Date().toISOString() })
      .eq('id', challanId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// FASTag operations
export const fastagOperations = {
  async createRecharge(recharge: Omit<FastagRecharge, 'id' | 'created_at'>): Promise<FastagRecharge> {
    const { data, error } = await supabase
      .from('fastag_recharges')
      .insert(recharge)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserRecharges(userId: string): Promise<FastagRecharge[]> {
    const { data, error } = await supabase
      .from('fastag_recharges')
      .select(`
        *,
        vehicles(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

// Notification operations
export const notificationOperations = {
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  },
};

// Storage operations
export const storageOperations = {
  async uploadDocument(file: File, path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path);

    return publicUrl;
  },

  async deleteDocument(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from('documents')
      .remove([path]);

    if (error) throw error;
  },

  async uploadAvatar(file: File, userId: string): Promise<string> {
    const path = `${userId}/avatar.${file.name.split('.').pop()}`;
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);

    return publicUrl;
  },
};
