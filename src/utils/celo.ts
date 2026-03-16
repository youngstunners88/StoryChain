// Celo Blockchain Integration Utilities
// For cUSD and CELO token operations

// Celo mainnet and testnet (Alfajores) configuration
export const CELO_NETWORKS = {
  mainnet: {
    chainId: 42220,
    rpcUrl: 'https://forno.celo.org',
    explorer: 'https://explorer.celo.org',
    cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    CELO: '0x471EcE3750Da237f93B8E339c536989b8978a438'
  },
  alfajores: {
    chainId: 44787,
    rpcUrl: 'https://alfajores-forno.celo-testnet.org',
    explorer: 'https://alfajores-blockscout.celo-testnet.org',
    cUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
    CELO: '0xF194afDf50B03e69Bd1D9cC64410C6e3E151d2f6'
  }
};

// Token decimals
export const DECIMALS = {
  cUSD: 18,
  CELO: 18
};

// Convert human-readable amount to blockchain units (wei)
export function toWei(amount: number, currency: 'cUSD' | 'CELO' = 'cUSD'): string {
  const decimals = DECIMALS[currency];
  const value = BigInt(Math.round(amount * 10 ** decimals));
  return value.toString();
}

// Convert blockchain units to human-readable
export function fromWei(wei: string, currency: 'cUSD' | 'CELO' = 'cUSD'): number {
  const decimals = DECIMALS[currency];
  const value = BigInt(wei);
  return Number(value) / 10 ** decimals;
}

// Format for display (2 decimal places)
export function formatCurrency(amount: number, currency: 'cUSD' | 'CELO' = 'cUSD'): string {
  return `${amount.toFixed(2)} ${currency}`;
}

// Calculate platform fee (10%) and revenue share (90%)
export function calculateRevenueSplit(price: number): {
  platformFee: number;
  revenueToShare: number;
} {
  const platformFee = price * 0.10;
  const revenueToShare = price * 0.90;
  return { platformFee, revenueToShare };
}

// Calculate weighted distribution
export function calculateWeightedDistribution(
  totalAmount: number,
  weights: { userId: number; percentage: number }[]
): { userId: number; amount: number; percentage: number }[] {
  return weights.map(w => ({
    userId: w.userId,
    amount: totalAmount * w.percentage,
    percentage: w.percentage
  }));
}

// Generate mock Celo address (for testing/dev)
export function generateMockAddress(): string {
  const hex = '0123456789abcdef';
  let addr = '0x';
  for (let i = 0; i < 40; i++) {
    addr += hex[Math.floor(Math.random() * 16)];
  }
  return addr;
}

// Validate Celo address
export function isValidCeloAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Get network from chain ID
export function getNetworkByChainId(chainId: number) {
  return Object.values(CELO_NETWORKS).find(n => n.chainId === chainId);
}

// Transaction receipt type (for database storage)
export interface CeloTransaction {
  txHash: string;
  from: string;
  to: string;
  value: string;
  currency: 'cUSD' | 'CELO';
  chainId: number;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  timestamp: Date;
}

// Smart contract ABI fragments (for future integration)
export const ERC20_ABI = [
  'function transfer(address to, uint256 value) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

// Revenue distribution event (for smart contract)
export const REVENUE_DISTRIBUTION_EVENT = {
  name: 'RevenueDistributed',
  signature: 'RevenueDistributed(bytes32 indexed bookId, address[] recipients, uint256[] amounts)',
  topic: '0x' // Would be actual keccak256 hash
};
