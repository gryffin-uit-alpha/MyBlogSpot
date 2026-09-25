# Implementation Plan: Deploying MyBlogSpot on AWS

* **Target Domain**: `gryffin-uit.site` (GoDaddy)
* **AWS Region**: `ap-southeast-1` (Singapore - optimal for users in Vietnam/Asia-Pacific)
* **Target Architecture**: Cost-Optimized hybrid stack (< $4.00/month)
  * **Frontend**: AWS S3 + AWS CloudFront (HTTPS)
  * **Backend**: AWS Lightsail VPS (Nginx + Docker Go Backend + Docker PostgreSQL)
  * **DNS/Proxy**: Cloudflare (Free DNS, SSL validation, CDN)

---

## Phase 1: DNS Setup (Cloudflare & GoDaddy)

Using Cloudflare for DNS saves the **$0.50/month** AWS Route 53 charge and provides DDoS protection.

1. **Create Cloudflare Account**:
   - Add site `gryffin-uit.site`.
   - Select the **Free Plan**.
2. **Update GoDaddy Name Servers**:
   - Go to GoDaddy Domain Control Panel for `gryffin-uit.site`.
   - Under **DNS Servers**, click **Change** and input the two Name Servers provided by Cloudflare (e.g., `alice.ns.cloudflare.com`, `bob.ns.cloudflare.com`).
   - Save changes (DNS propagation may take 1 - 2 hours).

---

## Phase 2: AWS Lightsail Backend Setup (ap-southeast-1)

1. **Launch Lightsail Instance**:
   - Go to AWS Console -> Lightsail.
   - Choose **OS Only** -> **Ubuntu 22.04 LTS**.
   - Select the **$3.50 USD/month** plan.
   - Name the instance: `myblogspot-backend-server`.
2. **Configure Networking**:
   - Attach a **Static IP** to the instance (Free). Let's assume it is `54.251.x.x`.
   - In the firewall settings, open ports:
     - `22` (SSH)
     - `80` (HTTP)
     - `443` (HTTPS)
3. **Install Docker & Docker Compose on Lightsail**:
   SSH into the instance and run:
   ```bash
   sudo apt-get update
   sudo apt-get install -y docker.io docker-compose
   sudo systemctl enable docker
   sudo systemctl start docker
   ```
4. **Setup Application Directory**:
   Create directory `/home/ubuntu/myblogspot` and place `docker-compose.prod.yml` there:
   ```yaml
   version: '3.8'

   services:
     postgres:
       image: postgres:15-alpine
       container_name: myblogspot_postgres
       restart: always
       environment:
         POSTGRES_USER: myblogspot
         POSTGRES_PASSWORD: ${DB_PASSWORD}
         POSTGRES_DB: myblogspot_prod
       volumes:
         - postgres_prod_data:/var/lib/postgresql/data
       command:
         - "-c"
         - "max_connections=10"
         - "-c"
         - "shared_buffers=16MB"
         - "-c"
         - "work_mem=1MB"
       # Do NOT expose port 5432 to public internet for security

     backend:
       image: ${ECR_REGISTRY}/myblogspot-backend:latest
       container_name: myblogspot_backend
       restart: always
       ports:
         - "127.0.0.1:8080:8080" # Bind strictly to localhost
       environment:
         PORT: "8080"
         ENV: production
         BASE_URL: https://gryffin-uit.site
         DB_HOST: postgres
         DB_PORT: "5432"
         DB_NAME: myblogspot_prod
         DB_USER: myblogspot
         DB_PASSWORD: ${DB_PASSWORD}
         DB_SSLMODE: disable
         JWT_SECRET: ${JWT_SECRET}
         JWT_EXPIRATION: "3600"
         CORS_ALLOWED_ORIGINS: https://gryffin-uit.site
         RATE_LIMIT_REQUESTS: "100"
         RATE_LIMIT_WINDOW: "60"
       depends_on:
         - postgres

   volumes:
     postgres_prod_data:
   ```
5. **Nginx & SSL Configuration (on Lightsail)**:
   - Install Nginx: `sudo apt-get install -y nginx`
   - Install Certbot: `sudo apt-get install -y certbot python3-certbot-nginx`
   - Configure Nginx site file `/etc/nginx/sites-available/api.gryffin-uit.site`:
     ```nginx
     server {
         listen 80;
         server_name api.gryffin-uit.site;

         # Static files upload routing (saves Go CPU cycles)
         location /uploads/ {
             alias /home/ubuntu/myblogspot/uploads/;
             expires 30d;
             add_header Cache-Control "public, no-transform";
         }

         # Reverse Proxy to Go API
         location / {
             proxy_pass http://127.0.0.1:8080;
             proxy_http_version 1.1;
             proxy_set_header Upgrade $http_upgrade;
             proxy_set_header Connection 'upgrade';
             proxy_set_header Host $host;
             proxy_cache_bypass $http_upgrade;
             proxy_set_header X-Real-IP $remote_addr;
             proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
             proxy_set_header X-Forwarded-Proto $scheme;
         }
     }
     ```
   - Enable configuration: 
     `sudo ln -s /etc/nginx/sites-available/api.gryffin-uit.site /etc/nginx/sites-enabled/`
     `sudo nginx -t && sudo systemctl restart nginx`
   - Fetch SSL via Certbot:
     `sudo certbot --nginx -d api.gryffin-uit.site --non-interactive --agree-tos -m admin@gryffin-uit.site`
     (This secures HTTPS on `https://api.gryffin-uit.site` automatically).

---

## Phase 3: S3 & CloudFront Frontend Setup

1. **AWS S3 Bucket**:
   - Create bucket `gryffin-uit-site-frontend` in `ap-southeast-1`.
   - **KEEP "Block all public access" ENABLED** (bucket stays private, CloudFront will use OAC for access).
   - Do NOT enable static website hosting (not needed with CloudFront OAC).
2. **AWS Certificate Manager (ACM) SSL**:
   - **CRITICAL**: Switch your AWS Console region to **us-east-1** (N. Virginia) - this is required for CloudFront SSL.
   - Request a certificate for `gryffin-uit.site` and `www.gryffin-uit.site`.
   - Complete CNAME validation in Cloudflare DNS.
3. **AWS CloudFront Distribution**:
   - Origin Domain: Select your S3 bucket (use bucket REST endpoint, not website endpoint).
   - **Origin Access**: Create new **Origin Access Control (OAC)** - CloudFront will provide a bucket policy to copy.
   - Copy the CloudFront-generated bucket policy and add it to your S3 bucket permissions.
   - Viewer Protocol Policy: **Redirect HTTP to HTTPS**.
   - Custom SSL Certificate: Select the ACM certificate you created.
   - Alternate Domain Names (CNAMEs): `gryffin-uit.site` and `www.gryffin-uit.site`.
   - Default Root Object: `index.html`.
   - Set up custom error pages in CloudFront:
     - Error Code: `403` -> Custom Error Response Page: `/index.html` (returns HTTP 200) for SPA routing.
     - Error Code: `404` -> Custom Error Response Page: `/404.html` (returns HTTP 404).
4. **Cloudflare Routing Point**:
   - Add CNAME record: `gryffin-uit.site` pointing to `yourcloudfrontid.cloudfront.net` (Proxy enabled).
   - Add CNAME record: `www` pointing to `yourcloudfrontid.cloudfront.net`.
   - Add A record: `api` pointing to your AWS Lightsail Static IP (Proxy disabled/DNS-only, to allow direct API calls).

---

## Phase 4: Frontend Next.js Configuration

Ensure Next.js is configured for static export.

1. Update `frontend/next.config.js`:
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'export', // Enables static HTML export
     reactStrictMode: true,
     swcMinify: true,
     images: {
       unoptimized: true, // Required for static HTML export
     },
     env: {
       NEXT_PUBLIC_API_URL: 'https://api.gryffin-uit.site/api/v1',
     },
   }
   module.exports = nextConfig
   ```

2. Update `frontend/src/app/admin/login/page.tsx` environment check (already completed):
   Access path will be `https://gryffin-uit.site/admin/login?secret=<YOUR_SECRET>`.

---

## Phase 5: Gitea CI/CD Workflow Files

Create Gitea Action workflows for automation.

### 1. Frontend Actions: `.github/workflows/deploy-frontend.yml`
```yaml
name: Deploy Frontend

on:
  push:
    branches:
      - main
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
          cache-dependency-path: 'frontend/package-lock.json'
      - name: Install
        run: cd frontend && npm ci
      - name: Build
        run: cd frontend && npm run build
        env:
          NEXT_PUBLIC_API_URL: https://api.gryffin-uit.site/api/v1
          NEXT_PUBLIC_ENV: production
          NEXT_PUBLIC_ADMIN_LOGIN_SECRET: ${{ secrets.NEXT_PUBLIC_ADMIN_LOGIN_SECRET }}
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-southeast-1
      - name: Sync to S3
        run: aws s3 sync frontend/out/ s3://gryffin-uit-site-frontend --delete
      - name: Invalidate CDN
        run: aws cloudfront create-invalidation --distribution-id ${{ secrets.AWS_CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
```

### 2. Backend Actions: `.github/workflows/deploy-backend.yml`
```yaml
name: Deploy Backend

on:
  push:
    branches:
      - main
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Login ECR
        uses: aws-actions/amazon-ecr-login@v2
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: ap-southeast-1
      - name: Build & Push
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.ap-southeast-1.amazonaws.com/myblogspot-backend:latest
      - name: SSH Deploy
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.LIGHTSAIL_IP }}
          username: ubuntu
          key: ${{ secrets.LIGHTSAIL_SSH_KEY }}
          script: |
            aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.ap-southeast-1.amazonaws.com
            cd /home/ubuntu/myblogspot
            docker-compose -f docker-compose.prod.yml pull backend
            docker-compose -f docker-compose.prod.yml up -d backend postgres
            docker image prune -f
```

---

## Credentials Setup inside Gitea Secrets:
Set the following secrets in Github repository settings:
* `AWS_ACCESS_KEY_ID` (Your configured AWS access key)
* `AWS_SECRET_ACCESS_KEY` (Your configured AWS secret key)
* `AWS_ACCOUNT_ID` (AWS Account number)
* `AWS_CLOUDFRONT_DISTRIBUTION_ID` (CloudFront Distribution ID)
* `NEXT_PUBLIC_ADMIN_LOGIN_SECRET` (Hidden URL key, e.g. `secret2026`)
* `LIGHTSAIL_IP` (Static IP of the Lightsail instance)
* `LIGHTSAIL_SSH_KEY` (SSH private key to access Lightsail instance)
