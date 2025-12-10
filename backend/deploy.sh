#!/bin/bash

# Construir e deployar no Cloud Run usando Cloud Build
gcloud builds submit --tag gcr.io/palaoro-production/cinema-erp-api . --project=palaoro-production

# Depois de construir, fazer deploy
gcloud run deploy cinema-erp-api \
  --image gcr.io/palaoro-production/cinema-erp-api \
  --region us-central1 \
  --allow-unauthenticated \
  --project=palaoro-production
