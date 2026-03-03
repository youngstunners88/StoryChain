#!/usr/bin/env tsx
/**
 * Fixed Service Automation Engine
 */

const VERTICALS: Record<string, { price: number; services: string[] }> = {
  'restaurant': { price: 2500, services: ['Menu Updates', 'Social Posting', 'Review Management'] },
  'salon': { price: 2000, services: ['Appointment Reminders', 'Client Follow-ups', 'Social Posting'] },
  'gym': { price: 1800, services: ['Membership Tracking', 'Class Booking', 'Progress Reports'] },
  'home-services': { price: 3000, services: ['Quote Generation', 'Scheduling', 'Invoicing'] },
  'consultant': { price: 2200, services: ['Lead Capture', 'Appointment Booking', 'Follow-up Sequences'] }
};

const LEADS = [
  { name: 'Waters Of Life', type: 'restaurant', phone: '0719400506', location: 'Maboneng' },
  { name: 'Maboneng Wellness', type: 'salon', location: 'Maboneng' },
  { name: 'Rosebank Fitness', type: 'gym', location: 'Rosebank' },
  { name: 'CleanPro Services', type: 'home-services', location: 'Sandton' },
  { name: 'Strategy Hub SA', type: 'consultant', location: 'Braamfontein' }
];

function pitch(lead: any): string {
  const v = VERTICALS[lead.type];
  return `📱 ${lead.name} (${lead.type.toUpperCase()})
Services: ${v.services.join(' | ')}
Price: R${v.price}/month
Location: ${lead.location}
Contact: ${lead.phone || 'Pending'}
---`;
}

console.log('=== SERVICE AUTOMATION PITCHES ===\n');
LEADS.forEach(l => console.log(pitch(l)));

const total = LEADS.reduce((s, l) => s + VERTICALS[l.type].price, 0);
console.log(`\n💰 Total potential: R${total}/month`);
