# Integrations Guide

Complete setup for calendar syncing and notifications (SMS/Email).

---

## 1. Google Calendar Integration

### Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs: `https://your-domain.com/api/v1/calendar/callback/google`

2. **Store Credentials**
   ```
   # In Settings > Advanced > Secrets
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

### Implementation

```typescript
// api/src/integrations/google-calendar.ts
import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly'
];

// Generate OAuth URL
export function getGoogleAuthUrl(state: string): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL}/api/v1/calendar/callback/google`
  );
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state,
    prompt: 'consent' // Always get refresh token
  });
}

// Handle OAuth callback
export async function handleGoogleCallback(code: string): Promise<TokenInfo> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL}/api/v1/calendar/callback/google`
  );
  
  const { tokens } = await oauth2Client.getToken(code);
  
  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token!,
    expiresIn: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
    calendarId: 'primary',
    calendarName: 'Primary Calendar'
  };
}

// Create calendar event from booking
export async function createGoogleCalendarEvent(
  connection: CalendarConnection,
  booking: Booking
): Promise<string> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken
  });
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  // Build event
  const event = {
    summary: `${booking.service.name} - ${booking.customerFirstName} ${booking.customerLastName}`,
    description: buildEventDescription(booking),
    start: {
      dateTime: `${booking.bookingDate}T${booking.startTime}:00`,
      timeZone: booking.timezone || 'Africa/Johannesburg'
    },
    end: {
      dateTime: `${booking.bookingDate}T${booking.endTime}:00`,
      timeZone: booking.timezone || 'Africa/Johannesburg'
    },
    attendees: [
      { email: booking.customerEmail, displayName: `${booking.customerFirstName} ${booking.customerLastName}` }
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 24 hours before
        { method: 'popup', minutes: 60 } // 1 hour before
      ]
    },
    extendedProperties: {
      private: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber
      }
    }
  };
  
  const response = await calendar.events.insert({
    calendarId: connection.calendarId,
    requestBody: event,
    sendUpdates: 'all' // Send invites to attendees
  });
  
  return response.data.id!;
}

// Update calendar event
export async function updateGoogleCalendarEvent(
  connection: CalendarConnection,
  booking: Booking,
  eventId: string
): Promise<void> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken
  });
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const event = {
    summary: `${booking.service.name} - ${booking.customerFirstName} ${booking.customerLastName}`,
    start: {
      dateTime: `${booking.bookingDate}T${booking.startTime}:00`,
      timeZone: booking.timezone || 'Africa/Johannesburg'
    },
    end: {
      dateTime: `${booking.bookingDate}T${booking.endTime}:00`,
      timeZone: booking.timezone || 'Africa/Johannesburg'
    }
  };
  
  await calendar.events.update({
    calendarId: connection.calendarId,
    eventId,
    requestBody: event,
    sendUpdates: 'all'
  });
}

// Delete calendar event
export async function deleteGoogleCalendarEvent(
  connection: CalendarConnection,
  eventId: string
): Promise<void> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken
  });
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  await calendar.events.delete({
    calendarId: connection.calendarId,
    eventId,
    sendUpdates: 'all'
  });
}

// Sync bookings to Google Calendar
export async function syncToGoogleCalendar(connection: CalendarConnection): Promise<SyncResult> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken
  });
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  // Get all active bookings
  const bookings = await db('bookings')
    .where('business_id', connection.businessId)
    .whereNot('status', 'cancelled')
    .where('booking_date', '>=', new Date());
  
  let created = 0;
  let updated = 0;
  let deleted = 0;
  
  for (const booking of bookings) {
    try {
      if (booking.calendar_event_id) {
        // Update existing
        await updateGoogleCalendarEvent(connection, booking, booking.calendar_event_id);
        updated++;
      } else {
        // Create new
        const eventId = await createGoogleCalendarEvent(connection, booking);
        await db('bookings').where('id', booking.id).update({
          calendar_event_id: eventId,
          calendar_synced_at: new Date()
        });
        created++;
      }
    } catch (error) {
      console.error(`Failed to sync booking ${booking.id}:`, error);
    }
  }
  
  // Update last sync time
  await db('calendar_connections')
    .where('id', connection.id)
    .update({ last_sync_at: new Date() });
  
  return { created, updated, deleted };
}

// Build event description
function buildEventDescription(booking: Booking): string {
  const lines = [
    `Booking #${booking.bookingNumber}`,
    '',
    `Service: ${booking.service?.name}`,
    `Party Size: ${booking.partySize}`,
    ''
  ];
  
  if (booking.customerPhone) {
    lines.push(`Phone: ${booking.customerPhone}`);
  }
  
  if (booking.customerNotes) {
    lines.push('');
    lines.push('Notes:');
    lines.push(booking.customerNotes);
  }
  
  return lines.join('\n');
}
```

---

## 2. Microsoft Outlook / Office 365 Integration

### Setup

1. **Register App in Azure AD**
   - Go to [Azure Portal](https://portal.azure.com)
   - Navigate to Azure Active Directory > App registrations
   - Create new registration
   - Add redirect URI: `https://your-domain.com/api/v1/calendar/callback/outlook`
   - Add API permissions: `Calendars.ReadWrite`

2. **Store Credentials**
   ```
   OUTLOOK_CLIENT_ID=your_client_id
   OUTLOOK_CLIENT_SECRET=your_client_secret
   OUTLOOK_TENANT_ID=common  # or specific tenant
   ```

### Implementation

```typescript
// api/src/integrations/outlook.ts
import fetch from 'node-fetch';

const OUTLOOK_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const OUTLOOK_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const OUTLOOK_SCOPES = [
  'offline_access',
  'Calendars.ReadWrite',
  'Calendars.ReadWrite.Shared'
].join(' ');

// Generate OAuth URL
export function getOutlookAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.OUTLOOK_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: `${process.env.APP_URL}/api/v1/calendar/callback/outlook`,
    scope: OUTLOOK_SCOPES,
    response_mode: 'query',
    state
  });
  
  return `${OUTLOOK_AUTH_URL}?${params}`;
}

// Handle OAuth callback
export async function handleOutlookCallback(code: string): Promise<TokenInfo> {
  const response = await fetch(OUTLOOK_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.OUTLOOK_CLIENT_ID!,
      client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
      code,
      redirect_uri: `${process.env.APP_URL}/api/v1/calendar/callback/outlook`,
      grant_type: 'authorization_code'
    })
  });
  
  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    calendarId: 'Calendar',
    calendarName: 'Calendar'
  };
}

// Refresh token
async function refreshOutlookToken(refreshToken: string): Promise<string> {
  const response = await fetch(OUTLOOK_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.OUTLOOK_CLIENT_ID!,
      client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
  
  const data = await response.json();
  return data.access_token;
}

// Create calendar event
export async function createOutlookEvent(
  connection: CalendarConnection,
  booking: Booking
): Promise<string> {
  let accessToken = connection.accessToken;
  
  // Check if token needs refresh
  if (connection.tokenExpiresAt && new Date(connection.tokenExpiresAt) < new Date()) {
    accessToken = await refreshOutlookToken(connection.refreshToken);
    // Update stored token
    await db('calendar_connections')
      .where('id', connection.id)
      .update({ access_token: accessToken });
  }
  
  const event = {
    subject: `${booking.service.name} - ${booking.customerFirstName} ${booking.customerLastName}`,
    body: {
      contentType: 'text',
      content: buildEventDescription(booking)
    },
    start: {
      dateTime: `${booking.bookingDate}T${booking.startTime}:00`,
      timeZone: booking.timezone || 'South Africa Standard Time'
    },
    end: {
      dateTime: `${booking.bookingDate}T${booking.endTime}:00`,
      timeZone: booking.timezone || 'South Africa Standard Time'
    },
    attendees: [
      {
        emailAddress: {
          address: booking.customerEmail,
          name: `${booking.customerFirstName} ${booking.customerLastName}`
        },
        type: 'required'
      }
    ],
    singleValueExtendedProperties: [
      {
        id: 'String {bookingId}',
        value: booking.id
      }
    ]
  };
  
  const response = await fetch(
    'https://graph.microsoft.com/v1.0/me/events',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    }
  );
  
  const data = await response.json();
  return data.id;
}

// Update event
export async function updateOutlookEvent(
  connection: CalendarConnection,
  booking: Booking,
  eventId: string
): Promise<void> {
  let accessToken = connection.accessToken;
  
  if (connection.tokenExpiresAt && new Date(connection.tokenExpiresAt) < new Date()) {
    accessToken = await refreshOutlookToken(connection.refreshToken);
  }
  
  const event = {
    subject: `${booking.service.name} - ${booking.customerFirstName} ${booking.customerLastName}`,
    start: {
      dateTime: `${booking.bookingDate}T${booking.startTime}:00`,
      timeZone: 'South Africa Standard Time'
    },
    end: {
      dateTime: `${booking.bookingDate}T${booking.endTime}:00`,
      timeZone: 'South Africa Standard Time'
    }
  };
  
  await fetch(
    `https://graph.microsoft.com/v1.0/me/events/${eventId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    }
  );
}

// Delete event
export async function deleteOutlookEvent(
  connection: CalendarConnection,
  eventId: string
): Promise<void> {
  let accessToken = connection.accessToken;
  
  if (connection.tokenExpiresAt && new Date(connection.tokenExpiresAt) < new Date()) {
    accessToken = await refreshOutlookToken(connection.refreshToken);
  }
  
  await fetch(
    `https://graph.microsoft.com/v1.0/me/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
}
```

---

## 3. Apple Calendar / CalDAV

For Apple Calendar, use an ICS feed that users can subscribe to:

```typescript
// api/src/routes/ics-feed.ts
import ical from 'ical-generator';

// Generate ICS feed for a business
export async function generateICSFeed(businessId: string): Promise<string> {
  const business = await db('businesses').where('id', businessId).first();
  const bookings = await db('bookings')
    .where('business_id', businessId)
    .whereNot('status', 'cancelled')
    .where('booking_date', '>=', new Date())
    .orderBy('booking_date');
  
  const cal = ical({
    name: `${business.name} Bookings`,
    timezone: business.timezone,
    prodId: { company: 'BookingSystem', product: 'Bookings' }
  });
  
  for (const booking of bookings) {
    cal.createEvent({
      id: booking.id,
      start: new Date(`${booking.bookingDate}T${booking.startTime}:00`),
      end: new Date(`${booking.bookingDate}T${booking.endTime}:00`),
      summary: `${booking.service.name} - ${booking.customerFirstName} ${booking.customerLastName}`,
      description: `Booking #${booking.bookingNumber}\nParty Size: ${booking.partySize}`,
      location: business.name
    });
  }
  
  return cal.toString();
}

// API endpoint
app.get('/api/v1/calendar/ics/:token', async (c) => {
  // Decode token to get business ID
  const businessId = decodeICSFeedToken(c.req.param('token'));
  
  const ics = await generateICSFeed(businessId);
  
  return c.text(ics, 200, {
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': 'attachment; filename="bookings.ics"'
  });
});
```

---

## 4. SMS Notifications (Twilio)

### Setup

1. **Create Twilio Account**
   - Go to [Twilio](https://www.twilio.com)
   - Sign up for account
   - Get Account SID and Auth Token
   - Buy a phone number

2. **Store Credentials**
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+27XXXXXXXXX
   ```

### Implementation

```typescript
// api/src/integrations/twilio.ts
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

interface SendSMSOptions {
  to: string;
  body: string;
  businessId?: string;
  bookingId?: string;
}

export async function sendSMS(options: SendSMSOptions): Promise<SMSResult> {
  try {
    // Validate phone number format
    const phone = normalizePhoneNumber(options.to);
    
    const message = await client.messages.create({
      body: options.body,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: phone,
      statusCallback: `${process.env.APP_URL}/api/v1/webhooks/twilio/status`
    });
    
    // Log notification
    if (options.businessId) {
      await db('notification_logs').insert({
        business_id: options.businessId,
        booking_id: options.bookingId,
        type: 'sms',
        channel: 'sms',
        recipient_phone: phone,
        body: options.body,
        status: 'sent',
        external_id: message.sid,
        sent_at: new Date()
      });
    }
    
    return {
      success: true,
      messageId: message.sid
    };
  } catch (error: any) {
    // Log error
    await db('notification_logs').insert({
      business_id: options.businessId,
      booking_id: options.bookingId,
      type: 'sms',
      channel: 'sms',
      recipient_phone: options.to,
      body: options.body,
      status: 'failed',
      error_message: error.message
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Normalize phone number to E.164 format
function normalizePhoneNumber(phone: string): string {
  // Remove spaces and dashes
  let cleaned = phone.replace(/[\s-]/g, '');
  
  // Handle South African numbers
  if (cleaned.startsWith('0')) {
    cleaned = '+27' + cleaned.substring(1);
  } else if (cleaned.startsWith('27')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

// SMS Templates
export const smsTemplates = {
  bookingConfirmation: (data: BookingData) =>
    `${data.businessName}: Booking confirmed for ${formatDate(data.date)} at ${formatTime(data.time)}. ${data.partySize} guests. Booking #${data.bookingNumber}`,
  
  bookingReminder: (data: BookingData) =>
    `Reminder: Your booking at ${data.businessName} is tomorrow at ${formatTime(data.time)}. Reply CANCEL to cancel.`,
  
  bookingCancellation: (data: BookingData) =>
    `${data.businessName}: Your booking #${data.bookingNumber} has been cancelled.`,
  
  bookingRescheduled: (data: BookingData) =>
    `${data.businessName}: Booking rescheduled to ${formatDate(data.date)} at ${formatTime(data.time)}. New booking #${data.bookingNumber}`
};

// Webhook for delivery status
app.post('/api/v1/webhooks/twilio/status', async (c) => {
  const body = await c.req.parseBody();
  const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = body;
  
  // Update notification log
  await db('notification_logs')
    .where('external_id', MessageSid)
    .update({
      status: MessageStatus,
      error_message: ErrorMessage,
      delivered_at: MessageStatus === 'delivered' ? new Date() : null
    });
  
  return c.text('OK');
});
```

---

## 5. Email Notifications (SendGrid)

### Setup

1. **Create SendGrid Account**
   - Go to [SendGrid](https://sendgrid.com)
   - Sign up for account
   - Create API key (Full Access)
   - Verify sender domain

2. **Store Credentials**
   ```
   SENDGRID_API_KEY=your_api_key
   SENDGRID_FROM_EMAIL=noreply@your-domain.com
   ```

### Implementation

```typescript
// api/src/integrations/sendgrid.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  businessId?: string;
  bookingId?: string;
  attachments?: Array<{
    content: string; // Base64
    filename: string;
    type: string;
  }>;
}

export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  try {
    const msg: any = {
      to: options.to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: 'Booking System'
      },
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      }
    };
    
    // Use template if specified
    if (options.templateId) {
      msg.templateId = options.templateId;
      msg.dynamicTemplateData = options.templateData;
      delete msg.html;
      delete msg.text;
    }
    
    // Add attachments
    if (options.attachments?.length) {
      msg.attachments = options.attachments.map(a => ({
        content: a.content,
        filename: a.filename,
        type: a.type,
        disposition: 'attachment'
      }));
    }
    
    const [response] = await sgMail.send(msg);
    
    // Log notification
    if (options.businessId) {
      await db('notification_logs').insert({
        business_id: options.businessId,
        booking_id: options.bookingId,
        type: 'email',
        channel: 'email',
        recipient_email: options.to,
        subject: options.subject,
        body: options.html,
        status: 'sent',
        external_id: response.headers['x-message-id'],
        sent_at: new Date()
      });
    }
    
    return {
      success: true,
      messageId: response.headers['x-message-id']
    };
  } catch (error: any) {
    console.error('SendGrid error:', error);
    
    await db('notification_logs').insert({
      business_id: options.businessId,
      booking_id: options.bookingId,
      type: 'email',
      channel: 'email',
      recipient_email: options.to,
      subject: options.subject,
      body: options.html,
      status: 'failed',
      error_message: error.message
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Email templates
export const emailTemplates = {
  bookingConfirmation: (data: BookingConfirmationData): SendEmailOptions => ({
    to: data.customerEmail,
    subject: `Your Reservation at ${data.businessName} is Confirmed`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${data.primaryColor}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { color: #6b7280; }
          .detail-value { font-weight: 600; }
          .button { display: inline-block; background: ${data.primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmed ✓</h1>
          </div>
          
          <div class="content">
            <p>Dear ${data.customerFirstName},</p>
            <p>Your reservation at <strong>${data.businessName}</strong> has been confirmed!</p>
            
            <div class="booking-details">
              <div class="detail-row">
                <span class="detail-label">Booking Number</span>
                <span class="detail-value">${data.bookingNumber}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date</span>
                <span class="detail-value">${formatDate(data.bookingDate)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time</span>
                <span class="detail-value">${formatTime(data.startTime)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Service</span>
                <span class="detail-value">${data.serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Party Size</span>
                <span class="detail-value">${data.partySize} ${data.partySize === 1 ? 'guest' : 'guests'}</span>
              </div>
              ${data.staffName ? `
              <div class="detail-row">
                <span class="detail-label">With</span>
                <span class="detail-value">${data.staffName}</span>
              </div>
              ` : ''}
            </div>
            
            <p>Please arrive 5 minutes before your appointment.</p>
            
            <p>
              Need to cancel or reschedule?<br>
              <a href="${data.manageUrl}" class="button">Manage Booking</a>
            </p>
            
            <p>We look forward to seeing you!</p>
            
            <p>
              Best regards,<br>
              The ${data.businessName} Team
            </p>
          </div>
          
          <div class="footer">
            <p>${data.businessName}<br>${data.businessAddress}</p>
            <p>Booking #${data.bookingNumber}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),
  
  bookingReminder: (data: BookingReminderData): SendEmailOptions => ({
    to: data.customerEmail,
    subject: `Reminder: Your reservation tomorrow at ${formatTime(data.startTime)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #fbbf24; color: #78350f; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .highlight-box { background: white; border-left: 4px solid ${data.primaryColor}; padding: 15px 20px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Reminder</h1>
          </div>
          
          <div class="content">
            <p>Hi ${data.customerFirstName},</p>
            <p>This is a friendly reminder about your upcoming reservation:</p>
            
            <div class="highlight-box">
              <strong>${formatDate(data.bookingDate)}</strong><br>
              ${formatTime(data.startTime)} - ${formatTime(data.endTime)}<br>
              ${data.serviceName}<br>
              ${data.partySize} ${data.partySize === 1 ? 'guest' : 'guests'}
            </div>
            
            <p>See you soon!</p>
            
            <p>
              ${data.businessName}<br>
              ${data.businessAddress}
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),
  
  bookingCancellation: (data: BookingCancellationData): SendEmailOptions => ({
    to: data.customerEmail,
    subject: `Booking Cancelled - ${data.businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Cancelled</h1>
          </div>
          
          <div class="content">
            <p>Dear ${data.customerFirstName},</p>
            <p>Your booking #${data.bookingNumber} at ${data.businessName} has been cancelled.</p>
            
            ${data.cancellationReason ? `
            <p><strong>Reason:</strong> ${data.cancellationReason}</p>
            ` : ''}
            
            ${data.refundAmount ? `
            <p>A refund of ${formatCurrency(data.refundAmount)} will be processed within 5-7 business days.</p>
            ` : ''}
            
            <p>We hope to see you again soon!</p>
            
            <p>
              ${data.businessName}<br>
              ${data.businessAddress}
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Strip HTML for plain text version
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
```

---

## 6. WhatsApp Business API (Optional)

```typescript
// api/src/integrations/whatsapp.ts
import fetch from 'node-fetch';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

interface WhatsAppMessage {
  to: string;
  templateName: string;
  templateData: Record<string, string>;
}

export async function sendWhatsAppMessage(options: WhatsAppMessage): Promise<any> {
  const response = await fetch(
    `${WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizePhoneNumber(options.to),
        type: 'template',
        template: {
          name: options.templateName,
          language: { code: 'en' },
          components: Object.entries(options.templateData).map(([key, value]) => ({
            type: 'body',
            parameters: [{ type: 'text', text: value }]
          }))
        }
      })
    }
  );
  
  return response.json();
}

// Pre-approved templates (must be created in WhatsApp Business Manager)
export const whatsappTemplates = {
  bookingConfirmation: {
    name: 'booking_confirmation',
    params: ['businessName', 'date', 'time', 'partySize', 'bookingNumber']
  },
  bookingReminder: {
    name: 'booking_reminder',
    params: ['businessName', 'time']
  }
};
```

---

## 7. Notification Scheduler

```typescript
// api/src/workers/notification-worker.ts
import { Queue, Worker } from 'bullmq';
import { sendEmail } from '../integrations/sendgrid';
import { sendSMS } from '../integrations/twilio';

const notificationQueue = new Queue('notifications', {
  connection: { host: 'localhost', port: 6379 }
});

// Schedule notifications
export async function scheduleNotifications(booking: Booking) {
  const business = await db('businesses').where('id', booking.businessId).first();
  
  // Immediate confirmation
  await notificationQueue.add('send-confirmation', {
    bookingId: booking.id,
    type: 'confirmation',
    channels: ['email', ...(business.sms_notifications_enabled ? ['sms'] : [])]
  }, { delay: 0 });
  
  // Reminder 24 hours before
  const bookingTime = new Date(`${booking.bookingDate}T${booking.startTime}`);
  const reminderTime = new Date(bookingTime.getTime() - business.reminder_hours_before * 60 * 60 * 1000);
  const delay = Math.max(0, reminderTime.getTime() - Date.now());
  
  if (delay > 0) {
    await notificationQueue.add('send-reminder', {
      bookingId: booking.id,
      type: 'reminder',
      channels: ['email', ...(business.sms_notifications_enabled ? ['sms'] : [])]
    }, { delay });
  }
}

// Worker to process notifications
const worker = new Worker('notifications', async job => {
  const { bookingId, type, channels } = job.data;
  
  const booking = await db('bookings')
    .where('id', bookingId)
    .first();
  
  if (!booking || booking.status === 'cancelled') {
    return; // Skip cancelled bookings
  }
  
  const business = await db('businesses')
    .where('id', booking.businessId)
    .first();
  
  for (const channel of channels) {
    if (channel === 'email') {
      const template = type === 'confirmation' 
        ? emailTemplates.bookingConfirmation 
        : emailTemplates.bookingReminder;
      
      await sendEmail(template({
        customerEmail: booking.customer_email,
        customerFirstName: booking.customer_first_name,
        businessName: business.name,
        primaryColor: business.primary_color,
        bookingNumber: booking.booking_number,
        bookingDate: booking.booking_date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        serviceName: booking.service?.name,
        partySize: booking.party_size,
        businessAddress: `${business.address_line1}, ${business.city}`,
        manageUrl: `${process.env.APP_URL}/booking/${booking.id}`
      }));
    }
    
    if (channel === 'sms' && booking.customer_phone) {
      const template = type === 'confirmation'
        ? smsTemplates.bookingConfirmation
        : smsTemplates.bookingReminder;
      
      await sendSMS({
        to: booking.customer_phone,
        body: template({
          businessName: business.name,
          date: booking.booking_date,
          time: booking.start_time,
          partySize: booking.party_size,
          bookingNumber: booking.booking_number
        }),
        businessId: business.id,
        bookingId: booking.id
      });
    }
  }
  
  // Update booking
  if (type === 'confirmation') {
    await db('bookings').where('id', bookingId).update({ confirmation_sent_at: new Date() });
  } else {
    await db('bookings').where('id', bookingId).update({ reminder_sent_at: new Date() });
  }
}, {
  connection: { host: 'localhost', port: 6379 }
});
```

---

## 8. Pricing for Clients

When quoting clients, include these third-party costs:

| Service | Free Tier | Paid Tier | Notes |
|---------|-----------|-----------|-------|
| Twilio SMS | First 100/month | ~R1.50/SMS | SA numbers have higher rates |
| SendGrid Email | 100/day | $14.95/mo for 50k | Recommended |
| Google Calendar | Free | - | OAuth setup needed |
| Outlook | Free | - | Azure AD registration |
| WhatsApp Business | First 1000/month | ~R0.80/message | Requires template approval |

**Bundle recommendation:**
- R150/month for SMS notifications (100 SMS)
- R250/month for email notifications (SendGrid Pro)
- Calendar integrations included in implementation

---

## Environment Variables Template

```bash
# .env.example

# App
APP_URL=https://your-domain.com
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/bookings

# Redis (for queues and caching)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key

# Google Calendar
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Outlook
OUTLOOK_CLIENT_ID=xxx
OUTLOOK_CLIENT_SECRET=xxx

# Twilio
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+27XXXXXXXXX

# SendGrid
SENDGRID_API_KEY=xxx
SENDGRID_FROM_EMAIL=noreply@your-domain.com

# WhatsApp (optional)
WHATSAPP_ACCESS_TOKEN=xxx
WHATSAPP_PHONE_NUMBER_ID=xxx

# Stripe (payments)
STRIPE_SECRET_KEY=xxx
STRIPE_WEBHOOK_SECRET=xxx
```
