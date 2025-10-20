import { useState, useEffect } from 'react';
import { Card, Button, Loader } from '../components/ui';
import { Search, Filter, Star, TrendingUp, BookOpen, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  category: string;
  body_type?: string;
  fuel_type?: string;
  status: string;
  launch_date?: string;
  average_rating?: number;
  review_count?: number;
  price_range?: {
    min: number;
    max: number;
    currency: string;
  };
  variants_count?: number;
}

interface SearchFilters {
  brand: string[];
  category: string[];
  fuel_type: string[];
  body_type: string[];
  price_min?: number;
  price_max?: number;
  status: string[];
}

const Encyclopedia = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    brand: [],
    category: [],
    fuel_type: [],
    body_type: [],
    status: []
  });
  const [sortBy, setSortBy] = useState<'relevance' | 'price_low' | 'price_high' | 'rating' | 'newest'>('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Available filter options
  const filterOptions = {
    brand: ['Maruti', 'Hyundai', 'Tata', 'Mahindra', 'Honda', 'Toyota', 'Ford', 'Kia', 'MG', 'Renault'],
    category: ['car', 'bike', 'ev'],
    fuel_type: ['petrol', 'diesel', 'electric', 'hybrid', 'cng'],
    body_type: ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Coupe', 'Convertible'],
    status: ['active', 'upcoming', 'discontinued']
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [vehicles, searchQuery, filters, sortBy]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      // For now, using mock data until Supabase functions are deployed
      // In production, this would call the vehicle-search Edge Function
      const mockVehicles: Vehicle[] = [
        {
          id: '1',
          brand: 'Maruti',
          model: 'Swift',
          category: 'car',
          body_type: 'Hatchback',
          fuel_type: 'petrol',
          status: 'active',
          average_rating: 4.2,
          review_count: 1250,
          price_range: { min: 599000, max: 899000, currency: 'INR' },
          variants_count: 8
        },
        {
          id: '2',
          brand: 'Tata',
          model: 'Nexon',
          category: 'car',
          body_type: 'SUV',
          fuel_type: 'petrol',
          status: 'active',
          average_rating: 4.5,
          review_count: 2100,
          price_range: { min: 799000, max: 1499000, currency: 'INR' },
          variants_count: 12
        },
        {
          id: '3',
          brand: 'Hyundai',
          model: 'Creta',
          category: 'car',
          body_type: 'SUV',
          fuel_type: 'petrol',
          status: 'active',
          average_rating: 4.3,
          review_count: 1800,
          price_range: { min: 1099000, max: 1899000, currency: 'INR' },
          variants_count: 15
        }
      ];

      setVehicles(mockVehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = vehicles;

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(vehicle =>
        vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.body_type?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    if (filters.brand.length > 0) {
      filtered = filtered.filter(vehicle => filters.brand.includes(vehicle.brand));
    }
    if (filters.category.length > 0) {
      filtered = filtered.filter(vehicle => filters.category.includes(vehicle.category));
    }
    if (filters.fuel_type.length > 0) {
      filtered = filtered.filter(vehicle => vehicle.fuel_type && filters.fuel_type.includes(vehicle.fuel_type));
    }
    if (filters.body_type.length > 0) {
      filtered = filtered.filter(vehicle => vehicle.body_type && filters.body_type.includes(vehicle.body_type));
    }
    if (filters.status.length > 0) {
      filtered = filtered.filter(vehicle => filters.status.includes(vehicle.status));
    }
    if (filters.price_min !== undefined) {
      filtered = filtered.filter(vehicle => vehicle.price_range && vehicle.price_range.min >= filters.price_min!);
    }
    if (filters.price_max !== undefined) {
      filtered = filtered.filter(vehicle => vehicle.price_range && vehicle.price_range.max <= filters.price_max!);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return (a.price_range?.min || 0) - (b.price_range?.min || 0);
        case 'price_high':
          return (b.price_range?.max || 0) - (a.price_range?.max || 0);
        case 'rating':
          return (b.average_rating || 0) - (a.average_rating || 0);
        case 'newest':
          return new Date(b.launch_date || 0).getTime() - new Date(a.launch_date || 0).getTime();
        default:
          return 0;
      }
    });

    setFilteredVehicles(filtered);
  };

  const toggleFilter = (type: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: Array.isArray(prev[type])
        ? (prev[type] as string[]).includes(value)
          ? (prev[type] as string[]).filter((item: string) => item !== value)
          : [...(prev[type] as string[]), value]
        : [value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      brand: [],
      category: [],
      fuel_type: [],
      body_type: [],
      status: []
    });
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
      default: return <BookOpen size={16} />;
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Vehicle Encyclopedia
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Discover and compare vehicles with detailed specifications
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {filteredVehicles.length} vehicles found
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search vehicles, brands, or features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
              </div>
            </div>

            {/* Sort and Filter Buttons */}
            <div className="flex gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-blue"
              >
                <option value="relevance">Sort by Relevance</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest First</option>
              </select>

              <Button
                variant={showFilters ? "primary" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter size={16} />
                Filters
                {(filters.brand.length + filters.category.length + filters.fuel_type.length + filters.body_type.length + filters.status.length) > 0 && (
                  <span className="bg-accent-blue text-white text-xs px-2 py-1 rounded-full">
                    {filters.brand.length + filters.category.length + filters.fuel_type.length + filters.body_type.length + filters.status.length}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 overflow-hidden"
              >
                <Card className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {/* Brand Filter */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Brand</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {filterOptions.brand.map(brand => (
                          <label key={brand} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={filters.brand.includes(brand)}
                              onChange={() => toggleFilter('brand', brand)}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{brand}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Category</h3>
                      <div className="space-y-2">
                        {filterOptions.category.map(category => (
                          <label key={category} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={filters.category.includes(category)}
                              onChange={() => toggleFilter('category', category)}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Fuel Type Filter */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Fuel Type</h3>
                      <div className="space-y-2">
                        {filterOptions.fuel_type.map(fuel => (
                          <label key={fuel} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={filters.fuel_type.includes(fuel)}
                              onChange={() => toggleFilter('fuel_type', fuel)}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{fuel}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Body Type Filter */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Body Type</h3>
                      <div className="space-y-2">
                        {filterOptions.body_type.map(body => (
                          <label key={body} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={filters.body_type.includes(body)}
                              onChange={() => toggleFilter('body_type', body)}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{body}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Status</h3>
                      <div className="space-y-2">
                        {filterOptions.status.map(status => (
                          <label key={status} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={filters.status.includes(status)}
                              onChange={() => toggleFilter('status', status)}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-dark-border">
                    <Button variant="outline" onClick={clearFilters}>
                      Clear All Filters
                    </Button>
                    <Button onClick={() => setShowFilters(false)}>
                      Apply Filters
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVehicles.map((vehicle, index) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-accent-blue transition-colors">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getCategoryIcon(vehicle.category)}
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {vehicle.category}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(vehicle.status)}`}>
                          {vehicle.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  {vehicle.average_rating && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 ml-1">
                          {vehicle.average_rating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({vehicle.review_count} reviews)
                      </span>
                    </div>
                  )}

                  {/* Price Range */}
                  {vehicle.price_range && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Price Range</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        ₹{vehicle.price_range.min.toLocaleString()} - ₹{vehicle.price_range.max.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Specs */}
                  <div className="space-y-2 mb-4">
                    {vehicle.body_type && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Body Type:</span>
                        <span className="text-gray-900 dark:text-gray-100">{vehicle.body_type}</span>
                      </div>
                    )}
                    {vehicle.fuel_type && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Fuel Type:</span>
                        <span className="text-gray-900 dark:text-gray-100 capitalize">{vehicle.fuel_type}</span>
                      </div>
                    )}
                    {vehicle.variants_count && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Variants:</span>
                        <span className="text-gray-900 dark:text-gray-100">{vehicle.variants_count}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                    >
                      Compare
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredVehicles.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOpen size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No vehicles found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your search criteria or filters
            </p>
            <Button onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Vehicle Detail Modal would go here */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedVehicle.brand} {selectedVehicle.model}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedVehicle(null)}
                >
                  ✕
                </Button>
              </div>
              {/* Vehicle details would be expanded here */}
              <p className="text-gray-600 dark:text-gray-400">
                Detailed vehicle information will be displayed here with specifications, variants, reviews, and comparison options.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Encyclopedia;
