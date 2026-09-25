# AWS Deployment Checklist

Based on `aws_implementation_plan.md`. Complete these steps in order.

## Phase 1: DNS Setup (Cloudflare & GoDaddy)
- [ ] Create Cloudflare account and add `gryffin-uit.site`
- [ ] Select Cloudflare Free Plan
- [ ] Update GoDaddy nameservers to Cloudflare nameservers
- [ ] Wait for DNS propagation (1-2 hours)

## Phase 2: AWS Lightsail Backend Setup
- [ ] Launch Lightsail instance (Ubuntu 22.04, $3.50/month plan)
- [ ] Attach static IP to instance
- [ ] Open firewall ports: 22, 80, 443
- [ ] SSH into instance and install Docker & Docker Compose
- [ ] Create `/home/ubuntu/myblogspot` directory
- [ ] Copy `docker-compose.prod.yml` to server
- [ ] Create `.env` file from `.env.prod.example` on server
- [ ] Install Nginx
- [ ] Install Certbot
- [ ] Copy `nginx-api.conf` to `/etc/nginx/sites-available/api.gryffin-uit.site`
- [ ] Enable Nginx site and reload
- [ ] Add Cloudflare A record: `api` → Lightsail static IP (DNS-only)
- [ ] Run Certbot: `sudo certbot --nginx -d api.gryffin-uit.site --non-interactive --agree-tos -m admin@gryffin-uit.site`

## Phase 3: AWS S3 & CloudFront Setup
- [ ] Create S3 bucket `gryffin-uit-site-frontend` in `ap-southeast-1`
- [ ] Keep "Block all public access" ENABLED (bucket stays private)
- [ ] Switch to **us-east-1** region in AWS Console
- [ ] Request ACM certificate for `gryffin-uit.site` and `www.gryffin-uit.site`
- [ ] Complete CNAME validation in Cloudflare DNS
- [ ] Create CloudFront distribution
  - Origin: S3 bucket (REST endpoint, not website endpoint)
  - Origin Access: Create new Origin Access Control (OAC)
  - Copy CloudFront-generated bucket policy to S3 bucket permissions
  - Viewer protocol: Redirect HTTP to HTTPS
  - Custom SSL: Select ACM certificate
  - CNAMEs: `gryffin-uit.site`, `www.gryffin-uit.site`
  - Default root: `index.html`
  - Custom error pages:
    - 403 → `/index.html` (HTTP 200, for SPA routing)
    - 404 → `/404.html` (HTTP 404)
- [ ] Add Cloudflare CNAME records:
  - `gryffin-uit.site` → CloudFront domain (proxied)
  - `www` → CloudFront domain (proxied)

## Phase 4: AWS ECR Setup
- [ ] Create ECR repository: `myblogspot-backend` in `ap-southeast-1`
- [ ] Note the repository URI

## Phase 5: Gitea Secrets Configuration
Set these secrets in Gitea repository settings:
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_ACCOUNT_ID`
- [ ] `AWS_CLOUDFRONT_DISTRIBUTION_ID`
- [ ] `NEXT_PUBLIC_ADMIN_LOGIN_SECRET`
- [ ] `LIGHTSAIL_IP`
- [ ] `LIGHTSAIL_SSH_KEY`

## Phase 6: First Deployment
- [ ] Push code to main branch
- [ ] Verify frontend workflow runs and deploys to S3
- [ ] Verify backend workflow builds, pushes to ECR, and deploys to Lightsail
- [ ] Test `https://api.gryffin-uit.site/api/v1/health` (or similar endpoint)
- [ ] Test `https://gryffin-uit.site`
- [ ] Test admin login: `https://gryffin-uit.site/admin/login?secret=<YOUR_SECRET>`

## Post-Deployment
- [ ] Monitor CloudFront cache hit rate
- [ ] Monitor Lightsail resource usage
- [ ] Set up log rotation on Lightsail
- [ ] Configure automated backups for PostgreSQL
- [ ] Test SSL certificate auto-renewal (Certbot)

## Estimated Monthly Cost
- Lightsail VPS: $3.50
- CloudFront: ~$0.10 (first 50GB free)
- S3 storage: ~$0.02
- Data transfer: ~$0.10
- **Total: ~$3.72/month**
