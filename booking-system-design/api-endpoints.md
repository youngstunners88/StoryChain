# Booking System API Endpoints

Complete API specification with Hono implementation examples.

---

## API Architecture

```
/api/v1/
├── /auth
│   ├── POST /register          # Register new user
│   ├── POST /login             # Login
│   ├── POST /logout            # Logout
│   ├── POST /refresh           # Refresh token
│   └── POST /forgot-password   # Password reset
│
├── /bookings
│   ├── GET /                   # List bookings (admin)
│   ├── POST /                  # Create booking
│   ├── GET /availability       # Check availability
│   ├── GET /slots              # Get available time slots
│   ├── GET /:id                # Get booking details
│   ├── PUT /:id                # Update booking
│   ├── PUT /:id/status         # Update status (admin)
│   ├── POST /:id/cancel        # Cancel booking
│   └── POST /:id/reschedule    # Reschedule booking
│
├── /services
│   ├── GET /                   # List services
│   ├── POST /                  # Create service (admin)
│   ├── GET /:id                # Get service
│   ├── PUT /:id                # Update service (admin)
│   └── DELETE /:id             # Delete service (admin)
│
├── /resources
│   ├── GET /                   # List resources
│   ├── POST /                  # Create resource (admin)
│   ├── GET /:id                # Get resource
│   ├── PUT /:id                # Update resource (admin)
│   └── DELETE /:id             # Delete resource (admin)
│
├── /staff
│   ├── GET /                   # List staff
│   ├── GET /:id                # Get staff details
│   ├── GET /:id/schedule       # Get staff schedule
│   ├── PUT /:id/schedule       # Update schedule (admin)
│   └── GET /:id/availability   # Get availability
│
├── /customers
│   ├── GET /                   # List customers (admin)
│   ├── GET /:id                # Get customer
│   ├── GET /:id/bookings       # Get customer bookings
│   └── PUT /:id                # Update customer
│
├── /calendar
│   ├── GET /connect/:provider  # Initiate OAuth
│   ├── GET /callback/:provider # OAuth callback
│   ├── POST /sync              # Trigger sync
│   └── DELETE /disconnect/:id  # Remove connection
│
├── /notifications
│   ├── GET /templates          # List templates (admin)
│   ├── POST /templates         # Create template (admin)
│   ├── PUT /templates/:id      # Update template (admin)
│   └── POST /send              # Send notification (admin)
│
└── /business
    ├── GET /settings           # Get business settings
    ├── PUT /settings           # Update settings (admin)
    ├── GET /hours              # Get business hours
    └── PUT /hours              # Update hours (admin)
```

---

## Authentication

### JWT Token Structure

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: 'customer' | 'staff' | 'admin' | 'owner';
  businessId?: string;
  iat: number;
  exp: number;
}
```

### Auth Middleware

```typescript
// src/middleware/auth.ts
import { Context, Next } from 'hono';
import { jwt } from 'hono/jwt';

export const authMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const payload = await jwt.verify(token, process.env.JWT_SECRET!);
    c.set('user', payload);
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

export const requireRole = (...roles: string[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!roles.includes(user.role)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    await next();
  };
};

export const requireBusiness = async (c: Context, next: Next) => {
  const user = c.get('user');
  if (!user.businessId) {
    return c.json({ error: 'Business context required' }, 400);
  }
  await next();
};
```

---

## Core Endpoints Implementation

### 1. Booking Endpoints

```typescript
// src/routes/bookings.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware, requireRole, requireBusiness } from '../middleware/auth';
import { db } from '../db';

const bookings = new Hono();

// Validation schemas
const createBookingSchema = z.object({
  serviceId: z.string().uuid(),
  resourceId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  partySize: z.number().min(1).max(100),
  customerEmail: z.string().email(),
  customerFirstName: z.string().min(1),
  customerLastName: z.string().min(1),
  customerPhone: z.string().optional(),
  customerNotes: z.string().optional(),
});

// GET /api/v1/bookings - List bookings
bookings.get('/', authMiddleware, requireBusiness, async (c) => {
  const user = c.get('user');
  const { date, status, staffId, page = '1', limit = '20' } = c.req.query();
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  
  let query = db('bookings')
    .where('business_id', user.businessId)
    .orderBy('booking_date', 'desc')
    .orderBy('start_time', 'asc');
  
  if (date) query = query.where('booking_date', date);
  if (status) query = query.where('status', status);
  if (staffId) query = query.where('staff_id', staffId);
  
  const [results, [{ count }]] = await Promise.all([
    query.clone().limit(limitNum).offset(offset),
    query.clone().count('* as count')
  ]);
  
  return c.json({
    data: results,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: parseInt(count),
      totalPages: Math.ceil(parseInt(count) / limitNum)
    }
  });
});

// GET /api/v1/bookings/availability - Check availability
bookings.get('/availability', async (c) => {
  const { businessSlug, serviceId, date, partySize } = c.req.query();
  
  if (!businessSlug || !serviceId || !date) {
    return c.json({ error: 'Missing required parameters' }, 400);
  }
  
  // Get business
  const business = await db('businesses').where('slug', businessSlug).first();
  if (!business) return c.json({ error: 'Business not found' }, 404);
  
  // Get service
  const service = await db('services')
    .where({ id: serviceId, business_id: business.id })
    .first();
  if (!service) return c.json({ error: 'Service not found' }, 404);
  
  // Get business hours for the day
  const dayOfWeek = new Date(date).getDay();
  const hours = await db('business_hours')
    .where({ business_id: business.id, day_of_week: dayOfWeek })
    .first();
  
  if (!hours || !hours.is_open) {
    return c.json({ available: false, reason: 'Closed on this day' });
  }
  
  // Get existing bookings
  const existingBookings = await db('bookings')
    .where({
      business_id: business.id,
      booking_date: date,
    })
    .whereNot('status', 'cancelled');
  
  // Get available staff
  const staffSchedules = await db('staff_schedules')
    .where('day_of_week', dayOfWeek)
    .whereExists(function() {
      this.select('*')
        .from('staff_services')
        .whereRaw('staff_services.staff_id = staff_schedules.staff_id')
        .where('service_id', serviceId);
    });
  
  // Calculate available slots
  const slots = calculateAvailableSlots(
    hours.open_time,
    hours.close_time,
    service.duration_minutes,
    service.buffer_after_minutes,
    existingBookings,
    staffSchedules
  );
  
  return c.json({
    date,
    available: slots.length > 0,
    slots: slots.map(slot => ({
      startTime: slot.start,
      endTime: slot.end,
      staffAvailable: slot.staffCount,
      resourcesAvailable: slot.resourceCount
    }))
  });
});

// GET /api/v1/bookings/slots - Get available time slots
bookings.get('/slots', async (c) => {
  const { businessSlug, serviceId, date } = c.req.query();
  
  // Similar to availability but returns slot objects for frontend calendar
  const business = await db('businesses').where('slug', businessSlug).first();
  if (!business) return c.json({ error: 'Business not found' }, 404);
  
  const service = await db('services')
    .where({ id: serviceId, business_id: business.id })
    .first();
  if (!service) return c.json({ error: 'Service not found' }, 404);
  
  const dayOfWeek = new Date(date).getDay();
  const hours = await db('business_hours')
    .where({ business_id: business.id, day_of_week: dayOfWeek })
    .first();
  
  if (!hours || !hours.is_open) {
    return c.json({ slots: [] });
  }
  
  // Get all relevant data
  const [bookings, resources, staffSchedules] = await Promise.all([
    db('bookings')
      .where({ business_id: business.id, booking_date: date })
      .whereNot('status', 'cancelled'),
    db('resources')
      .where({ business_id: business.id, is_active: true }),
    db('staff_schedules')
      .where('day_of_week', dayOfWeek)
      .join('users', 'staff_schedules.staff_id', 'users.id')
      .where('users.business_id', business.id)
      .where('users.is_active', true)
  ]);
  
  // Generate 15-minute slots
  const slots: Slot[] = [];
  const startTime = parseTime(hours.open_time);
  const endTime = parseTime(hours.close_time);
  
  for (let time = startTime; time < endTime; time += 15) {
    const slotStart = formatTime(time);
    const slotEnd = formatTime(time + service.duration_minutes);
    
    // Check if slot is available
    const isAvailable = checkSlotAvailability(
      time,
      time + service.duration_minutes,
      bookings,
      resources,
      staffSchedules,
      service
    );
    
    slots.push({
      time: slotStart,
      endTime: slotEnd,
      available: isAvailable.available,
      staff: isAvailable.staff,
      resources: isAvailable.resources
    });
  }
  
  return c.json({ slots });
});

// POST /api/v1/bookings - Create booking
bookings.post('/', async (c) => {
  const body = await c.req.json();
  const validated = createBookingSchema.parse(body);
  
  // Get business from service
  const service = await db('services')
    .where('id', validated.serviceId)
    .first();
  
  if (!service) {
    return c.json({ error: 'Service not found' }, 404);
  }
  
  const business = await db('businesses')
    .where('id', service.business_id)
    .first();
  
  // Check if booking is allowed (advance time, etc.)
  const bookingDate = new Date(validated.bookingDate);
  const now = new Date();
  const hoursUntil = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  const minHours = service.min_advance_hours ?? business.min_advance_booking_hours;
  if (hoursUntil < minHours) {
    return c.json({ 
      error: `Bookings must be made at least ${minHours} hours in advance` 
    }, 400);
  }
  
  // Check availability again (prevent double booking)
  const isAvailable = await checkRealAvailability(
    business.id,
    validated.serviceId,
    validated.resourceId,
    validated.staffId,
    validated.bookingDate,
    validated.startTime,
    service.duration_minutes
  );
  
  if (!isAvailable) {
    return c.json({ error: 'This time slot is no longer available' }, 409);
  }
  
  // Calculate end time
  const [hours, minutes] = validated.startTime.split(':').map(Number);
  const endMinutes = hours * 60 + minutes + service.duration_minutes;
  const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
  
  // Create booking
  const [booking] = await db('bookings')
    .insert({
      business_id: business.id,
      service_id: validated.serviceId,
      resource_id: validated.resourceId,
      staff_id: validated.staffId,
      booking_date: validated.bookingDate,
      start_time: validated.startTime,
      end_time: endTime,
      party_size: validated.partySize,
      customer_email: validated.customerEmail,
      customer_first_name: validated.customerFirstName,
      customer_last_name: validated.customerLastName,
      customer_phone: validated.customerPhone,
      customer_notes: validated.customerNotes,
      status: 'pending',
      total_amount: calculateTotal(service, validated.partySize),
      source: 'website'
    })
    .returning('*');
  
  // Queue notifications
  await queueNotifications(booking, 'confirmation');
  
  // Sync to calendar if enabled
  if (business.calendar_sync_enabled) {
    await syncToCalendar(booking);
  }
  
  return c.json({ booking }, 201);
});

// GET /api/v1/bookings/:id - Get booking
bookings.get('/:id', async (c) => {
  const { id } = c.req.param();
  
  const booking = await db('bookings')
    .where('id', id)
    .first();
  
  if (!booking) {
    return c.json({ error: 'Booking not found' }, 404);
  }
  
  // Get related data
  const [service, resource, staff] = await Promise.all([
    db('services').where('id', booking.service_id).first(),
    booking.resource_id ? db('resources').where('id', booking.resource_id).first() : null,
    booking.staff_id ? db('users').where('id', booking.staff_id).first() : null
  ]);
  
  return c.json({
    ...booking,
    service,
    resource,
    staff
  });
});

// PUT /api/v1/bookings/:id/status - Update status
bookings.put('/:id/status', 
  authMiddleware, 
  requireRole('staff', 'admin', 'owner'), 
  async (c) => {
    const { id } = c.req.param();
    const { status, notes } = await c.req.json();
    
    const booking = await db('bookings').where('id', id).first();
    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404);
    }
    
    const updateData: any = { status };
    const user = c.get('user');
    
    if (status === 'checked_in') {
      updateData.checked_in_at = new Date();
    } else if (status === 'completed') {
      updateData.checked_out_at = new Date();
    } else if (status === 'cancelled') {
      updateData.cancelled_at = new Date();
      updateData.cancelled_by = user.userId;
      updateData.cancellation_reason = notes;
    }
    
    const [updated] = await db('bookings')
      .where('id', id)
      .update(updateData)
      .returning('*');
    
    // Notify customer of status change
    if (['confirmed', 'cancelled'].includes(status)) {
      await queueNotifications(updated, status);
    }
    
    return c.json({ booking: updated });
  }
);

// POST /api/v1/bookings/:id/cancel - Cancel booking
bookings.post('/:id/cancel', async (c) => {
  const { id } = c.req.param();
  const { reason, email } = await c.req.json();
  
  const booking = await db('bookings').where('id', id).first();
  if (!booking) {
    return c.json({ error: 'Booking not found' }, 404);
  }
  
  // Verify email matches
  if (booking.customer_email !== email) {
    return c.json({ error: 'Email does not match booking' }, 403);
  }
  
  // Check cancellation policy
  const business = await db('businesses').where('id', booking.business_id).first();
  const bookingTime = new Date(`${booking.booking_date} ${booking.start_time}`);
  const hoursUntil = (bookingTime.getTime() - Date.now()) / (1000 * 60 * 60);
  
  if (hoursUntil < business.cancellation_hours) {
    return c.json({ 
      error: `Cannot cancel within ${business.cancellation_hours} hours of booking` 
    }, 400);
  }
  
  // Update booking
  const [updated] = await db('bookings')
    .where('id', id)
    .update({
      status: 'cancelled',
      cancelled_at: new Date(),
      cancellation_reason: reason
    })
    .returning('*');
  
  // Notify business
  await sendCancellationNotification(updated);
  
  // Remove from calendar
  if (booking.calendar_event_id) {
    await deleteCalendarEvent(booking);
  }
  
  return c.json({ booking: updated });
});

// POST /api/v1/bookings/:id/reschedule - Reschedule booking
bookings.post('/:id/reschedule', async (c) => {
  const { id } = c.req.param();
  const { newDate, newTime, email } = await c.req.json();
  
  const oldBooking = await db('bookings').where('id', id).first();
  if (!oldBooking) {
    return c.json({ error: 'Booking not found' }, 404);
  }
  
  if (oldBooking.customer_email !== email) {
    return c.json({ error: 'Email does not match booking' }, 403);
  }
  
  if (oldBooking.status === 'cancelled') {
    return c.json({ error: 'Cannot reschedule cancelled booking' }, 400);
  }
  
  // Check new slot availability
  const service = await db('services').where('id', oldBooking.service_id).first();
  const isAvailable = await checkRealAvailability(
    oldBooking.business_id,
    oldBooking.service_id,
    oldBooking.resource_id,
    oldBooking.staff_id,
    newDate,
    newTime,
    service.duration_minutes
  );
  
  if (!isAvailable) {
    return c.json({ error: 'New time slot is not available' }, 409);
  }
  
  // Calculate new end time
  const [hours, minutes] = newTime.split(':').map(Number);
  const endMinutes = hours * 60 + minutes + service.duration_minutes;
  const newEndTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
  
  // Create new booking
  const [newBooking] = await db('bookings')
    .insert({
      ...oldBooking,
      id: undefined,
      booking_number: undefined,
      booking_date: newDate,
      start_time: newTime,
      end_time: newEndTime,
      status: 'pending',
      calendar_event_id: null,
      created_at: undefined,
      updated_at: undefined
    })
    .returning('*');
  
  // Cancel old booking
  await db('bookings')
    .where('id', id)
    .update({
      status: 'rescheduled',
      cancellation_reason: `Rescheduled to booking ${newBooking.booking_number}`
    });
  
  // Update calendar
  await syncToCalendar(newBooking);
  
  // Send confirmation
  await queueNotifications(newBooking, 'reschedule');
  
  return c.json({ booking: newBooking });
});

export { bookings };
```

### 2. Services Endpoints

```typescript
// src/routes/services.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware, requireRole, requireBusiness } from '../middleware/auth';
import { db } from '../db';

const services = new Hono();

const createServiceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  durationMinutes: z.number().min(5).max(480),
  bufferAfterMinutes: z.number().min(0).max(120).default(0),
  capacity: z.number().min(1).default(1),
  price: z.number().min(0).optional(),
  priceType: z.enum(['fixed', 'per_person', 'per_hour', 'variable']).default('fixed'),
  requiresStaff: z.boolean().default(true),
  requiresResource: z.boolean().default(false),
  maxPerSlot: z.number().optional(),
  isActive: z.boolean().default(true),
});

// GET /api/v1/services - List services
services.get('/', async (c) => {
  const { businessSlug, categoryId, active } = c.req.query();
  
  let query = db('services')
    .join('businesses', 'services.business_id', 'businesses.id')
    .select('services.*');
  
  if (businessSlug) {
    query = query.where('businesses.slug', businessSlug);
  }
  
  if (categoryId) {
    query = query.where('services.category_id', categoryId);
  }
  
  if (active !== undefined) {
    query = query.where('services.is_active', active === 'true');
  }
  
  const results = await query.orderBy('services.display_order');
  
  return c.json({ data: results });
});

// POST /api/v1/services - Create service
services.post('/', 
  authMiddleware, 
  requireRole('admin', 'owner'), 
  requireBusiness,
  async (c) => {
    const user = c.get('user');
    const body = await c.req.json();
    const validated = createServiceSchema.parse(body);
    
    const [service] = await db('services')
      .insert({
        business_id: user.businessId,
        name: validated.name,
        description: validated.description,
        category_id: validated.categoryId,
        duration_minutes: validated.durationMinutes,
        buffer_after_minutes: validated.bufferAfterMinutes,
        capacity: validated.capacity,
        price: validated.price,
        price_type: validated.priceType,
        requires_staff: validated.requiresStaff,
        requires_resource: validated.requiresResource,
        max_per_slot: validated.maxPerSlot,
        is_active: validated.isActive
      })
      .returning('*');
    
    return c.json({ service }, 201);
  }
);

// PUT /api/v1/services/:id - Update service
services.put('/:id',
  authMiddleware,
  requireRole('admin', 'owner'),
  async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json();
    const user = c.get('user');
    
    const service = await db('services').where('id', id).first();
    if (!service) {
      return c.json({ error: 'Service not found' }, 404);
    }
    
    // Verify ownership
    if (service.business_id !== user.businessId) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    const [updated] = await db('services')
      .where('id', id)
      .update({
        ...body,
        updated_at: new Date()
      })
      .returning('*');
    
    return c.json({ service: updated });
  }
);

export { services };
```

### 3. Staff & Availability Endpoints

```typescript
// src/routes/staff.ts
import { Hono } from 'hono';
import { authMiddleware, requireRole, requireBusiness } from '../middleware/auth';
import { db } from '../db';

const staff = new Hono();

// GET /api/v1/staff - List staff
staff.get('/', authMiddleware, requireBusiness, async (c) => {
  const user = c.get('user');
  
  const staffList = await db('users')
    .where('business_id', user.businessId)
    .whereIn('role', ['staff', 'admin', 'owner'])
    .orderBy('first_name');
  
  return c.json({ data: staffList });
});

// GET /api/v1/staff/:id/availability - Get availability for a date range
staff.get('/:id/availability', async (c) => {
  const { id } = c.req.param();
  const { startDate, endDate } = c.req.query();
  
  const [schedules, overrides, bookings] = await Promise.all([
    db('staff_schedules').where('staff_id', id).where('is_active', true),
    db('staff_availability_overrides')
      .where('staff_id', id)
      .where('start_datetime', '>=', startDate)
      .where('end_datetime', '<=', `${endDate} 23:59:59`),
    db('bookings')
      .where('staff_id', id)
      .where('booking_date', '>=', startDate)
      .where('booking_date', '<=', endDate)
      .whereNot('status', 'cancelled')
  ]);
  
  // Build availability map
  const availability: Record<string, any> = {};
  
  // Iterate through date range
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const dayOfWeek = current.getDay();
    
    const daySchedule = schedules.find(s => s.day_of_week === dayOfWeek);
    
    if (!daySchedule) {
      availability[dateStr] = { available: false, reason: 'Not scheduled' };
    } else {
      // Check for overrides
      const dayOverride = overrides.find(o => 
        new Date(o.start_datetime) <= current && 
        new Date(o.end_datetime) >= current
      );
      
      if (dayOverride && !dayOverride.is_available) {
        availability[dateStr] = { 
          available: false, 
          reason: dayOverride.reason || 'Unavailable' 
        };
      } else {
        availability[dateStr] = {
          available: true,
          hours: {
            start: daySchedule.start_time,
            end: daySchedule.end_time,
            breakStart: daySchedule.break_start,
            breakEnd: daySchedule.break_end
          },
          bookings: bookings.filter(b => b.booking_date === dateStr)
        };
      }
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return c.json({ availability });
});

// PUT /api/v1/staff/:id/schedule - Update staff schedule
staff.put('/:id/schedule',
  authMiddleware,
  requireRole('admin', 'owner'),
  async (c) => {
    const { id } = c.req.param();
    const schedules = await c.req.json();
    
    // Validate schedules
    const validated = schedules.map((s: any) => ({
      staff_id: id,
      day_of_week: s.dayOfWeek,
      start_time: s.startTime,
      end_time: s.endTime,
      break_start: s.breakStart,
      break_end: s.breakEnd,
      is_active: s.isActive ?? true
    }));
    
    // Delete existing and insert new
    await db.transaction(async (trx) => {
      await trx('staff_schedules').where('staff_id', id).delete();
      await trx('staff_schedules').insert(validated);
    });
    
    return c.json({ success: true });
  }
);

export { staff };
```

### 4. Calendar Integration Endpoints

```typescript
// src/routes/calendar.ts
import { Hono } from 'hono';
import { authMiddleware, requireBusiness } from '../middleware/auth';
import { db } from '../db';
import { getGoogleAuthUrl, handleGoogleCallback, syncToGoogleCalendar } from '../integrations/google-calendar';
import { getOutlookAuthUrl, handleOutlookCallback } from '../integrations/outlook';

const calendar = new Hono();

// GET /api/v1/calendar/connect/:provider - Initiate OAuth
calendar.get('/connect/:provider', authMiddleware, async (c) => {
  const { provider } = c.req.param();
  const user = c.get('user');
  
  const state = Buffer.from(JSON.stringify({
    userId: user.userId,
    businessId: user.businessId
  })).toString('base64');
  
  let authUrl: string;
  
  switch (provider) {
    case 'google':
      authUrl = getGoogleAuthUrl(state);
      break;
    case 'outlook':
      authUrl = getOutlookAuthUrl(state);
      break;
    default:
      return c.json({ error: 'Unsupported provider' }, 400);
  }
  
  return c.json({ authUrl });
});

// GET /api/v1/calendar/callback/:provider - OAuth callback
calendar.get('/callback/:provider', async (c) => {
  const { provider } = c.req.param();
  const { code, state } = c.req.query();
  
  const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
  
  let tokens: any;
  
  switch (provider) {
    case 'google':
      tokens = await handleGoogleCallback(code);
      break;
    case 'outlook':
      tokens = await handleOutlookCallback(code);
      break;
    default:
      return c.json({ error: 'Unsupported provider' }, 400);
  }
  
  // Save connection
  await db('calendar_connections').insert({
    business_id: stateData.businessId,
    user_id: stateData.userId,
    provider,
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    token_expires_at: new Date(Date.now() + tokens.expiresIn * 1000),
    calendar_id: tokens.calendarId,
    calendar_name: tokens.calendarName,
    is_active: true
  });
  
  return c.json({ success: true, message: 'Calendar connected successfully' });
});

// POST /api/v1/calendar/sync - Trigger sync
calendar.post('/sync', authMiddleware, requireBusiness, async (c) => {
  const user = c.get('user');
  
  const connections = await db('calendar_connections')
    .where('business_id', user.businessId)
    .where('is_active', true);
  
  for (const conn of connections) {
    if (conn.provider === 'google') {
      await syncToGoogleCalendar(conn);
    }
  }
  
  return c.json({ success: true, synced: connections.length });
});

export { calendar };
```

### 5. Notification Endpoints

```typescript
// src/routes/notifications.ts
import { Hono } from 'hono';
import { authMiddleware, requireRole, requireBusiness } from '../middleware/auth';
import { db } from '../db';
import { sendEmail } from '../integrations/sendgrid';
import { sendSMS } from '../integrations/twilio';

const notifications = new Hono();

// GET /api/v1/notifications/templates - List templates
notifications.get('/templates', 
  authMiddleware, 
  requireBusiness, 
  async (c) => {
    const user = c.get('user');
    
    const templates = await db('notification_templates')
      .where('business_id', user.businessId)
      .orderBy('type')
      .orderBy('channel');
    
    return c.json({ data: templates });
  }
);

// POST /api/v1/notifications/send - Send notification
notifications.post('/send',
  authMiddleware,
  requireRole('admin', 'owner'),
  async (c) => {
    const { bookingId, type, channels, customMessage } = await c.req.json();
    
    const booking = await db('bookings')
      .where('id', bookingId)
      .first();
    
    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404);
    }
    
    const business = await db('businesses')
      .where('id', booking.business_id)
      .first();
    
    const template = await db('notification_templates')
      .where('business_id', business.id)
      .where('type', type)
      .first();
    
    const results: any[] = [];
    
    for (const channel of channels) {
      const message = renderTemplate(
        customMessage || template?.body,
        { booking, business }
      );
      
      try {
        if (channel === 'email') {
          await sendEmail({
            to: booking.customer_email,
            subject: renderTemplate(template?.subject, { booking, business }),
            html: message
          });
        } else if (channel === 'sms' && booking.customer_phone) {
          await sendSMS({
            to: booking.customer_phone,
            body: message
          });
        }
        
        results.push({ channel, status: 'sent' });
      } catch (error) {
        results.push({ channel, status: 'failed', error: error.message });
      }
    }
    
    return c.json({ results });
  }
);

// Helper: Render template with variables
function renderTemplate(template: string, context: any): string {
  if (!template) return '';
  
  const { booking, business, service } = context;
  
  return template
    .replace(/\{\{customer_first_name\}\}/g, booking.customer_first_name)
    .replace(/\{\{customer_last_name\}\}/g, booking.customer_last_name)
    .replace(/\{\{booking_date\}\}/g, booking.booking_date)
    .replace(/\{\{start_time\}\}/g, booking.start_time)
    .replace(/\{\{party_size\}\}/g, booking.party_size.toString())
    .replace(/\{\{business_name\}\}/g, business.name)
    .replace(/\{\{business_address\}\}/g, `${business.address_line1}, ${business.city}`)
    .replace(/\{\{booking_number\}\}/g, booking.booking_number);
}

export { notifications };
```

---

## Rate Limiting

```typescript
// src/middleware/rateLimit.ts
import { Context, Next } from 'hono';
import { redis } from '../redis';

const rateLimits: Record<string, { windowMs: number; max: number }> = {
  'POST:/api/v1/bookings': { windowMs: 60000, max: 10 }, // 10 bookings per minute
  'GET:/api/v1/bookings/availability': { windowMs: 60000, max: 60 }, // 60 checks per minute
  'POST:/api/v1/auth/login': { windowMs: 900000, max: 5 }, // 5 login attempts per 15 min
};

export const rateLimiter = async (c: Context, next: Next) => {
  const key = `${c.req.method}:${c.req.path}`;
  const limit = rateLimits[key];
  
  if (!limit) {
    return next();
  }
  
  const ip = c.req.header('x-forwarded-for') || 'unknown';
  const redisKey = `ratelimit:${key}:${ip}`;
  
  const current = await redis.incr(redisKey);
  
  if (current === 1) {
    await redis.pexpire(redisKey, limit.windowMs);
  }
  
  if (current > limit.max) {
    return c.json({ 
      error: 'Too many requests', 
      retryAfter: await redis.pttl(redisKey) / 1000 
    }, 429);
  }
  
  c.header('X-RateLimit-Limit', limit.max.toString());
  c.header('X-RateLimit-Remaining', (limit.max - current).toString());
  
  await next();
};
```

---

## Error Handling

```typescript
// src/middleware/errorHandler.ts
import { Context } from 'hono';
import { ZodError } from 'zod';

export const errorHandler = (err: Error, c: Context) => {
  console.error('Error:', err);
  
  if (err instanceof ZodError) {
    return c.json({
      error: 'Validation error',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    }, 400);
  }
  
  if (err.name === 'UnauthorizedError') {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  if (err.name === 'NotFoundError') {
    return c.json({ error: err.message }, 404);
  }
  
  // Database errors
  if (err.code === '23505') { // Unique violation
    return c.json({ error: 'This record already exists' }, 409);
  }
  
  if (err.code === '23503') { // Foreign key violation
    return c.json({ error: 'Referenced record not found' }, 400);
  }
  
  return c.json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  }, 500);
};
```

---

## Main Application Setup

```typescript
// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

import { bookings } from './routes/bookings';
import { services } from './routes/services';
import { staff } from './routes/staff';
import { calendar } from './routes/calendar';
import { notifications } from './routes/notifications';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimit';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400
}));
app.use('*', prettyJSON());

// Rate limiting
app.use('/api/*', rateLimiter);

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API routes
app.route('/api/v1/bookings', bookings);
app.route('/api/v1/services', services);
app.route('/api/v1/staff', staff);
app.route('/api/v1/calendar', calendar);
app.route('/api/v1/notifications', notifications);

// Error handler
app.onError(errorHandler);

// 404 handler
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Start server
const port = parseInt(process.env.PORT || '3000');
console.log(`🚀 Server running on http://localhost:${port}`);

export default app;
```

---

## API Response Formats

### Success Response
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Paginated Response
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error Response
```json
{
  "error": "Validation error",
  "details": [
    {
      "path": "bookingDate",
      "message": "Invalid date format"
    }
  ]
}
```
