# QuickStart Guide: MyBlogSpot Development

**Last Updated**: 2026-05-12  
**Target Audience**: Developers setting up local development environment

---

## Prerequisites

### Required Software
- **Go**: 1.22 or later ([install](https://go.dev/doc/install))
- **Node.js**: 20.x or later ([install](https://nodejs.org/))
- **PostgreSQL**: 15+ ([install](https://www.postgresql.org/download/))
- **Docker** (optional): For containerized PostgreSQL ([install](https://docs.docker.com/get-docker/))
- **Git**: For version control

### Recommended Tools
- **sqlc**: SQL query generator ([install](https://docs.sqlc.dev/en/latest/overview/install.html))
- **goose**: Database migration tool (`go install github.com/pressly/goose/v3/cmd/goose@latest`)
- **VS Code** with Go and TypeScript extensions

---

## Quick Start (5 Minutes)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/myblogspot.git
cd myblogspot
```

### 2. Start PostgreSQL
**Option A: Docker Compose (Recommended)**
```bash
docker-compose up -d
```

**Option B: Local PostgreSQL**
```bash
# Create database
createdb myblogspot_dev

# Create user (if needed)
psql -c "CREATE USER myblogspot WITH PASSWORD 'secret';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE myblogspot_dev TO myblogspot;"
```

### 3. Setup Backend
```bash
cd backend

# Install dependencies
go mod download

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=myblogspot_dev
# DB_USER=myblogspot
# DB_PASSWORD=secret
# JWT_SECRET=your-super-secret-key-change-in-production

# Run database migrations
goose -dir internal/db/migrations postgres "user=myblogspot password=secret dbname=myblogspot_dev sslmode=disable" up

# Generate sqlc code
sqlc generate

# Run backend server
go run cmd/server/main.go
```

Backend now running on **http://localhost:8080**

### 4. Setup Frontend
```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8080

# Run development server
npm run dev
```

Frontend now running on **http://localhost:3000**

### 5. Access the Application
- **Public Site**: http://localhost:3000
- **Admin Login**: http://localhost:3000/admin/login
  - Username: `admin`
  - Password: `changeme` (change immediately!)
- **Backend API**: http://localhost:8080/api/v1
- **Health Check**: http://localhost:8080/health

---

## Project Structure

```
myblogspot/
├── backend/                 # Go backend API
│   ├── cmd/server/         # Application entry point
│   ├── internal/           # Private application code
│   │   ├── config/        # Configuration management
│   │   ├── db/            # Database layer (sqlc, migrations)
│   │   ├── handler/       # HTTP handlers
│   │   ├── middleware/    # HTTP middleware
│   │   ├── service/       # Business logic
│   │   ├── model/         # Domain models
│   │   └── util/          # Utility functions
│   ├── tests/             # Test files
│   ├── go.mod             # Go dependencies
│   ├── Dockerfile         # Backend Docker image
│   └── .env.example       # Environment template
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/          # Next.js 14 App Router pages
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities and API clients
│   │   ├── styles/       # Global styles
│   │   └── types/        # TypeScript types
│   ├── public/           # Static assets
│   ├── package.json      # Node dependencies
│   └── .env.local.example
├── docs/                   # Documentation
├── specs/                  # Feature specifications
├── docker-compose.yml      # Local development services
└── README.md              # Project overview
```

---

## Development Workflow

### Backend Development

#### Run Tests
```bash
cd backend

# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run specific test
go test -v ./tests/integration/article_test.go

# Run benchmarks
go test -bench=. ./tests/benchmark/
```

#### Database Migrations
```bash
cd backend

# Create new migration
goose -dir internal/db/migrations create add_feature sql

# Apply migrations
goose -dir internal/db/migrations postgres $DB_URL up

# Rollback last migration
goose -dir internal/db/migrations postgres $DB_URL down

# Check migration status
goose -dir internal/db/migrations postgres $DB_URL status
```

#### Generate sqlc Code
```bash
cd backend

# After editing .sql files in internal/db/queries/
sqlc generate
```

#### Code Formatting & Linting
```bash
cd backend

# Format code
gofmt -w .

# Run go vet
go vet ./...

# Run golint (install: go install golang.org/x/lint/golint@latest)
golint ./...
```

---

### Frontend Development

#### Run Tests
```bash
cd frontend

# Run Jest tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests (Playwright)
npm run test:e2e
```

#### Lint & Format
```bash
cd frontend

# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Format with Prettier
npm run format
```

#### Build for Production
```bash
cd frontend

# Build optimized production bundle
npm run build

# Start production server
npm start
```

---

## Environment Variables

### Backend (.env)
```bash
# Server
PORT=8080
ENV=development  # development, production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myblogspot_dev
DB_USER=myblogspot
DB_PASSWORD=secret
DB_SSLMODE=disable  # require in production

# Authentication
JWT_SECRET=your-super-secret-key-minimum-32-characters-change-in-production
JWT_EXPIRATION=3600  # 1 hour in seconds

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60  # seconds
```

### Frontend (.env.local)
```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:8080

# Environment
NEXT_PUBLIC_ENV=development
```

---

## Common Tasks

### Seed Database with Sample Data
```bash
cd backend

# Run seed script (creates sample articles, categories, tags)
go run cmd/seed/main.go
```

### Reset Database
```bash
# Drop and recreate database
dropdb myblogspot_dev
createdb myblogspot_dev

# Re-run migrations
cd backend
goose -dir internal/db/migrations postgres $DB_URL up

# Seed sample data
go run cmd/seed/main.go
```

### Create Admin Account
```bash
# Admin account created automatically by first migration
# Default: username=admin, password=changeme

# To create additional admin (future multi-admin support):
psql myblogspot_dev
INSERT INTO admins (username, password_hash, email)
VALUES ('newadmin', crypt('password', gen_salt('bf', 12)), 'admin@example.com');
```

### View API Documentation
```bash
# Start backend
cd backend && go run cmd/server/main.go

# Access Swagger UI (if implemented)
open http://localhost:8080/swagger/index.html
```

---

## Troubleshooting

### Backend Issues

**Database Connection Error**
```
Error: failed to connect to database
```
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `.env`
- Check database exists: `psql -l | grep myblogspot`

**Migration Failed**
```
Error: migration xxx failed
```
- Check migration SQL syntax
- Rollback: `goose down`
- Check database state: `goose status`

**Port Already in Use**
```
Error: bind: address already in use
```
- Change port in `.env`: `PORT=8081`
- Or kill existing process: `lsof -ti:8080 | xargs kill`

### Frontend Issues

**Module Not Found**
```
Error: Cannot find module 'xyz'
```
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

**API Connection Failed**
```
Error: Failed to fetch
```
- Verify backend is running: `curl http://localhost:8080/health`
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS configuration in backend

**Build Errors**
```
Error: TypeScript compilation failed
```
- Run type check: `npm run type-check`
- Check TypeScript version matches project: `npm ls typescript`

---

## Testing

### Run All Tests
```bash
# Backend
cd backend && go test ./...

# Frontend
cd frontend && npm test
```

### Integration Tests (Backend)
```bash
cd backend

# Integration tests use testcontainers (Docker required)
go test ./tests/integration/... -v
```

### E2E Tests (Frontend)
```bash
cd frontend

# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run in UI mode
npm run test:e2e:ui
```

---

## Docker Development

### Build Docker Images
```bash
# Backend
cd backend
docker build -t myblogspot-backend .

# Frontend
cd frontend
docker build -t myblogspot-frontend .
```

### Run with Docker Compose
```bash
# Start all services (postgres, backend, frontend)
docker-compose up

# Rebuild and start
docker-compose up --build

# Stop all services
docker-compose down

# Clean volumes (reset database)
docker-compose down -v
```

---

## Production Deployment

### Backend Deployment
```bash
# Build production binary
cd backend
GOOS=linux GOARCH=amd64 go build -o myblogspot-server cmd/server/main.go

# Or use Docker
docker build -t myblogspot-backend:latest .
docker push your-registry/myblogspot-backend:latest
```

### Frontend Deployment (Vercel)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod
```

---

## Next Steps

1. **Create First Article**: Login to admin panel and create your first blog post
2. **Customize Branding**: Update logo, colors in `frontend/src/styles/globals.css`
3. **Configure Domain**: Set up custom domain in Vercel and backend DNS
4. **Enable Analytics**: Add Google Analytics or Vercel Analytics
5. **Set up CI/CD**: GitHub Actions workflows in `.github/workflows/`

---

## Resources

- **Backend Docs**: See `specs/001-personal-publishing-platform/contracts/`
- **Data Model**: See `specs/001-personal-publishing-platform/data-model.md`
- **API Contracts**: See `specs/001-personal-publishing-platform/contracts/api-endpoints.md`
- **Architecture**: See `specs/001-personal-publishing-platform/research.md`

---

## Support

- **Issues**: https://github.com/yourusername/myblogspot/issues
- **Documentation**: `/docs`
- **API Reference**: `/specs/001-personal-publishing-platform/contracts/`
