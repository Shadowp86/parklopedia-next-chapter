import { supabase } from './supabase';

// ===========================================
// API SERVICE CLASSES
// ===========================================

export class ApiService {
  protected async handleError(error: any): Promise<never> {
    console.error('API Error:', error);
    throw new Error(error.message || 'An unexpected error occurred');
  }

  protected async handleResponse<T>(response: any): Promise<T> {
    if (response.error) {
      throw response.error;
    }
    return response.data;
  }
}

// ===========================================
// USER API SERVICE
// ===========================================

export class UserApiService extends ApiService {
  async getProfile(userId: string) {
    try {
      const response = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateProfile(userId: string, data: Partial<any>) {
    try {
      const response = await supabase
        .from('users')
        .update(data)
        .eq('id', userId)
        .select()
        .single();

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getPreferences(userId: string) {
    try {
      const response = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId);

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updatePreference(userId: string, category: string, key: string, value: any) {
    try {
      const response = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          category,
          preference_key: key,
          preference_value: value
        })
        .select()
        .single();

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// ===========================================
// VEHICLE API SERVICE
// ===========================================

export class VehicleApiService extends ApiService {
  async getVehicles(userId: string) {
    try {
      const response = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createVehicle(vehicleData: any) {
    try {
      const response = await supabase
        .from('vehicles')
        .insert(vehicleData)
        .select()
        .single();

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateVehicle(vehicleId: string, data: Partial<any>) {
    try {
      const response = await supabase
        .from('vehicles')
        .update(data)
        .eq('id', vehicleId)
        .select()
        .single();

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteVehicle(vehicleId: string) {
    try {
      const response = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getMaintenanceHistory(vehicleId: string) {
    try {
      const response = await supabase
        .from('vehicle_maintenance')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('performed_at', { ascending: false });

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async addMaintenanceRecord(vehicleId: string, maintenanceData: any) {
    try {
      const response = await supabase
        .from('vehicle_maintenance')
        .insert({ ...maintenanceData, vehicle_id: vehicleId })
        .select()
        .single();

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// ===========================================
// DOCUMENT API SERVICE
// ===========================================

export class DocumentApiService extends ApiService {
  async getDocuments(userId: string, vehicleId?: string) {
    try {
      let query = supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      const response = await query;
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async uploadDocument(documentData: any, file: File) {
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `documents/${documentData.user_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Save document record
      const response = await supabase
        .from('documents')
        .insert({
          ...documentData,
          file_url: publicUrl,
          metadata: {
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            storage_path: filePath
          }
        })
        .select()
        .single();

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateDocument(documentId: string, data: Partial<any>) {
    try {
      const response = await supabase
        .from('documents')
        .update(data)
        .eq('id', documentId)
        .select()
        .single();

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteDocument(documentId: string) {
    try {
      // Get document to find storage path
      const { data: document } = await supabase
        .from('documents')
        .select('metadata')
        .eq('id', documentId)
        .single();

      // Delete from storage if path exists
      if (document?.metadata?.storage_path) {
        await supabase.storage
          .from('documents')
          .remove([document.metadata.storage_path]);
      }

      // Delete record
      const response = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// ===========================================
// BOOKING API SERVICE
// ===========================================

export class BookingApiService extends ApiService {
  async getBookings(userId: string, type?: string) {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          vehicles (
            registration_number,
            brand,
            model
          ),
          parking_spots (
            name,
            address
          ),
          services (
            provider_name,
            service_type
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('booking_type', type);
      }

      const response = await query;
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createBooking(bookingData: any) {
    try {
      const response = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateBooking(bookingId: string, data: Partial<any>) {
    try {
      const response = await supabase
        .from('bookings')
        .update(data)
        .eq('id', bookingId)
        .select()
        .single();

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async cancelBooking(bookingId: string) {
    try {
      const response = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .select()
        .single();

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// ===========================================
// PARKING API SERVICE
// ===========================================

export class ParkingApiService extends ApiService {
  async getParkingSpots(filters?: any) {
    try {
      let query = supabase
        .from('parking_spots')
        .select('*')
        .eq('status', 'active');

      if (filters?.location) {
        // Add location-based filtering logic here
      }

      if (filters?.features) {
        // Add feature-based filtering
      }

      const response = await query.order('rating', { ascending: false });
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getParkingSpot(spotId: string) {
    try {
      const response = await supabase
        .from('parking_spots')
        .select('*')
        .eq('id', spotId)
        .single();

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getParkingHistory(userId: string) {
    try {
      const response = await supabase
        .from('parking_history')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// ===========================================
// NOTIFICATION API SERVICE
// ===========================================

export class NotificationApiService extends ApiService {
  async getNotifications(userId: string, unreadOnly = false) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const response = await query;
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async markAsRead(notificationId: string) {
    try {
      const response = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .select()
        .single();

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async markAllAsRead(userId: string) {
    try {
      const response = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteNotification(notificationId: string) {
    try {
      const response = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// ===========================================
// PAYMENT API SERVICE
// ===========================================

export class PaymentApiService extends ApiService {
  async getPayments(userId: string) {
    try {
      const response = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getPaymentMethods(userId: string) {
    try {
      const response = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async addPaymentMethod(userId: string, methodData: any) {
    try {
      const response = await supabase
        .from('payment_methods')
        .insert({ ...methodData, user_id: userId })
        .select()
        .single();

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async processPayment(bookingId: string, paymentMethodId: string, amount: number) {
    try {
      // Call Supabase Edge Function for payment processing
      const { data, error } = await supabase.functions.invoke('payment-processor', {
        body: {
          booking_id: bookingId,
          payment_method_id: paymentMethodId,
          amount: amount
        }
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// ===========================================
// REWARDS API SERVICE
// ===========================================

export class RewardsApiService extends ApiService {
  async getUserRewards(userId: string) {
    try {
      const response = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getUserAchievements(userId: string) {
    try {
      const response = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getAvailableRewards() {
    try {
      const response = await supabase
        .from('reward_catalog')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async redeemReward(userId: string, rewardId: string) {
    try {
      // Call Supabase Edge Function for reward redemption
      const { data, error } = await supabase.functions.invoke('reward-redemption', {
        body: {
          user_id: userId,
          reward_id: rewardId
        }
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getLeaderboard(timeframe: 'weekly' | 'monthly' | 'all_time' = 'monthly') {
    try {
      const response = await supabase
        .from('user_stats')
        .select('user_id, total_points, users(full_name, avatar_url)')
        .order('total_points', { ascending: false })
        .limit(50);

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getUserStats(userId: string) {
    try {
      const response = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// ===========================================
// FAMILY API SERVICE
// ===========================================

export class FamilyApiService extends ApiService {
  async getFamilyGroups(userId: string) {
    try {
      const response = await supabase
        .from('family_groups')
        .select(`
          *,
          family_members (
            user_id,
            role,
            joined_at,
            permissions,
            users (
              id,
              full_name,
              avatar_url,
              email
            )
          )
        `)
        .or(`owner_id.eq.${userId},family_members.user_id.eq.${userId}`);

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createFamilyGroup(ownerId: string, groupData: any) {
    try {
      const response = await supabase
        .from('family_groups')
        .insert({ ...groupData, owner_id: ownerId })
        .select()
        .single();

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async inviteToFamilyGroup(groupId: string, inviterId: string, inviteeEmail: string, role: string = 'member') {
    try {
      const response = await supabase
        .from('family_invitations')
        .insert({
          family_group_id: groupId,
          inviter_id: inviterId,
          invitee_email: inviteeEmail,
          role: role
        })
        .select()
        .single();

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async acceptFamilyInvitation(invitationId: string, userId: string) {
    try {
      // Get invitation details
      const { data: invitation } = await supabase
        .from('family_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (!invitation) {
        throw new Error('Invitation not found');
      }

      // Verify user email matches invitation
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (user?.email !== invitation.invitee_email) {
        throw new Error('Invitation not for this user');
      }

      // Add user to family group
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_group_id: invitation.family_group_id,
          user_id: userId,
          role: invitation.role,
          permissions: {
            can_book: true,
            can_view_documents: true,
            can_manage_vehicles: false
          }
        });

      if (memberError) {
        throw memberError;
      }

      // Delete invitation
      const { error: deleteError } = await supabase
        .from('family_invitations')
        .delete()
        .eq('id', invitationId);

      if (deleteError) {
        throw deleteError;
      }

      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async shareVehicleWithFamily(vehicleId: string, familyGroupId: string, permissions: any) {
    try {
      const response = await supabase
        .from('shared_vehicles')
        .insert({
          vehicle_id: vehicleId,
          family_group_id: familyGroupId,
          permissions: permissions
        })
        .select()
        .single();

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getSharedVehicles(userId: string) {
    try {
      const response = await supabase
        .from('shared_vehicles')
        .select(`
          *,
          vehicles (
            id,
            registration_number,
            brand,
            model,
            image_url
          ),
          family_groups (
            name,
            owner_id
          )
        `)
        .or(`vehicles.user_id.eq.${userId},shared_vehicles.family_group_id.in.(${await this.getUserFamilyGroupIds(userId)})`);

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  private async getUserFamilyGroupIds(userId: string): Promise<string> {
    const { data } = await supabase
      .from('family_members')
      .select('family_group_id')
      .eq('user_id', userId);

    return data?.map(item => item.family_group_id).join(',') || '';
  }

  async updateFamilyMemberPermissions(memberId: string, permissions: any) {
    try {
      const response = await supabase
        .from('family_members')
        .update({ permissions })
        .eq('id', memberId)
        .select()
        .single();

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async removeFamilyMember(memberId: string) {
    try {
      const response = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId);

      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// ===========================================
// EXPORT ALL SERVICES
// ===========================================

export const api = {
  users: new UserApiService(),
  vehicles: new VehicleApiService(),
  documents: new DocumentApiService(),
  bookings: new BookingApiService(),
  parking: new ParkingApiService(),
  notifications: new NotificationApiService(),
  payments: new PaymentApiService(),
  rewards: new RewardsApiService(),
  family: new FamilyApiService(),
};
