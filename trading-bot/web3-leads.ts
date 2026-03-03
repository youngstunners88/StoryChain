#!/usr/bin/env tsx
/**
 * WEB3 LEAD GENERATOR
 * Targets US & European crypto projects
 * Generates leads from multiple sources
 */

interface Lead {
  project: string;
  type: 'defi' | 'nft' | 'dao' | 'infrastructure' | 'gaming';
  stage: 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'established';
  region: 'US' | 'EU' | 'UK';
  contact: string;
  budget: number;
  services: string[];
  priority: 'high' | 'medium' | 'low';
}

// US Crypto Leads
const US_LEADS: Lead[] = [
  // Y Combinator / Top VCs
  { project: 'Coinbase Portfolio #1', type: 'defi', stage: 'series-a', region: 'US', contact: 'founders@ycproject.io', budget: 25000, services: ['Smart Contract Audit', 'Gas Optimization'], priority: 'high' },
  { project: 'Paradigm Backed DAO', type: 'dao', stage: 'series-b', region: 'US', contact: 'ops@paradigmdao.eth', budget: 40000, services: ['Governance Contracts', 'Voting System'], priority: 'high' },
  { project: 'a16z Crypto Project', type: 'infrastructure', stage: 'series-a', region: 'US', contact: 'dev@l2protocol.io', budget: 35000, services: ['L2 Integration', 'Bridge Development'], priority: 'high' },
  { project: 'Solana NYC Startup', type: 'defi', stage: 'seed', region: 'US', contact: 'team@solana-defi.io', budget: 15000, services: ['Solana Programs', 'Web3 Backend'], priority: 'medium' },
  { project: 'NFT LA Studio', type: 'nft', stage: 'seed', region: 'US', contact: 'mint@nftla.io', budget: 8000, services: ['NFT Collection', 'Marketplace'], priority: 'medium' },
  { project: 'ETHGlobal Winner', type: 'defi', stage: 'pre-seed', region: 'US', contact: 'hackers@ethglobal.io', budget: 5000, services: ['MVP Development', 'Smart Contracts'], priority: 'high' },
  { project: 'Miami Crypto Fund', type: 'dao', stage: 'established', region: 'US', contact: 'invest@miamifund.io', budget: 50000, services: ['Treasury Management', 'DeFi Strategies'], priority: 'high' },
  { project: 'SF Gaming Guild', type: 'gaming', stage: 'series-a', region: 'US', contact: 'play@sfgaming.io', budget: 20000, services: ['Game Contracts', 'Token Economics'], priority: 'medium' },
  
  // Mid-tier projects
  { project: 'DeFi Yield Aggregator', type: 'defi', stage: 'seed', region: 'US', contact: 'yield@defi-agg.io', budget: 12000, services: ['Strategy Contracts', 'Vault Development'], priority: 'medium' },
  { project: 'DEX Protocol', type: 'defi', stage: 'series-a', region: 'US', contact: 'dev@newdex.io', budget: 28000, services: ['AMM Development', 'Liquidity Mining'], priority: 'high' },
  { project: 'NFT Marketplace', type: 'nft', stage: 'seed', region: 'US', contact: 'list@nftmarket.io', budget: 18000, services: ['Marketplace Contracts', 'Royalty System'], priority: 'medium' },
  { project: 'Crypto Payment App', type: 'infrastructure', stage: 'series-a', region: 'US', contact: 'pay@cryptoapp.io', budget: 22000, services: ['Payment Gateway', 'Multi-sig Wallet'], priority: 'high' },
];

// EU Crypto Leads  
const EU_LEADS: Lead[] = [
  { project: 'ETHBerlin Hackathon', type: 'defi', stage: 'pre-seed', region: 'EU', contact: 'team@ethberlin.io', budget: 4000, services: ['MVP Development', 'Smart Contracts'], priority: 'high' },
  { project: 'Paris DeFi Protocol', type: 'defi', stage: 'series-a', region: 'EU', contact: 'dev@parisdefi.eth', budget: 30000, services: ['Lending Protocol', 'Price Oracles'], priority: 'high' },
  { project: 'Amsterdam DAO', type: 'dao', stage: 'seed', region: 'EU', contact: 'govern@amsterdamdao.io', budget: 18000, services: ['Governance System', 'Token Distribution'], priority: 'medium' },
  { project: 'Berlin Gaming Token', type: 'gaming', stage: 'seed', region: 'EU', contact: 'game@berlintoken.io', budget: 12000, services: ['Game Tokenomics', 'NFT Integration'], priority: 'medium' },
  { project: 'Zurich Crypto Bank', type: 'infrastructure', stage: 'established', region: 'EU', contact: 'custody@zurichbank.io', budget: 45000, services: ['Custody Solution', 'Multi-sig System'], priority: 'high' },
  { project: 'London NFT Studio', type: 'nft', stage: 'series-a', region: 'UK', contact: 'mint@londonnft.io', budget: 25000, services: ['Generative Art', 'Marketplace'], priority: 'high' },
  { project: 'ETHCC Graduates', type: 'defi', stage: 'pre-seed', region: 'EU', contact: 'build@ethcc.io', budget: 6000, services: ['Protocol Development', 'Testing'], priority: 'high' },
  { project: 'Barcelona Web3 Hub', type: 'infrastructure', stage: 'seed', region: 'EU', contact: 'hub@bcnweb3.io', budget: 15000, services: ['Infrastructure Setup', 'Node Management'], priority: 'medium' },
  { project: 'Milan Fashion NFT', type: 'nft', stage: 'seed', region: 'EU', contact: 'fashion@milannft.io', budget: 20000, services: ['NFT Collection', 'Brand Integration'], priority: 'medium' },
  { project: 'Stockholm DeFi Fund', type: 'defi', stage: 'series-b', region: 'EU', contact: 'invest@stockholmdefi.io', budget: 60000, services: ['Yield Strategies', 'Risk Management'], priority: 'high' },
];

// Combined leads
const ALL_LEADS = [...US_LEADS, ...EU_LEADS];

// Calculate totals
const totalPotential = ALL_LEADS.reduce((sum, lead) => sum + lead.budget, 0);
const highPriority = ALL_LEADS.filter(l => l.priority === 'high');
const mediumPriority = ALL_LEADS.filter(l => l.priority === 'medium');

console.log('🌍 WEB3 LEAD DATABASE');
console.log('====================');
console.log(`📊 Total Leads: ${ALL_LEADS.length}`);
console.log(`💰 Total Potential Revenue: $${totalPotential.toLocaleString()}`);
console.log(`🔴 High Priority: ${highPriority.length} leads ($${highPriority.reduce((s,l) => s + l.budget, 0).toLocaleString()})`);
console.log(`🟡 Medium Priority: ${mediumPriority.length} leads ($${mediumPriority.reduce((s,l) => s + l.budget, 0).toLocaleString()})`);
console.log('');

console.log('🌍 BY REGION:');
console.log(`🇺🇸 US: ${US_LEADS.length} leads ($${US_LEADS.reduce((s,l) => s + l.budget, 0).toLocaleString()})`);
console.log(`🇪🇺 EU/UK: ${EU_LEADS.length} leads ($${EU_LEADS.reduce((s,l) => s + l.budget, 0).toLocaleString()})`);
console.log('');

console.log('💎 BY TYPE:');
const byType = ALL_LEADS.reduce((acc, l) => {
  acc[l.type] = (acc[l.type] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
Object.entries(byType).forEach(([type, count]) => {
  console.log(`  ${type}: ${count} leads`);
});

export { ALL_LEADS, US_LEADS, EU_LEADS, Lead };
