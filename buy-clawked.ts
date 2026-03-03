import { createWalletClient, createPublicClient, http, formatUnits, parseUnits, Address } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Conway wallet private key
const PRIVATE_KEY = '0xe3b770f13153f0a55a0c76588ca9ba02a26c820efce1ed16906ff8514ff2d29b' as `0x${string}`;
const account = privateKeyToAccount(PRIVATE_KEY);

const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address;
const WETH = '0x4200000000000000000000000000000000000006' as Address;
const CLAWKED = '0xe54F44b6e1F5F5e7BB2222b21Ba5aAe9FFf2d812' as Address;

// Uniswap V3 Router on Base
const UNISWAP_V3_ROUTER = '0x2626664c2603336E57B271c5C0b26F421741e481' as Address;

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

const ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'exactInputSingle',
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

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

  // Amount to swap (leave some for fees)
  const amountIn = parseUnits('4.5', 6); // 4.5 USDC
  
  // Approve USDC
  console.log('\nApproving USDC...');
  const approveTx = await walletClient.writeContract({
    address: USDC,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [UNISWAP_V3_ROUTER, amountIn],
  });
  console.log(`Approval tx: ${approveTx}`);
  await publicClient.waitForTransactionReceipt({ hash: approveTx });
  console.log('Approved!');

  // Swap USDC -> WETH first (fee 500 = 0.05%)
  console.log('\nSwapping USDC -> WETH...');
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
  
  const swapTx = await walletClient.writeContract({
    address: UNISWAP_V3_ROUTER,
    abi: ROUTER_ABI,
    functionName: 'exactInputSingle',
    args: [{
      tokenIn: USDC,
      tokenOut: WETH,
      fee: 500,
      recipient: account.address,
      deadline,
      amountIn,
      amountOutMinimum: 0n,
      sqrtPriceLimitX96: 0n,
    }],
  });
  console.log(`Swap tx: ${approveTx}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: swapTx });
  console.log(`Swap confirmed! Gas used: ${receipt.gasUsed}`);

  // Check WETH balance
  const wethBalance = await publicClient.readContract({
    address: WETH,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });
  console.log(`\nWETH Balance: ${formatUnits(wethBalance as bigint, 18)}`);
}

main().catch(console.error);
