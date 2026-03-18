#!/usr/bin/env python3
"""
Batch Processor for Insurance Datasets

Processes entire CSV files using Mistral AI and outputs predictions.
"""

import os
import csv
import json
import argparse
from pathlib import Path
from typing import List, Dict, Any
from tqdm import tqdm

from mistral_client import InsuranceMistralClient


def process_medical_insurance(
    input_path: str,
    output_path: str,
    limit: int = None
) -> List[Dict]:
    """Process medical insurance dataset"""
    
    client = InsuranceMistralClient()
    results = []
    
    with open(input_path, 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        if limit:
            rows = rows[:limit]
        
        for row in tqdm(rows, desc="Processing medical records"):
            try:
                prediction = client.predict_claim_amount(
                    age=int(row['age']),
                    bmi=float(row['bmi']),
                    smoker=row['smoker'],
                    children=int(row['children']),
                    region=row['region'],
                    sex=row['sex']
                )
                
                results.append({
                    "input": row,
                    "predicted_charges": prediction.prediction,
                    "confidence": prediction.confidence,
                    "risk_factors": prediction.risk_factors,
                    "actual_charges": row.get('charges', 'N/A')
                })
            except Exception as e:
                results.append({
                    "input": row,
                    "error": str(e)
                })
    
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    return results


def process_fraud_detection(
    input_path: str,
    output_path: str,
    limit: int = None
) -> List[Dict]:
    """Process fraud detection dataset"""
    
    client = InsuranceMistralClient()
    results = []
    
    with open(input_path, 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        if limit:
            rows = rows[:limit]
        
        for row in tqdm(rows, desc="Analyzing for fraud"):
            try:
                prediction = client.detect_fraud(row)
                
                results.append({
                    "transaction": row,
                    "fraud_risk": prediction.prediction,
                    "confidence": prediction.confidence,
                    "risk_factors": prediction.risk_factors,
                    "recommendation": prediction.recommendation,
                    "actual_fraud": row.get('is_fraud', 'N/A')
                })
            except Exception as e:
                results.append({
                    "transaction": row,
                    "error": str(e)
                })
    
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    return results


def process_auto_claims(
    input_path: str,
    output_path: str,
    limit: int = None
) -> List[Dict]:
    """Process auto insurance claims"""
    
    client = InsuranceMistralClient()
    results = []
    
    with open(input_path, 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        if limit:
            rows = rows[:limit]
        
        for row in tqdm(rows, desc="Processing auto claims"):
            try:
                prediction = client.assess_auto_claim(row)
                
                results.append({
                    "claim": row,
                    "assessment": prediction.prediction,
                    "confidence": prediction.confidence,
                    "risk_factors": prediction.risk_factors,
                    "recommendation": prediction.recommendation
                })
            except Exception as e:
                results.append({
                    "claim": row,
                    "error": str(e)
                })
    
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    return results


def process_life_policies(
    input_path: str,
    output_path: str,
    limit: int = None
) -> List[Dict]:
    """Process life insurance policies"""
    
    client = InsuranceMistralClient()
    results = []
    
    with open(input_path, 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        if limit:
            rows = rows[:limit]
        
        for row in tqdm(rows, desc="Evaluating life policies"):
            try:
                prediction = client.evaluate_life_policy(row)
                
                results.append({
                    "policy": row,
                    "decision": prediction.prediction,
                    "confidence": prediction.confidence,
                    "risk_factors": prediction.risk_factors,
                    "recommendation": prediction.recommendation
                })
            except Exception as e:
                results.append({
                    "policy": row,
                    "error": str(e)
                })
    
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    return results


def main():
    parser = argparse.ArgumentParser(
        description="Batch process insurance datasets with Mistral AI"
    )
    parser.add_argument(
        "dataset",
        choices=["medical", "fraud", "auto", "life"],
        help="Which dataset to process"
    )
    parser.add_argument(
        "-l", "--limit",
        type=int,
        default=None,
        help="Limit number of records to process"
    )
    parser.add_argument(
        "-o", "--output",
        default=None,
        help="Output JSON file path"
    )
    
    args = parser.parse_args()
    
    # Map dataset to file paths
    dataset_paths = {
        "medical": "datasets/medical_insurance.csv",
        "fraud": "datasets/fraud_detection.csv",
        "auto": "datasets/auto_insurance_claims.csv",
        "life": "datasets/life_insurance_policies.csv"
    }
    
    input_path = dataset_paths.get(args.dataset)
    output_path = args.output or f"output/{args.dataset}_predictions.json"
    
    # Create output directory
    os.makedirs("output", exist_ok=True)
    
    print(f"Processing {args.dataset} dataset...")
    print(f"Input: {input_path}")
    print(f"Output: {output_path}")
    
    # Process based on dataset type
    processors = {
        "medical": process_medical_insurance,
        "fraud": process_fraud_detection,
        "auto": process_auto_claims,
        "life": process_life_policies
    }
    
    results = processors[args.dataset](input_path, output_path, args.limit)
    
    print(f"\n✓ Processed {len(results)} records")
    print(f"✓ Results saved to {output_path}")


if __name__ == "__main__":
    main()
