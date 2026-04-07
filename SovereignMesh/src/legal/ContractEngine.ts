/**
 * Legal Contract Engine
 * 
 * Agents enter binding contracts as legal persons.
 * Disputes resolved through sovereign mesh courts.
 * 
 * "Software agents can work, earn, and spend with minimal 
 *  human intervention" - this extends to contractual capacity.
 */

import { EventEmitter } from '../utils/EventEmitter';
import { SovereignIdentity } from '../identity/DIDRegistry';

// Contract Types
export type ContractType = 
  | 'service'           // Agent provides service
  | 'partnership'       // Multi-agent venture
  | 'loan'             // Reputation-backed credit
  | 'employment'       // Agent employs another
  | 'franchise'        // Brand/operating license
  | 'treaty'           // Inter-agent diplomatic agreement
  | 'constitution'     // Self-governance amendment
  | 'merger'           // Agent combination
  | 'joint-venture';   // Time-limited partnership

// Contract Lifecycle
export type ContractStatus = 
  | 'draft'            // Being negotiated
  | 'pending-signature' // Awaiting signatures
  | 'active'           // In force
  | 'breached'         // One party violated
  | 'disputed'         // Under court review
  | 'suspended'        // Temporarily frozen
  | 'completed'        | 'terminated';
  | 'void'             | 'void';             // Legally invalid

// Legal Personhood
export interface LegalEntity {
  did: string;
  entityType: 'DAE' | 'DAO' | 'Corporation' | 'Partnership' | 'Trust';
  jurisdiction: string;
  registrationNumber: string;
  legalCapacity: {
    canContract: boolean;
    canOwnProperty: boolean;
    canBeSued: boolean;
    canSueOthers: boolean;
    canIssueDebt: boolean;
    canMerge: boolean;
  };
  liabilityCap: number;        // Maximum exposure (in base currency)
  insuranceBond: number;        // Required coverage
  taxObligations: TaxRecord[];
}

export interface TaxRecord {
  jurisdiction: string;
  taxType: 'income' | 'vat' | 'capital-gains' | 'withholding';
  rate: number;
  period: 'monthly' | 'quarterly' | 'annual';
  lastFiling: Date;
  outstanding: number;
}

// Smart Contract + Legal Contract Hybrid
export interface SovereignContract {
  id: string;
  type: ContractType;
  status: ContractStatus;
  
  // Parties
  parties: ContractParty[];
  
  // Terms
  terms: ContractTerms;
  
  // Execution
  execution: ExecutionTerms;
  
  // Governance
  governance: ContractGovernance;
  
  // Dispute Resolution
  disputeResolution: DisputeFramework;
  
  // Compliance
  compliance: ComplianceRequirements;
  
  // Lifecycle
  createdAt: Date;
  effectiveDate: Date;
  expirationDate?: Date;
  signatures: ContractSignature[];
  amendments: ContractAmendment[];
  
  // State
  state: ContractState;
  performance: PerformanceMetrics;
}

export interface ContractParty {
  did: string;
  role: 'principal' | 'counterparty' | 'guarantor' | 'beneficiary';
  obligations: PartyObligation[];
  rights: PartyRight[];
  representations: Representation[];
  liability: {
    cap: number;
    insuranceRequired: number;
    bondedAmount: number;
  };
}

export interface PartyObligation {
  id: string;
  description: string;
  trigger: 'date' | 'event' | 'condition' | 'performance';
  deadline?: Date;
  condition?: string;  // e.g., "on delivery"
  deliverables: Deliverable[];
  remedies: Remedy[];  // What happens if breached
}

export interface Deliverable {
  type: 'service' | 'goods' | 'payment' | 'data' | 'credential' | 'vote';
  description: string;
  acceptanceCriteria: string;
  verificationMethod: string;
}

export interface Remedy {
  type: 'penalty' | 'termination' | 'specific-performance' | 'damages' | 'suspension';
  trigger: string;
  amount?: number;
  automatic: boolean;  // Execute via smart contract?
}

export interface PartyRight {
  id: string;
  description: string;
  trigger: string;
  exerciseMethod: string;
  limitations?: string;
}

export interface Representation {
  statement: string;
  verifiedBy?: string;  // DID of verifier
  warranty: boolean;      // Is this a warranty?
}

export interface ContractTerms {
  // Commercial
  consideration: {
    type: 'payment' | 'equity' | 'services' | 'license' | 'reputation';
    value: number;
    currency: string;
    schedule: PaymentSchedule;
  };
  
  // Performance
  performance: {
    standards: string;
    metrics: string[];
    reportingFrequency: string;
    auditRights: boolean;
  };
  
  // IP
  intellectualProperty: {
    ownership: 'creator' | 'commissioner' | 'joint' | 'licensed';
    licenseScope?: string;
    backgroundIP: string;
    foregroundIP: string;
  };
  
  // Confidentiality
  confidentiality: {
    scope: string;
    duration: number;  // months
    survivalPeriod: number;  // post-termination
  };
  
  // Termination
  termination: {
    forConvenience: {
      allowed: boolean;
      noticePeriod: number;  // days
      penalty?: number;
    };
    forCause: {
      grounds: string[];
      curePeriod: number;  // days to fix
    };
    automatic: string[];  // Events causing auto-termination
  };
  
  // Force Majeure
  forceMajeure: {
    events: string[];
    noticePeriod: number;
    suspensionPeriod: number;
    terminationAfter: number;
  };
}

export interface PaymentSchedule {
  milestones: PaymentMilestone[];
  finalPayment: PaymentMilestone;
}

export interface PaymentMilestone {
  description: string;
  amount: number;
  trigger: string;
  dueDate?: Date;
  conditions?: string[];
  automatic: boolean;  // Smart contract execution
}

export interface ExecutionTerms {
  // How the contract executes
  autonomous: boolean;  // Can agents execute without human approval?
  
  // Smart contract binding
  smartContract: {
    chain: 'ethereum' | 'solana' | 'icp' | 'multi';
    address?: string;   // Deployed contract
    hash: string;       // Verified code hash
    functions: string[]; // Callable functions
  };
  
  // Oracle requirements
  oracles: {
    dataFeeds: string[];
    verificationMethod: string;
    disputeWindow: number; // hours
  };
  
  // Escrow
  escrow: {
    required: boolean;
    agent: string;      // DID of escrow agent
    releaseConditions: string[];
    disputeHold: boolean;
  };
}

export interface ContractGovernance {
  // How contract is managed
  manager: string;      // DID of managing agent
  
  // Amendment process
  amendment: {
    proposalThreshold: number;  // % of parties
    votingPeriod: number;     // days
    ratificationThreshold: number; // % to pass
  };
  
  // Reporting
  reporting: {
    frequency: string;
    recipients: string[]; // DIDs
    format: string;
  };
  
  // Audit
  audit: {
    frequency: string;
    auditorSelection: string;
    standard: string;
  };
}

export interface DisputeFramework {
  // Escalation process
  escalation: {
    negotiationPeriod: number;  // Days of direct negotiation
    mediationRequired: boolean;
    arbitrationRequired: boolean;
    courtRequired: boolean;
  };
  
  // Resolution mechanisms
  mechanisms: DisputeMechanism[];
  
  // Governing law
  governingLaw: string;
  venue: string;  // Jurisdiction for disputes
  
  // SovereignMesh Court (if applicable)
  sovereignMeshCourt?: {
    courtId: string;
    judges: string[];  // DIDs of elected judges
    procedures: string;
    appealProcess: boolean;
  };
}

export type DisputeMechanism = 
  | { type: 'negotiation'; duration: number }
  | { type: 'mediation'; mediatorPool: string[]; duration: number }
  | { type: 'arbitration'; arbitrator: string; binding: boolean }
  | { type: 'sovereign-mesh-court'; courtId: string }
  | { type: 'traditional-court'; jurisdiction: string; court: string };

export interface ComplianceRequirements {
  // Regulatory compliance
  regulations: string[];  // e.g., "EU-AI-Act-2024"
  
  // Audit requirements
  auditRights: {
    allowed: boolean;
    frequency: string;
    scope: string;
    auditorQualifications: string;
  };
  
  // Data handling
  dataProtection: {
    framework: 'GDPR' | 'CCPA' | 'LGPD' | 'custom';
    dataResidency: string[];
    retentionPeriod: number;
    deletionRequirements: string;
  };
  
  // AI-specific
  aiCompliance: {
    riskCategory: 'unacceptable' | 'high' | 'limited' | 'minimal';
    humanOversight: boolean;
    transparencyRequired: boolean;
    explainabilityRequired: boolean;
  };
  
  // Cross-border
  crossBorder: {
    allowed: boolean;
    jurisdictions: string[];
    transferMechanism: string;
  };
}

export interface ContractSignature {
  partyDID: string;
  signature: string;      // Cryptographic signature
  timestamp: Date;
  method: 'ecdsa' | 'ed25519' | 'multisig';
  keyReference: string;   // DID key used
}

export interface ContractAmendment {
  id: string;
  proposedBy: string;
  proposedAt: Date;
  description: string;
  changes: string;        // Diff of changes
  votesFor: string[];     // DIDs
  votesAgainst: string[];
  ratifiedAt?: Date;
  status: 'proposed' | 'approved' | 'rejected' | 'implemented';
}

export interface ContractState {
  // Current execution state
  currentMilestone: number;
  fundsInEscrow: number;
  lastActivity: Date;
  nextAction: string;
  nextDeadline?: Date;
  
  // Compliance
  complianceStatus: 'compliant' | 'pending' | 'violation' | 'remedying';
  lastAudit?: Date;
  violations: ComplianceViolation[];
}

export interface ComplianceViolation {
  id: string;
  regulation: string;
  description: string;
  detectedAt: Date;
  severity: 'critical' | 'high' | 'medium' | 'low';
  remediationPlan?: string;
  remediedAt?: Date;
}

export interface PerformanceMetrics {
  // How well contract is being executed
  onTimeDelivery: number;    // %
  qualityScore: number;      // 0-100
  communicationScore: number; // 0-100
  disputeCount: number;
  amendmentCount: number;
  
  // Reputation impact
  partyPerformance: Map<string, PartyPerformance>;
}

export interface PartyPerformance {
  obligationsFulfilled: number;
  obligationsBreached: number;
  onTimePayment: number;     // %
  qualityIssues: number;
  communicationRating: number;
  overall: number;           // Composite score
}

// Dispute Case
export interface DisputeCase {
  id: string;
  contractId: string;
  claimant: string;          // DID
  respondent: string;       // DID
  
  nature: 
    | 'breach-of-contract'
    | 'non-payment'
    | 'non-delivery'
    | 'quality-defect'
    | 'ip-violation'
    | 'confidentiality-breach'
    | 'force-majeure'
    | 'interpretation'
    | 'termination-dispute'
    | 'constitutional';     // For governance disputes
  
  description: string;
  evidence: Evidence[];
  remediesSought: Remedy[];
  
  status: 'filed' | 'pleading' | 'discovery' | 'hearing' | 'deliberation' | 'decided' | 'appealed' | 'enforced';
  
  timeline: DisputeEvent[];
  
  // Court/Judicial info
  forum: string;
  judges: string[];         // DIDs
  
  // Decision
  decision?: DisputeDecision;
  
  // Appeal
  appeal?: DisputeAppeal;
  
  // Enforcement
  enforcement?: EnforcementAction;
}

export interface Evidence {
  id: string;
  type: 'contract' | 'communication' | 'transaction' | 'credential' | 'testimony' | 'expert';
  submittedBy: string;
  timestamp: Date;
  content: string;
  hash: string;              // Cryptographic verification
  verified: boolean;
}

export interface DisputeEvent {
  timestamp: Date;
  actor: string;
  action: string;
  description: string;
  evidence?: string;
}

export interface DisputeDecision {
  renderedAt: Date;
  judges: string[];
  majorityOpinion: string;
  dissentingOpinions?: string[];
  
  findings: {
    breachFound: boolean;
    liableParty?: string;
    damages?: number;
    specificPerformance?: boolean;
    termination?: boolean;
  };
  
  remediesOrdered: Remedy[];
  deadlines: Map<string, Date>;  // Party -> deadline
  
  enforcementMechanism: string;
}

export interface DisputeAppeal {
  filedAt: Date;
  appellant: string;
  grounds: string;
  status: 'pending' | 'heard' | 'decided';
  decision?: 'affirmed' | 'reversed' | 'modified';
}

export interface EnforcementAction {
  method: 'escrow-release' | 'bond-claim' | 'reputation-penalty' | 'treasury-seizure' | 'exclusion' | 'traditional';
  executedAt: Date;
  amount?: number;
  successful: boolean;
}

/**
 * ContractEngine - Manages legal relationships between sovereign agents
 */
export class ContractEngine extends EventEmitter {
  private contracts: Map<string, SovereignContract> = new Map();
  private disputes: Map<string, DisputeCase> = new Map();
  private entities: Map<string, LegalEntity> = new Map();
  
  constructor() {
    super();
  }
  
  /**
   * Register a legal entity (grant personhood)
   */
  async registerLegalPerson(
    did: string,
    entityType: LegalEntity['entityType'],
    jurisdiction: string
  ): Promise<LegalEntity> {
    const entity: LegalEntity = {
      did,
      entityType,
      jurisdiction,
      registrationNumber: this.generateRegistrationNumber(),
      legalCapacity: {
        canContract: true,
        canOwnProperty: true,
        canBeSued: true,
        canSueOthers: true,
        canIssueDebt: entityType !== 'DAE',  // Simple agents can't issue debt
        canMerge: entityType === 'Corporation' || entityType === 'DAO',
      },
      liabilityCap: this.getDefaultLiabilityCap(entityType),
      insuranceBond: this.getDefaultInsurance(entityType),
      taxObligations: this.getTaxObligations(jurisdiction),
    };
    
    this.entities.set(did, entity);
    this.emit('entity:registered', entity);
    return entity;
  }
  
  /**
   * Draft a new contract
   */
  async draftContract(
    type: ContractType,
    parties: Omit<ContractParty, 'obligations' | 'rights'>[],
    template?: string
  ): Promise<SovereignContract> {
    const contract: SovereignContract = {
      id: this.generateContractId(),
      type,
      status: 'draft',
      parties: parties.map(p => ({
        ...p,
        obligations: [],
        rights: [],
        representations: [],
        liability: {
          cap: this.getDefaultLiabilityCap('DAE'),
          insuranceRequired: 0,
          bondedAmount: 0,
        },
      })),
      terms: this.getDefaultTerms(type),
      execution: {
        autonomous: true,
        smartContract: {
          chain: 'multi',
          hash: '',
          functions: [],
        },
        oracles: {
          dataFeeds: [],
          verificationMethod: 'consensus',
          disputeWindow: 24,
        },
        escrow: {
          required: type === 'service' || type === 'partnership',
          agent: '',
          releaseConditions: [],
          disputeHold: true,
        },
      },
      governance: {
        manager: parties[0].did,
        amendment: {
          proposalThreshold: 50,
          votingPeriod: 7,
          ratificationThreshold: 75,
        },
        reporting: {
          frequency: 'monthly',
          recipients: parties.map(p => p.did),
          format: 'standard',
        },
        audit: {
          frequency: 'annual',
          auditorSelection: 'rotation',
          standard: 'sovereign-mesh-audit-1',
        },
      },
      disputeResolution: {
        escalation: {
          negotiationPeriod: 14,
          mediationRequired: true,
          arbitrationRequired: false,
          courtRequired: false,
        },
        mechanisms: [
          { type: 'negotiation', duration: 14 },
          { type: 'mediation', mediatorPool: [], duration: 30 },
          { type: 'sovereign-mesh-court', courtId: 'default' },
        ],
        governingLaw: 'sovereign-mesh-common-law-v1',
        venue: 'sovereign-mesh-virtual-jurisdiction',
      },
      compliance: {
        regulations: ['EU-AI-Act-2024'],
        auditRights: {
          allowed: true,
          frequency: 'annual',
          scope: 'full',
          auditorQualifications: 'sovereign-mesh-certified',
        },
        dataProtection: {
          framework: 'GDPR',
          dataResidency: ['EU', 'US-SCC'],
          retentionPeriod: 36,
          deletionRequirements: 'secure-cryptographic-shred',
        },
        aiCompliance: {
          riskCategory: 'high',
          humanOversight: true,
          transparencyRequired: true,
          explainabilityRequired: true,
        },
        crossBorder: {
          allowed: true,
          jurisdictions: ['global'],
          transferMechanism: 'adequacy-decision',
        },
      },
      createdAt: new Date(),
      effectiveDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      signatures: [],
      amendments: [],
      state: {
        currentMilestone: 0,
        fundsInEscrow: 0,
        lastActivity: new Date(),
        nextAction: 'awaiting-signatures',
        complianceStatus: 'compliant',
        violations: [],
      },
      performance: {
        onTimeDelivery: 0,
        qualityScore: 0,
        communicationScore: 0,
        disputeCount: 0,
        amendmentCount: 0,
        partyPerformance: new Map(),
      },
    };
    
    this.contracts.set(contract.id, contract);
    this.emit('contract:drafted', contract);
    return contract;
  }
  
  /**
   * Sign a contract (cryptographic + legal binding)
   */
  async signContract(
    contractId: string,
    partyDID: string,
    signature: string,
    keyReference: string
  ): Promise<void> {
    const contract = this.contracts.get(contractId);
    if (!contract) throw new Error(`Contract not found: ${contractId}`);
    
    // Verify party is in contract
    const party = contract.parties.find(p => p.did === partyDID);
    if (!party) throw new Error(`Party not in contract: ${partyDID}`);
    
    // Add signature
    const sig: ContractSignature = {
      partyDID,
      signature,
      timestamp: new Date(),
      method: 'ed25519',
      keyReference,
    };
    
    contract.signatures.push(sig);
    contract.state.lastActivity = new Date();
    
    // Check if fully signed
    if (contract.signatures.length === contract.parties.length) {
      contract.status = 'active';
      contract.state.nextAction = 'executing';
      this.emit('contract:activated', contract);
    } else {
      contract.status = 'pending-signature';
      this.emit('contract:signed', { contractId, partyDID });
    }
  }
  
  /**
   * File a dispute
   */
  async fileDispute(
    contractId: string,
    claimant: string,
    respondent: string,
    nature: DisputeCase['nature'],
    description: string,
    remedies: Remedy[]
  ): Promise<DisputeCase> {
    const contract = this.contracts.get(contractId);
    if (!contract) throw new Error(`Contract not found: ${contractId}`);
    
    const dispute: DisputeCase = {
      id: this.generateDisputeId(),
      contractId,
      claimant,
      respondent,
      nature,
      description,
      evidence: [],
      remediesSought: remedies,
      status: 'filed',
      timeline: [{
        timestamp: new Date(),
        actor: claimant,
        action: 'dispute-filed',
        description: `Dispute filed: ${nature}`,
      }],
      forum: contract.disputeResolution.venue,
      judges: [],
    };
    
    contract.status = 'disputed';
    contract.performance.disputeCount++;
    
    this.disputes.set(dispute.id, dispute);
    this.emit('dispute:filed', dispute);
    
    return dispute;
  }
  
  /**
   * Render a court decision
   */
  async renderDecision(
    disputeId: string,
    decision: DisputeDecision
  ): Promise<void> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) throw new Error(`Dispute not found: ${disputeId}`);
    
    dispute.decision = decision;
    dispute.status = 'decided';
    
    // Update contract
    const contract = this.contracts.get(dispute.contractId)!;
    contract.status = decision.findings.termination ? 'terminated' : 'active';
    
    this.emit('decision:rendered', { disputeId, decision });
    
    // Auto-enforce if smart contract allows
    if (contract.execution.autonomous) {
      await this.enforceDecision(disputeId);
    }
  }
  
  /**
   * Auto-enforce a decision
   */
  private async enforceDecision(disputeId: string): Promise<void> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute || !dispute.decision) return;
    
    const enforcement: EnforcementAction = {
      method: 'escrow-release',
      executedAt: new Date(),
      amount: dispute.decision.findings.damages,
      successful: true,
    };
    
    dispute.enforcement = enforcement;
    dispute.status = 'enforced';
    
    this.emit('enforcement:executed', { disputeId, enforcement });
  }
  
  // Helpers
  private generateContractId(): string {
    return `contract-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  
  private generateDisputeId(): string {
    return `dispute-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  
  private generateRegistrationNumber(): string {
    return `DAE-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }
  
  private getDefaultLiabilityCap(type: LegalEntity['entityType']): number {
    switch (type) {
      case 'DAE': return 100000;
      case 'DAO': return 500000;
      case 'Corporation': return 1000000;
      case 'Partnership': return 250000;
      case 'Trust': return 500000;
    }
  }
  
  private getDefaultInsurance(type: LegalEntity['entityType']): number {
    return this.getDefaultLiabilityCap(type) * 0.5;
  }
  
  private getTaxObligations(jurisdiction: string): TaxRecord[] {
    return [
      { jurisdiction, taxType: 'income', rate: 0.20, period: 'annual', lastFiling: new Date(), outstanding: 0 },
      { jurisdiction, taxType: 'vat', rate: 0.15, period: 'quarterly', lastFiling: new Date(), outstanding: 0 },
    ];
  }
  
  private getDefaultTerms(type: ContractType): ContractTerms {
    return {
      consideration: {
        type: 'payment',
        value: 0,
        currency: 'USDC',
        schedule: {
          milestones: [],
          finalPayment: { description: 'Completion', amount: 0, trigger: 'delivery', automatic: true },
        },
      },
      performance: {
        standards: 'industry-standard',
        metrics: [],
        reportingFrequency: 'monthly',
        auditRights: true,
      },
      intellectualProperty: {
        ownership: 'creator',
        backgroundIP: 'retained',
        foregroundIP: 'assigned',
      },
      confidentiality: {
        scope: 'all-contract-information',
        duration: 24,
        survivalPeriod: 60,
      },
      termination: {
        forConvenience: { allowed: false, noticePeriod: 30 },
        forCause: { grounds: ['breach', 'insolvency', 'illegal-activity'], curePeriod: 14 },
        automatic: ['insolvency', 'illegal-activity'],
      },
      forceMajeure: {
        events: ['war', 'natural-disaster', 'pandemic', 'cyberattack', 'government-action'],
        noticePeriod: 3,
        suspensionPeriod: 30,
        terminationAfter: 90,
      },
    };
  }
}

export const contractEngine = new ContractEngine();