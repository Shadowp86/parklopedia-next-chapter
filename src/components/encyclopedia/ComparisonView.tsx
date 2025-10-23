import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Button, Loader } from '../ui';
import {
  ArrowLeft,
  Star,
  Share2,
  Settings,
  TrendingUp,
  Zap,
  X,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui';
import { api } from '../../lib/api';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  category: string;
  body_type: string;
  fuel_type: string;
  status: string;
  vehicle_variants: VehicleVariant[];
  vehicle_reviews: VehicleReview[];
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
  length_mm: number;
  width_mm: number;
  height_mm: number;
  wheelbase_mm: number;
  ground_clearance_mm: number;
  boot_space_liters: number;
  top_speed_kmph: number;
  acceleration_0_100: number;
  features: Record<string, unknown>;
  colors: string[];
}

interface VehicleReview {
  id: string;
  rating: number;
  title: string;
  review_text: string;
  ownership_duration: string;
  purchase_price: number;
  pros: string[];
  cons: string[];
  verified_purchase: boolean;
  photos: string[];
  created_at: string;
  users: {
    full_name: string;
    avatar_url: string;
  };
}

const ComparisonView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariants, setSelectedVariants] = useState<(VehicleVariant | null)[]>([null, null, null]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Vehicle[]>([]);

  const vehicleIds = searchParams.get('v')?.split(',') || [];

  useEffect(() => {
    if (vehicleIds.length > 0) {
      fetchVehicles();
    } else {
      setLoading(false);
    }
  }, [vehicleIds]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const vehiclePromises = vehicleIds.map(id => api.encyclopedia.getVehicleById(id));
      const vehiclesData = await Promise.all(vehiclePromises);
      setVehicles(vehiclesData as Vehicle[]);

      // Set default variants
      const defaultVariants = (vehiclesData as Vehicle[]).map((vehicle) =>
        vehicle.vehicle_variants?.length > 0 ? vehicle.vehicle_variants[0] : null
      );
      setSelectedVariants(defaultVariants);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      showToast('error', 'Failed to load vehicles for comparison');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await api.encyclopedia.searchVehicles(query, {}, 'relevance', 10);
      // Filter out already selected vehicles
      const filteredResults = (results as Vehicle[]).filter((vehicle) =>
        !vehicleIds.includes(vehicle.id)
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching vehicles:', error);
    }
  };

  const addVehicleToComparison = (vehicle: Vehicle) => {
    if (vehicles.length >= 3) {
      showToast('info', 'Maximum 3 vehicles can be compared at once');
      return;
    }

    const newVehicleIds = [...vehicleIds, vehicle.id];
    setSearchParams({ v: newVehicleIds.join(',') });
    setShowAddVehicle(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeVehicle = (index: number) => {
    const newVehicleIds = vehicleIds.filter((_, i) => i !== index);
    if (newVehicleIds.length === 0) {
      navigate('/encyclopedia');
    } else {
      setSearchParams({ v: newVehicleIds.join(',') });
    }
  };

  const handleVariantChange = (vehicleIndex: number, variantId: string) => {
    const vehicle = vehicles[vehicleIndex];
    const variant = vehicle.vehicle_variants.find(v => v.id === variantId);
    const newSelectedVariants = [...selectedVariants];
    newSelectedVariants[vehicleIndex] = variant || null;
    setSelectedVariants(newSelectedVariants);
  };

  const calculateAverageRating = (reviews: VehicleReview[]) => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'discontinued': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ev': return <Zap size={16} />;
      case 'bike': return <TrendingUp size={16} />;
      default: return <Settings size={16} />;
    }
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/encyclopedia')}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to Encyclopedia
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Compare Vehicles
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {vehicles.length} of 3 vehicles selected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {vehicles.length < 3 && (
                <Button
                  variant="primary"
                  onClick={() => setShowAddVehicle(true)}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Vehicle
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  showToast('success', 'Link copied to clipboard');
                }}
                className="flex items-center gap-2"
              >
                <Share2 size={16} />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {vehicles.length === 0 ? (
          <Card className="text-center p-12">
            <div className="mb-6">
              <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Vehicles Selected
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Add vehicles to start comparing their specifications and features.
              </p>
            </div>
            <Button onClick={() => setShowAddVehicle(true)}>
              Add First Vehicle
            </Button>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Vehicle Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle, index) => (
                <Card key={vehicle.id} className="relative">
                  <div className="absolute top-4 right-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeVehicle(index)}
                      className="w-8 h-8 p-0 rounded-full"
                    >
                      <X size={14} />
                    </Button>
                  </div>

                  <div className="p-6">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        {getCategoryIcon(vehicle.category)}
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {vehicle.category}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(vehicle.status)}`}>
                          {vehicle.status}
                        </span>
                      </div>
                    </div>

                    {/* Variant Selector */}
                    {vehicle.vehicle_variants && vehicle.vehicle_variants.length > 1 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Select Variant
                        </label>
                        <select
                          value={selectedVariants[index]?.id || ''}
                          onChange={(e) => handleVariantChange(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100"
                        >
                          {vehicle.vehicle_variants.map((variant) => (
                            <option key={variant.id} value={variant.id}>
                              {variant.variant_name} - ₹{variant.price_range_min.toLocaleString()} - ₹{variant.price_range_max.toLocaleString()}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Key Specs */}
                    {selectedVariants[index] && (
                      <div className="space-y-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-accent-blue">
                            ₹{selectedVariants[index].price_range_min.toLocaleString()} - ₹{selectedVariants[index].price_range_max.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Price Range
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {selectedVariants[index].fuel_efficiency_combined} kmpl
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">Fuel Efficiency</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {selectedVariants[index].power_hp} HP
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">Power</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {selectedVariants[index].acceleration_0_100}s
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">0-100 km/h</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {calculateAverageRating(vehicle.vehicle_reviews).toFixed(1)}★
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">Rating</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}

              {/* Add Vehicle Card */}
              {vehicles.length < 3 && (
                <Card
                  className="border-2 border-dashed border-gray-300 dark:border-dark-border hover:border-accent-blue cursor-pointer transition-colors"
                  onClick={() => setShowAddVehicle(true)}
                >
                  <div className="p-6 text-center">
                    <Plus size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Add Vehicle
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Compare up to 3 vehicles
                    </p>
                  </div>
                </Card>
              )}
            </div>

            {/* Detailed Comparison Table */}
            {vehicles.length > 1 && selectedVariants.some(v => v !== null) && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                  Detailed Comparison
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-dark-border">
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                          Specification
                        </th>
                        {vehicles.map((vehicle, index) => (
                          <th key={vehicle.id} className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100 min-w-[200px]">
                            {vehicle.brand} {vehicle.model}
                            {selectedVariants[index] && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {selectedVariants[index].variant_name}
                              </div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Price */}
                      <tr className="border-b border-gray-100 dark:border-dark-border">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Price Range
                        </td>
                        {selectedVariants.map((variant, index) => (
                          <td key={index} className="py-3 px-4 text-center">
                            {variant ? (
                              <div className="font-semibold text-accent-blue">
                                ₹{variant.price_range_min.toLocaleString()} - ₹{variant.price_range_max.toLocaleString()}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Engine */}
                      <tr className="border-b border-gray-100 dark:border-dark-border">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Engine
                        </td>
                        {selectedVariants.map((variant, index) => (
                          <td key={index} className="py-3 px-4 text-center">
                            {variant ? (
                              <div>
                                <div className="font-medium">{variant.engine_type}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {variant.engine_displacement}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Power & Torque */}
                      <tr className="border-b border-gray-100 dark:border-dark-border">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Power & Torque
                        </td>
                        {selectedVariants.map((variant, index) => (
                          <td key={index} className="py-3 px-4 text-center">
                            {variant ? (
                              <div>
                                <div className="font-medium">{variant.power_hp} HP</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {variant.torque_nm} Nm
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Transmission */}
                      <tr className="border-b border-gray-100 dark:border-dark-border">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Transmission
                        </td>
                        {selectedVariants.map((variant, index) => (
                          <td key={index} className="py-3 px-4 text-center font-medium">
                            {variant?.transmission || <span className="text-gray-400">-</span>}
                          </td>
                        ))}
                      </tr>

                      {/* Fuel Efficiency */}
                      <tr className="border-b border-gray-100 dark:border-dark-border">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Fuel Efficiency (kmpl)
                        </td>
                        {selectedVariants.map((variant, index) => (
                          <td key={index} className="py-3 px-4 text-center">
                            {variant ? (
                              <div>
                                <div className="font-medium">{variant.fuel_efficiency_combined}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  City: {variant.fuel_efficiency_city} | Hwy: {variant.fuel_efficiency_highway}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Performance */}
                      <tr className="border-b border-gray-100 dark:border-dark-border">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Performance
                        </td>
                        {selectedVariants.map((variant, index) => (
                          <td key={index} className="py-3 px-4 text-center">
                            {variant ? (
                              <div>
                                <div className="font-medium">{variant.acceleration_0_100}s 0-100</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  Top Speed: {variant.top_speed_kmph} km/h
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Dimensions */}
                      <tr className="border-b border-gray-100 dark:border-dark-border">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Dimensions (mm)
                        </td>
                        {selectedVariants.map((variant, index) => (
                          <td key={index} className="py-3 px-4 text-center">
                            {variant ? (
                              <div>
                                <div className="font-medium">
                                  {variant.length_mm}L × {variant.width_mm}W × {variant.height_mm}H
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  Wheelbase: {variant.wheelbase_mm}mm
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Boot Space */}
                      <tr className="border-b border-gray-100 dark:border-dark-border">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Boot Space
                        </td>
                        {selectedVariants.map((variant, index) => (
                          <td key={index} className="py-3 px-4 text-center font-medium">
                            {variant ? `${variant.boot_space_liters} L` : <span className="text-gray-400">-</span>}
                          </td>
                        ))}
                      </tr>

                      {/* Rating */}
                      <tr>
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          User Rating
                        </td>
                        {vehicles.map((vehicle, index) => (
                          <td key={index} className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={14}
                                    className={`${
                                      star <= calculateAverageRating(vehicle.vehicle_reviews)
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="ml-1 font-medium">
                                {calculateAverageRating(vehicle.vehicle_reviews).toFixed(1)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              ({vehicle.vehicle_reviews.length} reviews)
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Add Vehicle Modal */}
      <AnimatePresence>
        {showAddVehicle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-dark-card rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 dark:border-dark-border">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Add Vehicle to Compare
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddVehicle(false)}
                    className="w-8 h-8 p-0 rounded-full"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search vehicles..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value);
                    }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                  />
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((vehicle) => (
                        <div
                          key={vehicle.id}
                          onClick={() => addVehicleToComparison(vehicle)}
                          className="flex items-center justify-between p-4 border border-gray-200 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-elevated cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-dark-elevated rounded-lg flex items-center justify-center">
                              <Settings size={20} className="text-gray-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {vehicle.brand} {vehicle.model}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                {vehicle.category} • {vehicle.fuel_type}
                              </div>
                            </div>
                          </div>
                          <Button size="sm">
                            <Plus size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No vehicles found matching "{searchQuery}"
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Start typing to search for vehicles
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComparisonView;
