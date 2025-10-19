import { useState, useEffect } from 'react';
import { Card, Loader } from '../components/ui';
import { MapPin, Search, Filter, Clock, DollarSign, Star, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui';
import { api } from '../lib/api';
import { useRealtime } from '../hooks/useRealtime';

interface ParkingSpot {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  total_spots: number;
  available_spots: number;
  price_per_hour: number;
  features: string[];
  rating: number;
  distance?: number;
  image_url?: string;
}

const Parking = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [filteredSpots, setFilteredSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const filters = ['All', 'EV Charging', '24/7', 'Secured', 'Roofed', 'Valet'];

  // Real-time updates for parking availability
  useRealtime({
    table: 'parking_spots',
    onUpdate: (payload: any) => {
      setParkingSpots((prev) =>
        prev.map(spot =>
          spot.id === payload.new.id ? { ...spot, ...payload.new } : spot
        )
      );
    }
  });

  useEffect(() => {
    if (user) {
      fetchParkingSpots();
      getUserLocation();
    }
  }, [user]);

  useEffect(() => {
    filterParkingSpots();
  }, [parkingSpots, searchQuery, selectedFilters]);

  const fetchParkingSpots = async () => {
    try {
      setLoading(true);
      const spots = await api.parking.getParkingSpots();
      setParkingSpots(spots);
    } catch (error) {
      console.error('Error fetching parking spots:', error);
      showToast('error', 'Failed to load parking spots');
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const filterParkingSpots = () => {
    let filtered = parkingSpots;

    // Add distance calculation if user location available
    if (userLocation) {
      filtered = filtered.map(spot => ({
        ...spot,
        distance: calculateDistance(userLocation.lat, userLocation.lng, spot.latitude, spot.longitude)
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(spot =>
        spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spot.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Feature filters
    if (selectedFilters.length > 0 && !selectedFilters.includes('All')) {
      filtered = filtered.filter(spot =>
        selectedFilters.some(filter => spot.features.includes(filter))
      );
    }

    setFilteredSpots(filtered);
  };

  const toggleFilter = (filter: string) => {
    if (filter === 'All') {
      setSelectedFilters(['All']);
    } else {
      setSelectedFilters(prev => {
        const newFilters = prev.filter(f => f !== 'All');
        if (newFilters.includes(filter)) {
          return newFilters.filter(f => f !== filter);
        } else {
          return [...newFilters, filter];
        }
      });
    }
  };

  const handleBookSpot = async (spotId: string) => {
    // TODO: Implement booking flow
    showToast('info', 'Booking feature coming soon!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader size="lg" text="Finding parking spots..." />
      </div>
    );
  }

  return (
    <div className="px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">
          Find Parking
        </h1>
        {userLocation && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-accent-blue text-white rounded-xl"
            onClick={() => getUserLocation()}
          >
            <Navigation size={20} />
          </motion.button>
        )}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search parking spots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-elevated text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-blue"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="p-3 bg-white dark:bg-dark-elevated rounded-xl border border-gray-300 dark:border-gray-600"
        >
          <Filter size={20} className="text-gray-700 dark:text-gray-300" />
        </motion.button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map((filter) => (
          <motion.button
            key={filter}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleFilter(filter)}
            className={`px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-colors ${
              selectedFilters.includes(filter)
                ? 'bg-accent-blue text-white border-accent-blue'
                : 'bg-white dark:bg-dark-elevated border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-accent-blue hover:text-white hover:border-accent-blue'
            }`}
          >
            {filter}
          </motion.button>
        ))}
      </div>

      {/* Parking Spots */}
      {filteredSpots.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card padding="none">
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-dark-elevated rounded-full flex items-center justify-center">
                <MapPin size={40} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Parking Spots Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try adjusting your search or filters
              </p>
            </div>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredSpots.map((spot, index) => (
            <motion.div
              key={spot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card padding="none" className="overflow-hidden">
                <div className="flex">
                  {/* Image */}
                  <div className="w-24 h-24 bg-gray-200 dark:bg-dark-elevated rounded-lg flex items-center justify-center flex-shrink-0">
                    {spot.image_url ? (
                      <img
                        src={spot.image_url}
                        alt={spot.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <MapPin size={24} className="text-gray-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 ml-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {spot.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {spot.address}
                        </p>
                        {spot.distance && (
                          <p className="text-xs text-accent-blue mt-1">
                            {spot.distance.toFixed(1)} km away
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{spot.rating}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Clock size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {spot.available_spots}/{spot.total_spots} available
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign size={14} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            ₹{spot.price_per_hour}/hr
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {spot.features.slice(0, 3).map((feature) => (
                        <span
                          key={feature}
                          className="px-2 py-1 bg-gray-100 dark:bg-dark-surface text-xs text-gray-600 dark:text-gray-400 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Book Button */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleBookSpot(spot.id)}
                    disabled={spot.available_spots === 0}
                    className={`w-full py-2 px-4 rounded-xl font-medium transition-colors ${
                      spot.available_spots === 0
                        ? 'bg-gray-200 dark:bg-dark-surface text-gray-500 cursor-not-allowed'
                        : 'bg-accent-blue text-white hover:bg-accent-blue-dark'
                    }`}
                  >
                    {spot.available_spots === 0 ? 'Fully Booked' : 'Book Now'}
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Parking;
