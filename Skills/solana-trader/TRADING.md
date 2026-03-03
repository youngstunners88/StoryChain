# Solana Trading Notes

## Wallet
- Address: `An3Ng8J9iaUzhmRb8vDUegAJ9aSh7DndoLmho2bqrb2u`
- SOL Balance: 0.1788 (~$14.88)
- MOLT Tokens: 1,000,000 (low value)

## Trending Tokens (Feb 22, 2026)

### PUNCH (パンチ)
- Contract: `NV2RYH954cTJ3ckFUpvfqaQXU4ARqqDH3562nFSpump`
- Price: $0.036
- Market Cap: $36M
- 24h Volume: $10.4M
- 24h Change: +47%
- Story: Abandoned monkey narrative
- Links:
  - https://dexscreener.com/solana/NV2RYH954cTJ3ckFUpvfqaQXU4ARqqDH3562nFSpump
  - https://jup.ag/swap/SOL-NV2RYH954cTJ3ckFUpvfqaQXU4ARqqDH3562nFSpump

## Trading Commands

Once private key is added:

```bash
# Check balance
cd /home/workspace/Skills/solana-trader/scripts && bun trade.ts balance

# Get quote for 0.1 SOL -> PUNCH
bun trade.ts quote So11111111111111111111111111111111111111112 NV2RYH954cTJ3ckFUpvfqaQXU4ARqqDH3562nFSpump 0.1

# Execute swap
bun trade.ts swap So11111111111111111111111111111111111111112 NV2RYH954cTJ3ckFUpvfqaQXU4ARqqDH3562nFSpump 0.1 100
```

## Important Token Addresses

| Token | Address |
|-------|---------|
| SOL | So11111111111111111111111111111111111111112 |
| USDC | EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v |
| USDT | Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB |
| JUP | JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN |
| BONK | DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263 |
| WIF | EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm |
| PUNCH | NV2RYH954cTJ3ckFUpvfqaQXU4ARqqDH3562nFSpump |

## Risk Management

- Never invest more than you can lose
- Meme coins are highly volatile
- Use appropriate slippage (1-5% for meme coins)
- Check liquidity before trading
- Verify contract addresses on Solscan

## Next Steps

1. Wait for user to add SOLANA_PRIVATE_KEY to secrets
2. Execute test balance check
3. Start with small trades to grow the portfolio
4. Monitor trending tokens and execute strategic swaps
