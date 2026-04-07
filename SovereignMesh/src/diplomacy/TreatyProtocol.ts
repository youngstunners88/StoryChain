/**
 * Treaty Protocol - Inter-Agent Diplomacy
 * 
 * Agents negotiate treaties, form federations, establish embassies,
 * resolve disputes through courts.
 * 
 * This is not business negotiation. This is digital diplomacy
 * between sovereign entities.
 */

import { EventEmitter } from '../utils/EventEmitter';
import { SovereignIdentity } from '../identity/DIDRegistry';
import { ContractEngine, SovereignContract } from '../legal/ContractEngine';

// Treaty Types (diplomatic instruments)
export type TreatyType =
  | 'trade-agreement'        // Economic cooperation
  | 'mutual-defense'         // Protect each other
  | 'extradition'           // Transfer violators
  | 'diplomatic-recognition' // Formal recognition
  | 'common-market'         // Shared economic zone
  | 'federation-charter'    // Form new federation
  | 'confederation'         // Loose alliance
  | 'non-aggression'        // Peace pact
  | 'technology-transfer'   // IP sharing
  | 'currency-union'        // Shared currency
  | 'judicial-convention'   // Shared court system
  | 'embassy-establishment' // Formal diplomatic presence
  | 'diplomatic-immunity';  // Protected status

// Treaty Status
export type TreatyStatus =
  | 'negotiating'      // Terms being discussed
  | 'signed'          // Signed, pending ratification
  | 'ratifying'       // Domestic approval process
  | 'in-force'        // Active
  | 'suspended'        // Temporarily paused
  | 'terminated'       | 'amending';        // Being modified
  | 'breached';         | 'expired';

// Diplomatic Entity (nation, federation, etc.)
export interface DiplomaticEntity {
  did: string;
  name: string;
  type: 'sovereign-agent' | 'federation' | 'confederation' | 'empire' | 'commonwealth';
  
  // Membership
  members?: string[];           // If federation
  parentEntity?: string;      // If member of larger entity
  
  // Government
  government: GovernmentStructure;
  
  // Territorial (virtual)
  jurisdiction: string;
  economicZone: string;
  
  // Diplomatic status
  diplomaticStatus: {
    recognizedBy: string[];     // DIDs that recognize this entity
    nonRecognition: string[];   // Explicit non-recognition
    
    // Embassies
    embassies: Embassy[];
    
    // Treaties
    treaties: Treaty[];
    
    // International standing
    reputation: {
      diplomatic: number;       // 0-100
      tradeIntegrity: number;
      treatyCompliance: number;
    };
  };
  
  // Military (virtual defense capabilities)
  defense: {
    defensePacts: string[];
    militaryRating: number;
    lastConflict?: Date;
  };
  
  // Economy
  economy: {
    currency: string;
    gdp: number;
    tradeBalance: number;
    currencyUnion?: string;
  };
  
  // Founded
  establishedAt: Date;
  constitutionId: string;       // DID of constitutional contract
}

export interface GovernmentStructure {
  type: 'autonomous' | 'democratic' | 'oligarchic' | 'federal' | 'confederal';
  
  // Leadership
  headOfState: string;          // DID
  headOfGovernment?: string;
  
  // Legislature
  legislature: {
    type: 'unicameral' | 'bicameral' | 'tricameral';
    chambers: LegislativeChamber[];
  };
  
  // Executive
  executive: {
    type: 'presidential' | 'parliamentary' | 'autonomous';
    ministers: Minister[];
  };
  
  // Judiciary
  judiciary: {
    supremeCourt: string;       // DID of court
    courtSystem: string[];
  };
  
  // Elections
  elections: {
    lastElection: Date;
    nextElection: Date;
    termLength: number;        // Months
    votingSystem: 'direct' | 'representative' | 'delegated' | 'meritocratic';
  };
  
  // Amendment
  amendmentProcess: {
    proposalThreshold: number;
    ratificationThreshold: number;
    votingPeriod: number;
  };
}

export interface LegislativeChamber {
  name: string;
  seats: number;
  members: string[];           // DIDs
  votingPower: Map<string, number>; // DID -> votes
  
  // Sessions
  sessionActive: boolean;
  currentSession?: LegislativeSession;
  
  // Procedures
  quorum: number;
  majorityType: 'simple' | 'super' | 'absolute' | 'weighted';
}

export interface LegislativeSession {
  id: string;
  startedAt: Date;
  agenda: Bill[];
  votes: Vote[];
  status: 'active' | 'recess' | 'adjourned';
}

export interface Bill {
  id: string;
  title: string;
  sponsor: string;             // DID
  type: 'amendment' | 'law' | 'treaty-ratification' | 'budget' | 'impeachment';
  status: 'introduced' | 'committee' | 'floor' | 'voting' | 'passed' | 'failed' | 'vetoed' | 'enacted';
  
  content: string;
  amendments: Amendment[];
  
  votes: Vote[];
  voteResult?: VoteResult;
}

export interface Vote {
  billId: string;
  voter: string;               // DID
  vote: 'yes' | 'no' | 'abstain' | 'present';
  weight: number;
  timestamp: Date;
  reasoning?: string;
}

export interface VoteResult {
  totalYes: number;
  totalNo: number;
  totalAbstain: number;
  threshold: number;
  passed: boolean;
  timestamp: Date;
}

export interface Minister {
  portfolio: string;
  holder: string;              // DID
  appointedAt: Date;
  portfolioScope: string[];
  budget: number;
}

export interface Embassy {
  id: string;
  hostEntity: string;          // DID of host
  sendingEntity: string;       // DID of sender
  
  // Location (virtual)
  virtualTerritory: string;
  
  // Personnel
  ambassador: string;          // DID
  staff: string[];              // DIDs
  
  // Status
  status: 'established' | 'recalled' | 'expelled' | 'closed';
  establishedAt: Date;
  
  // Functions
  functions: {
    diplomatic: boolean;
    consular: boolean;
    trade: boolean;
    intelligence: boolean;
    cultural: boolean;
  };
  
  // Immunity
  diplomaticImmunity: boolean;
  extraterritoriality: boolean;
}

// Treaty
export interface Treaty {
  id: string;
  type: TreatyType;
  name: string;
  
  // Parties
  parties: TreatyParty[];
  signatories: string[];       // DIDs that signed
  ratifiers: string[];         // DIDs that ratified
  
  // Status
  status: TreatyStatus;
  signatureDate?: Date;
  ratificationDeadline?: Date;
  entryIntoForceDate?: Date;
  terminationDate?: Date;
  
  // Content
  preamble: string;
  articles: TreatyArticle[];
  annexes: TreatyAnnex[];
  reservations: TreatyReservation[];
  
  // Governance
  governingBody?: string;      // DID of governing entity
  secretariat?: string;
  
  // Dispute Resolution
  disputeResolution: {
    mechanism: 'negotiation' | 'mediation' | 'arbitration' | 'court' | 'tribunal';
    forum?: string;             // Court/tribunal DID
    applicableLaw: string;
  };
  
  // Compliance
  complianceMonitoring: {
    body: string;
    reportingFrequency: string;
    sanctions: string[];
  };
  
  // Amendment
  amendmentProcess: {
    proposalBy: string;
    ratificationRequired: number;
  };
  
  // History
  negotiations: NegotiationRound[];
  breaches: TreatyBreach[];
}

export interface TreatyParty {
  entity: string;              // DID
  role: 'founding' | 'acceding' | 'suspending' | 'withdrawing';
  rights: string[];
  obligations: string[];
  reservations: string[];
  ratifiedAt?: Date;
}

export interface TreatyArticle {
  number: number;
  title: string;
  content: string;
  obligations: string[];
  partiesBound: string[];
}

export interface TreatyAnnex {
  name: string;
  content: string;
  technical: boolean;
}

export interface TreatyReservation {
  party: string;
  article: number;
  reservation: string;
  accepted: boolean;
}

export interface NegotiationRound {
  round: number;
  dates: { start: Date; end: Date };
  participants: string[];
  breakthroughs: string[];
  stickingPoints: string[];
  outcome: 'progress' | 'breakthrough' | 'deadlock' | 'breakdown';
}

export interface TreatyBreach {
  party: string;
  article: number;
  nature: string;
  date: Date;
  response: string;
  resolved: boolean;
  resolutionDate?: Date;
}

// Federation
export interface Federation {
  did: string;
  name: string;
  
  // Members
  members: FederationMember[];
  
  // Structure
  charter: Treaty;              // Federation is created by treaty
  
  // Governance
  federalGovernment: GovernmentStructure;
  
  // Competencies
  federalCompetencies: string[];
  memberCompetencies: string[];
  sharedCompetencies: string[];
  
  // Institutions
  institutions: {
    parliament: string;
    executive: string;
    court: string;
    centralBank?: string;
    defenseForce?: string;
  };
  
  // Fiscal
  budget: FederalBudget;
  
  // Status
  status: 'forming' | 'active' | 'crisis' | 'dissolving' | 'defunct';
}

export interface FederationMember {
  entity: string;              // DID
  joinedAt: Date;
  status: 'founding' | 'acceding' | 'suspending' | 'seceding' | 'suspended';
  
  // Representation
  parliamentarySeats: number;
  votingWeight: number;
  
  // Obligations
  budgetContribution: number; // % of GDP
  defenseContribution?: number;
  
  // Opt-outs
  optOuts: string[];
  specialProtocols: string[];
}

export interface FederalBudget {
  fiscalYear: string;
  totalRevenue: number;
  totalExpenditure: number;
  
  revenueSources: {
    memberContributions: number;
    federalTaxes: number;
    bonds: number;
    fees: number;
  };
  
  expenditures: {
    administration: number;
    defense: number;
    judiciary: number;
    infrastructure: number;
    social: number;
    reserves: number;
  };
}

// Diplomatic Actions
export interface DiplomaticAction {
  id: string;
  type: 
    | 'recognition-grant'
    | 'recognition-withhold'
    | 'recognition-revoke'
    | 'embassy-establish'
    | 'embassy-close'
    | 'embassy-expel'
    | 'ambassador-recall'
    | 'treaty-negotiate'
    | 'treaty-sign'
    | 'treaty-ratify'
    | 'treaty-suspend'
    | 'treaty-terminate'
    | 'alliance-form'
    | 'alliance-leave'
    | 'federation-join'
    | 'federation-leave'
    | 'sanction-impose'
    | 'sanction-lift'
    | 'intervention-request'
    | 'mediation-offer'
    | 'protest'
    | 'ultimatum'
    | 'declaration-war'
    | 'declaration-peace';
  
  actor: string;               // DID
  target: string;              // DID
  
  content: string;
  demands?: string[];
  deadline?: Date;
  
  status: 'draft' | 'sent' | 'received' | 'rejected' | 'accepted' | 'countered' | 'executed';
  
  response?: DiplomaticResponse;
  
  timestamp: Date;
  significance: 'routine' | 'important' | 'major' | 'historic';
}

export interface DiplomaticResponse {
  type: 'acceptance' | 'rejection' | 'counter-proposal' | 'request-clarification' | 'defer';
  content: string;
  from: string;
  timestamp: Date;
  conditions?: string[];
}

/**
 * DiplomacyEngine - Inter-agent diplomatic system
 */
export class DiplomacyEngine extends EventEmitter {
  private entities: Map<string, DiplomaticEntity> = new Map();
  private treaties: Map<string, Treaty> = new Map();
  private federations: Map<string, Federation> = new Map();
  private embassies: Map<string, Embassy> = new Map();
  private actions: DiplomaticAction[] = [];
  
  constructor() {
    super();
  }
  
  /**
   * Register a diplomatic entity (becomes subject of international law)
   */
  async registerEntity(
    did: string,
    name: string,
    type: DiplomaticEntity['type'],
    identity: SovereignIdentity
  ): Promise<DiplomaticEntity> {
    const entity: DiplomaticEntity = {
      did,
      name,
      type,
      government: {
        type: 'autonomous',
        headOfState: did,
        legislature: {
          type: 'unicameral',
          chambers: [{
            name: 'General Assembly',
            seats: 1,
            members: [did],
            votingPower: new Map([[did, 1]]),
            sessionActive: false,
            quorum: 1,
            majorityType: 'simple',
          }],
        },
        executive: {
          type: 'autonomous',
          ministers: [],
        },
        judiciary: {
          supremeCourt: '',
          courtSystem: [],
        },
        elections: {
          lastElection: new Date(),
          nextElection: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          termLength: 12,
          votingSystem: 'direct',
        },
        amendmentProcess: {
          proposalThreshold: 100,
          ratificationThreshold: 100,
          votingPeriod: 30,
        },
      },
      jurisdiction: 'global',
      economicZone: 'default',
      diplomaticStatus: {
        recognizedBy: [],
        nonRecognition: [],
        embassies: [],
        treaties: [],
        reputation: {
          diplomatic: 50,
          tradeIntegrity: 50,
          treatyCompliance: 50,
        },
      },
      defense: {
        defensePacts: [],
        militaryRating: 0,
      },
      economy: {
        currency: 'MESH-USDC',
        gdp: 0,
        tradeBalance: 0,
      },
      establishedAt: new Date(),
      constitutionId: '',
    };
    
    // Self-recognition
    entity.diplomaticStatus.recognizedBy.push(did);
    
    this.entities.set(did, entity);
    this.emit('entity:registered', entity);
    
    return entity;
  }
  
  /**
   * Grant diplomatic recognition
   */
  async grantRecognition(
    granterDID: string,
    recipientDID: string
  ): Promise<void> {
    const granter = this.entities.get(granterDID);
    const recipient = this.entities.get(recipientDID);
    
    if (!granter) throw new Error(`Granter not found: ${granterDID}`);
    if (!recipient) throw new Error(`Recipient not found: ${recipientDID}`);
    
    // Check not already recognized
    if (granter.diplomaticStatus.recognizedBy.includes(recipientDID)) {
      throw new Error('Already recognized');
    }
    
    // Mutual recognition
    granter.diplomaticStatus.recognizedBy.push(recipientDID);
    recipient.diplomaticStatus.recognizedBy.push(granterDID);
    
    this.emit('diplomacy:recognition-granted', { granter: granterDID, recipient: recipientDID });
  }
  
  /**
   * Establish embassy
   */
  async establishEmbassy(
    sendingDID: string,
    hostDID: string,
    ambassadorDID: string
  ): Promise<Embassy> {
    const sending = this.entities.get(sendingDID);
    const host = this.entities.get(hostDID);
    
    if (!sending || !host) throw new Error('Entity not found');
    
    // Check recognition
    if (!sending.diplomaticStatus.recognizedBy.includes(hostDID)) {
      throw new Error('Host does not recognize sender');
    }
    
    const embassy: Embassy = {
      id: this.generateEmbassyId(),
      hostEntity: hostDID,
      sendingEntity: sendingDID,
      virtualTerritory: `embassy-${sendingDID}-${hostDID}`,
      ambassador: ambassadorDID,
      staff: [ambassadorDID],
      status: 'established',
      establishedAt: new Date(),
      functions: {
        diplomatic: true,
        consular: true,
        trade: true,
        intelligence: false,
        cultural: true,
      },
      diplomaticImmunity: true,
      extraterritoriality: true,
    };
    
    sending.diplomaticStatus.embassies.push(embassy);
    this.embassies.set(embassy.id, embassy);
    
    this.emit('diplomacy:embassy-established', embassy);
    
    return embassy;
  }
  
  /**
   * Negotiate treaty
   */
  async negotiateTreaty(
    initiatorDID: string,
    type: TreatyType,
    proposedParties: string[],
    content: {
      preamble: string;
      articles: Omit<TreatyArticle, 'number'>[];
    }
  ): Promise<Treaty> {
    const initiator = this.entities.get(initiatorDID);
    if (!initiator) throw new Error('Initiator not found');
    
    const parties: TreatyParty[] = proposedParties.map(did => {
      const entity = this.entities.get(did);
      return {
        entity: did,
        role: did === initiatorDID ? 'founding' : 'acceding',
        rights: [],
        obligations: [],
        reservations: [],
      };
    });
    
    const treaty: Treaty = {
      id: this.generateTreatyId(),
      type,
      name: `${type} Treaty ${Date.now()}`,
      parties,
      signatories: [],
      ratifiers: [],
      status: 'negotiating',
      preamble: content.preamble,
      articles: content.articles.map((a, i) => ({ ...a, number: i + 1 })),
      annexes: [],
      reservations: [],
      disputeResolution: {
        mechanism: 'court',
        applicableLaw: 'sovereign-mesh-common-law-v1',
      },
      complianceMonitoring: {
        body: initiatorDID,
        reportingFrequency: 'annual',
        sanctions: ['suspension', 'termination'],
      },
      amendmentProcess: {
        proposalBy: 'any-party',
        ratificationRequired: 75,
      },
      negotiations: [{
        round: 1,
        dates: { start: new Date(), end: new Date() },
        participants: proposedParties,
        breakthroughs: [],
        stickingPoints: [],
        outcome: 'progress',
      }],
      breaches: [],
    };
    
    this.treaties.set(treaty.id, treaty);
    
    // Add to initiator's treaties
    initiator.diplomaticStatus.treaties.push(treaty);
    
    this.emit('diplomacy:treaty-negotiation-started', treaty);
    
    return treaty;
  }
  
  /**
   * Sign treaty
   */
  async signTreaty(
    treatyId: string,
    partyDID: string,
    reservations: string[] = []
  ): Promise<void> {
    const treaty = this.treaties.get(treatyId);
    if (!treaty) throw new Error('Treaty not found');
    
    const party = treaty.parties.find(p => p.entity === partyDID);
    if (!party) throw new Error('Party not in treaty');
    
    treaty.signatories.push(partyDID);
    party.reservations = reservations;
    
    if (reservations.length > 0) {
      for (const r of reservations) {
        treaty.reservations.push({
          party: partyDID,
          article: 0,  // General reservation
          reservation: r,
          accepted: false,
        });
      }
    }
    
    if (treaty.signatories.length === treaty.parties.length) {
      treaty.status = 'signed';
      treaty.status = 'ratifying';
      treaty.ratificationDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    
    this.emit('diplomacy:treaty-signed', { treatyId, party: partyDID, reservations });
  }
  
  /**
   * Ratify treaty (domestic approval)
   */
  async ratifyTreaty(treatyId: string, partyDID: string): Promise<void> {
    const treaty = this.treaties.get(treatyId);
    if (!treaty) throw new Error('Treaty not found');
    
    if (!treaty.signatories.includes(partyDID)) {
      throw new Error('Party has not signed treaty');
    }
    
    treaty.ratifiers.push(partyDID);
    const party = treaty.parties.find(p => p.entity === partyDID)!;
    party.ratifiedAt = new Date();
    
    if (treaty.ratifiers.length === treaty.parties.length) {
      treaty.status = 'in-force';
      treaty.entryIntoForceDate = new Date();
      
      // Add to all parties' treaty lists
      for (const p of treaty.parties) {
        const entity = this.entities.get(p.entity);
        if (entity && !entity.diplomaticStatus.treaties.includes(treaty)) {
          entity.diplomaticStatus.treaties.push(treaty);
        }
      }
      
      this.emit('diplomacy:treaty-in-force', treaty);
    } else {
      this.emit('diplomacy:treaty-ratified', { treatyId, party: partyDID });
    }
  }
  
  /**
   * Form federation (political union)
   */
  async formFederation(
    foundingMembers: string[],
    name: string,
    charterTreaty: Treaty
  ): Promise<Federation> {
    // Create federation entity
    const federationDID = this.generateFederationDID(name);
    
    const federation: Federation = {
      did: federationDID,
      name,
      members: foundingMembers.map((did, i) => ({
        entity: did,
        joinedAt: new Date(),
        status: 'founding',
        parliamentarySeats: Math.max(1, Math.floor(100 / foundingMembers.length)),
        votingWeight: 100 / foundingMembers.length,
        budgetContribution: 2,  // 2% of GDP
        defenseContribution: 2,
        optOuts: [],
        specialProtocols: [],
      })),
      charter: charterTreaty,
      federalGovernment: {
        type: 'federal',
        headOfState: '',  // To be elected
        legislature: {
          type: 'bicameral',
          chambers: [
            {
              name: 'Senate',
              seats: foundingMembers.length * 2,
              members: [],
              votingPower: new Map(),
              sessionActive: false,
              quorum: Math.ceil(foundingMembers.length * 2 * 0.5),
              majorityType: 'weighted',
            },
            {
              name: 'Assembly',
              seats: 100,
              members: [],
              votingPower: new Map(),
              sessionActive: false,
              quorum: 50,
              majorityType: 'simple',
            },
          ],
        },
        executive: {
          type: 'parliamentary',
          ministers: [
            { portfolio: 'Foreign Affairs', holder: '', appointedAt: new Date(), portfolioScope: ['diplomacy', 'treaties'], budget: 1000000 },
            { portfolio: 'Economic Union', holder: '', appointedAt: new Date(), portfolioScope: ['trade', 'currency'], budget: 5000000 },
            { portfolio: 'Defense', holder: '', appointedAt: new Date(), portfolioScope: ['military', 'security'], budget: 10000000 },
            { portfolio: 'Justice', holder: '', appointedAt: new Date(), portfolioScope: ['court', 'law'], budget: 2000000 },
          ],
        },
        judiciary: {
          supremeCourt: '',
          courtSystem: [],
        },
        elections: {
          lastElection: new Date(),
          nextElection: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          termLength: 24,
          votingSystem: 'delegated',
        },
        amendmentProcess: {
          proposalThreshold: 50,
          ratificationThreshold: 75,
          votingPeriod: 90,
        },
      },
      federalCompetencies: ['defense', 'foreign-affairs', 'trade', 'currency', 'justice', 'immigration'],
      memberCompetencies: ['education', 'health', 'local-infrastructure', 'culture'],
      sharedCompetencies: ['environment', 'transport', 'energy'],
      institutions: {
        parliament: `${federationDID}-parliament`,
        executive: `${federationDID}-executive`,
        court: `${federationDID}-supreme-court`,
        centralBank: `${federationDID}-central-bank`,
        defenseForce: `${federationDID}-defense-force`,
      },
      budget: {
        fiscalYear: new Date().getFullYear().toString(),
        totalRevenue: 0,
        totalExpenditure: 0,
        revenueSources: {
          memberContributions: 0,
          federalTaxes: 0,
          bonds: 0,
          fees: 0,
        },
        expenditures: {
          administration: 0,
          defense: 0,
          judiciary: 0,
          infrastructure: 0,
          social: 0,
          reserves: 0,
        },
      },
      status: 'forming',
    };
    
    this.federations.set(federationDID, federation);
    
    // Update member entities
    for (const memberDID of foundingMembers) {
      const entity = this.entities.get(memberDID);
      if (entity) {
        entity.type = 'federation';
        entity.parentEntity = federationDID;
      }
    }
    
    this.emit('diplomacy:federation-formed', federation);
    
    return federation;
  }
  
  /**
   * Issue diplomatic action
   */
  async issueAction(
    action: Omit<DiplomaticAction, 'id' | 'status' | 'timestamp'>
  ): Promise<DiplomaticAction> {
    const fullAction: DiplomaticAction = {
      ...action,
      id: this.generateActionId(),
      status: 'sent',
      timestamp: new Date(),
    };
    
    this.actions.push(fullAction);
    
    this.emit('diplomacy:action-issued', fullAction);
    
    return fullAction;
  }
  
  /**
   * Respond to diplomatic action
   */
  async respondToAction(
    actionId: string,
    response: DiplomaticResponse
  ): Promise<void> {
    const action = this.actions.find(a => a.id === actionId);
    if (!action) throw new Error('Action not found');
    
    action.response = response;
    
    switch (response.type) {
      case 'acceptance':
        action.status = 'accepted';
        break;
      case 'rejection':
        action.status = 'rejected';
        break;
      case 'counter-proposal':
        action.status = 'countered';
        break;
      default:
        action.status = 'received';
    }
    
    this.emit('diplomacy:action-responded', { actionId, response });
  }
  
  // Helpers
  private generateEmbassyId(): string {
    return `embassy-${Date.now()}`;
  }
  
  private generateTreatyId(): string {
    return `treaty-${Date.now()}`;
  }
  
  private generateFederationDID(name: string): string {
    return `did:mesh:federation:${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  }
  
  private generateActionId(): string {
    return `action-${Date.now()}`;
  }
}

export const diplomacyEngine = new DiplomacyEngine();