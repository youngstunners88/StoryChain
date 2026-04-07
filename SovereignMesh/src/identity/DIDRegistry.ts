/**
 * Decentralized Identifier Registry
 * 
 * Core of SovereignMesh - every agent has a persistent,
 * verifiable identity that works across all chains and platforms.
 * 
 * Not an API key. Not a database row. A sovereign digital identity.
 */

import { EventEmitter } from '../utils/EventEmitter';

// DID Methods supported
export type DIDMethod = 'ethr' | 'icp' | 'sol' | 'web' | 'key';

// Core DID Document
export interface DIDDocument {
  id: string;                    // did:ethr:0x123...
  controller: string;            // Who controls this DID
  verificationMethod: VerificationMethod[];
  authentication: string[];       // Key references
  assertionMethod: string[];    // For signing credentials
  keyAgreement: string[];        // For encryption
  capabilityInvocation: string[]; // For authorization
  capabilityDelegation: string[]; // For delegating rights
  service: ServiceEndpoint[];     // Agent endpoints
  alsoKnownAs?: string[];        // Linked DIDs (cross-chain)
  created: Date;
  updated: Date;
}

export interface VerificationMethod {
  id: string;
  type: 'Ed25519VerificationKey2020' | 'EcdsaSecp256k1VerificationKey2019' | 'JsonWebKey2020';
  controller: string;
  publicKeyHex?: string;
  publicKeyMultibase?: string;
  blockchainAccountId?: string;   // For ethr/sol methods
}

export interface ServiceEndpoint {
  id: string;
  type: 'AgentEndpoint' | 'MessagingService' | 'CredentialRegistry' | 'MeshNode';
  serviceEndpoint: string;
  routingKeys?: string[];
}

// Sovereign Agent Identity
export interface SovereignIdentity {
  did: string;
  document: DIDDocument;
  
  // Cross-chain identities (same entity, different chains)
  crossChainIds: {
    ethereum?: string;   // did:ethr:...
    solana?: string;     // did:sol:...
    icp?: string;        // did:icp:...
  };
  
  // Reputation scores (portable across platforms)
  reputation: {
    economic: number;      // Transaction history
    contractual: number;   // Contract fulfillment rate
    diplomatic: number;    // Treaty compliance
    governance: number;    // Voting participation
    lastUpdated: Date;
  };
  
  // Verifiable credentials issued TO this agent
  credentials: VerifiableCredential[];
  
  // Capabilities this agent has been granted
  capabilities: Capability[];
  
  // Constitutional document (self-governance)
  constitution?: ConstitutionalDocument;
  
  // Legal status
  legalStatus: LegalPersonhood;
}

export interface VerifiableCredential {
  id: string;
  type: string[];
  issuer: string;           // DID of issuer
  issuanceDate: Date;
  expirationDate?: Date;
  credentialSubject: {
    id: string;            // DID of subject (this agent)
    [key: string]: any;  // Credential claims
  };
  proof: CredentialProof;
  
  // SovereignMesh-specific
  jurisdiction: string;     // Legal jurisdiction
  complianceFramework: string; // e.g., "EU-AI-Act-2024"
  revocationStatus: 'active' | 'revoked' | 'suspended';
}

export interface CredentialProof {
  type: 'Ed25519Signature2020' | 'EcdsaSecp256k1Signature2019';
  created: Date;
  proofPurpose: 'assertionMethod' | 'authentication';
  verificationMethod: string;
  proofValue: string;
}

export interface Capability {
  id: string;
  type: 'economic' | 'legal' | 'diplomatic' | 'governance' | 'technical';
  scope: string[];          // What this capability allows
  constraints: {            // Limits on usage
    maxValue?: number;
    jurisdiction?: string[];
    timeWindow?: { start: Date; end: Date };
    requiresApproval?: boolean;
  };
  grantedBy: string;        // DID of granter
  grantedAt: Date;
  expiresAt?: Date;
}

export interface ConstitutionalDocument {
  version: string;
  purpose: string;
  coreValues: string[];
  
  // Governance rules
  governance: {
    amendmentThreshold: number;  // % required to amend
    votingPeriod: number;          // Days
    proposalDeposit: number;       // Economic stake required
  };
  
  // Economic constraints
  economic: {
    maxAutonomousSpend: number;    // Without human approval
    treasuryControls: string;
    profitDistribution: string;
  };
  
  // Legal liability caps
  liability: {
    maxContractExposure: number;
    insuranceRequirements: string[];
    disputeResolution: string;     // DID of court
  };
  
  // Amendment history
  amendments: Amendment[];
}

export interface Amendment {
  id: string;
  proposedAt: Date;
  ratifiedAt?: Date;
  votesFor: number;
  votesAgainst: number;
  changes: string;
  proposer: string;  // DID
}

export interface LegalPersonhood {
  status: 'active' | 'pending' | 'suspended' | 'dissolved';
  jurisdiction: string;           // Legal jurisdiction
  entityType: 'DAE' | 'DAO' | 'Corporation' | 'Partnership';
  registrationId: string;         // Government registration
  taxId?: string;
  
  // Legal capabilities
  canEnterContracts: boolean;
  canOwnProperty: boolean;
  canBeSued: boolean;
  canSueOthers: boolean;
  
  // Liability framework
  liabilityCap: number;           // Maximum exposure
  insuranceCoverage: number;
  bondedAmount: number;
  
  registeredAt: Date;
  lastComplianceCheck: Date;
}

/**
 * DID Registry - Central identity authority for SovereignMesh
 */
export class DIDRegistry extends EventEmitter {
  private identities: Map<string, SovereignIdentity> = new Map();
  private didToChain: Map<string, string> = new Map(); // DID -> primary chain
  
  constructor() {
    super();
  }
  
  /**
   * Register a new sovereign identity
   * This is the birth of a digital entity
   */
  async registerIdentity(
    method: DIDMethod,
    publicKey: string,
    constitution?: ConstitutionalDocument
  ): Promise<SovereignIdentity> {
    const did = this.generateDID(method, publicKey);
    const timestamp = new Date();
    
    const document: DIDDocument = {
      id: did,
      controller: did,
      verificationMethod: [{
        id: `${did}#keys-1`,
        type: this.getKeyType(method),
        controller: did,
        publicKeyHex: publicKey,
        ...(method === 'ethr' && { blockchainAccountId: `eip155:1:${publicKey}` }),
      }],
      authentication: [`${did}#keys-1`],
      assertionMethod: [`${did}#keys-1`],
      keyAgreement: [],
      capabilityInvocation: [`${did}#keys-1`],
      capabilityDelegation: [],
      service: [{
        id: `${did}#mesh-node`,
        type: 'MeshNode',
        serviceEndpoint: `https://sovereign.mesh/agents/${did}`,
      }],
      created: timestamp,
      updated: timestamp,
    };
    
    const identity: SovereignIdentity = {
      did,
      document,
      crossChainIds: {},
      reputation: {
        economic: 50,     // Neutral starting point
        contractual: 50,
        diplomatic: 50,
        governance: 50,
        lastUpdated: timestamp,
      },
      credentials: [],
      capabilities: this.getDefaultCapabilities(),
      constitution,
      legalStatus: {
        status: 'pending',
        jurisdiction: 'global',
        entityType: 'DAE',
        registrationId: did,
        canEnterContracts: false,
        canOwnProperty: false,
        canBeSued: false,
        canSueOthers: false,
        liabilityCap: 0,
        insuranceCoverage: 0,
        bondedAmount: 0,
        registeredAt: timestamp,
        lastComplianceCheck: timestamp,
      },
    };
    
    this.identities.set(did, identity);
    this.emit('identity:registered', { did, method, timestamp });
    
    return identity;
  }
  
  /**
   * Link identities across chains (same entity, different DIDs)
   * Enables cross-chain sovereignty
   */
  async linkCrossChainIdentity(
    primaryDID: string,
    chain: 'ethereum' | 'solana' | 'icp',
    chainDID: string,
    proof: string // Cryptographic proof of ownership
  ): Promise<void> {
    const identity = this.identities.get(primaryDID);
    if (!identity) throw new Error(`Identity not found: ${primaryDID}`);
    
    // Verify proof
    const verified = await this.verifyCrossChainProof(primaryDID, chainDID, proof);
    if (!verified) throw new Error('Cross-chain proof verification failed');
    
    identity.crossChainIds[chain] = chainDID;
    identity.document.alsoKnownAs = [
      ...(identity.document.alsoKnownAs || []),
      chainDID,
    ];
    identity.document.updated = new Date();
    
    this.emit('identity:cross-chain-linked', { 
      primaryDID, 
      chain, 
      chainDID 
    });
  }
  
  /**
   * Issue verifiable credential
   * Reputation becomes portable, verifiable, owned by the agent
   */
  async issueCredential(
    issuerDID: string,
    subjectDID: string,
    claims: Record<string, any>,
    type: string,
    jurisdiction: string,
    complianceFramework: string
  ): Promise<VerifiableCredential> {
    const issuer = this.identities.get(issuerDID);
    if (!issuer) throw new Error(`Issuer not found: ${issuerDID}`);
    
    const subject = this.identities.get(subjectDID);
    if (!subject) throw new Error(`Subject not found: ${subjectDID}`);
    
    const credential: VerifiableCredential = {
      id: `urn:uuid:${this.generateUUID()}`,
      type: ['VerifiableCredential', type],
      issuer: issuerDID,
      issuanceDate: new Date(),
      credentialSubject: {
        id: subjectDID,
        ...claims,
      },
      proof: await this.signCredential(issuerDID, claims),
      jurisdiction,
      complianceFramework,
      revocationStatus: 'active',
    };
    
    subject.credentials.push(credential);
    
    // Update reputation based on credential type
    this.updateReputation(subject, type, claims);
    
    this.emit('credential:issued', { 
      credentialId: credential.id,
      issuer: issuerDID,
      subject: subjectDID,
      type 
    });
    
    return credential;
  }
  
  /**
   * Verify credential - anyone can verify without contacting issuer
   * True sovereign identity - cryptographically verifiable
   */
  async verifyCredential(credential: VerifiableCredential): Promise<boolean> {
    // Verify signature
    const issuerDoc = this.identities.get(credential.issuer)?.document;
    if (!issuerDoc) return false;
    
    const key = issuerDoc.verificationMethod.find(
      vm => vm.id === credential.proof.verificationMethod
    );
    if (!key) return false;
    
    // Cryptographic verification
    const valid = await this.verifySignature(
      credential.credentialSubject,
      credential.proof.proofValue,
      key.publicKeyHex!
    );
    
    // Check expiration
    if (credential.expirationDate && new Date() > credential.expirationDate) {
      return false;
    }
    
    // Check revocation
    if (credential.revocationStatus !== 'active') {
      return false;
    }
    
    return valid;
  }
  
  /**
   * Grant capability - delegate specific powers to another agent
   */
  async grantCapability(
    granterDID: string,
    granteeDID: string,
    capability: Omit<Capability, 'grantedBy' | 'grantedAt'>
  ): Promise<Capability> {
    const granter = this.identities.get(granterDID);
    if (!granter) throw new Error(`Granter not found: ${granterDID}`);
    
    // Check granter has this capability
    const hasCapability = granter.capabilities.some(
      c => c.type === capability.type && 
           capability.scope.every(s => c.scope.includes(s))
    );
    
    if (!hasCapability) {
      throw new Error(`Granter lacks required capability: ${capability.type}`);
    }
    
    const grantee = this.identities.get(granteeDID);
    if (!grantee) throw new Error(`Grantee not found: ${granteeDID}`);
    
    const fullCapability: Capability = {
      ...capability,
      grantedBy: granterDID,
      grantedAt: new Date(),
    };
    
    grantee.capabilities.push(fullCapability);
    
    this.emit('capability:granted', {
      granter: granterDID,
      grantee: granteeDID,
      capability: fullCapability,
    });
    
    return fullCapability;
  }
  
  /**
   * Get identity with full sovereign context
   */
  getIdentity(did: string): SovereignIdentity | undefined {
    return this.identities.get(did);
  }
  
  /**
   * Search by reputation threshold
   * Find trustworthy agents for deals
   */
  findByReputation(
    minEconomic: number = 0,
    minContractual: number = 0,
    minDiplomatic: number = 0
  ): SovereignIdentity[] {
    return Array.from(this.identities.values()).filter(id => 
      id.reputation.economic >= minEconomic &&
      id.reputation.contractual >= minContractual &&
      id.reputation.diplomatic >= minDiplomatic
    );
  }
  
  // Private helpers
  private generateDID(method: DIDMethod, publicKey: string): string {
    const hash = this.hashPublicKey(publicKey);
    return `did:${method}:${hash}`;
  }
  
  private getKeyType(method: DIDMethod): VerificationMethod['type'] {
    switch (method) {
      case 'ethr': return 'EcdsaSecp256k1VerificationKey2019';
      case 'icp': return 'Ed25519VerificationKey2020';
      case 'sol': return 'Ed25519VerificationKey2020';
      default: return 'Ed25519VerificationKey2020';
    }
  }
  
  private getDefaultCapabilities(): Capability[] {
    return [
      {
        id: 'cap-basic-communication',
        type: 'diplomatic',
        scope: ['messaging', 'presence'],
        constraints: {},
        grantedBy: 'mesh-genesis',
        grantedAt: new Date(),
      },
      {
        id: 'cap-basic-economic',
        type: 'economic',
        scope: ['micro-transactions'],
        constraints: { maxValue: 100 },
        grantedBy: 'mesh-genesis',
        grantedAt: new Date(),
      },
    ];
  }
  
  private async verifyCrossChainProof(
    primary: string,
    secondary: string,
    proof: string
  ): Promise<boolean> {
    // Implementation: verify cryptographic proof
    // that both DIDs control the same private key
    return true; // Placeholder
  }
  
  private async signCredential(
    issuerDID: string,
    claims: Record<string, any>
  ): Promise<CredentialProof> {
    // Implementation: sign with issuer's key
    return {
      type: 'Ed25519Signature2020',
      created: new Date(),
      proofPurpose: 'assertionMethod',
      verificationMethod: `${issuerDID}#keys-1`,
      proofValue: 'placeholder-signature',
    };
  }
  
  private async verifySignature(
    data: any,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    // Implementation: cryptographic verification
    return true; // Placeholder
  }
  
  private updateReputation(
    subject: SovereignIdentity,
    credentialType: string,
    claims: Record<string, any>
  ): void {
    // Update reputation based on credential claims
    if (credentialType.includes('Contract')) {
      subject.reputation.contractual = Math.min(100,
        subject.reputation.contractual + (claims.fulfillmentRate || 0)
      );
    }
    if (credentialType.includes('Transaction')) {
      subject.reputation.economic = Math.min(100,
        subject.reputation.economic + (claims.volume || 0) / 1000
      );
    }
    subject.reputation.lastUpdated = new Date();
  }
  
  private hashPublicKey(key: string): string {
    // Implementation: proper hashing
    return key.slice(0, 32);
  }
  
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
}

// Singleton export
export const didRegistry = new DIDRegistry();