# AWS Deployment Guide

Complete guide for deploying MyBlogSpot to AWS with cost-optimized architecture (<$4/month).

## Architecture Overview

```
User → Cloudflare DNS → CloudFront (CDN) → S3 (Private, Frontend)
                      ↓                      ↑
                   Cloudflare DNS          OAC (Origin Access Control)
                      ↓
                   Lightsail VPS
                      ↓
                   Nginx → Go Backend → PostgreSQL
```

**Monthly Cost Breakdown:**
- Lightsail VPS: $3.50
- CloudFront + S3: ~$0.12
- Total: **~$3.62/month**

## Prerequisites

- AWS Account
- GoDaddy domain: `gryffin-uit.site`
- Cloudflare account
- Gitea repository with Actions enabled

## Implementation Steps

Follow the checklist in `deployment-checklist.md` for detailed step-by-step instructions.

### Quick Command Reference

#### On AWS Lightsail Instance

```bash
# Install Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker

# Install Nginx & Certbot
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Setup application directory
mkdir -p /home/ubuntu/myblogspot/uploads
cd /home/ubuntu/myblogspot

# Copy docker-compose.prod.yml and .env to this directory
# Then start services
docker-compose -f docker-compose.prod.yml up -d

# Setup Nginx
sudo cp nginx-api.conf /etc/nginx/sites-available/api.gryffin-uit.site
sudo ln -s /etc/nginx/sites-available/api.gryffin-uit.site /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d api.gryffin-uit.site --non-interactive --agree-tos -m admin@gryffin-uit.site
```

#### On Local Development Machine

```bash
# Build and test Docker image locally
cd backend
docker build -t myblogspot-backend:test .
docker run -p 8080:8080 --env-file .env myblogspot-backend:test

# Test frontend static export
cd frontend
npm run build
# Check frontend/out/ directory
```

#### AWS CLI Commands

```bash
# Login to ECR
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com

# Create ECR repository
aws ecr create-repository --repository-name myblogspot-backend --region ap-southeast-1

# Upload frontend manually (if needed)
aws s3 sync frontend/out/ s3://gryffin-uit-site-frontend --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"
```

## S3 & CloudFront Setup (Detailed)

### Step 1: Create S3 Bucket
```bash
aws s3 mb s3://gryffin-uit-site-frontend --region ap-southeast-1
```

**Important**: Keep "Block all public access" ENABLED. Bucket must stay private.

### Step 2: Create CloudFront Distribution with OAC

1. Go to CloudFront → Create Distribution
2. **Origin Settings**:
   - Origin domain: `gryffin-uit-site-frontend.s3.ap-southeast-1.amazonaws.com` (REST endpoint)
   - Origin access: **Origin access control settings (recommended)**
   - Click "Create control setting"
     - Name: `gryffin-uit-site-oac`
     - Sign requests: Yes
     - Origin type: S3
   - After creation, CloudFront shows bucket policy → **Copy it**

3. **Default Cache Behavior**:
   - Viewer protocol: Redirect HTTP to HTTPS
   - Allowed methods: GET, HEAD
   - Cache policy: CachingOptimized

4. **Settings**:
   - Alternate domain names: `gryffin-uit.site`, `www.gryffin-uit.site`
   - Custom SSL certificate: Select your ACM cert (must be in us-east-1)
   - Default root object: `index.html`

5. **Custom Error Pages**:
   - 403 → `/index.html`, HTTP 200 (for SPA client-side routing)
   - 404 → `/404.html`, HTTP 404

### Step 3: Update S3 Bucket Policy

Copy policy from CloudFront (shown after OAC creation). Should look like:

```json
{
  "Version": "2012-10-17",
  "Statement": {
    "Sid": "AllowCloudFrontServicePrincipalReadOnly",
    "Effect": "Allow",
    "Principal": {
      "Service": "cloudfront.amazonaws.com"
    },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::gryffin-uit-site-frontend/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DIST_ID"
      }
    }
  }
}
```

Add this to S3 bucket → Permissions → Bucket Policy.

### Why OAC vs Public Bucket?

- **Security**: S3 bucket stays private, only CloudFront can access
- **No direct S3 access**: Users can't bypass CloudFront and hit S3 directly
- **Better logging**: All requests logged at CloudFront edge
- **AWS Best Practice**: OAC replaces legacy OAI (Origin Access Identity)

## Cloudflare DNS Records

Add these records in Cloudflare dashboard:

| Type  | Name | Target                          | Proxy Status |
|-------|------|---------------------------------|--------------|
| CNAME | @    | xxxxx.cloudfront.net            | Proxied      |
| CNAME | www  | xxxxx.cloudfront.net            | Proxied      |
| A     | api  | 54.251.x.x (Lightsail Static IP)| DNS-only     |

## Gitea Secrets

Configure these in repository settings → Secrets:

```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_ACCOUNT_ID=123456789012
AWS_CLOUDFRONT_DISTRIBUTION_ID=E1ABC2DEF3GHIJ
NEXT_PUBLIC_ADMIN_LOGIN_SECRET=your_secret_key_2026
LIGHTSAIL_IP=54.251.x.x
LIGHTSAIL_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

## Environment Variables on Lightsail

Create `/home/ubuntu/myblogspot/.env`:

```bash
# Database
DB_PASSWORD=your_secure_password_here

# JWT
JWT_SECRET=your_jwt_secret_here

# ECR Registry
ECR_REGISTRY=123456789012.dkr.ecr.ap-southeast-1.amazonaws.com
```

Generate secure secrets:
```bash
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 24  # For DB_PASSWORD
```

## Deployment Workflow

1. **Frontend changes**: Push to `main` → triggers `.github/workflows/deploy-frontend.yml`
   - Builds Next.js static export
   - Uploads to S3
   - Invalidates CloudFront cache

2. **Backend changes**: Push to `main` → triggers `.github/workflows/deploy-backend.yml`
   - Builds Docker image
   - Pushes to AWS ECR
   - SSH to Lightsail and deploys

## Testing Deployment

```bash
# Test backend API
curl https://api.gryffin-uit.site/api/v1/health

# Test frontend
curl https://gryffin-uit.site

# Test admin login
open https://gryffin-uit.site/admin/login?secret=your_secret_key_2026
```

## Monitoring & Maintenance

### Lightsail Instance

```bash
# SSH into instance
ssh ubuntu@54.251.x.x -i ~/.ssh/lightsail_key.pem

# Check Docker containers
docker ps
docker logs myblogspot_backend
docker logs myblogspot_postgres

# Check disk usage
df -h
docker system df

# Restart services
cd /home/ubuntu/myblogspot
docker-compose -f docker-compose.prod.yml restart

# Check Nginx
sudo systemctl status nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Database Backup

```bash
# Manual backup
docker exec myblogspot_postgres pg_dump -U myblogspot myblogspot_prod | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore from backup
gunzip < backup_20260604.sql.gz | docker exec -i myblogspot_postgres psql -U myblogspot myblogspot_prod
```

### SSL Certificate Renewal

Certbot auto-renews. Check status:
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker logs myblogspot_backend

# Check environment variables
docker exec myblogspot_backend env | grep DB_

# Restart from scratch
cd /home/ubuntu/myblogspot
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### Frontend not updating
```bash
# Check CloudFront invalidation status
aws cloudfront get-invalidation --distribution-id DIST_ID --id INVALIDATION_ID

# Manually invalidate
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"
```

### Database connection issues
```bash
# Check if PostgreSQL is running
docker exec myblogspot_postgres pg_isready -U myblogspot

# Connect to database
docker exec -it myblogspot_postgres psql -U myblogspot -d myblogspot_prod
```

## Security Considerations

1. **Never expose PostgreSQL port 5432** to public internet
2. **Use strong passwords** for DB_PASSWORD and JWT_SECRET
3. **Keep SSH key secure** - never commit to git
4. **Enable Cloudflare proxy** for frontend domains (DDoS protection)
5. **Disable Cloudflare proxy** for API domain (direct SSL from Lightsail)
6. **Rotate secrets** periodically
7. **Monitor Lightsail firewall** - only ports 22, 80, 443 should be open

## Cost Optimization Tips

1. Use Cloudflare Free tier (saves $0.50/month Route 53 cost)
2. Enable CloudFront compression
3. Set aggressive S3 lifecycle policies for old assets
4. Monitor Lightsail data transfer (first 1TB free)
5. Use PostgreSQL connection pooling to reduce overhead

## Scaling Considerations

When traffic grows beyond Lightsail $3.50 plan:

1. Upgrade Lightsail to $5 plan (1GB RAM → 2GB RAM)
2. Add Redis for session/cache (add to docker-compose)
3. Move PostgreSQL to RDS for better performance
4. Add CloudFront caching for API responses
5. Consider ECS Fargate for backend auto-scaling

## References

- Full implementation plan: `aws_implementation_plan.md`
- Deployment checklist: `deployment-checklist.md`
- Environment variables: `.env.prod.example`
