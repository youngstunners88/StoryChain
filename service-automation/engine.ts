#!/usr/bin/env tsx
/**
 * Service Industry Automation Engine
 * Generates leads and automates client acquisition
 */

const TARGET_VERTICLES = [
  { name: 'restaurants', price: 2500, services: ['menu-updates', 'social-posting', 'review-management'] },
  { name: 'salons', price: 2000, services: ['appointment-reminders', 'follow-ups', 'social-posting'] },
  { name: 'gyms', price: 1800, services: ['membership-tracking', 'class-booking', 'progress-reports'] },
  { name: 'home-services', price: 3000, services: ['quote-generation', 'scheduling', 'invoicing'] },
  { name: 'consultants', price: 2200, services: ['lead-capture', 'appointment-booking', 'follow-ups'] }
];

// Johannesburg service businesses (from lead generation)
const JOHANNESBURG_LEADS = [
  { name: 'Waters Of Life', type: 'restaurant', phone: '0719400506', status: 'pitched' },
  { name: 'Maboneng Wellness Spa', type: 'salon', location: 'Maboneng' },
  { name: 'Joburg Fitness Hub', type: 'gym', location: 'Rosebank' },
  { name: 'CleanPro Home Services', type: 'home-services', location: 'Sandton' },
  { name: 'Digital Strategy SA', type: 'consultant', location: 'Braamfontein' }
];

function generatePitch(lead: any): string {
  const vertical = TARGET_VERTICLES.find(v => v.name === lead.type);
  return `
📱 AUTOMATED PITCH for ${lead.name}

Hi! I'm from Scamperi's AI Automation. We help ${lead.type} save 10+ hours/week with:

✅ ${vertical?.services.join('\n✅ ')}

Investment: R${vertical?.price}/month
ROI: Typically 3x within 30 days

Free demo? Reply YES or call 0719400506
`;
}

function calculateRevenue(): number {
  const signed = JOHANNESBURG_LEADS.filter(l => l.status === 'signed');
  return signed.reduce((sum, lead) => {
    const vertical = TARGET_VERTICLES.find(v => v.name === lead.type);
    return sum + (vertical?.price || 0);
  }, 0);
}

console.log('=== SERVICE AUTOMATION ENGINE ===\n');
console.log('Target verticals:', TARGET_VERTICLES.length);
console.log('Leads in pipeline:', JOHANNESBURG_LEADS.length);
console.log('Monthly revenue potential: R', calculateRevenue());

// Generate pitches for new leads
JOHANNESBURG_LEADS.forEach(lead => {
  if (lead.status !== 'signed') {
    console.log(generatePitch(lead));
  }
});
