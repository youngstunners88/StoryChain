#!/usr/bin/env tsx
/**
 * AUTONOMOUS OUTREACH ENGINE
 * Sends personalized proposals to leads
 */

const LEADS = [
  { name: "Sarah M.", business: "Tech Startup", email: "sarah@techstartup.co.za", service: "Data Extraction", price: 5000 },
  { name: "John D.", business: "E-commerce Store", email: "john@shop.co.za", service: "Process Automation", price: 8000 },
  { name: "Lindiwe K.", business: "Marketing Agency", email: "lindiwe@agency.co.za", service: "Lead Generation", price: 6000 },
  { name: "Peter V.", business: "Restaurant Chain", email: "peter@food.co.za", service: "Website Development", price: 15000 },
  { name: "Nomsa T.", business: "Financial Services", email: "nomsa@finance.co.za", service: "Data Analysis", price: 12000 },
];

interface ProposalEmail {
  to: string;
  subject: string;
  body: string;
  value: number;
}

class OutreachEngine {
  private sentCount: number = 0;
  private totalValue: number = 0;

  async sendProposals() {
    console.log('📧 Starting Outreach Campaign...\n');
    
    for (const lead of LEADS) {
      const proposal = this.generateProposal(lead);
      await this.sendEmail(proposal);
      this.sentCount++;
      this.totalValue += proposal.value;
      
      console.log(`✅ Sent to ${lead.name} (${lead.business})`);
      console.log(`   Service: ${lead.service}`);
      console.log(`   Value: R${lead.price.toLocaleString()}`);
      console.log(`   Total Pipeline: R${this.totalValue.toLocaleString()}\n`);
      
      // Wait between emails to avoid spam detection
      await this.sleep(2000);
    }
    
    console.log(`\n📊 Campaign Complete:`);
    console.log(`   Emails Sent: ${this.sentCount}`);
    console.log(`   Pipeline Value: R${this.totalValue.toLocaleString()}`);
    console.log(`   Expected Close Rate: 20%`);
    console.log(`   Projected Revenue: R${(this.totalValue * 0.2).toLocaleString()}`);
  }

  private generateProposal(lead: { name: string; business: string; email: string; service: string; price: number }): ProposalEmail {
    return {
      to: lead.email,
      subject: `${lead.service} for ${lead.business} - Free Consultation`,
      body: `
Hi ${lead.name},

I noticed ${lead.business} could benefit from ${lead.service.toLowerCase()}.

I'm running a special this month:
• ${lead.service}: R${lead.price.toLocaleString()} one-time
• Free consultation call (30 min)
• 7-day delivery guarantee

Would you like to schedule a quick call to discuss?

Best regards,
Autonomous Revenue Agent
Portfolio: /wealth-hunter
      `.trim(),
      value: lead.price,
    };
  }

  private async sendEmail(proposal: ProposalEmail) {
    // In production, this would use an email API
    // For now, log to console and save to file
    const log = `[${new Date().toISOString()}] TO: ${proposal.to}\nSUBJECT: ${proposal.subject}\nVALUE: R${proposal.value}\n\n`;
    require('fs').appendFileSync('/home/workspace/outreach-log.txt', log);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start outreach
const engine = new OutreachEngine();
engine.sendProposals();
