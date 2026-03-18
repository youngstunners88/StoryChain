#!/usr/bin/env python3
"""
Quick Start Guide for Insurance AI + Mistral

1. Install dependencies:
   pip install -r requirements.txt

2. Set your API key:
   export MISTRAL_API_KEY='your-key-here'
   
   Or create a .env file:
   echo "MISTRAL_API_KEY=your-key-here" > .env

3. Run examples:
   python quickstart.py
"""

import os
import sys
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

# Check API key
if not os.getenv("MISTRAL_API_KEY"):
    print("=" * 60)
    print("MISTRAL API KEY REQUIRED")
    print("=" * 60)
    print("\n1. Get your API key: https://console.mistral.ai/")
    print("2. Set it as environment variable:")
    print("   export MISTRAL_API_KEY='your-key-here'")
    print("\nOr create a .env file:")
    print("   echo 'MISTRAL_API_KEY=your-key' > .env")
    print("=" * 60)
    sys.exit(1)

# Import and run demos
from mistral_client import demo_medical_prediction, demo_fraud_detection

print("Insurance AI with Mistral")
print("=" * 60)

demo_medical_prediction()
demo_fraud_detection()

print("\n" + "=" * 60)
print("Next steps:")
print("• Import mistral_client in your scripts")
print("• Use predict_claim_amount() for medical insurance")
print("• Use detect_fraud() for fraud detection")
print("• Use assess_auto_claim() for auto claims")
print("• Use evaluate_life_policy() for life underwriting")
print("=" * 60)
