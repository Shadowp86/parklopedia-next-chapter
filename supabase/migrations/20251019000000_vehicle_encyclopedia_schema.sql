-- Phase 10.1: Vehicle Encyclopedia Database Schema
-- Creates comprehensive vehicle catalog with specifications, reviews, and comparison features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- Master vehicle catalog table
CREATE TABLE vehicles_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('car', 'bike', 'ev', 'truck', 'bus')),
    body_type VARCHAR(50), -- SUV, Sedan, Hatchback, etc.
    fuel_type VARCHAR(50) CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'upcoming')),
    launch_date DATE,
    discontinued_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Search optimization
    search_vector TSVECTOR,
    UNIQUE(brand, model)
);

-- Vehicle variants table (different trims/specifications)
CREATE TABLE vehicle_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles_catalog(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL, -- Base, Plus, Premium, etc.
    price_range_min DECIMAL(12,2),
    price_range_max DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'INR',

    -- Engine specifications
    engine_type VARCHAR(50),
    engine_displacement VARCHAR(20), -- e.g., "1199 cc"
    power_hp INTEGER,
    torque_nm INTEGER,
    transmission VARCHAR(50), -- Manual, Automatic, CVT
    fuel_efficiency_city DECIMAL(4,1), -- kmpl or km/range
    fuel_efficiency_highway DECIMAL(4,1),
    fuel_efficiency_combined DECIMAL(4,1),
    electric_range INTEGER, -- for EVs

    -- Dimensions
    length_mm INTEGER,
    width_mm INTEGER,
    height_mm INTEGER,
    wheelbase_mm INTEGER,
    ground_clearance_mm INTEGER,
    boot_space_liters INTEGER,

    -- Features (JSON for flexible storage)
    features JSONB DEFAULT '{}',
    colors JSONB DEFAULT '[]', -- Array of available colors

    -- Performance
    top_speed_kmph INTEGER,
    acceleration_0_100 DECIMAL(4,1), -- seconds

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(vehicle_id, variant_name)
);

-- Vehicle reviews and ratings
CREATE TABLE vehicle_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles_catalog(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- Clerk user ID
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    review_text TEXT,
    ownership_duration VARCHAR(50), -- e.g., "2 years"
    purchase_price DECIMAL(12,2),
    pros TEXT[],
    cons TEXT[],
    verified_purchase BOOLEAN DEFAULT FALSE,

    -- Media attachments
    photos JSONB DEFAULT '[]', -- Array of Supabase storage URLs

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, vehicle_id)
);

-- Vehicle comparison history
CREATE TABLE vehicle_comparisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- NULL for anonymous comparisons
    vehicle_ids UUID[] NOT NULL CHECK (array_length(vehicle_ids, 1) <= 3),
    comparison_criteria TEXT[], -- What aspects were compared
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle alerts and notifications
CREATE TABLE vehicle_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    vehicle_id UUID REFERENCES vehicles_catalog(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('price_drop', 'new_variant', 'launch_date', 'discontinued')),
    threshold_value DECIMAL(12,2), -- For price alerts
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automotive news and articles
CREATE TABLE vehicle_news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    content TEXT,
    source_url VARCHAR(1000),
    source_name VARCHAR(100),
    published_at TIMESTAMP WITH TIME ZONE,
    image_url VARCHAR(1000),

    -- AI-generated summary
    ai_summary TEXT,
    ai_tags TEXT[],

    -- Categorization
    categories TEXT[] DEFAULT '{}',
    related_vehicles UUID[] DEFAULT '{}', -- References to vehicles_catalog

    -- Engagement metrics
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(source_url)
);

-- User bookmarks for vehicles
CREATE TABLE vehicle_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES vehicles_catalog(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, vehicle_id)
);

-- Create indexes for performance
CREATE INDEX idx_vehicles_catalog_brand ON vehicles_catalog(brand);
CREATE INDEX idx_vehicles_catalog_category ON vehicles_catalog(category);
CREATE INDEX idx_vehicles_catalog_status ON vehicles_catalog(status);
CREATE INDEX idx_vehicles_catalog_search ON vehicles_catalog USING GIN(search_vector);

CREATE INDEX idx_vehicle_variants_vehicle_id ON vehicle_variants(vehicle_id);
CREATE INDEX idx_vehicle_variants_price ON vehicle_variants(price_range_min, price_range_max);

CREATE INDEX idx_vehicle_reviews_vehicle_id ON vehicle_reviews(vehicle_id);
CREATE INDEX idx_vehicle_reviews_user_id ON vehicle_reviews(user_id);
CREATE INDEX idx_vehicle_reviews_rating ON vehicle_reviews(rating);

CREATE INDEX idx_vehicle_alerts_user_id ON vehicle_alerts(user_id);
CREATE INDEX idx_vehicle_alerts_vehicle_id ON vehicle_alerts(vehicle_id);

CREATE INDEX idx_vehicle_news_published_at ON vehicle_news(published_at DESC);
CREATE INDEX idx_vehicle_news_categories ON vehicle_news USING GIN(categories);
CREATE INDEX idx_vehicle_news_related_vehicles ON vehicle_news USING GIN(related_vehicles);

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_vehicle_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.brand, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.model, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.body_type, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.fuel_type, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for search vector updates
CREATE TRIGGER trigger_update_vehicle_search_vector
    BEFORE INSERT OR UPDATE ON vehicles_catalog
    FOR EACH ROW EXECUTE FUNCTION update_vehicle_search_vector();

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_vehicles_catalog_updated_at BEFORE UPDATE ON vehicles_catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicle_variants_updated_at BEFORE UPDATE ON vehicle_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicle_reviews_updated_at BEFORE UPDATE ON vehicle_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicle_news_updated_at BEFORE UPDATE ON vehicle_news FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
