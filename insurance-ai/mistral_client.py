"""
Mistral AI Client for Insurance Analytics

Provides unified interface to Mistral's models for:
- Claims prediction
- Fraud detection
- Risk assessment
- Policy recommendations
"""

import os
import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from mistralai import Mistral


@dataclass
class InsurancePrediction:
    """Structured prediction result from Mistral"""
    prediction: str
    confidence: float
    reasoning: str
    risk_factors: List[str]
    recommendation: Optional[str] = None


class InsuranceMistralClient:
    """Mistral-powered AI for insurance workflows"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("MISTRAL_API_KEY")
        if not self.api_key:
            raise ValueError("MISTRAL_API_KEY not set. Get one at https://console.mistral.ai/")
        
        self.client = Mistral(api_key=self.api_key)
        self.model = "mistral-large-latest"  # or "mistral-medium-latest" for cost savings
    
    def predict_claim_amount(
        self,
        age: int,
        bmi: float,
        smoker: str,
        children: int,
        region: str,
        sex: str
    ) -> InsurancePrediction:
        """Predict medical insurance claim amount based on demographics"""
        
        prompt = f"""You are an expert insurance actuary. Predict the annual medical insurance charges.

Patient Profile:
- Age: {age}
- Sex: {sex}
- BMI: {bmi}
- Children: {children}
- Smoker: {smoker}
- Region: {region}

Respond in this exact JSON format:
{{
    "predicted_amount": <number>,
    "confidence": <0.0-1.0>,
    "reasoning": "<brief explanation>",
    "risk_factors": ["<factor1>", "<factor2>"],
    "recommendation": "<optional advice>"
}}"""

        return self._call_model(prompt, "predicted_amount")
    
    def detect_fraud(
        self,
        transaction_data: Dict[str, Any]
    ) -> InsurancePrediction:
        """Detect potential fraud in insurance claims"""
        
        prompt = f"""You are a fraud detection specialist. Analyze this insurance claim for fraud indicators.

Claim Data:
{json.dumps(transaction_data, indent=2)}

Respond in this exact JSON format:
{{
    "fraud_risk": "low|medium|high",
    "confidence": <0.0-1.0>,
    "reasoning": "<explanation of indicators>",
    "risk_factors": ["<indicator1>", "<indicator2>"],
    "recommendation": "<action to take>"
}}"""

        return self._call_model(prompt, "fraud_risk")
    
    def assess_auto_claim(
        self,
        claim_data: Dict[str, Any]
    ) -> InsurancePrediction:
        """Assess auto insurance claim validity and amount"""
        
        prompt = f"""You are an auto insurance claims adjuster. Assess this claim.

Claim Details:
{json.dumps(claim_data, indent=2)}

Respond in this exact JSON format:
{{
    "assessment": "approve|review|deny",
    "confidence": <0.0-1.0>,
    "estimated_payout": <number or null>,
    "reasoning": "<explanation>",
    "risk_factors": ["<concern1>", "<concern2>"],
    "recommendation": "<next steps>"
}}"""

        return self._call_model(prompt, "assessment")
    
    def evaluate_life_policy(
        self,
        policy_data: Dict[str, Any]
    ) -> InsurancePrediction:
        """Evaluate life insurance policy application"""
        
        prompt = f"""You are a life insurance underwriter. Evaluate this policy application.

Applicant Data:
{json.dumps(policy_data, indent=2)}

Respond in this exact JSON format:
{{
    "decision": "approve|decline|review",
    "confidence": <0.0-1.0>,
    "risk_category": "preferred|standard|substandard",
    "reasoning": "<explanation>",
    "risk_factors": ["<factor1>", "<factor2>"],
    "recommendation": "<premium adjustment or conditions>"
}}"""

        return self._call_model(prompt, "decision")
    
    def _call_model(self, prompt: str, prediction_key: str) -> InsurancePrediction:
        """Call Mistral API and parse response"""
        
        try:
            response = self.client.chat.complete(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert insurance AI. Respond only with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Low temperature for consistent results
                max_tokens=1000
            )
            
            content = response.choices[0].message.content
            
            # Extract JSON from response
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            data = json.loads(content.strip())
            
            return InsurancePrediction(
                prediction=str(data.get(prediction_key, "unknown")),
                confidence=data.get("confidence", 0.5),
                reasoning=data.get("reasoning", "No reasoning provided"),
                risk_factors=data.get("risk_factors", []),
                recommendation=data.get("recommendation")
            )
            
        except Exception as e:
            return InsurancePrediction(
                prediction="error",
                confidence=0.0,
                reasoning=f"API error: {str(e)}",
                risk_factors=[],
                recommendation="Please retry or check API configuration"
            )


# Example usage functions

def demo_medical_prediction():
    """Demo: Predict medical insurance costs"""
    client = InsuranceMistralClient()
    
    # Sample high-risk patient
    result = client.predict_claim_amount(
        age=45,
        bmi=32.5,
        smoker="yes",
        children=2,
        region="southeast",
        sex="male"
    )
    
    print("Medical Insurance Prediction")
    print(f"  Predicted: ${result.prediction}")
    print(f"  Confidence: {result.confidence:.1%}")
    print(f"  Risk Factors: {', '.join(result.risk_factors)}")
    print(f"  Reasoning: {result.reasoning}")


def demo_fraud_detection():
    """Demo: Detect fraudulent claims"""
    client = InsuranceMistralClient()
    
    suspicious_claim = {
        "amount": 25000,
        "claim_date": "2024-01-15",
        "incident_date": "2024-01-14",
        "policy_age_days": 15,
        "claim_history_30d": 3,
        "customer_segment": "new",
        "repair_shop_flag": "unregistered",
        "witnesses": 0
    }
    
    result = client.detect_fraud(suspicious_claim)
    
    print("\nFraud Detection")
    print(f"  Risk Level: {result.prediction}")
    print(f"  Confidence: {result.confidence:.1%}")
    print(f"  Risk Factors: {', '.join(result.risk_factors)}")
    print(f"  Action: {result.recommendation}")


def demo_batch_predictions(csv_path: str, output_path: str):
    """Process a batch of records from CSV"""
    import csv
    
    client = InsuranceMistralClient()
    results = []
    
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in list(reader)[:5]:  # Process first 5 for demo
            result = client.predict_claim_amount(
                age=int(row['age']),
                bmi=float(row['bmi']),
                smoker=row['smoker'],
                children=int(row['children']),
                region=row['region'],
                sex=row['sex']
            )
            results.append({
                "input": row,
                "prediction": result.prediction,
                "confidence": result.confidence
            })
    
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nBatch predictions saved to {output_path}")


if __name__ == "__main__":
    print("Insurance AI with Mistral\n" + "="*50)
    
    # Check for API key
    if not os.getenv("MISTRAL_API_KEY"):
        print("\n⚠️  MISTRAL_API_KEY not found!")
        print("Get your API key at: https://console.mistral.ai/")
        print("Then set it: export MISTRAL_API_KEY='your-key-here'")
        exit(1)
    
    # Run demos
    demo_medical_prediction()
    demo_fraud_detection()
    
    print("\n✓ Mistral integration ready!")
