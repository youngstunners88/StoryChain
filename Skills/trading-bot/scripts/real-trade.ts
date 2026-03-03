#!/usr/bin/env bun
/**
 * REAL TRADING SCRIPT - Execute swaps on Base chain
 */

import { createWalletClient, createPublicClient, http, parseEther, formatEther } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Configuration
const PRIVATE_KEY = '0xe3b770f13153f0a55a0c76588ca9ba02a26c820efce1ed16906ff8514ff2d29b';
const BASE_RPC = 'https://mainnet.base.org';

// Token addresses on Base
const TOKENS = {
  WETH: '0x4200000000000000000000000000000000000006' as `0x${string}`,
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
  // Uniswap V3 Router on Base
  ROUTER: '0x2626664c2603336E57B271c5C0b26F421741e481' as `0x${string}`,
};

// ERC20 ABI (minimal)
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;

async function main() {
  console.log('=== BASE CHAIN TRADER ===\n');

  // Create account from private key
  const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
  console.log('Wallet:', account.address);

  // Create clients
  const publicClient = createPublicClient({
    chain: base,
    transport: http(BASE_RPC),
  });

  const walletClient = createWalletClient({
    chain: base,
    transport: http(BASE_RPC),
    account,
  });

  // Check ETH balance
  const ethBalance = await publicClient.getBalance({ address: account.address });
  console.log('ETH Balance:', formatEther(ethBalance), 'ETH');

  // Check USDC balance
  const usdcBalance = await publicClient.readContract({
    address: TOKENS.USDC,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  }) as bigint;
  console.log('USDC Balance:', Number(usdcBalance) / 1e6, 'USDC');

  console.log('\n--- Ready to trade ---');
  console.log('To execute a swap, specify the token and amount');
}

main().catch(console.error);
