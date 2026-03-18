# Insurance AI with Mistral

AI-powered insurance analytics using Mistral's language models.

## Features

- **Claims Prediction** - Predict medical insurance costs from demographics
- **Fraud Detection** - Identify suspicious claims patterns
- **Auto Claims Assessment** - Evaluate auto insurance claims
- **Life Policy Underwriting** - Risk assessment for life insurance

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set API Key

Get your API key at [console.mistral.ai](https://console.mistral.ai/)

```bash
export MISTRAL_API_KEY='your-api-key-here'
```

Or create a `.env` file:
```bash
cp .env.example .env
# Edit .env with your API key
```

### 3. Run Demo

```bash
python quickstart.py
```

## Datasets

| Dataset | Records | Purpose |
|---------|---------|---------|
| medical_insurance.csv | 1,338 | Health insurance cost prediction |
| fraud_detection.csv | 5,000 | Fraud pattern detection |
| auto_insurance_claims.csv | 3,000 | Auto claim assessment |
| life_insurance_policies.csv | 2,500 | Life underwriting |

## Batch Processing

Process entire datasets:

```bash
# Medical insurance predictions
python batch_processor.py medical --limit 100

# Fraud detection
python batch_processor.py fraud --limit 50

# Auto claims
python batch_processor.py auto

# Life policies
python batch_processor.py life
```

## Using the Client

```python
from mistral_client import InsuranceMistralClient

client = InsuranceMistralClient()

# Predict medical insurance costs
result = client.predict_claim_amount(
    age=45,
    bmi=32.5,
    smoker="yes",
    children=2,
    region="southeast",
    sex="male"
)

print(f"Predicted: ${result.prediction}")
print(f"Confidence: {result.confidence:.1%}")
print(f"Risk Factors: {result.risk_factors}")
```

## API Methods

### `predict_claim_amount(age, bmi, smoker, children, region, sex)`
Predicts annual medical insurance charges.

### `detect_fraud(transaction_data)`
Analyzes claims for fraud indicators.

### `assess_auto_claim(claim_data)`
Evaluates auto insurance claim validity.

### `evaluate_life_policy(policy_data)`
Assesses life insurance policy applications.

## Model Options

Default: `mistral-large-latest`

For cost savings, use `mistral-medium-latest` by setting:
```python
client = InsuranceMistralClient()
client.model = "mistral-medium-latest"
```

## Project Structure

```
insurance-ai/
├── mistral_client.py       # Core Mistral integration
├── batch_processor.py      # Batch CSV processing
├── quickstart.py          # Demo script
├── requirements.txt       # Python dependencies
├── datasets/             # 11,838 insurance records
└── output/               # Generated predictions
```

## License

MIT
