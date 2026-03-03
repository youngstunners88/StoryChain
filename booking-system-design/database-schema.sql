-- ============================================================================
-- UNIVERSAL BOOKING SYSTEM - DATABASE SCHEMA
-- PostgreSQL 15+ with JSONB support for flexibility
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For location-based businesses

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Businesses/Organizations
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('restaurant', 'clinic', 'service')),
    
    -- Contact Information
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(255),
    
    -- Location
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'South Africa',
    location GEOGRAPHY(POINT, 4326), -- PostGIS for geo-queries
    
    -- Business Settings
    timezone VARCHAR(50) DEFAULT 'Africa/Johannesburg',
    currency VARCHAR(3) DEFAULT 'ZAR',
    booking_buffer_minutes INTEGER DEFAULT 30, -- Min time between bookings
    max_advance_booking_days INTEGER DEFAULT 90,
    min_advance_booking_hours INTEGER DEFAULT 2,
    cancellation_hours INTEGER DEFAULT 24,
    
    -- Display Settings
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#3B82F6',
    booking_message TEXT, -- Custom message shown during booking
    
    -- Notification Settings
    sms_notifications_enabled BOOLEAN DEFAULT false,
    email_notifications_enabled BOOLEAN DEFAULT true,
    reminder_hours_before INTEGER DEFAULT 24,
    
    -- Payment Settings (if applicable)
    payment_required BOOLEAN DEFAULT false,
    deposit_percentage INTEGER DEFAULT 0,
    
    -- Metadata
    settings JSONB DEFAULT '{}', -- Flexible business-specific settings
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_deposit CHECK (deposit_percentage >= 0 AND deposit_percentage <= 100)
);

-- Users (Customers, Staff, Admins)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Authentication
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'staff', 'admin', 'owner')),
    
    -- Profile
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    avatar_url TEXT,
    
    -- Preferences
    timezone VARCHAR(50) DEFAULT 'Africa/Johannesburg',
    language VARCHAR(10) DEFAULT 'en',
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false}',
    
    -- For Staff
    is_active BOOLEAN DEFAULT true,
    hourly_rate DECIMAL(10,2),
    
    -- Metadata
    last_login_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(business_id, email),
    CONSTRAINT valid_role CHECK (
        (role = 'customer' AND business_id IS NULL) OR
        (role IN ('staff', 'admin', 'owner') AND business_id IS NOT NULL)
    )
);

-- Create indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_business ON users(business_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- SERVICES & RESOURCES
-- ============================================================================

-- Service Categories (for organization)
CREATE TABLE service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services/Menu Items
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    
    -- Duration & Capacity
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    buffer_after_minutes INTEGER DEFAULT 0, -- Cleanup/prep time
    capacity INTEGER DEFAULT 1, -- How many can be booked at once
    
    -- Pricing
    price DECIMAL(10,2),
    price_type VARCHAR(20) DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'per_person', 'per_hour', 'variable')),
    
    -- Booking Rules
    requires_staff BOOLEAN DEFAULT true,
    requires_resource BOOLEAN DEFAULT false,
    min_advance_hours INTEGER, -- Override business default
    max_per_slot INTEGER, -- Max bookings per time slot
    
    -- Availability
    is_active BOOLEAN DEFAULT true,
    available_from DATE, -- Seasonal services
    available_until DATE,
    
    -- Display
    display_order INTEGER DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}', -- Service-specific attributes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_business ON services(business_id);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_active ON services(is_active);

-- Resources (Tables, Rooms, Equipment)
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'table', 'room', 'chair', 'equipment'
    capacity INTEGER DEFAULT 1,
    
    -- Location within business
    location_note VARCHAR(255), -- e.g., "Patio", "Ground Floor"
    
    -- Attributes
    attributes JSONB DEFAULT '{}', -- e.g., {"wheelchair_accessible": true, "smoking": false}
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resources_business ON resources(business_id);
CREATE INDEX idx_resources_type ON resources(type);

-- ============================================================================
-- STAFF & AVAILABILITY
-- ============================================================================

-- Staff-Service Assignments (which staff can do which services)
CREATE TABLE staff_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
    is_primary BOOLEAN DEFAULT false, -- Preferred provider
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(staff_id, service_id)
);

-- Staff Working Hours (Recurring Schedule)
CREATE TABLE staff_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Break time
    break_start TIME,
    break_end TIME,
    
    is_active BOOLEAN DEFAULT true,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(staff_id, day_of_week, effective_from)
);

CREATE INDEX idx_staff_schedules_staff ON staff_schedules(staff_id);
CREATE INDEX idx_staff_schedules_day ON staff_schedules(day_of_week);

-- Staff Availability Overrides (Vacations, Time Off)
CREATE TABLE staff_availability_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    
    reason VARCHAR(255), -- 'vacation', 'sick', 'training', 'other'
    notes TEXT,
    
    is_available BOOLEAN DEFAULT false, -- false = unavailable, true = available override
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_overrides_staff ON staff_availability_overrides(staff_id);
CREATE INDEX idx_staff_overdates_range ON staff_availability_overrides(start_datetime, end_datetime);

-- Business Hours (Operating Hours)
CREATE TABLE business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    
    is_open BOOLEAN DEFAULT true,
    
    UNIQUE(business_id, day_of_week)
);

-- Special Business Hours (Holidays, Events)
CREATE TABLE special_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    
    date DATE NOT NULL,
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT false,
    
    name VARCHAR(255), -- "Christmas Day", "Heritage Day"
    notes TEXT,
    
    UNIQUE(business_id, date)
);

-- ============================================================================
-- BOOKINGS/RESERVATIONS
-- ============================================================================

-- Booking Status Enum
CREATE TYPE booking_status AS ENUM (
    'pending',      -- Awaiting confirmation
    'confirmed',    -- Confirmed by business
    'checked_in',   -- Customer arrived
    'in_progress',  -- Service started
    'completed',    -- Service finished
    'cancelled',    -- Cancelled
    'no_show',      -- Customer didn't show
    'rescheduled'   -- Rescheduled to another time
);

-- Main Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number VARCHAR(20) UNIQUE NOT NULL, -- Human-readable: "BK-2024-001234"
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    
    -- Customer Info
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_first_name VARCHAR(100) NOT NULL,
    customer_last_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(50),
    
    -- Service Details
    service_id UUID REFERENCES services(id) ON DELETE SET NULL NOT NULL,
    resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Time
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Africa/Johannesburg',
    
    -- Party/Group
    party_size INTEGER DEFAULT 1,
    
    -- Status
    status booking_status DEFAULT 'pending',
    
    -- Notes & Special Requests
    customer_notes TEXT,
    internal_notes TEXT, -- Staff-only notes
    
    -- Payment
    total_amount DECIMAL(10,2),
    deposit_amount DECIMAL(10,2),
    amount_paid DECIMAL(10,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'deposit_paid', 'paid', 'refunded')),
    payment_method VARCHAR(50),
    
    -- Calendar Sync
    calendar_event_id VARCHAR(255), -- External calendar event ID
    calendar_synced_at TIMESTAMPTZ,
    
    -- Source
    source VARCHAR(50) DEFAULT 'website', -- 'website', 'phone', 'walk-in', 'api'
    
    -- Check-in/Out
    checked_in_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ,
    
    -- Cancellation
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES users(id),
    cancellation_reason TEXT,
    
    -- Reminders
    confirmation_sent_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ,
    
    -- Metadata
    custom_fields JSONB DEFAULT '{}', -- Business-specific fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for bookings
CREATE INDEX idx_bookings_business ON bookings(business_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_staff ON bookings(staff_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_datetime ON bookings(booking_date, start_time);
CREATE INDEX idx_bookings_number ON bookings(booking_number);

-- Booking History (Audit Trail)
CREATE TABLE booking_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    
    action VARCHAR(50) NOT NULL, -- 'created', 'confirmed', 'cancelled', 'rescheduled', etc.
    old_values JSONB,
    new_values JSONB,
    
    performed_by UUID REFERENCES users(id),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booking_history_booking ON booking_history(booking_id);

-- Waitlist (for fully booked times)
CREATE TABLE waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    
    customer_email VARCHAR(255) NOT NULL,
    customer_first_name VARCHAR(100) NOT NULL,
    customer_last_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(50),
    
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    preferred_date DATE,
    preferred_time TIME,
    party_size INTEGER DEFAULT 1,
    
    notes TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'booked', 'expired')),
    notified_at TIMESTAMPTZ,
    
    -- When they want to be notified
    notify_before_time TIME, -- "Notify me for slots before 7pm"
    
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_waitlist_business ON waitlist(business_id);
CREATE INDEX idx_waitlist_status ON waitlist(status);

-- ============================================================================
-- CUSTOMER DATA
-- ============================================================================

-- Customer Profiles (aggregated customer data)
CREATE TABLE customer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    -- Stats
    total_bookings INTEGER DEFAULT 0,
    completed_bookings INTEGER DEFAULT 0,
    cancelled_bookings INTEGER DEFAULT 0,
    no_shows INTEGER DEFAULT 0,
    
    total_spent DECIMAL(10,2) DEFAULT 0,
    
    -- Preferences
    preferred_staff_id UUID REFERENCES users(id),
    preferred_service_id UUID REFERENCES services(id),
    
    -- Tags
    tags TEXT[], -- 'vip', 'allergic-shellfish', 'birthday-regular', etc.
    
    -- Notes
    notes TEXT, -- "Prefers window table", "Always late"
    
    first_booking_at TIMESTAMPTZ,
    last_booking_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(business_id, customer_id)
);

-- Customer Preferences (detailed)
CREATE TABLE customer_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE NOT NULL,
    
    preference_type VARCHAR(50) NOT NULL, -- 'seating', 'dietary', 'time'
    preference_value TEXT NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS & COMMUNICATION
-- ============================================================================

-- Notification Templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'booking_confirmation', 'reminder', 'cancellation', etc.
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
    
    subject VARCHAR(255), -- For emails
    body TEXT NOT NULL, -- Template with variables: {{customer_name}}, {{booking_date}}, etc.
    
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(business_id, type, channel)
);

-- Notification Log
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),
    
    subject VARCHAR(255),
    body TEXT,
    
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'bounced'
    external_id VARCHAR(255), -- Message ID from provider
    
    error_message TEXT,
    
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ, -- For emails
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_booking ON notification_logs(booking_id);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);

-- ============================================================================
-- CALENDAR INTEGRATIONS
-- ============================================================================

-- Calendar Connections
CREATE TABLE calendar_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    provider VARCHAR(50) NOT NULL, -- 'google', 'outlook', 'apple', 'ical'
    
    -- OAuth tokens (encrypted)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- Calendar details
    calendar_id VARCHAR(255),
    calendar_name VARCHAR(255),
    
    -- Sync settings
    sync_bookings BOOLEAN DEFAULT true,
    sync_direction VARCHAR(20) DEFAULT 'bidirectional' CHECK (sync_direction IN ('import', 'export', 'bidirectional')),
    last_sync_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, provider, calendar_id)
);

-- Calendar Sync Log
CREATE TABLE calendar_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID REFERENCES calendar_connections(id) ON DELETE CASCADE NOT NULL,
    
    sync_type VARCHAR(20) NOT NULL, -- 'full', 'incremental'
    events_created INTEGER DEFAULT 0,
    events_updated INTEGER DEFAULT 0,
    events_deleted INTEGER DEFAULT 0,
    events_skipped INTEGER DEFAULT 0,
    
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT
);

-- ============================================================================
-- PAYMENTS (Optional Integration)
-- ============================================================================

-- Payment Transactions
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ZAR',
    
    type VARCHAR(20) NOT NULL, -- 'deposit', 'full_payment', 'refund'
    status VARCHAR(20) NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
    
    -- Payment provider
    provider VARCHAR(50) NOT NULL, -- 'stripe', 'payfast', 'yoco', 'paystack'
    provider_transaction_id VARCHAR(255),
    provider_fee DECIMAL(10,2),
    
    -- Card info (masked)
    card_last_four VARCHAR(4),
    card_brand VARCHAR(20),
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_booking ON payment_transactions(booking_id);

-- ============================================================================
-- ANALYTICS & REPORTING VIEWS
-- ============================================================================

-- Booking Analytics View
CREATE VIEW booking_analytics AS
SELECT 
    b.business_id,
    DATE(b.created_at) as date,
    COUNT(*) as total_bookings,
    COUNT(*) FILTER (WHERE b.status = 'completed') as completed_bookings,
    COUNT(*) FILTER (WHERE b.status = 'cancelled') as cancelled_bookings,
    COUNT(*) FILTER (WHERE b.status = 'no_show') as no_shows,
    AVG(EXTRACT(EPOCH FROM (b.checked_in_at - b.created_at))/3600) as avg_hours_to_checkin,
    SUM(b.total_amount) as total_revenue,
    AVG(b.total_amount) as avg_booking_value
FROM bookings b
GROUP BY b.business_id, DATE(b.created_at);

-- Staff Performance View
CREATE VIEW staff_performance AS
SELECT 
    staff_id,
    business_id,
    COUNT(*) as total_appointments,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_appointments,
    COUNT(*) FILTER (WHERE status = 'no_show') as no_shows,
    AVG(total_amount) as avg_revenue_per_appointment,
    SUM(total_amount) as total_revenue
FROM bookings
WHERE staff_id IS NOT NULL
GROUP BY staff_id, business_id;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Generate booking number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS VARCHAR AS $$
DECLARE
    year_part VARCHAR(4);
    seq_num INTEGER;
    result VARCHAR(20);
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    
    SELECT COALESCE(MAX(CAST(RIGHT(booking_number, 6) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM bookings
    WHERE booking_number LIKE 'BK-' || year_part || '-%';
    
    result := 'BK-' || year_part || '-' || LPAD(seq_num::TEXT, 6, '0');
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set booking number
CREATE OR REPLACE FUNCTION set_booking_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_number IS NULL THEN
        NEW.booking_number := generate_booking_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_number_trigger
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION set_booking_number();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp trigger to relevant tables
CREATE TRIGGER businesses_timestamp
    BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER services_timestamp
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER bookings_timestamp
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Booking history trigger
CREATE OR REPLACE FUNCTION log_booking_history()
RETURNS TRIGGER AS $$
DECLARE
    action_type VARCHAR(50);
BEGIN
    IF TG_OP = 'INSERT' THEN
        action_type := 'created';
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            action_type := NEW.status;
        ELSE
            action_type := 'updated';
        END IF;
    END IF;
    
    INSERT INTO booking_history (booking_id, action, old_values, new_values)
    VALUES (
        COALESCE(NEW.id, OLD.id),
        action_type,
        CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) END,
        CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_history_trigger
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION log_booking_history();

-- Update customer profile stats
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO customer_profiles (business_id, customer_id, total_bookings, first_booking_at, last_booking_at)
    VALUES (
        NEW.business_id,
        NEW.customer_id,
        1,
        NEW.created_at,
        NEW.created_at
    )
    ON CONFLICT (business_id, customer_id) DO UPDATE SET
        total_bookings = customer_profiles.total_bookings + 1,
        last_booking_at = NEW.created_at,
        completed_bookings = CASE WHEN NEW.status = 'completed' THEN customer_profiles.completed_bookings + 1 ELSE customer_profiles.completed_bookings END,
        cancelled_bookings = CASE WHEN NEW.status = 'cancelled' THEN customer_profiles.cancelled_bookings + 1 ELSE customer_profiles.cancelled_bookings END,
        no_shows = CASE WHEN NEW.status = 'no_show' THEN customer_profiles.no_shows + 1 ELSE customer_profiles.no_shows END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_stats_trigger
    AFTER INSERT ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_customer_stats();

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample business
INSERT INTO businesses (slug, name, type, email, phone, address_line1, city, province, postal_code)
VALUES ('demo-restaurant', 'Demo Restaurant', 'restaurant', 'info@demo.co.za', '+27123456789', '123 Main Street', 'Johannesburg', 'Gauteng', '2000');

-- Insert business hours (Mon-Sat 9am-9pm, Sun 10am-6pm)
INSERT INTO business_hours (business_id, day_of_week, open_time, close_time, is_open) VALUES
((SELECT id FROM businesses WHERE slug = 'demo-restaurant'), 0, '10:00', '18:00', true),
((SELECT id FROM businesses WHERE slug = 'demo-restaurant'), 1, '09:00', '21:00', true),
((SELECT id FROM businesses WHERE slug = 'demo-restaurant'), 2, '09:00', '21:00', true),
((SELECT id FROM businesses WHERE slug = 'demo-restaurant'), 3, '09:00', '21:00', true),
((SELECT id FROM businesses WHERE slug = 'demo-restaurant'), 4, '09:00', '21:00', true),
((SELECT id FROM businesses WHERE slug = 'demo-restaurant'), 5, '09:00', '21:00', true),
((SELECT id FROM businesses WHERE slug = 'demo-restaurant'), 6, '09:00', '22:00', true);

-- Insert sample services
INSERT INTO service_categories (business_id, name, description, display_order) VALUES
((SELECT id FROM businesses WHERE slug = 'demo-restaurant'), 'Main Dining', 'Regular table reservations', 1),
((SELECT id FROM businesses WHERE slug = 'demo-restaurant'), 'Private Events', 'Private dining and events', 2);

INSERT INTO services (business_id, category_id, name, duration_minutes, capacity, price, price_type) VALUES
((SELECT id FROM businesses WHERE slug = 'demo-restaurant'), (SELECT id FROM service_categories WHERE name = 'Main Dining'), 'Table Reservation', 90, 4, 0, 'fixed'),
((SELECT id FROM businesses WHERE slug = 'demo-restaurant'), (SELECT id FROM service_categories WHERE name = 'Main Dining'), 'Large Party (5+)', 120, 12, 200, 'per_person'),
((SELECT id FROM businesses WHERE slug = 'demo-restaurant'), (SELECT id FROM service_categories WHERE name = 'Private Events'), 'Private Dining Room', 180, 20, 5000, 'fixed');

-- Insert sample resources (tables)
INSERT INTO resources (business_id, name, type, capacity, location_note, attributes) VALUES
((SELECT id FROM businesses WHERE slug = 'demo-restaurant'), 'Table 1', 'table', 2, 'Window', '{"wheelchair_accessible": true}'),
((SELECT id FROM businesses WHERE slug = 'demo-restaurant'), 'Table 2', 'table', 2, 'Window', '{"wheelchair_accessible": true}'),
((SELECT id FROM businesses WHERE slug = 'demo-restaurant'), 'Table 3', 'table', 4, 'Main Floor', '{}'),
((SELECT id FROM businesses WHERE slug = 'demo-restaurant'), 'Table 4', 'table', 4, 'Main Floor', '{}'),
((SELECT id FROM businesses WHERE slug = 'demo-restaurant'), 'Table 5', 'table', 6, 'Main Floor', '{}'),
((SELECT id FROM businesses WHERE slug = 'demo-restaurant'), 'Table 6', 'table', 8, 'Private Room', '{"private": true}');

-- Insert default notification templates
INSERT INTO notification_templates (business_id, name, type, channel, subject, body, is_default) VALUES
((SELECT id FROM businesses WHERE slug = 'demo-restaurant'), 'Booking Confirmation', 'booking_confirmation', 'email', 
'Your Reservation at {{business_name}} is Confirmed',
'Dear {{customer_first_name}},

Your reservation has been confirmed!

📅 Date: {{booking_date}}
⏰ Time: {{start_time}}
👥 Party Size: {{party_size}}
📍 Location: {{business_address}}

If you need to cancel or modify your reservation, please click here: {{booking_link}}

We look forward to seeing you!

Best regards,
{{business_name}}', true),

((SELECT id FROM businesses WHERE slug = 'demo-restaurant'), 'Booking Reminder', 'reminder', 'email',
'Reminder: Your reservation tomorrow at {{start_time}}',
'Hi {{customer_first_name}},

This is a friendly reminder about your upcoming reservation:

📅 Date: {{booking_date}}
⏰ Time: {{start_time}}
👥 Party Size: {{party_size}}

See you soon!

{{business_name}}', true),

((SELECT id FROM businesses WHERE slug = 'demo-restaurant'), 'Booking Confirmation SMS', 'booking_confirmation', 'sms',
NULL,
'{{business_name}}: Your reservation is confirmed for {{booking_date}} at {{start_time}} for {{party_size}} guests. Booking #{{booking_number}}', true);

-- ============================================================================
-- GRANTS (adjust based on your auth setup)
-- ============================================================================

-- Grant permissions to your application user
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
