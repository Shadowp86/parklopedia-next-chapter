import { useState, useEffect } from 'react';
import { Card, Button, Loader, Badge } from '../ui';
import {
  Calendar,
  Clock,
  Star,
  TrendingUp,
  Zap,
  Settings,
  Fuel,
  Gauge,
  Users,
  Bell,
  BellOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui';
import { api } from '../../lib/api';

interface UpcomingVehicle {
  id: string;
  brand: string;
  model: string;
  category: string;
  body_type: string;
  fuel_type: string;
  launch_date: string;
  vehicle_variants: VehicleVariant[];
}

interface VehicleVariant {
  id: string;
  variant_name: string;
  price_range_min: number;
  price_range_max: number;
  currency: string;
  engine_type: string;
  engine_displacement: string;
  power_hp: number;
  torque_nm: number;
  transmission: string;
  fuel_efficiency_city: number;
  fuel_efficiency_highway: number;
  fuel_efficiency_combined: number;
  electric_range: number;
  top_speed_kmph: number;
  acceleration_0_100: number;
  features: any;
}

const UpcomingVehicles = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [vehicles, setVehicles] = useState<UpcomingVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<'launch_date' | 'brand' | 'category'>('launch_date');

  useEffect(() => {
    fetchUpcomingVehicles();
    if (user) {
      fetchUserAlerts();
    }
  }, [user]);

  const fetchUpcomingVehicles = async () => {
    try {
      setLoading(true);
      const data = await api.encyclopedia.getUpcomingVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching upcoming vehicles:', error);
      showToast('error', 'Failed to load upcoming vehicles');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAlerts = async () => {
    try {
      const userAlerts = await api.encyclopedia.getUserAlerts(user!.id);
      const alertMap: Record<string, boolean> = {};
      userAlerts.forEach((alert: any) => {
        alertMap[alert.vehicle_id] = true;
      });
      setAlerts(alertMap);
    } catch (error) {
      console.error('Error fetching user alerts:', error);
    }
  };

  const handleAlertToggle = async (vehicleId: string) => {
    if (!user) {
      showToast('info', 'Please sign in to set alerts');
      return;
    }

    try {
      if (alerts[vehicleId]) {
        // Remove alert
        const userAlerts = await api.encyclopedia.getUserAlerts(user.id);
        const alertToRemove = userAlerts.find((alert: any) => alert.vehicle_id === vehicleId);
        if (alertToRemove) {
          await api.encyclopedia.deleteAlert(alertToRemove.id);
          setAlerts(prev => ({ ...prev, [vehicleId]: false }));
          showToast('success', 'Launch alert removed');
        }
      } else {
        // Add alert
        await api.encyclopedia.createAlert({
          user_id: user.id,
          vehicle_id: vehicleId,
          alert_type: 'launch_date'
        });
        setAlerts(prev => ({ ...prev, [vehicleId]: true }));
        showToast('success', 'Launch alert set');
      }
    } catch (error) {
      console.error('Error updating alert:', error);
      showToast('error', 'Failed to update alert');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ev': return <Zap size={16} />;
      case 'bike': return <TrendingUp size={16} />;
      default: return <Settings size={16} />;
    }
  };

  const getFuelTypeColor = (fuelType: string) => {
    switch (fuelType) {
      case 'electric': return 'bg-green-100 text-green-800';
      case 'hybrid': return 'bg-blue-100 text-blue-800';
      case 'petrol': return 'bg-orange-100 text-orange-800';
      case 'diesel': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatLaunchDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Launched';
    } else if (diffDays === 0) {
      return 'Launching Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays < 30) {
      return `In ${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `In ${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `In ${years} year${years > 1 ? 's' : ''}`;
    }
  };

  const getLaunchUrgencyColor = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'bg-gray-100 text-gray-800';
    if (diffDays <= 30) return 'bg-red-100 text-red-800';
    if (diffDays <= 90) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const sortedVehicles = [...vehicles].sort((a, b) => {
    switch (sortBy) {
      case 'brand':
        return a.brand.localeCompare(b.brand);
      case 'category':
        return a.category.localeCompare(b.category);
      case 'launch_date':
      default:
        return new Date(a.launch_date).getTime() - new Date(b.launch_date).getTime();
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      {/* Header */}
      <div className="bg-white dark:bg-dark-card shadow-sm border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Upcoming Vehicles
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover the latest vehicles coming to market. Set alerts to get notified when they launch.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 text-sm"
            >
              <option value="launch_date">Launch Date</option>
              <option value="brand">Brand</option>
              <option value="category">Category</option>
            </select>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            {vehicles.length} upcoming vehicles
          </div>
        </div>

        {/* Vehicles Grid */}
        {sortedVehicles.length === 0 ? (
          <Card className="text-center p-12">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Upcoming Vehicles
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Check back later for new vehicle announcements.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedVehicles.map((vehicle) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {vehicle.brand} {vehicle.model}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getCategoryIcon(vehicle.category)}
                          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {vehicle.category}
                          </span>
                          <Badge variant="outline" className={getFuelTypeColor(vehicle.fuel_type)}>
                            {vehicle.fuel_type}
                          </Badge>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAlertToggle(vehicle.id)}
                        className={`flex items-center gap-1 ${alerts[vehicle.id] ? 'text-accent-blue' : ''}`}
                      >
                        {alerts[vehicle.id] ? <Bell size={14} /> : <BellOff size={14} />}
                        {alerts[vehicle.id] ? 'Alert Set' : 'Set Alert'}
                      </Button>
                    </div>

                    {/* Launch Date */}
                    <div className="mb-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getLaunchUrgencyColor(vehicle.launch_date)}`}>
                        <Clock size={14} />
                        {formatLaunchDate(vehicle.launch_date)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Expected: {new Date(vehicle.launch_date).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>

                    {/* Variants Preview */}
                    {vehicle.vehicle_variants && vehicle.vehicle_variants.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Expected Variants ({vehicle.vehicle_variants.length})
                        </h4>
                        <div className="space-y-2">
                          {vehicle.vehicle_variants.slice(0, 2).map((variant) => (
                            <div key={variant.id} className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                {variant.variant_name}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                ₹{variant.price_range_min.toLocaleString()} - ₹{variant.price_range_max.toLocaleString()}
                              </span>
                            </div>
                          ))}
                          {vehicle.vehicle_variants.length > 2 && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              +{vehicle.vehicle_variants.length - 2} more variants
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Key Features */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Expected Features
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {vehicle.vehicle_variants?.[0]?.features && (
                          <>
                            {vehicle.vehicle_variants[0].power_hp && (
                              <Badge variant="secondary">
                                {vehicle.vehicle_variants[0].power_hp} HP
                              </Badge>
                            )}
                            {vehicle.vehicle_variants[0].fuel_efficiency_combined && (
                              <Badge variant="secondary">
                                {vehicle.vehicle_variants[0].fuel_efficiency_combined} kmpl
                              </Badge>
                            )}
                            {vehicle.vehicle_variants[0].electric_range && (
                              <Badge variant="secondary">
                                {vehicle.vehicle_variants[0].electric_range} km range
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.open(`/encyclopedia/vehicle/${vehicle.id}`, '_blank')}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={() => window.open(`/encyclopedia/compare?v=${vehicle.id}`, '_blank')}
                      >
                        Compare
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <Card className="mt-12 p-6 bg-gradient-to-r from-accent-blue/10 to-accent-purple/10 border-accent-blue/20">
          <div className="text-center">
            <Bell size={32} className="mx-auto text-accent-blue mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Stay Updated
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Set launch alerts for upcoming vehicles and get notified when they become available.
              Never miss the release of your dream car or bike.
            </p>
            {!user && (
              <Button variant="primary">
                Sign In to Set Alerts
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UpcomingVehicles;


