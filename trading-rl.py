#!/usr/bin/env python3
"""
Agent Lightning RL-Enhanced Trading System
Self-improving trading through reinforcement learning
"""
import asyncio
from datetime import datetime
from agentlightning import OtelTracer, emit_reward, emit_message
import requests

# Trading parameters that will be learned/optimized
TRADING_PARAMS = {
    "rsi_oversold": 35,
    "rsi_overbought": 70,
    "stop_loss_pct": 0.03,
    "take_profit_pct": 0.05
}

# Track trades
trades_log = []

def get_eth_price():
    """Fetch ETH price from CoinGecko"""
    try:
        r = requests.get(
            "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
            timeout=10
        )
        return r.json()["ethereum"]["usd"]
    except Exception as e:
        print(f"Price fetch error: {e}")
        return None

def calculate_rsi(prices, period=14):
    """Calculate RSI indicator"""
    if len(prices) < period + 1:
        return 50  # Neutral
    gains, losses = [], []
    for i in range(1, min(len(prices), period + 1)):
        change = prices[-i] - prices[-i-1]
        if change > 0:
            gains.append(change)
        else:
            losses.append(abs(change))
    avg_gain = sum(gains) / period if gains else 0.001
    avg_loss = sum(losses) / period if losses else 0.001
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))

async def trading_loop(tracer):
    """Main trading loop with RL tracing"""
    price_history = []
    iteration = 0
    
    print("⚡ Agent Lightning ETH Trading Bot")
    print("=" * 50)
    print("Monitoring ETH/USDC with RSI strategy")
    print("Learning via reinforcement learning")
    print("=" * 50)
    
    while True:
        iteration += 1
        try:
            price = get_eth_price()
            if not price:
                await asyncio.sleep(30)
                continue
            
            price_history.append(price)
            price_history = price_history[-100:]  # Keep last 100
            
            rsi = calculate_rsi(price_history)
            
            # Trading logic
            if rsi < TRADING_PARAMS["rsi_oversold"]:
                action = "BUY"
                confidence = (TRADING_PARAMS["rsi_oversold"] - rsi) / TRADING_PARAMS["rsi_oversold"]
            elif rsi > TRADING_PARAMS["rsi_overbought"]:
                action = "SELL"
                confidence = (rsi - TRADING_PARAMS["rsi_overbought"]) / (100 - TRADING_PARAMS["rsi_overbought"])
            else:
                action = "HOLD"
                confidence = 0
            
            # Use trace context for RL tracing
            async with tracer.trace_context(name=f"trading_iteration_{iteration}"):
                # Emit market state to Lightning for RL tracing
                emit_message(
                    message=f"ETH ${price:.2f} | RSI {rsi:.1f} | {action}",
                    attributes={
                        "price": price,
                        "rsi": rsi,
                        "action": action,
                        "confidence": confidence,
                        "timestamp": datetime.now().isoformat()
                    }
                )
                
                # Calculate reward if we have price movement
                if len(price_history) >= 2:
                    price_change = (price - price_history[-2]) / price_history[-2]
                    if action != "HOLD":
                        reward_value = price_change * 100  # Percentage
                        emit_reward(
                            reward={
                                "price_movement": reward_value,
                                "action_taken": action,
                                "rsi": rsi,
                                "confidence": confidence
                            },
                            primary_key="price_movement"
                        )
                        trades_log.append({
                            "time": datetime.now().isoformat(),
                            "action": action,
                            "price": price,
                            "reward": reward_value
                        })
            
            # Print status
            print(f"\n[{iteration}] {datetime.now().strftime('%H:%M:%S')}")
            print(f"   Price: ${price:,.2f} | RSI: {rsi:.1f}")
            print(f"   Signal: {action} (confidence: {confidence:.1%})")
            
            if trades_log:
                total_reward = sum(t["reward"] for t in trades_log)
                print(f"   Total trades: {len(trades_log)} | Cumulative reward: {total_reward:.2f}%")
            
            await asyncio.sleep(60)  # Check every minute
            
        except KeyboardInterrupt:
            print("\n\n📊 Final Statistics:")
            print(f"   Iterations: {iteration}")
            print(f"   Prices analyzed: {len(price_history)}")
            if price_history:
                print(f"   Final price: ${price_history[-1]:,.2f}")
            print(f"   Total trades: {len(trades_log)}")
            if trades_log:
                total_reward = sum(t["reward"] for t in trades_log)
                print(f"   Cumulative reward: {total_reward:.2f}%")
            break
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
            await asyncio.sleep(30)

async def main():
    """Run the RL-enhanced trading system"""
    tracer = OtelTracer()
    await trading_loop(tracer)

if __name__ == "__main__":
    asyncio.run(main())
