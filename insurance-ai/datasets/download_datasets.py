import pandas as pd
import numpy as np
import requests
from io import StringIO

# Download medical insurance dataset (already have it)
medical = pd.read_csv('/home/workspace/insurance-ai/datasets/medical_insurance.csv')
print(f"Medical insurance dataset: {len(medical)} records")
print(medical.head())

# Generate synthetic but realistic fraud detection dataset
np.random.seed(42)
n_records = 5000

fraud_data = {
    'claim_id': [f'CLM_{i:06d}' for i in range(n_records)],
    'policy_age_days': np.random.exponential(365, n_records).astype(int),
    'claim_amount': np.random.lognormal(8, 1.5, n_records).round(2),
    'previous_claims': np.random.poisson(0.5, n_records),
    'incident_severity': np.random.choice(['Minor', 'Moderate', 'Severe', 'Total Loss'], n_records, p=[0.4, 0.3, 0.2, 0.1]),
    'police_report': np.random.choice([0, 1], n_records, p=[0.7, 0.3]),
    'witness_present': np.random.choice([0, 1], n_records, p=[0.6, 0.4]),
    'policy_holder_age': np.random.normal(45, 15, n_records).astype(int),
    'policy_tenure_years': np.random.exponential(3, n_records).round(1),
    'vehicle_age': np.random.exponential(5, n_records).round(1),
    'fraud': np.random.choice([0, 1], n_records, p=[0.85, 0.15])
}

# Adjust features for fraudulent claims to make them more realistic
fraud_indices = np.where(fraud_data['fraud'] == 1)[0]
fraud_data['claim_amount'][fraud_indices] *= np.random.uniform(1.5, 3.0, len(fraud_indices))
fraud_data['previous_claims'][fraud_indices] += np.random.poisson(2, len(fraud_indices))
fraud_data['police_report'][fraud_indices] = np.random.choice([0, 1], len(fraud_indices), p=[0.8, 0.2])
fraud_data['policy_age_days'][fraud_indices] = np.random.exponential(30, len(fraud_indices)).astype(int)

fraud_df = pd.DataFrame(fraud_data)
fraud_df.to_csv('/home/workspace/insurance-ai/datasets/fraud_detection.csv', index=False)
print(f"\nFraud detection dataset: {len(fraud_df)} records, {fraud_df['fraud'].sum()} fraudulent")

# Generate auto insurance claims dataset
np.random.seed(43)
n_auto = 3000

auto_data = {
    'claim_id': [f'AUTO_{i:06d}' for i in range(n_auto)],
    'customer_age': np.random.normal(40, 12, n_auto).astype(int),
    'vehicle_age': np.random.exponential(4, n_auto).round(1),
    'vehicle_category': np.random.choice(['Sedan', 'SUV', 'Truck', 'Sports', 'Luxury'], n_auto),
    'driver_gender': np.random.choice(['M', 'F'], n_auto),
    'marital_status': np.random.choice(['Single', 'Married', 'Divorced'], n_auto, p=[0.3, 0.6, 0.1]),
    'annual_premium': np.random.lognormal(7.5, 0.8, n_auto).round(2),
    'claim_amount': np.random.lognormal(7.8, 1.2, n_auto).round(2),
    'claim_frequency': np.random.poisson(0.8, n_auto),
    'driving_history': np.random.choice(['Clean', 'Minor', 'Major', 'Suspension'], n_auto, p=[0.7, 0.2, 0.08, 0.02]),
    'coverage_type': np.random.choice(['Basic', 'Standard', 'Premium'], n_auto, p=[0.3, 0.5, 0.2]),
    'incident_type': np.random.choice(['Collision', 'Theft', 'Vandalism', 'Weather', 'Other'], n_auto, p=[0.5, 0.1, 0.15, 0.2, 0.05]),
    'fraudulent': np.random.choice([0, 1], n_auto, p=[0.9, 0.1])
}

auto_df = pd.DataFrame(auto_data)
auto_df.to_csv('/home/workspace/insurance-ai/datasets/auto_insurance_claims.csv', index=False)
print(f"\nAuto insurance dataset: {len(auto_df)} records")

# Generate life insurance dataset
np.random.seed(44)
n_life = 2500

life_data = {
    'policy_id': [f'LIFE_{i:06d}' for i in range(n_life)],
    'age_at_purchase': np.random.normal(35, 10, n_life).astype(int),
    'gender': np.random.choice(['M', 'F'], n_life),
    'bmi': np.random.normal(27, 5, n_life).round(1),
    'smoker': np.random.choice(['Yes', 'No'], n_life, p=[0.2, 0.8]),
    'policy_term_years': np.random.choice([10, 20, 30], n_life, p=[0.2, 0.3, 0.5]),
    'coverage_amount': np.random.choice([50000, 100000, 250000, 500000, 1000000], n_life),
    'annual_premium': np.random.lognormal(7, 0.6, n_life).round(2),
    'occupation_risk': np.random.choice(['Low', 'Medium', 'High'], n_life, p=[0.7, 0.25, 0.05]),
    'medical_history': np.random.choice(['None', 'Minor', 'Major'], n_life, p=[0.8, 0.15, 0.05]),
    'policy_status': np.random.choice(['Active', 'Lapsed', 'Claimed'], n_life, p=[0.85, 0.1, 0.05])
}

life_df = pd.DataFrame(life_data)
life_df.to_csv('/home/workspace/insurance-ai/datasets/life_insurance_policies.csv', index=False)
print(f"\nLife insurance dataset: {len(life_df)} records")

print("\n✓ All datasets downloaded/created successfully!")
print("\nDatasets available:")
print(f"  • medical_insurance.csv - {len(medical)} records (US health insurance costs)")
print(f"  • fraud_detection.csv - {len(fraud_df)} records (synthetic fraud patterns)")
print(f"  • auto_insurance_claims.csv - {len(auto_df)} records (synthetic auto claims)")
print(f"  • life_insurance_policies.csv - {len(life_df)} records (synthetic life policies)")
