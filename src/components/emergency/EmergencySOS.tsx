import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Phone, MapPin, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  priority: number;
}

interface SOSStatus {
  active: boolean;
  requestId?: string;
  status?: string;
  timestamp?: Date;
  responders?: number;
}

const EmergencySOS: React.FC = () => {
  const { user } = useAuth();
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [sosStatus, setSosStatus] = useState<SOSStatus>({ active: false });
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [emergencyMessage, setEmergencyMessage] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadEmergencyContacts();
      getCurrentLocation();
    }
  }, [user]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const loadEmergencyContacts = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('emergency-response', {
        body: {
          action: 'get_emergency_contacts',
          user_id: user.id
        }
      });

      if (error) throw error;
      setEmergencyContacts(data.contacts || []);
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
    }
  };

  const triggerSOS = async () => {
    if (!user?.id || !currentLocation) {
      alert('Unable to get your location. Please enable location services and try again.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('emergency-response', {
        body: {
          action: 'create_sos',
          user_id: user.id,
          emergency_type: 'vehicle_emergency',
          location: currentLocation,
          message: emergencyMessage || 'Vehicle emergency - immediate assistance required',
          severity: 'high'
        }
      });

      if (error) throw error;

      setSosStatus({
        active: true,
        requestId: data.sos_request.id,
        status: 'active',
        timestamp: new Date(),
        responders: data.contacts_notified
      });

      setIsSOSActive(true);

      // Auto-cancel after 5 minutes if not resolved
      setTimeout(() => {
        if (sosStatus.active) {
          cancelSOS();
        }
      }, 5 * 60 * 1000);

    } catch (error: any) {
      alert(`Error sending SOS: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cancelSOS = async () => {
    if (!sosStatus.requestId) return;

    try {
      await supabase.functions.invoke('emergency-response', {
        body: {
          action: 'update_sos_status',
          user_id: user.id,
          sos_id: sosStatus.requestId,
          status: 'cancelled'
        }
      });

      setSosStatus({ active: false });
      setIsSOSActive(false);
    } catch (error) {
      console.error('Error cancelling SOS:', error);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-100';
      case 'responding': return 'text-orange-600 bg-orange-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusMessage = (status?: string) => {
    switch (status) {
      case 'active': return 'Emergency alert sent. Help is on the way.';
      case 'responding': return 'Emergency responders are en route.';
      case 'resolved': return 'Emergency situation resolved.';
      default: return 'Emergency system ready.';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* SOS Trigger */}
      <div className="bg-white p-6 rounded-lg border border-red-200">
        <div className="text-center">
          <motion.button
            onClick={triggerSOS}
            disabled={loading || isSOSActive}
            className={`w-32 h-32 rounded-full font-bold text-white text-lg transition-all duration-300 ${
              isSOSActive
                ? 'bg-red-600 animate-pulse'
                : 'bg-red-500 hover:bg-red-600 active:bg-red-700'
            } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            ) : isSOSActive ? (
              <div className="space-y-2">
                <AlertTriangle className="w-8 h-8 mx-auto" />
                <div className="text-sm">SOS ACTIVE</div>
              </div>
            ) : (
              <div className="space-y-2">
                <AlertTriangle className="w-8 h-8 mx-auto" />
                <div>SOS</div>
              </div>
            )}
          </motion.button>

          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {isSOSActive ? 'Emergency Alert Active' : 'Emergency SOS'}
            </h3>
            <p className={`mt-2 px-3 py-1 rounded-full text-sm inline-block ${getStatusColor(sosStatus.status)}`}>
              {getStatusMessage(sosStatus.status)}
            </p>
          </div>

          {isSOSActive && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{sosStatus.timestamp?.toLocaleTimeString()}</span>
                </div>
                {sosStatus.responders && (
                  <div className="flex items-center space-x-1">
                    <Phone className="w-4 h-4" />
                    <span>{sosStatus.responders} contacts notified</span>
                  </div>
                )}
              </div>

              <button
                onClick={cancelSOS}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel Emergency Alert
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Message */}
      {!isSOSActive && (
        <div className="bg-white p-6 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Emergency Message (Optional)
          </label>
          <textarea
            value={emergencyMessage}
            onChange={(e) => setEmergencyMessage(e.target.value)}
            placeholder="Describe your emergency situation..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            This message will be sent to emergency contacts and services
          </p>
        </div>
      )}

      {/* Emergency Contacts */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Emergency Contacts</h3>
              <p className="text-sm text-gray-600">{emergencyContacts.length} contacts configured</p>
            </div>
          </div>
          <button
            onClick={() => setShowContacts(!showContacts)}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            {showContacts ? 'Hide' : 'View'}
          </button>
        </div>

        <AnimatePresence>
          {showContacts && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-4 border-t">
                {emergencyContacts.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No emergency contacts configured</p>
                    <p className="text-sm">Add contacts to ensure help reaches you quickly</p>
                  </div>
                ) : (
                  emergencyContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {contact.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{contact.name}</p>
                          <p className="text-sm text-gray-600">{contact.relationship} • {contact.phone}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        contact.priority === 1 ? 'bg-red-100 text-red-600' :
                        contact.priority === 2 ? 'bg-orange-100 text-orange-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        Priority {contact.priority}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Location Info */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-green-100 rounded-full">
            <MapPin className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Current Location</h3>
            <p className="text-sm text-gray-600">
              {currentLocation
                ? `Lat: ${currentLocation.lat.toFixed(6)}, Lng: ${currentLocation.lng.toFixed(6)}`
                : 'Getting your location...'
              }
            </p>
          </div>
        </div>

        {!currentLocation && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Location access is required for emergency services. Please enable location permissions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Emergency Instructions */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900 mb-2">Emergency Instructions</h4>
            <ul className="text-sm text-red-800 space-y-1">
              <li>• Stay calm and assess the situation</li>
              <li>• If safe, provide details in the emergency message</li>
              <li>• Emergency contacts will be notified automatically</li>
              <li>• Local emergency services will be alerted</li>
              <li>• Cancel the alert only when situation is resolved</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencySOS;
