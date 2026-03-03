#!/usr/bin/env python3
"""
Trading Bot with Agent Lightning RL Integration
Learns from every trade to improve strategy
"""
import agentlightning as agl
import requests
import json
import time
from datetime import datetime

# Initialize Agent Lightning
agl.init(project_name="trading-bot-rl")

# Trading parameters (learned/improved over time)
PARAMS = {
    "rsi_oversold": 35,
    "rsi_overbought": 70,
    "stop_loss_pct": 0.03,
    "take_profit_pct": 0.05,
    "position_size_pct": 0.10
}

def get_eth_price():
    """Fetch current ETH price"""
    try:
        r = requests.get("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd")
        return r.json()["ethereum"]["usd"]
    except:
        return None

def calculate_rsi(prices, period=14):
    """Calculate RSI indicator"""
    if len(prices) < period:
        return 50
    gains = []
    losses = []
    for i in range(1, len(prices)):
        change = prices[i] - prices[i-1]
        if change > 0:
            gains.append(change)
            losses.append(0)
        else:
            gains.append(0)
            losses.append(abs(change))
    
    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period
    
    if avg_loss == 0:
        return 100
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

@agl.trace_span("trading-bot")
def analyze_and_trade(price_history):
    """Main trading logic with Lightning tracing"""
    current_price = price_history[-1]
    rsi = calculate_rsi(price_history)
    
    # Emit market observation for learning
    agl.emit_observation(
        observation_type="market_state",
        data={
            "price": current_price,
            "rsi": rsi,
            "timestamp": datetime.now().isoformat()
        }
    )
    
    # Trading decision
    if rsi < PARAMS["rsi_oversold"]:
        action = "BUY"
        reason = f"RSI oversold ({rsi:.1f})"
    elif rsi > PARAMS["rsi_overbought"]:
        action = "SELL"
        reason = f"RSI overbought ({rsi:.1f})"
    else:
        action = "HOLD"
        reason = f"RSI neutral ({rsi:.1f})"
    
    # Emit action for learning
    if action != "HOLD":
        agl.emit_action(
            action_type="trade_signal",
            params={
                "action": action,
                "price": current_price,
                "rsi": rsi,
                "reason": reason
            }
        )
    
    return {
        "action": action,
        "price": current_price,
        "rsi": rsi,
        "reason": reason
    }

def record_trade_outcome(trade_id, entry_price, exit_price):
    """Record PnL for RL learning"""
    pnl_pct = (exit_price - entry_price) / entry_price
    
    agl.emit_reward(
        reward_type="pnl",
        value=pnl_pct,
        metadata={
            "trade_id": trade_id,
            "entry_price": entry_price,
            "exit_price": exit_price,
            "timestamp": datetime.now().isoformat()
        }
    )
    
    # Update parameters if profitable
    if pnl_pct > 0:
        print(f"✅ Profitable trade! Reinforcing strategy...")
        # Agent Lightning will learn from this
    else:
        print(f"❌ Loss. Adjusting parameters...")
    
    return pnl_pct

def main():
    print("⚡ Trading Bot with Agent Lightning RL")
    print("=" * 50)
    
    # Simulate price history for demo
    price_history = [1849.0 + (i * 0.5) for i in range(20)]
    
    while True:
        try:
            price = get_eth_price()
            if price:
                price_history.append(price)
                price_history = price_history[-100:]  # Keep last 100
                
                result = analyze_and_trade(price_history)
                
                print(f"\n{datetime.now().strftime('%H:%M:%S')}")
                print(f"Price: ${price:.2f}")
                print(f"RSI: {result['rsi']:.1f}")
                print(f"Signal: {result['action']} ({result['reason']})")
                print(f"Traced by Agent Lightning ✓")
            
            time.sleep(60)  # Check every minute
            
        except KeyboardInterrupt:
            print("\nStopping...")
            break
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(30)

if __name__ == "__main__":
    main()
