param(
  [Parameter(Mandatory=$true)] [string]$PROJECT_ID,
  [Parameter(Mandatory=$true)] [string]$REGION,
  [Parameter(Mandatory=$false)] [string]$SERVICE_NAME = "cinema-erp-api",
  [Parameter(Mandatory=$false)] [string]$IMAGE
)

$ErrorActionPreference = "Stop"

if (-not $PSBoundParameters.ContainsKey('IMAGE') -or [string]::IsNullOrWhiteSpace($IMAGE)) {
  # Compute the default image tag after parameters are parsed so variables expand correctly
  $IMAGE = "gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"
}

Write-Host "Project: $PROJECT_ID | Region: $REGION | Service: $SERVICE_NAME | Image: $IMAGE"

Write-Host "Logging in to gcloud..."
gcloud auth login --brief

gcloud config set project $PROJECT_ID

gcloud services enable run.googleapis.com containerregistry.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

Push-Location $PSScriptRoot

Write-Host "Building container image..."
# Use Cloud Build to build from Dockerfile
gcloud builds submit --tag $IMAGE .

Write-Host "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME `
  --image $IMAGE `
  --region $REGION `
  --platform managed `
  --allow-unauthenticated `
  --cpu 1 `
  --memory 512Mi `
  --max-instances 1 `
  --min-instances 0 `
  --set-env-vars "ENVIRONMENT=production,DEBUG=false,DATABASE_TYPE=firebase,DATABASE_URL=sqlite:////tmp/cinema_erp.db,FIREBASE_PROJECT_ID=${PROJECT_ID},FIREBASE_STORAGE_BUCKET=${PROJECT_ID}.appspot.com,ENABLE_FIREBASE_PHOTO_STORAGE=true,FIREBASE_PUBLIC_PHOTOS=true,CLOUD_RUN=1"

$SERVICE_URL = (gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)')
Write-Host "Service URL: $SERVICE_URL"

Pop-Location
