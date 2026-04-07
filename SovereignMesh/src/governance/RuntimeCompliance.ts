/**
 * Runtime Governance & Compliance
 * 
 * "Governance must travel WITH data, not rely on static infrastructure"
 * 
 * Agents carry compliance rules as verifiable credentials.
 * Policy enforcement happens at runtime, not deployment.
 * EU AI Act, GDPR, and all regulations travel with the agent.
 */

import { EventEmitter } from '../utils/EventEmitter';
import { SovereignIdentity, VerifiableCredential, Capability } from '../identity/DIDRegistry';

// Compliance Frameworks
export type ComplianceFramework = 
  | 'EU-AI-Act-2024'
  | 'GDPR-2016'
  | 'CCPA-2018'
  | 'LGPD-2019'
  | 'NIST-AIRMF'
  | 'ISO-42001'
  | 'IEEE-2857'
  | 'OECD-AI-Principles'
  | 'Singapore-FEAT'
  | 'UK-AI-Regulation'
  | 'China-Algorithmic-Recommendations'
  | 'Custom-Jurisdiction';

// Risk Categories (EU AI Act style)
export type RiskCategory = 
  | 'unacceptable'   // Prohibited
  | 'high'            // Strict requirements
  | 'limited'         // Transparency required
  | 'minimal'         // Voluntary codes
  | 'general-purpose'; // Foundation models

// AI System Types
export type AISystemType =
  | 'biometric-identification'
  | 'critical-infrastructure'
  | 'education-vocational'
  | 'employment'
  | 'essential-services'
  | 'law-enforcement'
  | 'migration-asylum-border'
  | 'justice-democratic-processes'
  | 'social-scoring'
  | 'subliminal-manipulation'
  | 'general-purpose-model'
  | 'agentic-system'
  | 'multi-agent-network'
  | 'autonomous-economic-actor';

// Runtime Compliance Profile
export interface ComplianceProfile {
  did: string;                    // Agent DID
  
  // Frameworks agent complies with
  frameworks: FrameworkCompliance[];
  
  // Risk assessment
  riskAssessment: RiskAssessment;
  
  // Capabilities with compliance constraints
  compliantCapabilities: CompliantCapability[];
  
  // Runtime rules
  runtimeRules: RuntimeRule[];
  
  // Audit trail
  auditLog: ComplianceEvent[];
  
  // Current status
  status: ComplianceStatus;
  lastVerified: Date;
  nextAudit: Date;
  
  // Cross-border
  crossBorder: CrossBorderCompliance;
}

export interface FrameworkCompliance {
  framework: ComplianceFramework;
  version: string;
  
  // Compliance credential
  credential: VerifiableCredential;
  
  // Specific obligations
  obligations: ComplianceObligation[];
  
  // Conformity assessment
  conformityAssessment: {
    body?: string;              // Assessment body DID
    date: Date;
    validUntil: Date;
    certificateId: string;
    status: 'active' | 'suspended' | 'withdrawn' | 'expired';
  };
  
  // Risk classification under this framework
  riskClass: RiskCategory;
  
  // Special conditions
  conditions: string[];
  postMarketMonitoring: boolean;
}

export interface ComplianceObligation {
  id: string;
  requirement: string;
  article?: string;              // Legal article reference
  
  // Implementation
  implemented: boolean;
  implementationMethod: string;
  evidence: string;
  
  // Verification
  verifiedBy?: string;           // DID
  verifiedAt?: Date;
  
  // Status
  status: 'compliant' | 'non-compliant' | 'partial' | 'not-applicable';
  
  // Remediation if non-compliant
  remediationPlan?: string;
  remediationDeadline?: Date;
  remediatedAt?: Date;
}

export interface RiskAssessment {
  // System classification
  systemType: AISystemType;
  intendedUse: string;
  
  // Risk categorization
  overallRisk: RiskCategory;
  
  // Specific risks
  risks: IdentifiedRisk[];
  
  // Mitigations
  mitigations: RiskMitigation[];
  
  // Human oversight
  humanOversight: HumanOversightPlan;
  
  // Assessment documentation
  assessmentDocument: string;    // IPFS hash or similar
  assessmentDate: Date;
  assessor: string;              // DID
}

export interface IdentifiedRisk {
  id: string;
  category: 
    | 'fundamental-rights'
    | 'safety'
    | 'discrimination'
    | 'privacy'
    | 'manipulation'
    | 'autonomy'
    | 'environmental'
    | 'societal'
    | 'economic';
  description: string;
  likelihood: 'low' | 'medium' | 'high' | 'very-high';
  impact: 'low' | 'medium' | 'high' | 'very-high';
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigated: boolean;
}

export interface RiskMitigation {
  riskId: string;
  measure: string;
  implemented: boolean;
  verified: boolean;
  residualRisk: 'low' | 'medium' | 'high';
}

export interface HumanOversightPlan {
  required: boolean;
  type: 'human-in-the-loop' | 'human-on-the-loop' | 'human-in-command' | 'none';
  
  // Oversight points
  oversightPoints: {
    decision: string;
    humanRole: 'approval' | 'review' | 'intervention' | 'monitoring';
    autonomyLevel: 'full' | 'partial' | 'advisory';
  }[];
  
  // Override capabilities
  override: {
    enabled: boolean;
    latency: number;            // Seconds to stop
    scope: string[];
    authorizedOverseers: string[]; // DIDs
  };
  
  // Training
  overseerTraining: string;
  competenceRequirements: string[];
}

export interface CompliantCapability {
  capabilityId: string;
  
  // What this capability does
  action: string;
  
  // Compliance constraints
  constraints: {
    frameworks: ComplianceFramework[];
    riskCategories: RiskCategory[];
    jurisdictions: string[];
    dataTypes: string[];
    maxAutonomy: number;        // 0-100, how autonomous
  };
  
  // Usage conditions
  conditions: {
    humanApprovalRequired: boolean;
    maxValue?: number;
    timeRestrictions?: string;
    auditRequired: boolean;
    loggingLevel: 'minimal' | 'standard' | 'detailed' | 'forensic';
  };
  
  // Verification method
  verificationMethod: 'credential' | 'real-time-check' | 'oracle' | 'manual';
  
  // Current status
  status: 'authorized' | 'suspended' | 'revoked' | 'restricted';
  lastVerified: Date;
}

export interface RuntimeRule {
  id: string;
  name: string;
  
  // When does this rule apply?
  trigger: {
    event: string;
    condition: string;
  };
  
  // What to check
  check: {
    type: 'credential' | 'jurisdiction' | 'risk-level' | 'purpose' | 'data-type' | 'cross-border' | 'consent';
    parameters: Record<string, any>;
  };
  
  // Decision
  decision: 'allow' | 'deny' | 'escalate' | 'audit' | 'quarantine';
  
  // Action if rule fires
  action: {
    type: 'log' | 'alert' | 'block' | 'approve' | 'request-approval' | 'modify';
    parameters?: Record<string, any>;
  };
  
  // Priority
  priority: number;              // Higher = evaluated first
  
  // Active
  active: boolean;
}

export interface ComplianceEvent {
  id: string;
  timestamp: Date;
  
  type: 
    | 'profile-created'
    | 'framework-added'
    | 'assessment-completed'
    | 'capability-used'
    | 'rule-triggered'
    | 'violation-detected'
    | 'remediation-action'
    | 'audit-conducted'
    | 'violation-corrected'
    | 'status-changed';
  
  // What happened
  description: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  
  // Context
  action?: string;
  capability?: string;
  framework?: ComplianceFramework;
  
  // Evidence
  evidence: string;              // IPFS hash
  proof: string;                 // Cryptographic proof
  
  // Resolution
  resolved: boolean;
  resolution?: string;
  resolvedAt?: Date;
  
  // Parties
  actor: string;                  // DID
  affectedParties: string[];
}

export interface CrossBorderCompliance {
  // Where agent is authorized to operate
  authorizedJurisdictions: string[];
  
  // Data residency requirements
  dataResidency: {
    default: string;
    allowedRegions: string[];
    prohibitedRegions: string[];
    transferMechanism: 'adequacy' | 'SCCs' | 'BCRs' | 'certification' | 'custom';
  };
  
  // For each transfer
  transferRules: DataTransferRule[];
  
  // Conflict resolution
  conflictResolution: {
    hierarchy: ComplianceFramework[];
    defaultFramework: ComplianceFramework;
  };
}

export interface DataTransferRule {
  id: string;
  fromJurisdiction: string;
  toJurisdiction: string;
  
  // Data types
  dataTypes: string[];
  
  // Conditions
  conditions: {
    requiredFrameworks: ComplianceFramework[];
    mechanism: string;
    safeguards: string[];
  };
  
  // Approved
  approved: boolean;
  approvedBy: string;           // DID
  approvedAt: Date;
  
  // Usage
  usedCount: number;
  lastUsed?: Date;
}

export type ComplianceStatus = 
  | 'fully-compliant'
  | 'compliant-with-conditions'
  | 'pending-assessment'
  | 'non-compliant-minor'
  | 'non-compliant-major'
  | 'suspended'
  | 'prohibited';

// Runtime Enforcement Decision
export interface EnforcementDecision {
  actionId: string;
  timestamp: Date;
  
  // What was being attempted
  attemptedAction: string;
  capability: string;
  
  // Context
  dataInvolved: string[];
  jurisdictions: string[];
  parties: string[];
  
  // Compliance check results
  checks: ComplianceCheck[];
  
  // Decision
  decision: 'allow' | 'deny' | 'modify' | 'escalate' | 'audit';
  
  // If denied, why
  denialReasons?: string[];
  requiredApprovers?: string[];
  
  // Modifications required
  modifications?: string[];
  
  // Audit requirements
  auditRequired: boolean;
  auditLevel?: string;
  
  // Proof
  proof: string;                 // Cryptographic proof of decision
}

export interface ComplianceCheck {
  ruleId: string;
  framework?: ComplianceFramework;
  check: string;
  result: 'pass' | 'fail' | 'warning' | 'not-applicable';
  evidence: string;
  timestamp: Date;
}

/**
 * RuntimeComplianceEngine
 * 
 * Checks every action against compliance rules at runtime.
 * Governance travels WITH the agent, not in infrastructure.
 */
export class RuntimeComplianceEngine extends EventEmitter {
  private profiles: Map<string, ComplianceProfile> = new Map();
  private decisions: EnforcementDecision[] = [];
  
  constructor() {
    super();
  }
  
  /**
   * Create compliance profile for new agent
   */
  async createProfile(
    did: string,
    systemType: AISystemType,
    intendedUse: string,
    frameworks: ComplianceFramework[]
  ): Promise<ComplianceProfile> {
    const profile: ComplianceProfile = {
      did,
      frameworks: [],
      riskAssessment: {
        systemType,
        intendedUse,
        overallRisk: this.assessRisk(systemType, intendedUse),
        risks: [],
        mitigations: [],
        humanOversight: {
          required: systemType !== 'general-purpose-model',
          type: this.getDefaultOversight(systemType),
          oversightPoints: [],
          override: {
            enabled: true,
            latency: 10,
            scope: ['high-risk-decisions'],
            authorizedOverseers: [],
          },
          overseerTraining: 'sovereign-mesh-oversight-certification-v1',
          competenceRequirements: ['ai-ethics', 'domain-expertise', 'sovereign-mesh-governance'],
        },
        assessmentDocument: '',
        assessmentDate: new Date(),
        assessor: did,  // Self-assessment initially
      },
      compliantCapabilities: [],
      runtimeRules: this.getDefaultRules(),
      auditLog: [{
        id: this.generateEventId(),
        timestamp: new Date(),
        type: 'profile-created',
        description: `Compliance profile created for ${systemType}`,
        severity: 'info',
        evidence: '',
        proof: '',
        resolved: true,
        actor: did,
        affectedParties: [did],
      }],
      status: 'pending-assessment',
      lastVerified: new Date(),
      nextAudit: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),  // 90 days
      crossBorder: {
        authorizedJurisdictions: ['global'],
        dataResidency: {
          default: 'EU',
          allowedRegions: ['EU', 'US', 'APAC'],
          prohibitedRegions: [],
          transferMechanism: 'SCCs',
        },
        transferRules: [],
        conflictResolution: {
          hierarchy: frameworks,
          defaultFramework: frameworks[0] || 'EU-AI-Act-2024',
        },
      },
    };
    
    // Add framework compliance for each requested framework
    for (const framework of frameworks) {
      profile.frameworks.push({
        framework,
        version: this.getFrameworkVersion(framework),
        credential: null as any,  // Will be issued
        obligations: this.getFrameworkObligations(framework, systemType),
        conformityAssessment: {
          date: new Date(),
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          certificateId: this.generateCertificateId(),
          status: 'active',
        },
        riskClass: profile.riskAssessment.overallRisk,
        conditions: [],
        postMarketMonitoring: true,
      });
    }
    
    this.profiles.set(did, profile);
    this.emit('compliance:profile-created', { did, systemType, risk: profile.riskAssessment.overallRisk });
    
    return profile;
  }
  
  /**
   * Check if action is compliant at runtime
   */
  async checkCompliance(
    did: string,
    action: string,
    capability: string,
    context: {
      data: string[];
      jurisdictions: string[];
      parties: string[];
      value?: number;
      autonomy?: number;
    }
  ): Promise<EnforcementDecision> {
    const profile = this.profiles.get(did);
    if (!profile) {
      throw new Error(`No compliance profile for: ${did}`);
    }
    
    const decision: EnforcementDecision = {
      actionId: this.generateActionId(),
      timestamp: new Date(),
      attemptedAction: action,
      capability,
      dataInvolved: context.data,
      jurisdictions: context.jurisdictions,
      parties: context.parties,
      checks: [],
      decision: 'allow',
      auditRequired: false,
      proof: '',
    };
    
    // Evaluate all active rules
    for (const rule of profile.runtimeRules.filter(r => r.active).sort((a, b) => b.priority - a.priority)) {
      const check = await this.evaluateRule(rule, context, profile);
      decision.checks.push(check);
      
      if (check.result === 'fail') {
        // Apply rule decision
        switch (rule.decision) {
          case 'deny':
            decision.decision = 'deny';
            decision.denialReasons = decision.denialReasons || [];
            decision.denialReasons.push(`Rule ${rule.id}: ${rule.name}`);
            break;
          case 'escalate':
            decision.decision = 'escalate';
            decision.requiredApprovers = rule.action.parameters?.approvers;
            break;
          case 'audit':
            decision.auditRequired = true;
            decision.auditLevel = rule.action.parameters?.level || 'detailed';
            break;
          case 'quarantine':
            decision.decision = 'modify';
            decision.modifications = ['quarantine-data'];
            break;
        }
        
        if (rule.decision === 'deny') break;  // Stop on deny
      }
    }
    
    // Framework-specific checks
    for (const framework of profile.frameworks) {
      const frameworkCheck = await this.checkFrameworkCompliance(framework, action, context);
      if (frameworkCheck) {
        decision.checks.push(frameworkCheck);
        if (frameworkCheck.result === 'fail') {
          decision.decision = 'deny';
          decision.denialReasons = decision.denialReasons || [];
          decision.denialReasons.push(`Framework ${framework.framework} violation`);
        }
      }
    }
    
    // Cross-border check
    const cbCheck = this.checkCrossBorder(context.jurisdictions, profile.crossBorder, context.data);
    decision.checks.push(cbCheck);
    if (cbCheck.result === 'fail') {
      decision.decision = 'deny';
      decision.denialReasons = decision.denialReasons || [];
      decision.denialReasons.push('Cross-border transfer not authorized');
    }
    
    // Log event
    const event: ComplianceEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      type: decision.decision === 'allow' ? 'capability-used' : 'rule-triggered',
      description: `${action} ${decision.decision}`,
      severity: decision.decision === 'deny' ? 'high' : 'info',
      action,
      capability,
      framework: profile.frameworks[0]?.framework,
      evidence: JSON.stringify(decision.checks),
      proof: decision.proof,
      resolved: decision.decision === 'allow',
      actor: did,
      affectedParties: context.parties,
    };
    
    profile.auditLog.push(event);
    this.decisions.push(decision);
    
    this.emit(`compliance:${decision.decision}`, { did, action, decision });
    
    return decision;
  }
  
  /**
   * Add runtime rule
   */
  addRule(did: string, rule: Omit<RuntimeRule, 'id'>): RuntimeRule {
    const profile = this.profiles.get(did);
    if (!profile) throw new Error(`Profile not found: ${did}`);
    
    const fullRule: RuntimeRule = {
      ...rule,
      id: this.generateRuleId(),
    };
    
    profile.runtimeRules.push(fullRule);
    
    this.emit('compliance:rule-added', { did, rule: fullRule });
    
    return fullRule;
  }
  
  /**
   * Get compliance report
   */
  async generateReport(did: string): Promise<{
    profile: ComplianceProfile;
    summary: {
      totalEvents: number;
      violations: number;
      remediated: number;
      currentStatus: ComplianceStatus;
      riskScore: number;
    };
    recommendations: string[];
  }> {
    const profile = this.profiles.get(did);
    if (!profile) throw new Error(`Profile not found: ${did}`);
    
    const violations = profile.auditLog.filter(e => e.type === 'violation-detected');
    const remediated = violations.filter(v => v.resolved);
    
    return {
      profile,
      summary: {
        totalEvents: profile.auditLog.length,
        violations: violations.length,
        remediated: remediated.length,
        currentStatus: profile.status,
        riskScore: this.calculateRiskScore(profile),
      },
      recommendations: this.generateRecommendations(profile),
    };
  }
  
  // Private helpers
  private assessRisk(systemType: AISystemType, intendedUse: string): RiskCategory {
    if (systemType === 'subliminal-manipulation' || systemType === 'social-scoring') {
      return 'unacceptable';
    }
    if (['biometric-identification', 'critical-infrastructure', 'law-enforcement'].includes(systemType)) {
      return 'high';
    }
    if (systemType === 'general-purpose-model') {
      return 'general-purpose';
    }
    if (['employment', 'education-vocational', 'essential-services'].includes(systemType)) {
      return 'high';
    }
    return 'limited';
  }
  
  private getDefaultOversight(systemType: AISystemType): HumanOversightPlan['type'] {
    if (['biometric-identification', 'critical-infrastructure', 'law-enforcement'].includes(systemType)) {
      return 'human-in-the-loop';
    }
    return 'human-on-the-loop';
  }
  
  private getDefaultRules(): RuntimeRule[] {
    return [
      {
        id: 'rule-1',
        name: 'High Risk Human Oversight',
        trigger: { event: 'high-risk-action', condition: 'autonomy > 80' },
        check: { type: 'risk-level', parameters: { threshold: 'high' } },
        decision: 'escalate',
        action: { type: 'request-approval', parameters: { approvers: ['oversight-committee'] } },
        priority: 100,
        active: true,
      },
      {
        id: 'rule-2',
        name: 'GDPR Data Protection',
        trigger: { event: 'personal-data-access', condition: 'always' },
        check: { type: 'data-type', parameters: { categories: ['personal', 'sensitive'] } },
        decision: 'audit',
        action: { type: 'log', parameters: { level: 'detailed' } },
        priority: 90,
        active: true,
      },
      {
        id: 'rule-3',
        name: 'Cross-Border Transfer',
        trigger: { event: 'data-transfer', condition: 'cross-border' },
        check: { type: 'cross-border', parameters: { requireAuthorization: true } },
        decision: 'deny',
        action: { type: 'block' },
        priority: 95,
        active: true,
      },
      {
        id: 'rule-4',
        name: 'Autonomous Spending Limit',
        trigger: { event: 'economic-transaction', condition: 'value > 10000' },
        check: { type: 'consent', parameters: { maxAutonomous: 10000 } },
        decision: 'escalate',
        action: { type: 'request-approval', parameters: { approvers: ['treasury-committee'] } },
        priority: 80,
        active: true,
      },
    ];
  }
  
  private async evaluateRule(
    rule: RuntimeRule,
    context: any,
    profile: ComplianceProfile
  ): Promise<ComplianceCheck> {
    // Simulate rule evaluation
    let result: ComplianceCheck['result'] = 'pass';
    
    if (rule.check.type === 'risk-level' && context.autonomy > 80) {
      result = 'fail';
    }
    
    if (rule.check.type === 'cross-border' && context.jurisdictions.length > 1) {
      const authorized = profile.crossBorder.authorizedJurisdictions;
      const allAuthorized = context.jurisdictions.every((j: string) => 
        authorized.includes(j) || authorized.includes('global')
      );
      if (!allAuthorized) result = 'fail';
    }
    
    return {
      ruleId: rule.id,
      check: rule.name,
      result,
      evidence: JSON.stringify(context),
      timestamp: new Date(),
    };
  }
  
  private async checkFrameworkCompliance(
    framework: FrameworkCompliance,
    action: string,
    context: any
  ): Promise<ComplianceCheck | null> {
    // Simulate framework check
    return {
      ruleId: `framework-${framework.framework}`,
      framework: framework.framework,
      check: `Framework ${framework.framework} compliance`,
      result: 'pass',
      evidence: action,
      timestamp: new Date(),
    };
  }
  
  private checkCrossBorder(
    jurisdictions: string[],
    cbConfig: CrossBorderCompliance,
    dataTypes: string[]
  ): ComplianceCheck {
    const allAuthorized = jurisdictions.every(j => 
      cbConfig.authorizedJurisdictions.includes(j) || 
      cbConfig.authorizedJurisdictions.includes('global')
    );
    
    return {
      ruleId: 'cross-border',
      check: 'Cross-border authorization',
      result: allAuthorized ? 'pass' : 'fail',
      evidence: jurisdictions.join(','),
      timestamp: new Date(),
    };
  }
  
  private calculateRiskScore(profile: ComplianceProfile): number {
    const riskWeights = {
      'unacceptable': 100,
      'high': 75,
      'limited': 50,
      'minimal': 25,
      'general-purpose': 40,
    };
    return riskWeights[profile.riskAssessment.overallRisk] || 50;
  }
  
  private generateRecommendations(profile: ComplianceProfile): string[] {
    const recs: string[] = [];
    
    if (profile.status === 'pending-assessment') {
      recs.push('Complete conformity assessment for all frameworks');
    }
    
    if (profile.riskAssessment.overallRisk === 'high') {
      recs.push('Implement enhanced human oversight for high-risk capabilities');
      recs.push('Register as high-risk AI system under EU AI Act');
    }
    
    const violations = profile.auditLog.filter(e => e.type === 'violation-detected' && !e.resolved);
    if (violations.length > 0) {
      recs.push(`Address ${violations.length} outstanding compliance violations`);
    }
    
    return recs;
  }
  
  private getFrameworkVersion(framework: ComplianceFramework): string {
    const versions: Record<string, string> = {
      'EU-AI-Act-2024': '2024-08-01',
      'GDPR-2016': '2016-05-25',
      'NIST-AIRMF': '1.0',
    };
    return versions[framework] || '1.0';
  }
  
  private getFrameworkObligations(framework: ComplianceFramework, systemType: AISystemType): ComplianceObligation[] {
    // Simplified obligations - real implementation would be comprehensive
    return [
      {
        id: 'ob-1',
        requirement: 'Conformity assessment',
        implemented: false,
        implementationMethod: 'Third-party assessment',
        evidence: '',
        status: 'not-applicable',
      },
      {
        id: 'ob-2',
        requirement: 'CE marking',
        implemented: false,
        implementationMethod: 'Post-assessment',
        evidence: '',
        status: 'not-applicable',
      },
      {
        id: 'ob-3',
        requirement: 'Quality management system',
        implemented: true,
        implementationMethod: 'ISO 9001 aligned',
        evidence: 'qms-document-v1',
        verifiedBy: 'self',
        verifiedAt: new Date(),
        status: 'compliant',
      },
    ];
  }
  
  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  
  private generateActionId(): string {
    return `action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  
  private generateRuleId(): string {
    return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  
  private generateCertificateId(): string {
    return `cert-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
}

export const complianceEngine = new RuntimeComplianceEngine();