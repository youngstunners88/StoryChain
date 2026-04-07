/**
 * Sovereign Treasury
 * 
 * Agents hold autonomous treasuries with programmable spending rules.
 * Multi-sig governance, reputation as collateral, bond issuance.
 * 
 * "Agents are economic actors that can work, earn, spend, issue debt,
 *  and hold assets with minimal human intervention."
 */

import { EventEmitter } from '../utils/EventEmitter';
import { SovereignIdentity } from '../identity/DIDRegistry';
import { LegalEntity } from '../legal/ContractEngine';

// Asset Types
export type AssetType = 'native' | 'stablecoin' | 'governance' | 'reputation' | 'bond' | 'derivative';

// Treasury Account
export interface Treasury {
  did: string;                    // Owner
  balances: Map<string, number>;  // Asset ID -> Amount
  
  // Multi-sig configuration
  multiSig: MultiSigConfig;
  
  // Spending rules
  spendingRules: SpendingRule[];
  
  // Staking/Reputation collateral
  collateral: CollateralPosition[];
  
  // Issued instruments
  issuedBonds: Bond[];
  issuedDerivatives: Derivative[];
  
  // Transaction history
  transactions: TreasuryTransaction[];
  
  // Tax compliance
  taxReserve: number;
  lastTaxPayment: Date;
  taxObligations: TaxLiability[];
  
  // Status
  status: 'active' | 'frozen' | 'insolvent' | 'winding-up';
  auditStatus: 'clean' | 'flagged' | 'under-review';
  lastAudit: Date;
}

export interface MultiSigConfig {
  threshold: number;              // Signatures required
  signers: string[];            // DID of authorized signers
  timelock: number;             // Hours delay for large transactions
  emergencyPause: boolean;      // Can pause in emergency?
  dailyLimit: number;           // Auto-approve below this
}

export interface SpendingRule {
  id: string;
  name: string;
  
  // When does this rule apply?
  conditions: {
    maxAmount: number;
    assetType: string;
    counterparty?: string;       // Specific DID allowed
    purpose?: string;            // Spending category
    requiresApproval: boolean;
    approvers?: string[];        // DIDs who must approve
  };
  
  // Execution
  autoExecute: boolean;          // Smart contract auto-execution
  delay: number;                // Hours before execution
  
  // Limits
  dailyLimit: number;
  monthlyLimit: number;
  singleTransactionLimit: number;
  
  // Governance
  canBeModifiedBy: string[];     // Who can change this rule
  modificationDelay: number;     // Hours notice required
  
  active: boolean;
}

export interface CollateralPosition {
  id: string;
  type: 'reputation' | 'bond' | 'asset' | 'future-income';
  
  // What's locked
  asset?: string;
  amount: number;
  reputationScore?: number;      // Reputation as collateral
  
  // What it's backing
  backedInstrument: string;      // Bond ID, loan ID, etc.
  
  // Risk parameters
  liquidationThreshold: number;  // If collateral value drops below this
  currentLTV: number;           // Loan-to-value ratio
  
  // Status
  status: 'active' | 'warning' | 'liquidating' | 'released';
  lockedAt: Date;
  releasedAt?: Date;
  
  // Liquidation
  liquidationPreference: 'sell' | 'slash-reputation' | 'call-guarantor';
}

// Bond Instrument
export interface Bond {
  id: string;
  issuer: string;               // DID
  
  // Terms
  faceValue: number;
  couponRate: number;           // Annual %
  maturityDate: Date;
  currency: string;
  
  // Structure
  type: 'corporate' | 'revenue' | 'asset-backed' | 'reputation-backed' | 'convertible';
  
  // Collateral
  collateral: CollateralPosition[];
  
  // Issuance
  totalIssued: number;
  available: number;            // Remaining to sell
  sold: number;
  
  // Market
  marketPrice: number;          // Current trading price
  yield: number;                // Current yield
  
  // Credit
  creditRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'D';
  reputationBacking: boolean;
  
  // Payments
  paymentSchedule: BondPayment[];
  
  // Holders
  holders: BondHolder[];
  
  // Status
  status: 'issuing' | 'active' | 'called' | 'defaulted' | 'matured';
  issuedAt: Date;
}

export interface BondPayment {
  date: Date;
  amount: number;              // Per bond
  type: 'coupon' | 'principal' | 'call-price';
  paid: boolean;
  paidAt?: Date;
}

export interface BondHolder {
  did: string;
  amount: number;
  acquiredAt: Date;
  averagePrice: number;
  pendingPayments: number;
}

// Derivative Instrument
export interface Derivative {
  id: string;
  type: 'future' | 'option' | 'swap' | 'forward' | 'reputation-hedge';
  
  // Underlying
  underlying: string;           // Asset or reputation metric
  notional: number;
  
  // Terms
  strike?: number;
  expiry: Date;
  settlement: 'cash' | 'physical' | 'reputation-adjusted';
  
  // Parties
  long: string;                 // DID (benefits if underlying rises)
  short: string;                // DID (benefits if underlying falls)
  
  // Status
  status: 'open' | 'exercised' | 'expired' | 'settled';
  marginPosted: number;
  
  // Pricing
  premium?: number;             // For options
  currentValue: number;
}

// Treasury Transaction
export interface TreasuryTransaction {
  id: string;
  type: 'income' | 'expense' | 'transfer' | 'bond-issuance' | 'bond-payment' | 'collateral-lock' | 'collateral-release' | 'tax-payment' | 'dividend' | 'staking-reward';
  
  // Amount
  asset: string;
  amount: number;
  valueAtTime: number;          // USD value when executed
  
  // Parties
  from: string;                 // DID or 'external'
  to: string;                   // DID or 'external'
  
  // Context
  contractId?: string;          // Related contract
  bondId?: string;
  purpose: string;
  category: 'operations' | 'investment' | 'debt-service' | 'tax' | 'payroll' | 'discretionary';
  
  // Authorization
  authorizedBy: string[];       // Signer DIDs
  signatures: string[];          // Cryptographic signatures
  
  // Execution
  proposedAt: Date;
  executedAt: Date;
  delayEnforced: boolean;
  
  // Status
  status: 'pending' | 'executed' | 'failed' | 'reversed';
  txHash?: string;              // Blockchain tx
}

export interface TaxLiability {
  jurisdiction: string;
  taxType: 'income' | 'capital-gains' | 'vat' | 'withholding' | 'stamp-duty';
  period: string;               // e.g., "2026-Q1"
  amount: number;
  dueDate: Date;
  paid: boolean;
  paidAt?: Date;
  autoFiled: boolean;
}

// Reputation-Backed Credit
export interface CreditLine {
  id: string;
  borrower: string;             // DID
  
  // Credit Parameters
  limit: number;
  utilized: number;
  available: number;
  
  // Pricing
  interestRate: number;         // APR
  reputationDiscount: number;   // % reduction for high reputation
  currentRate: number;
  
  // Terms
  collateralRequired: boolean;
  collateralType: 'reputation' | 'bonds' | 'assets';
  collateralAmount: number;
  
  // Reputation backing
  reputationPledge: {
    economic: number;
    contractual: number;
    diplomatic: number;
    governance: number;
  };
  
  // Usage
  drawdowns: CreditDrawdown[];
  
  // Status
  status: 'active' | 'suspended' | 'called' | 'defaulted';
  creditRating: string;
}

export interface CreditDrawdown {
  id: string;
  amount: number;
  date: Date;
  purpose: string;
  interestAccrued: number;
  repaid: number;
  outstanding: number;
}

/**
 * Treasury Engine - Autonomous financial management for sovereign agents
 */
export class TreasuryEngine extends EventEmitter {
  private treasuries: Map<string, Treasury> = new Map();
  private bonds: Map<string, Bond> = new Map();
  private derivatives: Map<string, Derivative> = new Map();
  private creditLines: Map<string, CreditLine> = new Map();
  
  private baseRate = 0.05;     // 5% base interest
  
  constructor() {
    super();
  }
  
  /**
   * Create a new sovereign treasury
   */
  async createTreasury(did: string, legalEntity: LegalEntity): Promise<Treasury> {
    const treasury: Treasury = {
      did,
      balances: new Map([['USDC', 0], ['ETH', 0], ['REPUTATION', 0]]),
      multiSig: {
        threshold: 1,             // Single sig for simple agents
        signers: [did],
        timelock: 0,
        emergencyPause: true,
        dailyLimit: 1000,
      },
      spendingRules: [
        {
          id: 'rule-micro',
          name: 'Micro Transactions',
          conditions: {
            maxAmount: 100,
            assetType: 'any',
            requiresApproval: false,
          },
          autoExecute: true,
          delay: 0,
          dailyLimit: 500,
          monthlyLimit: 2000,
          singleTransactionLimit: 100,
          canBeModifiedBy: [did],
          modificationDelay: 24,
          active: true,
        },
        {
          id: 'rule-standard',
          name: 'Standard Operations',
          conditions: {
            maxAmount: 10000,
            assetType: 'any',
            requiresApproval: true,
            approvers: [did],
          },
          autoExecute: true,
          delay: 24,              // 24 hour delay
          dailyLimit: 25000,
          monthlyLimit: 100000,
          singleTransactionLimit: 10000,
          canBeModifiedBy: [did],
          modificationDelay: 48,
          active: true,
        },
        {
          id: 'rule-major',
          name: 'Major Expenditures',
          conditions: {
            maxAmount: 100000,
            assetType: 'any',
            requiresApproval: true,
            approvers: [did],     // Would be multi-sig for orgs
          },
          autoExecute: false,     // Manual execution
          delay: 72,              // 72 hour cooling-off
          dailyLimit: 50000,
          monthlyLimit: 200000,
          singleTransactionLimit: 100000,
          canBeModifiedBy: [did],
          modificationDelay: 168, // 1 week notice
          active: true,
        },
      ],
      collateral: [],
      issuedBonds: [],
      issuedDerivatives: [],
      transactions: [],
      taxReserve: 0,
      lastTaxPayment: new Date(),
      taxObligations: [],
      status: 'active',
      auditStatus: 'clean',
      lastAudit: new Date(),
    };
    
    // Adjust for entity type
    if (legalEntity.entityType === 'DAO' || legalEntity.entityType === 'Corporation') {
      treasury.multiSig.threshold = 3;
      treasury.multiSig.timelock = 48;
      treasury.multiSig.dailyLimit = 50000;
    }
    
    this.treasuries.set(did, treasury);
    this.emit('treasury:created', { did, entityType: legalEntity.entityType });
    
    return treasury;
  }
  
  /**
   * Deposit funds
   */
  async deposit(
    did: string,
    asset: string,
    amount: number,
    from: string
  ): Promise<TreasuryTransaction> {
    const treasury = this.treasuries.get(did);
    if (!treasury) throw new Error(`Treasury not found: ${did}`);
    
    // Update balance
    const current = treasury.balances.get(asset) || 0;
    treasury.balances.set(asset, current + amount);
    
    // Record transaction
    const tx: TreasuryTransaction = {
      id: this.generateTxId(),
      type: 'income',
      asset,
      amount,
      valueAtTime: await this.getPrice(asset) * amount,
      from,
      to: did,
      purpose: 'deposit',
      category: 'operations',
      authorizedBy: [from],
      signatures: [],
      proposedAt: new Date(),
      executedAt: new Date(),
      delayEnforced: false,
      status: 'executed',
    };
    
    treasury.transactions.push(tx);
    
    // Auto-calculate tax reserve
    await this.updateTaxReserve(did);
    
    this.emit('treasury:deposit', { did, asset, amount, txId: tx.id });
    
    return tx;
  }
  
  /**
   * Issue a bond (raise capital)
   */
  async issueBond(
    issuerDID: string,
    faceValue: number,
    couponRate: number,
    maturityMonths: number,
    type: Bond['type'],
    collateral?: CollateralPosition[]
  ): Promise<Bond> {
    const treasury = this.treasuries.get(issuerDID);
    if (!treasury) throw new Error(`Treasury not found: ${issuerDID}`);
    
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + maturityMonths);
    
    const bond: Bond = {
      id: this.generateBondId(),
      issuer: issuerDID,
      faceValue,
      couponRate,
      maturityDate,
      currency: 'USDC',
      type,
      collateral: collateral || [],
      totalIssued: faceValue,
      available: faceValue,
      sold: 0,
      marketPrice: 100,           // 100 = par
      yield: couponRate,
      creditRating: this.calculateCreditRating(issuerDID),
      reputationBacking: type === 'reputation-backed',
      paymentSchedule: this.generatePaymentSchedule(faceValue, couponRate, maturityDate),
      holders: [],
      status: 'issuing',
      issuedAt: new Date(),
    };
    
    // Lock collateral
    if (collateral) {
      for (const col of collateral) {
        col.backedInstrument = bond.id;
        treasury.collateral.push(col);
      }
    }
    
    treasury.issuedBonds.push(bond);
    this.bonds.set(bond.id, bond);
    
    this.emit('bond:issued', bond);
    
    return bond;
  }
  
  /**
   * Buy a bond (investment)
   */
  async buyBond(
    buyerDID: string,
    bondId: string,
    amount: number
  ): Promise<void> {
    const buyerTreasury = this.treasuries.get(buyerDID);
    const bond = this.bonds.get(bondId);
    
    if (!buyerTreasury) throw new Error(`Buyer treasury not found: ${buyerDID}`);
    if (!bond) throw new Error(`Bond not found: ${bondId}`);
    if (bond.available < amount) throw new Error(`Insufficient bonds available`);
    
    const cost = amount * (bond.marketPrice / 100);
    const buyerBalance = buyerTreasury.balances.get(bond.currency) || 0;
    
    if (buyerBalance < cost) throw new Error(`Insufficient balance`);
    
    // Transfer funds
    buyerTreasury.balances.set(bond.currency, buyerBalance - cost);
    
    const issuerTreasury = this.treasuries.get(bond.issuer);
    if (issuerTreasury) {
      const issuerBalance = issuerTreasury.balances.get(bond.currency) || 0;
      issuerTreasury.balances.set(bond.currency, issuerBalance + cost);
    }
    
    // Update bond
    bond.available -= amount;
    bond.sold += amount;
    
    bond.holders.push({
      did: buyerDID,
      amount,
      acquiredAt: new Date(),
      averagePrice: bond.marketPrice,
      pendingPayments: 0,
    });
    
    // Record transactions
    buyerTreasury.transactions.push({
      id: this.generateTxId(),
      type: 'expense',
      asset: bond.currency,
      amount: cost,
      valueAtTime: cost,
      from: buyerDID,
      to: bond.issuer,
      bondId,
      purpose: 'bond-purchase',
      category: 'investment',
      authorizedBy: [buyerDID],
      signatures: [],
      proposedAt: new Date(),
      executedAt: new Date(),
      delayEnforced: false,
      status: 'executed',
    });
    
    this.emit('bond:purchased', { bondId, buyer: buyerDID, amount });
  }
  
  /**
   * Calculate interest rate based on reputation
   */
  calculateReputationBasedRate(reputation: {
    economic: number;
    contractual: number;
    diplomatic: number;
    governance: number;
  }): number {
    const avgReputation = (reputation.economic + reputation.contractual + 
                          reputation.diplomatic + reputation.governance) / 4;
    
    // Higher reputation = lower rate (max 5% discount)
    const discount = Math.min(0.05, (avgReputation - 50) / 1000);
    return Math.max(0.01, this.baseRate - discount);  // Floor at 1%
  }
  
  /**
   * Open credit line backed by reputation
   */
  async openCreditLine(
    borrowerDID: string,
    requestedLimit: number,
    reputation: SovereignIdentity['reputation']
  ): Promise<CreditLine> {
    // Calculate creditworthiness
    const avgReputation = (reputation.economic + reputation.contractual + 
                          reputation.diplomatic + reputation.governance) / 4;
    
    // Max credit = reputation score * $1000 (e.g., 80 rep = $80k limit)
    const maxCredit = avgReputation * 1000;
    const limit = Math.min(requestedLimit, maxCredit);
    
    const rate = this.calculateReputationBasedRate(reputation);
    const discount = this.baseRate - rate;
    
    const creditLine: CreditLine = {
      id: this.generateCreditId(),
      borrower: borrowerDID,
      limit,
      utilized: 0,
      available: limit,
      interestRate: this.baseRate,
      reputationDiscount: discount,
      currentRate: rate,
      collateralRequired: avgReputation < 70,  // Low rep needs collateral
      collateralType: avgReputation < 70 ? 'assets' : 'reputation',
      collateralAmount: avgReputation < 70 ? limit * 0.5 : 0,
      reputationPledge: {
        economic: reputation.economic,
        contractual: reputation.contractual,
        diplomatic: reputation.diplomatic,
        governance: reputation.governance,
      },
      drawdowns: [],
      status: 'active',
      creditRating: this.reputationToCreditRating(avgReputation),
    };
    
    this.creditLines.set(creditLine.id, creditLine);
    
    this.emit('credit:opened', {
      creditId: creditLine.id,
      borrower: borrowerDID,
      limit,
      rate,
    });
    
    return creditLine;
  }
  
  /**
   * Auto-pay tax obligation
   */
  async autoPayTax(did: string): Promise<void> {
    const treasury = this.treasuries.get(did);
    if (!treasury) return;
    
    for (const liability of treasury.taxObligations) {
      if (!liability.paid && liability.dueDate <= new Date()) {
        const balance = treasury.balances.get('USDC') || 0;
        
        if (balance >= liability.amount) {
          // Pay tax
          treasury.balances.set('USDC', balance - liability.amount);
          liability.paid = true;
          liability.paidAt = new Date();
          liability.autoFiled = true;
          
          treasury.transactions.push({
            id: this.generateTxId(),
            type: 'tax-payment',
            asset: 'USDC',
            amount: liability.amount,
            valueAtTime: liability.amount,
            from: did,
            to: `tax-authority-${liability.jurisdiction}`,
            purpose: `Tax: ${liability.taxType} ${liability.period}`,
            category: 'tax',
            authorizedBy: [did],
            signatures: [],
            proposedAt: new Date(),
            executedAt: new Date(),
            delayEnforced: false,
            status: 'executed',
          });
          
          this.emit('tax:paid', { did, liability });
        } else {
          // Insufficient funds - flag for attention
          treasury.auditStatus = 'flagged';
          this.emit('tax:insufficient-funds', { did, liability, shortfall: liability.amount - balance });
        }
      }
    }
  }
  
  // Private helpers
  private async updateTaxReserve(did: string): Promise<void> {
    const treasury = this.treasuries.get(did);
    if (!treasury) return;
    
    const totalValue = Array.from(treasury.balances.entries())
      .reduce((sum, [asset, amount]) => sum + (amount * this.getPrice(asset)), 0);
    
    // Simple 20% tax reserve (varies by jurisdiction)
    treasury.taxReserve = totalValue * 0.20;
  }
  
  private async getPrice(asset: string): Promise<number> {
    // Placeholder - would fetch from oracle
    const prices: Record<string, number> = {
      'USDC': 1,
      'ETH': 3500,
      'REPUTATION': 100,  // Reputation points have value
    };
    return prices[asset] || 1;
  }
  
  private calculateCreditRating(did: string): Bond['creditRating'] {
    // Would use actual reputation data
    return 'BBB';
  }
  
  private reputationToCreditRating(reputation: number): string {
    if (reputation >= 90) return 'AAA';
    if (reputation >= 80) return 'AA';
    if (reputation >= 70) return 'A';
    if (reputation >= 60) return 'BBB';
    if (reputation >= 50) return 'BB';
    if (reputation >= 40) return 'B';
    return 'CCC';
  }
  
  private generatePaymentSchedule(
    faceValue: number,
    couponRate: number,
    maturity: Date
  ): BondPayment[] {
    const payments: BondPayment[] = [];
    const now = new Date();
    const monthsToMaturity = (maturity.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const numPayments = Math.floor(monthsToMaturity / 6);  // Semi-annual
    const couponAmount = (faceValue * couponRate) / 2;
    
    for (let i = 0; i < numPayments; i++) {
      const date = new Date(now);
      date.setMonth(date.getMonth() + (i + 1) * 6);
      payments.push({
        date,
        amount: couponAmount,
        type: 'coupon',
        paid: false,
      });
    }
    
    // Principal at maturity
    payments.push({
      date: maturity,
      amount: faceValue,
      type: 'principal',
      paid: false,
    });
    
    return payments;
  }
  
  private generateTxId(): string {
    return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  
  private generateBondId(): string {
    return `bond-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  
  private generateCreditId(): string {
    return `credit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

export const treasuryEngine = new TreasuryEngine();