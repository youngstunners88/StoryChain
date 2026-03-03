# Frontend Components Specification

Complete UI/UX specification for the booking system frontend.

---

## Component Architecture

```
├── Booking Widget (Embeddable)
│   ├── ServiceSelector
│   ├── DateTimePicker
│   ├── StaffSelector
│   ├── CustomerForm
│   └── Confirmation
│
├── Admin Dashboard
│   ├── DashboardLayout
│   ├── CalendarView
│   ├── BookingsTable
│   ├── CustomersTable
│   ├── ServicesManager
│   ├── StaffManager
│   ├── SettingsPanel
│   └── AnalyticsCharts
│
└── Customer Portal
    ├── MyBookings
    ├── BookingDetails
    └── ProfileSettings
```

---

## 1. Booking Widget (Embeddable)

The core component - a multi-step booking flow that can be embedded on any website.

### Widget Container

```tsx
// widget/src/BookingWidget.tsx
import { useState } from 'react';
import { ServiceSelector } from './ServiceSelector';
import { DateTimePicker } from './DateTimePicker';
import { StaffSelector } from './StaffSelector';
import { CustomerForm } from './CustomerForm';
import { Confirmation } from './Confirmation';

export interface BookingWidgetProps {
  businessSlug: string;
  serviceId?: string;           // Pre-select service
  staffId?: string;             // Pre-select staff member
  primaryColor?: string;        // Theme color
  locale?: string;              // 'en' | 'af' | 'zu' | etc.
  onComplete?: (booking: Booking) => void;
  onCancel?: () => void;
}

type Step = 'service' | 'datetime' | 'staff' | 'details' | 'confirm';

export function BookingWidget({
  businessSlug,
  serviceId,
  staffId,
  primaryColor = '#3B82F6',
  locale = 'en',
  onComplete,
  onCancel
}: BookingWidgetProps) {
  const [step, setStep] = useState<Step>('service');
  const [bookingData, setBookingData] = useState<Partial<Booking>>({
    serviceId,
    staffId
  });
  
  const updateBooking = (data: Partial<Booking>) => {
    setBookingData(prev => ({ ...prev, ...data }));
  };
  
  const goNext = () => {
    const steps: Step[] = ['service', 'datetime', 'staff', 'details', 'confirm'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };
  
  const goBack = () => {
    const steps: Step[] = ['service', 'datetime', 'staff', 'details', 'confirm'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };
  
  return (
    <div 
      className="booking-widget"
      style={{ '--primary-color': primaryColor } as React.CSSProperties}
    >
      <ProgressBar currentStep={step} />
      
      <div className="widget-content">
        {step === 'service' && (
          <ServiceSelector
            businessSlug={businessSlug}
            selectedId={bookingData.serviceId}
            onSelect={(service) => {
              updateBooking({ serviceId: service.id, service });
              goNext();
            }}
          />
        )}
        
        {step === 'datetime' && (
          <DateTimePicker
            businessSlug={businessSlug}
            serviceId={bookingData.serviceId!}
            selectedDate={bookingData.bookingDate}
            selectedTime={bookingData.startTime}
            onSelect={(date, time) => {
              updateBooking({ bookingDate: date, startTime: time });
              goNext();
            }}
          />
        )}
        
        {step === 'staff' && (
          <StaffSelector
            businessSlug={businessSlug}
            serviceId={bookingData.serviceId!}
            selectedId={bookingData.staffId}
            onSelect={(staff) => {
              updateBooking({ staffId: staff?.id, staff });
              goNext();
            }}
            onSkip={goNext}
          />
        )}
        
        {step === 'details' && (
          <CustomerForm
            initialData={bookingData}
            onSubmit={(customer) => {
              updateBooking(customer);
              goNext();
            }}
          />
        )}
        
        {step === 'confirm' && (
          <Confirmation
            booking={bookingData}
            onConfirm={async () => {
              // Submit booking
              const response = await fetch('/api/v1/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
              });
              
              const { booking } = await response.json();
              onComplete?.(booking);
            }}
            onBack={goBack}
          />
        )}
      </div>
    </div>
  );
}
```

### Service Selector Component

```tsx
// widget/src/ServiceSelector.tsx
import { useState, useEffect } from 'react';
import { Clock, Users, DollarSign } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  capacity: number;
  price?: number;
  priceType: 'fixed' | 'per_person' | 'per_hour';
  imageUrl?: string;
}

interface ServiceSelectorProps {
  businessSlug: string;
  selectedId?: string;
  onSelect: (service: Service) => void;
}

export function ServiceSelector({ businessSlug, selectedId, onSelect }: ServiceSelectorProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  useEffect(() => {
    fetch(`/api/v1/services?businessSlug=${businessSlug}`)
      .then(res => res.json())
      .then(data => {
        setServices(data.data.filter((s: Service) => s.isActive));
        setCategories(data.categories || []);
        setLoading(false);
      });
  }, [businessSlug]);
  
  const filteredServices = selectedCategory
    ? services.filter(s => s.categoryId === selectedCategory)
    : services;
  
  const formatPrice = (service: Service) => {
    if (!service.price) return null;
    
    const formatted = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(service.price);
    
    switch (service.priceType) {
      case 'per_person':
        return `${formatted} per person`;
      case 'per_hour':
        return `${formatted} per hour`;
      default:
        return formatted;
    }
  };
  
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };
  
  if (loading) {
    return (
      <div className="service-selector loading">
        <div className="skeleton-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="service-selector">
      <h2>Select a Service</h2>
      
      {categories.length > 0 && (
        <div className="category-tabs">
          <button
            className={selectedCategory === null ? 'active' : ''}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={selectedCategory === cat.id ? 'active' : ''}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}
      
      <div className="services-grid">
        {filteredServices.map(service => (
          <button
            key={service.id}
            className={`service-card ${selectedId === service.id ? 'selected' : ''}`}
            onClick={() => onSelect(service)}
          >
            {service.imageUrl && (
              <img 
                src={service.imageUrl} 
                alt={service.name}
                className="service-image"
              />
            )}
            
            <div className="service-info">
              <h3>{service.name}</h3>
              {service.description && (
                <p className="service-description">{service.description}</p>
              )}
              
              <div className="service-meta">
                <span className="meta-item">
                  <Clock size={16} />
                  {formatDuration(service.durationMinutes)}
                </span>
                
                {service.capacity > 1 && (
                  <span className="meta-item">
                    <Users size={16} />
                    Up to {service.capacity}
                  </span>
                )}
                
                {service.price && (
                  <span className="meta-item price">
                    <DollarSign size={16} />
                    {formatPrice(service)}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Date/Time Picker Component

```tsx
// widget/src/DateTimePicker.tsx
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface TimeSlot {
  time: string;
  endTime: string;
  available: boolean;
  staff?: Staff[];
}

interface DateTimePickerProps {
  businessSlug: string;
  serviceId: string;
  selectedDate?: string;
  selectedTime?: string;
  onSelect: (date: string, time: string) => void;
}

export function DateTimePicker({
  businessSlug,
  serviceId,
  selectedDate,
  selectedTime,
  onSelect
}: DateTimePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedDateState, setSelectedDateState] = useState<string>(
    selectedDate || formatDate(new Date())
  );
  const [loading, setLoading] = useState(false);
  
  // Fetch available slots when date changes
  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/bookings/slots?businessSlug=${businessSlug}&serviceId=${serviceId}&date=${selectedDateState}`)
      .then(res => res.json())
      .then(data => {
        setSlots(data.slots);
        setLoading(false);
      });
  }, [businessSlug, serviceId, selectedDateState]);
  
  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Padding for days before month starts
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    
    // Days in month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };
  
  const isDateAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Can't book in the past
    if (date < today) return false;
    
    // Can't book too far in advance (e.g., 90 days)
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);
    if (date > maxDate) return false;
    
    return true;
  };
  
  const handleTimeSelect = (time: string) => {
    onSelect(selectedDateState, time);
  };
  
  const availableSlots = slots.filter(s => s.available);
  
  return (
    <div className="datetime-picker">
      <h2>Select Date & Time</h2>
      
      {/* Calendar */}
      <div className="calendar-section">
        <div className="calendar-header">
          <button onClick={() => {
            const prev = new Date(currentMonth);
            prev.setMonth(prev.getMonth() - 1);
            setCurrentMonth(prev);
          }}>
            <ChevronLeft size={20} />
          </button>
          
          <span className="month-year">
            {currentMonth.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
          </span>
          
          <button onClick={() => {
            const next = new Date(currentMonth);
            next.setMonth(next.getMonth() + 1);
            setCurrentMonth(next);
          }}>
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="calendar-grid">
          <div className="weekday-labels">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <span key={day} className="weekday-label">{day}</span>
            ))}
          </div>
          
          <div className="days-grid">
            {generateCalendarDays().map((date, index) => (
              <button
                key={index}
                className={`day-cell ${
                  !date ? 'empty' :
                  !isDateAvailable(date) ? 'disabled' :
                  selectedDateState === formatDate(date) ? 'selected' : 'available'
                }`}
                disabled={!date || !isDateAvailable(date)}
                onClick={() => date && setSelectedDateState(formatDate(date))}
              >
                {date?.getDate()}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Time Slots */}
      <div className="time-slots-section">
        <h3>
          <Clock size={18} />
          Available Times for {new Date(selectedDateState).toLocaleDateString('en-ZA', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h3>
        
        {loading ? (
          <div className="loading-slots">Loading...</div>
        ) : availableSlots.length === 0 ? (
          <div className="no-slots">
            No available times for this date. Please select another date.
          </div>
        ) : (
          <div className="time-slots-grid">
            {availableSlots.map(slot => (
              <button
                key={slot.time}
                className={`time-slot ${selectedTime === slot.time ? 'selected' : ''}`}
                onClick={() => handleTimeSelect(slot.time)}
              >
                {formatTimeDisplay(slot.time)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helpers
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}
```

### Customer Form Component

```tsx
// widget/src/CustomerForm.tsx
import { useState } from 'react';
import { User, Mail, Phone, Users, MessageSquare } from 'lucide-react';

interface CustomerFormProps {
  initialData?: Partial<CustomerInfo>;
  onSubmit: (data: CustomerInfo) => void;
}

interface CustomerInfo {
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone?: string;
  partySize: number;
  customerNotes?: string;
}

export function CustomerForm({ initialData, onSubmit }: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerInfo>({
    customerEmail: initialData?.customerEmail || '',
    customerFirstName: initialData?.customerFirstName || '',
    customerLastName: initialData?.customerLastName || '',
    customerPhone: initialData?.customerPhone || '',
    partySize: initialData?.partySize || 1,
    customerNotes: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.customerEmail) {
      newErrors.customerEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Invalid email format';
    }
    
    if (!formData.customerFirstName) {
      newErrors.customerFirstName = 'First name is required';
    }
    
    if (!formData.customerLastName) {
      newErrors.customerLastName = 'Last name is required';
    }
    
    if (formData.partySize < 1) {
      newErrors.partySize = 'Party size must be at least 1';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(formData);
    }
  };
  
  return (
    <form className="customer-form" onSubmit={handleSubmit}>
      <h2>Your Details</h2>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName">
            <User size={16} />
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            value={formData.customerFirstName}
            onChange={e => setFormData(prev => ({ ...prev, customerFirstName: e.target.value }))}
            placeholder="John"
            className={errors.customerFirstName ? 'error' : ''}
          />
          {errors.customerFirstName && (
            <span className="error-message">{errors.customerFirstName}</span>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="lastName">
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            value={formData.customerLastName}
            onChange={e => setFormData(prev => ({ ...prev, customerLastName: e.target.value }))}
            placeholder="Doe"
            className={errors.customerLastName ? 'error' : ''}
          />
          {errors.customerLastName && (
            <span className="error-message">{errors.customerLastName}</span>
          )}
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="email">
          <Mail size={16} />
          Email *
        </label>
        <input
          type="email"
          id="email"
          value={formData.customerEmail}
          onChange={e => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
          placeholder="john@example.com"
          className={errors.customerEmail ? 'error' : ''}
        />
        {errors.customerEmail && (
          <span className="error-message">{errors.customerEmail}</span>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="phone">
          <Phone size={16} />
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.customerPhone}
          onChange={e => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
          placeholder="+27 12 345 6789"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="partySize">
          <Users size={16} />
          Party Size
        </label>
        <div className="party-size-input">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, partySize: Math.max(1, prev.partySize - 1) }))}
          >
            -
          </button>
          <input
            type="number"
            id="partySize"
            value={formData.partySize}
            min={1}
            onChange={e => setFormData(prev => ({ ...prev, partySize: parseInt(e.target.value) || 1 }))}
          />
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, partySize: prev.partySize + 1 }))}
          >
            +
          </button>
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="notes">
          <MessageSquare size={16} />
          Special Requests
        </label>
        <textarea
          id="notes"
          value={formData.customerNotes}
          onChange={e => setFormData(prev => ({ ...prev, customerNotes: e.target.value }))}
          placeholder="Any allergies, special occasions, or requests..."
          rows={3}
        />
      </div>
      
      <button type="submit" className="submit-button">
        Continue to Confirmation
      </button>
    </form>
  );
}
```

### Confirmation Component

```tsx
// widget/src/Confirmation.tsx
import { Calendar, Clock, User, Mail, Phone, MapPin, Check } from 'lucide-react';

interface ConfirmationProps {
  booking: Partial<Booking>;
  onConfirm: () => Promise<void>;
  onBack: () => void;
}

export function Confirmation({ booking, onConfirm, onBack }: ConfirmationProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    
    try {
      await onConfirm();
    } catch (err) {
      setError('Failed to create booking. Please try again.');
      setSubmitting(false);
    }
  };
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  return (
    <div className="confirmation">
      <h2>Confirm Your Booking</h2>
      
      <div className="booking-summary">
        {/* Service */}
        <div className="summary-item">
          <div className="item-icon">
            <Check size={20} />
          </div>
          <div className="item-content">
            <span className="label">Service</span>
            <span className="value">{booking.service?.name}</span>
          </div>
        </div>
        
        {/* Date & Time */}
        <div className="summary-item">
          <div className="item-icon">
            <Calendar size={20} />
          </div>
          <div className="item-content">
            <span className="label">Date</span>
            <span className="value">{formatDate(booking.bookingDate!)}</span>
          </div>
        </div>
        
        <div className="summary-item">
          <div className="item-icon">
            <Clock size={20} />
          </div>
          <div className="item-content">
            <span className="label">Time</span>
            <span className="value">
              {formatTime(booking.startTime!)}
              {' - '}
              {formatTime(booking.service ? 
                addMinutes(booking.startTime!, booking.service.durationMinutes) : 
                booking.startTime!
              )}
            </span>
          </div>
        </div>
        
        {/* Staff */}
        {booking.staff && (
          <div className="summary-item">
            <div className="item-icon">
              <User size={20} />
            </div>
            <div className="item-content">
              <span className="label">With</span>
              <span className="value">{booking.staff.firstName} {booking.staff.lastName}</span>
            </div>
          </div>
        )}
        
        {/* Customer */}
        <div className="summary-divider" />
        
        <div className="summary-item">
          <div className="item-icon">
            <User size={20} />
          </div>
          <div className="item-content">
            <span className="label">Name</span>
            <span className="value">
              {booking.customerFirstName} {booking.customerLastName}
            </span>
          </div>
        </div>
        
        <div className="summary-item">
          <div className="item-icon">
            <Mail size={20} />
          </div>
          <div className="item-content">
            <span className="label">Email</span>
            <span className="value">{booking.customerEmail}</span>
          </div>
        </div>
        
        {booking.customerPhone && (
          <div className="summary-item">
            <div className="item-icon">
              <Phone size={20} />
            </div>
            <div className="item-content">
              <span className="label">Phone</span>
              <span className="value">{booking.customerPhone}</span>
            </div>
          </div>
        )}
        
        <div className="summary-item">
          <div className="item-icon">
            <Users size={20} />
          </div>
          <div className="item-content">
            <span className="label">Party Size</span>
            <span className="value">{booking.partySize} {booking.partySize === 1 ? 'guest' : 'guests'}</span>
          </div>
        </div>
      </div>
      
      {/* Price */}
      {booking.service?.price && (
        <div className="price-summary">
          <span className="label">Total</span>
          <span className="value">
            {formatPrice(booking.service.price * booking.partySize!)}
          </span>
        </div>
      )}
      
      {error && (
        <div className="error-banner">{error}</div>
      )}
      
      <div className="actions">
        <button 
          type="button" 
          className="back-button"
          onClick={onBack}
          disabled={submitting}
        >
          Back
        </button>
        
        <button
          type="button"
          className="confirm-button"
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting ? 'Processing...' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  );
}
```

---

## 2. Admin Dashboard

### Calendar View (Main Booking Management)

```tsx
// dashboard/src/pages/CalendarPage.tsx
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { BookingCard } from '../components/BookingCard';
import { BookingModal } from '../components/BookingModal';

type ViewMode = 'day' | 'week' | 'month';

export function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  useEffect(() => {
    fetchBookings();
  }, [currentDate, viewMode]);
  
  const fetchBookings = async () => {
    const start = getStartDate(currentDate, viewMode);
    const end = getEndDate(currentDate, viewMode);
    
    const response = await fetch(
      `/api/v1/bookings?startDate=${formatDate(start)}&endDate=${formatDate(end)}`
    );
    const data = await response.json();
    setBookings(data.data);
  };
  
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <div className="header-left">
          <h1>Calendar</h1>
          
          <div className="navigation">
            <button onClick={() => navigateDate('prev')}>
              <ChevronLeft size={20} />
            </button>
            
            <button className="today-btn" onClick={goToToday}>
              Today
            </button>
            
            <button onClick={() => navigateDate('next')}>
              <ChevronRight size={20} />
            </button>
            
            <span className="current-period">
              {formatPeriod(currentDate, viewMode)}
            </span>
          </div>
        </div>
        
        <div className="header-right">
          <div className="view-mode-toggle">
            {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                className={viewMode === mode ? 'active' : ''}
                onClick={() => setViewMode(mode)}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          
          <button className="new-booking-btn" onClick={() => {
            setSelectedBooking(null);
            setShowModal(true);
          }}>
            <Plus size={18} />
            New Booking
          </button>
        </div>
      </div>
      
      <div className="calendar-content">
        {viewMode === 'day' && (
          <DayView
            date={currentDate}
            bookings={bookings}
            onBookingClick={setSelectedBooking}
          />
        )}
        
        {viewMode === 'week' && (
          <WeekView
            date={currentDate}
            bookings={bookings}
            onBookingClick={setSelectedBooking}
          />
        )}
        
        {viewMode === 'month' && (
          <MonthView
            date={currentDate}
            bookings={bookings}
            onBookingClick={setSelectedBooking}
            onDateClick={(date) => {
              setCurrentDate(date);
              setViewMode('day');
            }}
          />
        )}
      </div>
      
      {showModal && (
        <BookingModal
          booking={selectedBooking}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            fetchBookings();
          }}
        />
      )}
    </div>
  );
}

// Week View Component
function WeekView({ date, bookings, onBookingClick }: WeekViewProps) {
  const weekDays = getWeekDays(date);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  return (
    <div className="week-view">
      <div className="time-column">
        {hours.map(hour => (
          <div key={hour} className="hour-label">
            {hour === 0 ? '12 AM' : 
             hour < 12 ? `${hour} AM` : 
             hour === 12 ? '12 PM' : 
             `${hour - 12} PM`}
          </div>
        ))}
      </div>
      
      <div className="days-grid">
        {weekDays.map(day => (
          <div key={day.toISOString()} className="day-column">
            <div className="day-header">
              <span className="day-name">
                {day.toLocaleDateString('en-ZA', { weekday: 'short' })}
              </span>
              <span className="day-number">
                {day.getDate()}
              </span>
            </div>
            
            <div className="day-slots">
              {hours.map(hour => {
                const hourBookings = bookings.filter(b => {
                  const bookingDate = new Date(b.bookingDate);
                  const [bookingHour] = b.startTime.split(':').map(Number);
                  return isSameDay(bookingDate, day) && bookingHour === hour;
                });
                
                return (
                  <div 
                    key={hour} 
                    className="hour-slot"
                    onClick={() => {/* Open new booking modal */}}
                  >
                    {hourBookings.map(booking => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        onClick={() => onBookingClick(booking)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Booking Card Component

```tsx
// dashboard/src/components/BookingCard.tsx
import { Clock, Users } from 'lucide-react';

interface BookingCardProps {
  booking: Booking;
  onClick: () => void;
  compact?: boolean;
}

export function BookingCard({ booking, onClick, compact = false }: BookingCardProps) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    confirmed: 'bg-blue-100 border-blue-300 text-blue-800',
    checked_in: 'bg-purple-100 border-purple-300 text-purple-800',
    in_progress: 'bg-indigo-100 border-indigo-300 text-indigo-800',
    completed: 'bg-green-100 border-green-300 text-green-800',
    cancelled: 'bg-red-100 border-red-300 text-red-800',
    no_show: 'bg-gray-100 border-gray-300 text-gray-800'
  };
  
  return (
    <div
      className={`booking-card ${statusColors[booking.status]} ${compact ? 'compact' : ''}`}
      onClick={onClick}
    >
      <div className="booking-time">
        <Clock size={14} />
        {formatTime(booking.startTime)}
      </div>
      
      <div className="booking-customer">
        {booking.customerFirstName} {booking.customerLastName}
      </div>
      
      {!compact && (
        <>
          <div className="booking-service">
            {booking.service?.name}
          </div>
          
          <div className="booking-details">
            <span className="party-size">
              <Users size={14} />
              {booking.partySize}
            </span>
            
            {booking.staff && (
              <span className="staff">
                {booking.staff.firstName}
              </span>
            )}
          </div>
        </>
      )}
      
      <div className={`status-badge ${booking.status}`}>
        {formatStatus(booking.status)}
      </div>
    </div>
  );
}

function formatStatus(status: string): string {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}
```

### Bookings Table View

```tsx
// dashboard/src/pages/BookingsPage.tsx
import { useState, useEffect } from 'react';
import { Search, Filter, Download, MoreVertical } from 'lucide-react';
import { BookingStatusBadge } from '../components/BookingStatusBadge';

export function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    date: '',
    search: ''
  });
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  
  useEffect(() => {
    fetchBookings();
  }, [filters]);
  
  const fetchBookings = async () => {
    setLoading(true);
    
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.date) params.append('date', filters.date);
    if (filters.search) params.append('search', filters.search);
    
    const response = await fetch(`/api/v1/bookings?${params}`);
    const data = await response.json();
    
    setBookings(data.data);
    setLoading(false);
  };
  
  const exportBookings = async () => {
    const response = await fetch('/api/v1/bookings/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingIds: selectedBookings })
    });
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };
  
  return (
    <div className="bookings-page">
      <div className="page-header">
        <h1>Bookings</h1>
        
        <div className="header-actions">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by name, email, booking #..."
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          
          <select
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
          
          <input
            type="date"
            value={filters.date}
            onChange={e => setFilters(prev => ({ ...prev, date: e.target.value }))}
          />
          
          {selectedBookings.length > 0 && (
            <button className="export-btn" onClick={exportBookings}>
              <Download size={18} />
              Export {selectedBookings.length} Selected
            </button>
          )}
        </div>
      </div>
      
      <div className="table-container">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedBookings.length === bookings.length}
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedBookings(bookings.map(b => b.id));
                    } else {
                      setSelectedBookings([]);
                    }
                  }}
                />
              </th>
              <th>Booking #</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Date & Time</th>
              <th>Party</th>
              <th>Staff</th>
              <th>Status</th>
              <th>Amount</th>
              <th></th>
            </tr>
          </thead>
          
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="loading">Loading...</td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={10} className="empty">No bookings found</td>
              </tr>
            ) : (
              bookings.map(booking => (
                <tr key={booking.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedBookings.includes(booking.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedBookings(prev => [...prev, booking.id]);
                        } else {
                          setSelectedBookings(prev => prev.filter(id => id !== booking.id));
                        }
                      }}
                    />
                  </td>
                  
                  <td className="booking-number">
                    {booking.bookingNumber}
                  </td>
                  
                  <td className="customer">
                    <div className="customer-name">
                      {booking.customerFirstName} {booking.customerLastName}
                    </div>
                    <div className="customer-email">
                      {booking.customerEmail}
                    </div>
                  </td>
                  
                  <td>{booking.service?.name}</td>
                  
                  <td>
                    <div className="datetime">
                      <div className="date">
                        {formatDate(booking.bookingDate)}
                      </div>
                      <div className="time">
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </div>
                    </div>
                  </td>
                  
                  <td className="party-size">{booking.partySize}</td>
                  
                  <td>{booking.staff?.firstName || '-'}</td>
                  
                  <td>
                    <BookingStatusBadge status={booking.status} />
                  </td>
                  
                  <td className="amount">
                    {booking.totalAmount ? formatCurrency(booking.totalAmount) : '-'}
                  </td>
                  
                  <td>
                    <button className="actions-btn">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="table-footer">
        <div className="showing-info">
          Showing {bookings.length} bookings
        </div>
        
        <div className="pagination">
          <button disabled>Previous</button>
          <span>Page 1 of 1</span>
          <button disabled>Next</button>
        </div>
      </div>
    </div>
  );
}
```

---

## 3. Customer Portal

### My Bookings Page

```tsx
// portal/src/pages/MyBookings.tsx
import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, X } from 'lucide-react';

export function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  
  useEffect(() => {
    fetchBookings();
  }, []);
  
  const fetchBookings = async () => {
    const response = await fetch('/api/v1/customers/me/bookings');
    const data = await response.json();
    setBookings(data.data);
    setLoading(false);
  };
  
  const upcomingBookings = bookings.filter(b => 
    new Date(b.bookingDate) >= new Date() && 
    !['cancelled', 'completed', 'no_show'].includes(b.status)
  );
  
  const pastBookings = bookings.filter(b =>
    new Date(b.bookingDate) < new Date() ||
    ['cancelled', 'completed', 'no_show'].includes(b.status)
  );
  
  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    await fetch(`/api/v1/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: bookings[0].customerEmail })
    });
    
    fetchBookings();
  };
  
  return (
    <div className="my-bookings">
      <h1>My Bookings</h1>
      
      <div className="tabs">
        <button
          className={activeTab === 'upcoming' ? 'active' : ''}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming ({upcomingBookings.length})
        </button>
        <button
          className={activeTab === 'past' ? 'active' : ''}
          onClick={() => setActiveTab('past')}
        >
          Past ({pastBookings.length})
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="bookings-list">
          {(activeTab === 'upcoming' ? upcomingBookings : pastBookings).map(booking => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <div className="booking-number">#{booking.bookingNumber}</div>
                <div className={`status ${booking.status}`}>
                  {formatStatus(booking.status)}
                </div>
              </div>
              
              <div className="booking-details">
                <div className="detail">
                  <Calendar size={18} />
                  <span>{formatDate(booking.bookingDate)}</span>
                </div>
                
                <div className="detail">
                  <Clock size={18} />
                  <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                </div>
                
                {booking.business && (
                  <div className="detail">
                    <MapPin size={18} />
                    <span>{booking.business.name}</span>
                  </div>
                )}
              </div>
              
              <div className="booking-service">
                <strong>{booking.service?.name}</strong>
                <span>{booking.partySize} {booking.partySize === 1 ? 'guest' : 'guests'}</span>
              </div>
              
              {activeTab === 'upcoming' && booking.status !== 'cancelled' && (
                <div className="booking-actions">
                  <button
                    className="cancel-btn"
                    onClick={() => cancelBooking(booking.id)}
                  >
                    <X size={16} />
                    Cancel Booking
                  </button>
                </div>
              )}
            </div>
          ))}
          
          {(activeTab === 'upcoming' ? upcomingBookings : pastBookings).length === 0 && (
            <div className="empty-state">
              <p>No {activeTab} bookings</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## CSS Styles (Tailwind-based)

```css
/* widget/src/styles.css */

.booking-widget {
  font-family: system-ui, -apple-system, sans-serif;
  max-width: 480px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  overflow: hidden;
}

/* Progress Bar */
.progress-bar {
  display: flex;
  background: #f3f4f6;
  padding: 0.5rem;
}

.progress-step {
  flex: 1;
  text-align: center;
  padding: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.progress-step.active {
  color: var(--primary-color);
  font-weight: 600;
}

.progress-step.completed {
  color: #10b981;
}

/* Services Grid */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.service-card {
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.service-card:hover {
  border-color: var(--primary-color);
}

.service-card.selected {
  border-color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 10%, white);
}

/* Calendar */
.calendar-grid {
  padding: 1rem;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.day-cell:hover:not(.disabled):not(.empty) {
  background: #f3f4f6;
}

.day-cell.selected {
  background: var(--primary-color);
  color: white;
}

.day-cell.disabled {
  color: #d1d5db;
  cursor: not-allowed;
}

/* Time Slots */
.time-slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 0.5rem;
  padding: 1rem;
}

.time-slot {
  padding: 0.75rem 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.time-slot:hover {
  border-color: var(--primary-color);
}

.time-slot.selected {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

/* Form */
.customer-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 20%, transparent);
}

.form-group input.error {
  border-color: #ef4444;
}

.error-message {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

/* Buttons */
.submit-button,
.confirm-button {
  width: 100%;
  padding: 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.submit-button:hover,
.confirm-button:hover {
  opacity: 0.9;
}

.submit-button:disabled,
.confirm-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Confirmation Summary */
.booking-summary {
  padding: 1rem;
}

.summary-item {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.summary-item .item-icon {
  color: var(--primary-color);
}

.summary-item .label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.summary-item .value {
  font-weight: 500;
}

/* Loading States */
.skeleton-card {
  height: 120px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Responsive */
@media (max-width: 640px) {
  .booking-widget {
    border-radius: 0;
  }
  
  .services-grid {
    grid-template-columns: 1fr;
  }
  
  .time-slots-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## Embed Script

```html
<!-- For clients to embed on their website -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://cdn.your-booking-system.com/widget.js';
    script.async = true;
    script.onload = function() {
      BookingWidget.init({
        businessSlug: 'your-business-slug',
        container: '#booking-widget',
        primaryColor: '#3B82F6',
        locale: 'en'
      });
    };
    document.head.appendChild(script);
  })();
</script>

<div id="booking-widget"></div>
```

---

## Widget JavaScript API

```typescript
// widget/src/embed.ts
interface WidgetConfig {
  businessSlug: string;
  container: string | HTMLElement;
  serviceId?: string;
  staffId?: string;
  primaryColor?: string;
  locale?: string;
  onComplete?: (booking: Booking) => void;
}

export const BookingWidget = {
  init(config: WidgetConfig) {
    const container = typeof config.container === 'string'
      ? document.querySelector(config.container)
      : config.container;
    
    if (!container) {
      console.error('Booking widget container not found');
      return;
    }
    
    // Inject styles
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'https://cdn.your-booking-system.com/widget.css';
    document.head.appendChild(style);
    
    // Create React root and render
    const root = createRoot(container);
    root.render(
      <BookingWidget
        businessSlug={config.businessSlug}
        serviceId={config.serviceId}
        staffId={config.staffId}
        primaryColor={config.primaryColor}
        locale={config.locale}
        onComplete={config.onComplete}
      />
    );
  },
  
  openModal(config: WidgetConfig) {
    // Opens booking widget in a modal overlay
    const modal = document.createElement('div');
    modal.className = 'booking-modal-overlay';
    modal.innerHTML = `
      <div class="booking-modal">
        <button class="close-btn">&times;</button>
        <div class="modal-content"></div>
      </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    const content = modal.querySelector('.modal-content');
    
    // Render widget in modal
    const root = createRoot(content!);
    root.render(
      <BookingWidget
        {...config}
        onComplete={(booking) => {
          config.onComplete?.(booking);
          modal.remove();
          document.body.style.overflow = '';
        }}
      />
    );
    
    // Close button
    modal.querySelector('.close-btn')!.addEventListener('click', () => {
      modal.remove();
      document.body.style.overflow = '';
    });
  }
};

// Make globally available
(window as any).BookingWidget = BookingWidget;
```
