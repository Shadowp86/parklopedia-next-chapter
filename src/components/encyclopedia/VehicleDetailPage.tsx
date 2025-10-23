import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Loader, Badge } from '../ui';
import {
  ArrowLeft,
  Star,
  Heart,
  Share2,
  Fuel,
  Gauge,
  Settings,
  TrendingUp,
  Zap,
  Calendar,
  Users,
  Bookmark,
  BookmarkCheck,
  MessageSquare,
  ThumbsUp,
  Camera,
  Plus,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui';
import { api } from '../../lib/api';
import { Vehicle, VehicleVariant, VehicleReview, VehicleBookmark } from '../../types/encyclopedia';

interface VehicleDetail extends Vehicle {
  vehicle_variants: VehicleVariant[];
  vehicle_reviews: VehicleReview[];
}

const VehicleDetailPage = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'variants' | 'specs' | 'reviews'>('overview');
  const [selectedVariant, setSelectedVariant] = useState<VehicleVariant | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [reviews, setReviews] = useState<VehicleReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    if (vehicleId) {
      fetchVehicleDetails();
      if (user) {
        checkBookmarkStatus();
      }
    }
  }, [vehicleId, user]);

  useEffect(() => {
    if (vehicle && vehicle.vehicle_variants.length > 0 && !selectedVariant) {
      setSelectedVariant(vehicle.vehicle_variants[0]);
    }
  }, [vehicle, selectedVariant]);

  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      const data = await api.encyclopedia.getVehicleById(vehicleId!);
      setVehicle(data as VehicleDetail);
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      showToast('error', 'Failed to load vehicle details');
      navigate('/encyclopedia');
    } finally {
      setLoading(false);
    }
  };

  const checkBookmarkStatus = async () => {
    try {
      const bookmarks = await api.encyclopedia.getUserBookmarks(user!.id);
      const isBookmarked = (bookmarks as VehicleBookmark[]).some((bookmark) => bookmark.vehicle_id === vehicleId);
      setIsBookmarked(isBookmarked);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      showToast('info', 'Please sign in to bookmark vehicles');
      return;
    }

    try {
      if (isBookmarked) {
        await api.encyclopedia.removeBookmark(user.id, vehicleId!);
        setIsBookmarked(false);
        showToast('success', 'Removed from bookmarks');
      } else {
        await api.encyclopedia.addBookmark(user.id, vehicleId!);
        setIsBookmarked(true);
        showToast('success', 'Added to bookmarks');
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
      showToast('error', 'Failed to update bookmark');
    }
  };

  const fetchReviews = async () => {
    if (!vehicle) return;

    try {
      setReviewsLoading(true);
      const reviewsData = await api.encyclopedia.getVehicleReviews(vehicle.id, 10, 0);
      setReviews(reviewsData as VehicleReview[]);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('success', 'Link copied to clipboard');
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
      case 'ev': return <Zap size={20} />;
      case 'bike': return <TrendingUp size={20} />;
      default: return <Settings size={20} />;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={`${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Vehicle Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The vehicle you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate('/encyclopedia')}>
            Back to Encyclopedia
          </Button>
        </Card>
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
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {vehicle.brand} {vehicle.model}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {getCategoryIcon(vehicle.category)}
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {vehicle.category}
                  </span>
                  <Badge variant="outline" className={getStatusColor(vehicle.status)}>
                    {vehicle.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleBookmark}
                className={`flex items-center gap-2 ${isBookmarked ? 'text-accent-blue' : ''}`}
              >
                {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 size={16} />
                Share
              </Button>
              <Button
                onClick={() => navigate(`/encyclopedia/compare?v=${vehicle.id}`)}
                className="flex items-center gap-2"
              >
                <TrendingUp size={16} />
                Compare
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Rating and Price Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {renderStars(vehicle.average_rating || 0)}
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {vehicle.average_rating?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {vehicle.review_count || 0} reviews
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-blue mb-2">
                ₹{vehicle.price_range?.min.toLocaleString()} - ₹{vehicle.price_range?.max.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Price Range
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {vehicle.variants_count || vehicle.vehicle_variants?.length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Variants Available
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-dark-border">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: Settings },
                { id: 'variants', label: 'Variants', icon: TrendingUp },
                { id: 'specs', label: 'Specifications', icon: Gauge },
                { id: 'reviews', label: 'Reviews', icon: MessageSquare }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-accent-blue text-accent-blue'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Key Features */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Key Features
                  </h3>
                  <div className="space-y-3">
                    {vehicle.key_features?.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-accent-blue rounded-full"></div>
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    )) || (
                      <p className="text-gray-500 dark:text-gray-400">No key features listed</p>
                    )}
                  </div>
                </Card>

                {/* Quick Specs */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Quick Specifications
                  </h3>
                  <div className="space-y-3">
                    {selectedVariant && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Engine:</span>
                          <span className="font-medium">{selectedVariant.engine_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Power:</span>
                          <span className="font-medium">{selectedVariant.power_hp} HP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Fuel Efficiency:</span>
                          <span className="font-medium">{selectedVariant.fuel_efficiency_combined} kmpl</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Top Speed:</span>
                          <span className="font-medium">{selectedVariant.top_speed_kmph} km/h</span>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              </div>

              {/* Description */}
              {vehicle.description && (
                <Card className="p-6 mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Description
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {vehicle.description}
                  </p>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === 'variants' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-4">
                {vehicle.vehicle_variants?.map((variant) => (
                  <Card key={variant.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {variant.variant_name}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Price:</span>
                            <div className="font-medium">₹{variant.price_range_min.toLocaleString()} - ₹{variant.price_range_max.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Engine:</span>
                            <div className="font-medium">{variant.engine_type}</div>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Power:</span>
                            <div className="font-medium">{variant.power_hp} HP</div>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Fuel Efficiency:</span>
                            <div className="font-medium">{variant.fuel_efficiency_combined} kmpl</div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVariant(variant)}
                        className={selectedVariant?.id === variant.id ? 'border-accent-blue text-accent-blue' : ''}
                      >
                        {selectedVariant?.id === variant.id ? 'Selected' : 'Select'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'specs' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {selectedVariant ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Engine & Performance */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Engine & Performance
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Engine Type:</span>
                        <span className="font-medium">{selectedVariant.engine_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Displacement:</span>
                        <span className="font-medium">{selectedVariant.engine_displacement}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Power:</span>
                        <span className="font-medium">{selectedVariant.power_hp} HP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Torque:</span>
                        <span className="font-medium">{selectedVariant.torque_nm} Nm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Transmission:</span>
                        <span className="font-medium">{selectedVariant.transmission}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Top Speed:</span>
                        <span className="font-medium">{selectedVariant.top_speed_kmph} km/h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">0-100 km/h:</span>
                        <span className="font-medium">{selectedVariant.acceleration_0_100}s</span>
                      </div>
                    </div>
                  </Card>

                  {/* Fuel Efficiency */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Fuel Efficiency
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">City:</span>
                        <span className="font-medium">{selectedVariant.fuel_efficiency_city} kmpl</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Highway:</span>
                        <span className="font-medium">{selectedVariant.fuel_efficiency_highway} kmpl</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Combined:</span>
                        <span className="font-medium">{selectedVariant.fuel_efficiency_combined} kmpl</span>
                      </div>
                      {selectedVariant.electric_range && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Electric Range:</span>
                          <span className="font-medium">{selectedVariant.electric_range} km</span>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Dimensions */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Dimensions
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Length:</span>
                        <span className="font-medium">{selectedVariant.length_mm} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Width:</span>
                        <span className="font-medium">{selectedVariant.width_mm} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Height:</span>
                        <span className="font-medium">{selectedVariant.height_mm} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Wheelbase:</span>
                        <span className="font-medium">{selectedVariant.wheelbase_mm} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Ground Clearance:</span>
                        <span className="font-medium">{selectedVariant.ground_clearance_mm} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Boot Space:</span>
                        <span className="font-medium">{selectedVariant.boot_space_liters} L</span>
                      </div>
                    </div>
                  </Card>

                  {/* Features */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Features
                    </h3>
                    <div className="space-y-2">
                      {selectedVariant.features ? (
                        Object.entries(selectedVariant.features).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400 capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">No additional features listed</p>
                      )}
                    </div>
                  </Card>
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Settings size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Select a Variant
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose a variant from the Variants tab to view detailed specifications.
                  </p>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                {/* Review Summary */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Customer Reviews
                    </h3>
                    <Button
                      onClick={() => setShowReviewForm(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Write Review
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {vehicle.average_rating?.toFixed(1) || 'N/A'}
                      </div>
                      <div className="flex items-center justify-center mb-1">
                        {renderStars(vehicle.average_rating || 0)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Based on {vehicle.review_count || 0} reviews
                      </div>
                    </div>

                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((stars) => (
                        <div key={stars} className="flex items-center gap-2 text-sm">
                          <span className="w-8">{stars}★</span>
                          <div className="flex-1 bg-gray-200 dark:bg-dark-elevated rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full"
                              style={{ width: '60%' }}
                            ></div>
                          </div>
                          <span className="w-8 text-right">60%</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent-blue mb-1">
                        {vehicle.review_count || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total Reviews
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviewsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader size="md" />
                    </div>
                  ) : reviews.length > 0 ? (
                    reviews.map((review) => (
                      <Card key={review.id} className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-accent-blue rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {review.user?.full_name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {review.user?.full_name || 'Anonymous'}
                              </span>
                              <div className="flex items-center">
                                {renderStars(review.rating)}
                              </div>
                              {review.verified_purchase && (
                                <Badge variant="secondary">
                                  Verified Purchase
                                </Badge>
                              )}
                            </div>

                            {review.title && (
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                {review.title}
                              </h4>
                            )}

                            <p className="text-gray-700 dark:text-gray-300 mb-3">
                              {review.content}
                            </p>

                            {review.pros && review.pros.length > 0 && (
                              <div className="mb-3">
                                <h5 className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                                  Pros:
                                </h5>
                                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                  {review.pros.map((pro, index) => (
                                    <li key={index}>• {pro}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {review.cons && review.cons.length > 0 && (
                              <div className="mb-3">
                                <h5 className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                                  Cons:
                                </h5>
                                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                  {review.cons.map((con, index) => (
                                    <li key={index}>• {con}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {review.images && review.images.length > 0 && (
                              <div className="flex gap-2 mb-3">
                                {review.images.map((image, index) => (
                                  <div key={index} className="w-16 h-16 bg-gray-200 dark:bg-dark-elevated rounded-lg flex items-center justify-center">
                                    <Camera size={20} className="text-gray-400" />
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                              <span>{new Date(review.created_at).toLocaleDateString()}</span>
                              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                                <ThumbsUp size={14} />
                                Helpful ({review.helpful_count || 0})
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <Card className="p-8 text-center">
                      <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        No Reviews Yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Be the first to review this vehicle.
                      </p>
                      <Button onClick={() => setShowReviewForm(true)}>
                        Write First Review
                      </Button>
                    </Card>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Review Form Modal */}
      <AnimatePresence>
        {showReviewForm && (
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
              className="bg-white dark:bg-dark-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 dark:border-dark-border">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Write a Review
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReviewForm(false)}
                    className="w-8 h-8 p-0 rounded-full"
                  >
                    ✕
                  </Button>
                </div>
              </div>

              <div className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {vehicle.brand} {vehicle.model}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Share your experience with this vehicle
                  </p>
                </div>

                <form className="space-y-6">
                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Overall Rating
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="text-2xl text-gray-300 hover:text-yellow-400"
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Review Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Review Title
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100"
                      placeholder="Summarize your review"
                    />
                  </div>

                  {/* Review Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Review
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100"
                      placeholder="Share your detailed experience..."
                    />
                  </div>

                  {/* Pros and Cons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Pros
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100"
                        placeholder="What did you like?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cons
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100"
                        placeholder="What could be improved?"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowReviewForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Submit Review
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VehicleDetailPage;
