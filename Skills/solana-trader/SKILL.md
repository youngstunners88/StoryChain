---
name: solana-trader
description: Solana wallet management and token trading using Jupiter DEX aggregator. Check balances, view transaction history, swap tokens, and manage your Solana portfolio.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
allowed-tools: Bash Read
---

# Solana Trader

Manage your Solana wallet, check balances, and execute token swaps via Jupiter.

## Setup

1. Add your Solana private key to Zo secrets:
   - Go to Settings > Advanced
   - Add secret: `SOLANA_PRIVATE_KEY`
   - Value: Your base58-encoded private key

2. (Optional) Add RPC endpoint for better performance:
   - Add secret: `SOLANA_RPC_URL`
   - Value: Your Helius/QuickNode RPC URL

## Usage

### Check Balance
```bash
bun scripts/trade.ts balance
```

### Get Token Info
```bash
bun scripts/trade.ts info <TOKEN_MINT>
```

### Swap Tokens
```bash
bun scripts/trade.ts swap <INPUT_MINT> <OUTPUT_MINT> <AMOUNT> [SLIPPAGE_BPS]
```

Examples:
```bash
# Swap 0.1 SOL to USDC
bun scripts/trade.ts swap So11111111111111111111111111111111111111112 EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v 0.1

# Swap 100 USDC to PUNCH with 1% slippage
bun scripts/trade.ts swap EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v NV2RYH954cTJ3ckFUpvfqaQXU4ARqqDH3562nFSpump 100 100
```

### Get Swap Quote (Preview)
```bash
bun scripts/trade.ts quote <INPUT_MINT> <OUTPUT_MINT> <AMOUNT>
```

## Token Addresses

- SOL: `So11111111111111111111111111111111111111112`
- USDC: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- USDT: `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB`
- JUP: `JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN`
- BONK: `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`
- WIF: `EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm`
- PUNCH: `NV2RYH954cTJ3ckFUpvfqaQXU4ARqqDH3562nFSpump`

## Notes

- Always verify token addresses before swapping
- Meme coins are highly volatile - use appropriate slippage
- Transactions are confirmed on-chain before completing
