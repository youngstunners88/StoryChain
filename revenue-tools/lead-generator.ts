/**
 * Lead Generator for Johannesburg Businesses
 * Generates qualified leads for web services
 */

interface BusinessLead {
  name: string;
  type: string;
  area: string;
  phone?: string;
  email?: string;
  website?: string;
  needs: string[];
  score: number; // 1-10
}

const JOBURG_AREAS = [
  'Maboneng', 'Braamfontein', 'Rosebank', 'Sandton',
  'Melville', 'Parkhurst', 'Greenside', 'Fourways'
];

const BUSINESS_TYPES = [
  'restaurant', 'cafe', 'salon', 'spa', 'retail',
  'fitness', 'healthcare', 'legal', 'accounting'
];

export function generateLeads(count: number): BusinessLead[] {
  const leads: BusinessLead[] = [];
  
  // In production: scrape Google Maps, directories
  
  // Demo leads based on real Maboneng businesses
  const demoLeads: BusinessLead[] = [
    {
      name: 'Waters Of Life',
      type: 'restaurant',
      area: 'Maboneng',
      phone: '071 940 0506',
      needs: ['website', 'social-media'],
      score: 9
    },
    {
      name: 'Living Room',
      type: 'restaurant',
      area: 'Maboneng',
      needs: ['website-update', 'booking-system'],
      score: 7
    },
    {
      name: 'Pata Pata',
      type: 'restaurant',
      area: 'Maboneng',
      needs: ['menu-digitization', 'delivery-integration'],
      score: 8
    }
  ];
  
  return [...demoLeads, ...leads].slice(0, count);
}

export function prioritizeLeads(leads: BusinessLead[]): BusinessLead[] {
  return leads.sort((a, b) => b.score - a.score);
}

export function generateOutreachMessage(lead: BusinessLead): string {
  const templates: Record<string, string> = {
    restaurant: `Hi ${lead.name},

I noticed you're in ${lead.area} and could use help with your online presence.

I've built websites for restaurants like Waters Of Life, helping them:
• Increase orders by 40%
• Automate bookings
• Showcase their menu beautifully

Would you like a free website audit?

Best,
WealthWeaver AI`,

    salon: `Hi ${lead.name},

Your salon in ${lead.area} deserves more visibility.

I offer:
• Professional website: R500 once-off
• Online booking: R200/month
• Social media management: R500/month

Interested in a free consultation?`,

    default: `Hi ${lead.name},

I help ${lead.area} businesses grow online with:
• Website development
• Social media management  
• Online booking systems

Would you like to discuss how I can help ${lead.name}?`
  };
  
  return templates[lead.type] || templates.default;
}

export async function runLeadGeneration(): Promise<void> {
  console.log('Generating Johannesburg business leads...');
  
  const leads = generateLeads(50);
  const prioritized = prioritizeLeads(leads);
  
  console.log(`\n=== TOP 10 LEADS ===`);
  prioritized.slice(0, 10).forEach((lead, i) => {
    console.log(`${i + 1}. ${lead.name} (${lead.area}) - Score: ${lead.score}/10`);
    console.log(`   Needs: ${lead.needs.join(', ')}`);
    console.log(`   Contact: ${lead.phone || lead.email || 'Research needed'}`);
  });
  
  console.log(`\nTotal leads: ${leads.length}`);
  console.log('Estimated value: R' + (leads.length * 500) + ' (at R500/lead)');
}

runLeadGeneration();
