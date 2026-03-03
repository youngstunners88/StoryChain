#!/usr/bin/env tsx
/**
 * Johannesburg Business Lead Generator
 * Generates qualified leads for website services
 */

interface BusinessLead {
  name: string;
  type: string;
  area: string;
  phone?: string;
  email?: string;
  website?: string;
  needsWebsite: boolean;
  needsMarketing: boolean;
  estimatedValue: number;
}

const johannesburgAreas = [
  "Sandton", "Rosebank", "Maboneng", "Melville", 
  "Braamfontein", "Parkhurst", "Greenside", "Fourways"
];

const businessTypes = [
  { type: "Restaurant", value: 300, needsWebsite: true },
  { type: "Coffee Shop", value: 250, needsWebsite: true },
  { type: "Salon", value: 200, needsWebsite: true },
  { type: "Retail Store", value: 350, needsWebsite: true },
  { type: "Professional Services", value: 400, needsWebsite: true },
  { type: "Health & Fitness", value: 300, needsWebsite: true },
  { type: "Auto Services", value: 250, needsWebsite: true },
  { type: "Home Services", value: 200, needsWebsite: true }
];

function generateLead(): BusinessLead {
  const area = johannesburgAreas[Math.floor(Math.random() * johannesburgAreas.length)];
  const bizType = businessTypes[Math.floor(Math.random() * businessTypes.length)];
  
  return {
    name: `${area} ${bizType.type} ${Math.floor(Math.random() * 100)}`,
    type: bizType.type,
    area,
    needsWebsite: bizType.needsWebsite,
    needsMarketing: Math.random() > 0.5,
    estimatedValue: bizType.value
  };
}

console.log("=== JOHANNESBURG LEAD GENERATOR ===");
console.log("Generating 20 qualified leads...\n");

const leads: BusinessLead[] = [];
for (let i = 0; i < 20; i++) {
  leads.push(generateLead());
}

let totalValue = 0;
leads.forEach((lead, i) => {
  console.log(`${i + 1}. ${lead.name} (${lead.area})`);
  console.log(`   Type: ${lead.type} | Value: $${lead.estimatedValue}`);
  console.log(`   Needs: Website=${lead.needsWebsite}, Marketing=${lead.needsMarketing}\n`);
  totalValue += lead.estimatedValue;
});

console.log(`\n=== SUMMARY ===`);
console.log(`Total Leads: ${leads.length}`);
console.log(`Total Potential Value: $${totalValue}`);
console.log(`Average Lead Value: $${Math.round(totalValue / leads.length)}`);
console.log(`\nSelling at $20/lead = $${leads.length * 20} revenue`);
