// ===========================================
// ENCYCLOPEDIA TYPES
// ===========================================

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  category: 'car' | 'bike' | 'ev';
  body_type?: string;
  fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng';
  status: 'active' | 'upcoming' | 'discontinued';
  launch_date?: string;
  average_rating?: number;
  review_count?: number;
  price_range?: {
    min: number;
    max: number;
    currency: string;
  };
  variants_count?: number;
  image_url?: string;
  description?: string;
  key_features?: string[];
  specifications?: VehicleSpecifications;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleSpecifications {
  engine?: {
    type: string;
    displacement?: string;
    power_hp?: number;
    torque_nm?: number;
    cylinders?: number;
  };
  transmission?: {
    type: string;
    gears?: number;
  };
  dimensions?: {
    length_mm?: number;
    width_mm?: number;
    height_mm?: number;
    wheelbase_mm?: number;
    ground_clearance_mm?: number;
    kerb_weight_kg?: number;
  };
  performance?: {
    top_speed_kmph?: number;
    acceleration_0_100?: number;
    fuel_efficiency_city?: number;
    fuel_efficiency_highway?: number;
    fuel_efficiency_combined?: number;
    electric_range?: number;
    battery_capacity?: number;
    charging_time?: string;
  };
  safety?: {
    airbags?: number;
    abs?: boolean;
    esp?: boolean;
    hill_assist?: boolean;
    emergency_braking?: boolean;
    blind_spot_monitor?: boolean;
  };
  comfort?: {
    air_conditioning?: boolean;
    power_steering?: boolean;
    power_windows?: boolean;
    central_locking?: boolean;
    music_system?: boolean;
    bluetooth?: boolean;
    usb_ports?: number;
  };
}

export interface VehicleVariant {
  id: string;
  vehicle_id: string;
  variant_name: string;
  price_range_min: number;
  price_range_max: number;
  currency: string;
  engine_type: string;
  engine_displacement?: string;
  power_hp?: number;
  torque_nm?: number;
  transmission: string;
  fuel_efficiency_city?: number;
  fuel_efficiency_highway?: number;
  fuel_efficiency_combined?: number;
  electric_range?: number;
  top_speed_kmph?: number;
  acceleration_0_100?: number;
  length_mm?: number;
  width_mm?: number;
  height_mm?: number;
  wheelbase_mm?: number;
  ground_clearance_mm?: number;
  boot_space_liters?: number;
  features: Record<string, unknown>;
  colors?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface VehicleReview {
  id: string;
  vehicle_id: string;
  user_id: string;
  rating: number;
  title?: string;
  content: string;
  pros?: string[];
  cons?: string[];
  verified_purchase?: boolean;
  helpful_count?: number;
  images?: string[];
  created_at: string;
  updated_at?: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface VehicleNews {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  image_url?: string;
  categories: string[];
  tags?: string[];
  published_at: string;
  author?: string;
  source_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleBookmark {
  id: string;
  user_id: string;
  vehicle_id: string;
  notes?: string;
  created_at: string;
  vehicle?: Vehicle;
}

export interface VehicleAlert {
  id: string;
  user_id: string;
  vehicle_id: string;
  alert_type: 'launch_date' | 'price_drop' | 'availability';
  threshold_value?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  vehicle?: Vehicle;
}

export interface VehicleComparison {
  id: string;
  user_id?: string;
  vehicle_ids: string[];
  comparison_data: any;
  created_at: string;
  updated_at?: string;
  vehicles?: Vehicle[];
}

export interface SearchFilters {
  brand?: string[];
  category?: string[];
  fuel_type?: string[];
  body_type?: string[];
  status?: string[];
  price_min?: number;
  price_max?: number;
  rating_min?: number;
  launch_date_from?: string;
  launch_date_to?: string;
}

export interface SearchParams {
  query?: string;
  filters?: SearchFilters;
  sort_by?: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'newest' | 'brand';
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  vehicles: Vehicle[];
  total_count: number;
  has_more: boolean;
  facets?: {
    brands: { [key: string]: number };
    categories: { [key: string]: number };
    fuel_types: { [key: string]: number };
    body_types: { [key: string]: number };
    price_ranges: { [key: string]: number };
  };
}

export interface ComparisonData {
  vehicles: Vehicle[];
  comparison_matrix: {
    [key: string]: {
      [vehicleId: string]: any;
    };
  };
  recommendations?: string[];
  insights?: string[];
}

// ===========================================
// API RESPONSE TYPES
// ===========================================

export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ===========================================
// COMPONENT PROPS TYPES
// ===========================================

export interface VehicleCardProps {
  vehicle: Vehicle;
  onViewDetails?: (vehicle: Vehicle) => void;
  onCompare?: (vehicle: Vehicle) => void;
  onBookmark?: (vehicle: Vehicle) => void;
  isBookmarked?: boolean;
  showCompare?: boolean;
}

export interface VehicleDetailProps {
  vehicleId: string;
  onClose?: () => void;
  onCompare?: (vehicle: Vehicle) => void;
}

export interface ComparisonViewProps {
  vehicleIds: string[];
  onRemoveVehicle?: (vehicleId: string) => void;
  onAddVehicle?: () => void;
  onClearComparison?: () => void;
}

export interface ReviewFormProps {
  vehicleId: string;
  onSubmit?: (review: Partial<VehicleReview>) => void;
  onCancel?: () => void;
}

export interface ReviewListProps {
  vehicleId: string;
  reviews: VehicleReview[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

export interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
  availableOptions?: {
    brands: string[];
    categories: string[];
    fuel_types: string[];
    body_types: string[];
    statuses: string[];
  };
}

export interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  loading?: boolean;
}

export interface SortOptionsProps {
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
}
