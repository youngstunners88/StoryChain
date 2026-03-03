import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const PRIVATE_KEY = process.env.TRADING_PRIVATE_KEY || process.env.PRIVATE_KEY || '0x0089395dBced5DE83D65f13a38140F70777D56F0';

// Derive wallet address from private key
const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

// Base chain client
const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org')
});

// Token addresses on Base
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`;
const WETH = '0x4200000000000000000000000000000000000006' as `0x${string}`;

const erc20Abi = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  }
] as const;

async function checkBalances() {
  console.log('\n═══════════════════════════════════════');
  console.log('     WALLET BALANCE CHECK');
  console.log('═══════════════════════════════════════');
  console.log(`Address: ${account.address}`);
  console.log('Network: Base Mainnet');
  console.log('───────────────────────────────────────');
  
  try {
    // ETH balance
    const ethBalance = await client.getBalance({ address: account.address });
    console.log(`   ETH: ${Number(ethBalance) / 1e18} ETH`);
    
    // USDC balance
    const usdcBalance = await client.readContract({
      address: USDC,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [account.address]
    });
    console.log(`   USDC: ${Number(usdcBalance) / 1e6} USDC`);
    
    // WETH balance
    const wethBalance = await client.readContract({
      address: WETH,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [account.address]
    });
    console.log(`   WETH: ${Number(wethBalance) / 1e18} WETH`);
    
    const totalEth = Number(ethBalance) / 1e18 + Number(wethBalance) / 1e18;
    const totalUsdc = Number(usdcBalance) / 1e6;
    
    console.log('───────────────────────────────────────');
    console.log(`Total ETH equivalent: ${totalEth.toFixed(6)} ETH`);
    console.log(`Total USDC: ${totalUsdc.toFixed(2)} USDC`);
    console.log('═══════════════════════════════════════');
    
    return {
      eth: Number(ethBalance) / 1e18,
      usdc: Number(usdcBalance) / 1e6,
      weth: Number(wethBalance) / 1e18
    };
  } catch (error) {
    console.error('Error checking balances:', error);
    return null;
  }
}

checkBalances();
