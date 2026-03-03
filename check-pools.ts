import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';

const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`;
const WETH = '0x4200000000000000000000000000000000000006' as `0x${string}`;

// Uniswap V3 Factory and Pool getters
const FACTORY_V3 = '0x33128a8fC17869897dcE68Ed026d694621f6FDfD' as `0x${string}`;

const FACTORY_ABI = [
  {
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'fee', type: 'uint24' },
    ],
    name: 'getPool',
    outputs: [{ name: 'pool', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const POOL_ABI = [
  {
    inputs: [],
    name: 'liquidity',
    outputs: [{ name: '', type: 'uint128' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'slot0',
    outputs: [
      { name: 'sqrtPriceX96', type: 'uint160' },
      { name: 'tick', type: 'int24' },
      { name: 'observationIndex', type: 'uint16' },
      { name: 'observationCardinality', type: 'uint16' },
      { name: 'observationCardinalityNext', type: 'uint16' },
      { name: 'feeProtocol', type: 'uint32' },
      { name: 'unlocked', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

async function main() {
  const client = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org'),
  });

  const fees = [100, 500, 3000, 10000]; // 0.01%, 0.05%, 0.3%, 1%

  console.log('Checking USDC/WETH pools on Uniswap V3 Base:\n');

  for (const fee of fees) {
    try {
      const poolAddress = await client.readContract({
        address: FACTORY_V3,
        abi: FACTORY_ABI,
        functionName: 'getPool',
        args: [USDC, WETH, fee],
      }) as `0x${string}`;

      if (poolAddress && poolAddress !== '0x0000000000000000000000000000000000000000') {
        const liquidity = await client.readContract({
          address: poolAddress,
          abi: POOL_ABI,
          functionName: 'liquidity',
        });
        console.log(`Fee ${fee/10000}%: Pool ${poolAddress} - Liquidity: ${liquidity}`);
      } else {
        console.log(`Fee ${fee/10000}%: No pool`);
      }
    } catch (e) {
      console.log(`Fee ${fee/10000}%: Error or no pool`);
    }
  }

  // Check Aerodrome instead
  console.log('\n\nChecking Aerodrome Router...');
  const AERO_ROUTER = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43' as `0x${string}`;
  
  // Aerodrome uses different pools - let me check the USDC/ETH pool
  const AERO_FACTORY = '0x420DD381b31aEf6683db6B902084cB0FEC03dAd2' as `0x${string}`;
  
  const AERO_FACTORY_ABI = [
    {
      inputs: [
        { name: '', type: 'address' },
        { name: '', type: 'address' },
        { name: '', type: 'bool' },
      ],
      name: 'getPool',
      outputs: [{ name: 'pool', type: 'address' }],
      stateMutability: 'view',
      type: 'function',
    },
  ] as const;

  // Check volatile pool (false) and stable pool (true)
  for (const stable of [false, true]) {
    try {
      const pool = await client.readContract({
        address: AERO_FACTORY,
        abi: AERO_FACTORY_ABI,
        functionName: 'getPool',
        args: [USDC, WETH, stable],
      });
      console.log(`Aerodrome ${stable ? 'Stable' : 'Volatile'} pool: ${pool}`);
    } catch (e) {
      console.log(`Aerodrome ${stable ? 'Stable' : 'Volatile'}: Error`);
    }
  }
}

main().catch(console.error);
