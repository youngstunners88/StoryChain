import { createWalletClient, createPublicClient, http, formatUnits, parseUnits, Address } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const PRIVATE_KEY = '0xe3b770f13153f0a55a0c76588ca9ba02a26c820efce1ed16906ff8514ff2d29b' as `0x${string}`;
const account = privateKeyToAccount(PRIVATE_KEY);

const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address;
const WETH = '0x4200000000000000000000000000000000000006' as Address;
const CLAWKED = '0xe54F44b6e1F5F5e7BB2222b21Ba5aAe9FFf2d812' as Address;

// Uniswap Universal Router on Base
const UNIVERSAL_ROUTER = '0x198EF79F6F889A63559994289b278F258ef55177' as Address;

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Universal Router commands
const COMMANDS = {
  V3_SWAP_EXACT_IN: 0x00,
  V2_SWAP_EXACT_IN: 0x08,
  PERMIT2_TRANSFER_FROM: 0x0a,
};

async function main() {
  const publicClient = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org'),
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http('https://mainnet.base.org'),
  });

  console.log(`Wallet: ${account.address}`);
  
  // Check balances
  const usdcBalance = await publicClient.readContract({
    address: USDC,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });
  console.log(`USDC Balance: ${formatUnits(usdcBalance as bigint, 6)}`);

  const ethBalance = await publicClient.getBalance({ address: account.address });
  console.log(`ETH Balance: ${formatUnits(ethBalance, 18)}`);

  // Let's use 0x API (DEX aggregator) for better routing
  console.log('\nGetting swap quote from 0x API...');
  
  const amountIn = parseUnits('4.5', 6);
  const slippageBps = 500; // 5%
  
  const quoteUrl = `https://api.0x.org/swap/v1/quote?buyToken=${WETH}&sellToken=${USDC}&sellAmount=${amountIn}&slippagePercentage=0.05`;
  
  try {
    const response = await fetch(quoteUrl, {
      headers: {
        '0x-api-key': 'dd19e49a-0f84-40c6-a35c-8eec4d8e7a79',
      },
    });
    const quote = await response.json();
    console.log('Quote received:', JSON.stringify(quote, null, 2).substring(0, 500));
    
    if (quote.code) {
      console.log('Error from 0x:', quote);
      return;
    }
    
    // Execute the swap
    console.log('\nExecuting swap...');
    const tx = await walletClient.sendTransaction({
      to: quote.to,
      data: quote.data,
      value: BigInt(quote.value || 0),
      gas: BigInt(quote.gas),
    });
    console.log(`Swap tx: ${tx}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
    console.log(`Swap confirmed! Gas used: ${receipt.gasUsed}`);
    
  } catch (e) {
    console.log('0x API error:', e);
    
    // Fallback: Try 1inch API
    console.log('\nTrying 1inch API...');
    const oneInchUrl = `https://api.1inch.dev/swap/v6.0/8453/quote?src=${USDC}&dst=${WETH}&amount=${amountIn}`;
    try {
      const resp = await fetch(oneInchUrl, {
        headers: {
          'Authorization': 'Bearer demo',
          'Content-Type': 'application/json',
        },
      });
      const data = await resp.json();
      console.log('1inch response:', JSON.stringify(data, null, 2).substring(0, 500));
    } catch (e2) {
      console.log('1inch also failed:', e2);
    }
  }

  // Check final balance
  const wethBalance = await publicClient.readContract({
    address: WETH,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });
  console.log(`\nWETH Balance: ${formatUnits(wethBalance as bigint, 18)}`);
}

main().catch(console.error);
