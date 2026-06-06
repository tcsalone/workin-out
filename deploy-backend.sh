#!/bin/bash

# Deploy Workin Out Backend to GCP Cloud Run
# Usage: ./deploy-backend.sh

set -e

echo "🏋️ Deploying Workin Out Backend to GCP Cloud Run..."

# Configuration
PROJECT_ID="workin-out"
SERVICE_NAME="workin-out-backend"
REGION="us-central1"
FRONTEND_URL="https://workin-out.eamongreeley.com"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Prompt for project ID if different
read -p "Enter GCP Project ID [$PROJECT_ID]: " input_project
PROJECT_ID="${input_project:-$PROJECT_ID}"

echo "📦 Building container image..."
cd backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/backend --project $PROJECT_ID

echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/backend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,CORS_ORIGIN=$FRONTEND_URL,DATABASE_PATH=/app/data/workouts.db,PORT=8080" \
  --memory 512Mi \
  --cpu 1 \
  --port 8080 \
  --project $PROJECT_ID

echo "✅ Backend deployed successfully!"
echo ""
echo "Service URL:"
gcloud run services describe $SERVICE_NAME --region $REGION --project $PROJECT_ID --format 'value(status.url)'

echo ""
echo "📋 Next steps:"
echo "1. Set up custom domain mapping for api.eamongreeley.com"
echo "2. Update DNS records"
echo "3. Deploy frontend to Vercel"
echo ""
echo "See DEPLOYMENT.md for detailed instructions."
