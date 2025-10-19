import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeOptions {
  table: string;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

export function useRealtime({ table, filter, onInsert, onUpdate, onDelete }: UseRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    // Create a unique channel name
    const channelName = `realtime-${table}-${Date.now()}`;

    // Create the channel
    const newChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: table,
          filter: filter,
        },
        (payload) => {
          console.log('Realtime INSERT:', payload);
          onInsert?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: table,
          filter: filter,
        },
        (payload) => {
          console.log('Realtime UPDATE:', payload);
          onUpdate?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: table,
          filter: filter,
        },
        (payload) => {
          console.log('Realtime DELETE:', payload);
          onDelete?.(payload);
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status for ${table}:`, status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    setChannel(newChannel);

    // Cleanup function
    return () => {
      console.log(`Unsubscribing from ${table} realtime`);
      newChannel.unsubscribe();
    };
  }, [table, filter, onInsert, onUpdate, onDelete]);

  return { isConnected, channel };
}

// ===========================================
// SPECIFIC REALTIME HOOKS
// ===========================================

export function useBookingsRealtime(userId: string, onUpdate?: (booking: any) => void) {
  return useRealtime({
    table: 'bookings',
    filter: `user_id=eq.${userId}`,
    onInsert: (payload) => {
      console.log('New booking:', payload.new);
      onUpdate?.(payload.new);
    },
    onUpdate: (payload) => {
      console.log('Booking updated:', payload.new);
      onUpdate?.(payload.new);
    },
  });
}

export function useNotificationsRealtime(userId: string, onNewNotification?: (notification: any) => void) {
  return useRealtime({
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
    onInsert: (payload) => {
      console.log('New notification:', payload.new);
      onNewNotification?.(payload.new);
    },
  });
}

export function useParkingSpotsRealtime(onSpotUpdate?: (spot: any) => void) {
  return useRealtime({
    table: 'parking_spots',
    onUpdate: (payload) => {
      console.log('Parking spot updated:', payload.new);
      onSpotUpdate?.(payload.new);
    },
  });
}

export function useDocumentsRealtime(userId: string, onDocumentUpdate?: (document: any) => void) {
  return useRealtime({
    table: 'documents',
    filter: `user_id=eq.${userId}`,
    onInsert: (payload) => {
      console.log('New document:', payload.new);
      onDocumentUpdate?.(payload.new);
    },
    onUpdate: (payload) => {
      console.log('Document updated:', payload.new);
      onDocumentUpdate?.(payload.new);
    },
  });
}
