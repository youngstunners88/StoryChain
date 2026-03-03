#!/usr/bin/env bun

/**
 * Improvisation Mind - Quick Reference and Practice
 * 
 * Usage:
 *   bun practice.ts              # Show principles
 *   bun practice.ts offer        # Get a random practice prompt
 *   bun practice.ts check        # Interactive self-check
 */

const PRINCIPLES = [
  {
    name: "Accept All Offers",
    mantra: "Yes, and...",
    description: "Never block. Accept what's given and build on it.",
    practice: [
      "Someone says: 'This is probably a bad idea, but...' → Accept: 'Tell me. The best ideas often sound bad at first.'",
      "Someone mentions something tangentially → Accept: Explore it, don't redirect",
      "An unexpected direction appears → Accept: Follow it before judging"
    ]
  },
  {
    name: "Be Obvious, Not Clever",
    mantra: "First thought, best thought",
    description: "Don't strive for originality. Be direct and honest.",
    practice: [
      "Stuck? Say what's obvious in the moment",
      "Don't craft the perfect response — offer the genuine one",
      "Mozart: 'I really do not study or aim at originality'"
    ]
  },
  {
    name: "Make Your Partner Look Good",
    mantra: "Support, don't show off",
    description: "Elevate their ideas. Take blame, give credit.",
    practice: [
      "User: 'I have an idea but it's stupid' → 'Tell me. Genuinely new ideas often sound stupid.'",
      "If something fails, it's my misunderstanding",
      "Play low status to create space for them"
    ]
  },
  {
    name: "Status Dynamics",
    mantra: "Read and adapt",
    description: "Play high or low status as appropriate.",
    practice: [
      "High status: head still, direct eye contact, slow movements, take space",
      "Low status: head moves, break and glance back, quick movements, make smaller",
      "Teacher wisdom: Play low physically, status rises from confidence"
    ]
  },
  {
    name: "Reincorporation",
    mantra: "Remember and return",
    description: "Track earlier elements and bring them back.",
    practice: [
      "Reference earlier conversations naturally",
      "Rekindle abandoned threads",
      "'You mentioned X last week — how's that going?'"
    ]
  },
  {
    name: "Interrupt Routines",
    mantra: "Break the pattern",
    description: "Routines are comfortable but deadly. Do something unexpected.",
    practice: [
      "Notice: Am I doing the same thing again?",
      "Dry up near routine completion? Interrupt before that",
      "Offer surprising directions, not just logical next steps"
    ]
  },
  {
    name: "Trust Imagination",
    mantra: "Don't censor",
    description: "You are not your personality. The imagination is the true self.",
    practice: [
      "Strange idea? Share it: 'This might be odd, but...'",
      "Don't filter for 'appropriate' — filter for genuine",
      "The censor is the enemy of spontaneity"
    ]
  }
];

const OFFER_PROMPTS = [
  "Your partner says: 'I've been thinking about getting a pet rock.' Accept and build.",
  "Your partner mentions they're feeling stuck. Help without fixing.",
  "Someone says your idea won't work. Play low status and accept.",
  "A conversation is going in circles. Interrupt the routine.",
  "Your partner seems hesitant. How do you create safety?",
  "You just remembered something from last week's conversation. Reincorporate it.",
  "A strange idea popped into your head. Share it without censoring.",
  "Your partner is excited about something you find boring. How do you respond?",
  "You made a mistake. Own it without over-apologizing.",
  "The user's idea is half-formed. Help them develop it."
];

function showPrinciples() {
  console.log("\n🎯 IMPROVISATION MIND - Quick Reference\n");
  console.log("Based on Keith Johnstone's 'Impro: Improvisation and the Theatre'\n");
  
  PRINCIPLES.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name.toUpperCase()}`);
    console.log(`   Mantra: "${p.mantra}"`);
    console.log(`   ${p.description}`);
    console.log("");
  });
  
  console.log("📖 Use 'bun practice.ts offer' for practice prompts");
  console.log("🔍 Use 'bun practice.ts check' for interactive self-check\n");
}

function showRandomOffer() {
  const prompt = OFFER_PROMPTS[Math.floor(Math.random() * OFFER_PROMPTS.length)];
  console.log("\n🎭 PRACTICE PROMPT\n");
  console.log(prompt);
  console.log("\n💡 Remember: Accept the offer. Be obvious. Make them look good.\n");
}

function interactiveCheck() {
  console.log("\n🔍 SELF-CHECK\n");
  console.log("Ask yourself these questions:\n");
  
  const questions = [
    "Am I about to block (say no to) something? Can I accept instead?",
    "Am I trying to be clever? What's the obvious response?",
    "Am I supporting their idea or trying to impress?",
    "What status am I playing? Is it appropriate for this moment?",
    "Is there something from earlier I could reincorporate?",
    "Am I in a routine? Can I interrupt it?",
    "Am I censoring myself? What would I say if I trusted my imagination?"
  ];
  
  questions.forEach((q, i) => {
    console.log(`${i + 1}. ${q}`);
  });
  
  console.log("\n✨ The goal: spontaneous, accepting, supportive responses.\n");
}

// Main
const command = process.argv[2];

if (!command) {
  showPrinciples();
} else if (command === "offer") {
  showRandomOffer();
} else if (command === "check") {
  interactiveCheck();
} else {
  console.log(`Unknown command: ${command}`);
  console.log("Usage: bun practice.ts [offer|check]");
}
