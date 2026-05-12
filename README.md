# MyBlogSpot - Personal Publishing Platform

A modern fullstack personal blogging platform built with **Next.js 14** (frontend) and **Go** (backend), designed for technical writing, DevOps knowledge sharing, and personal storytelling.

## Features

### Public Experience
- 📖 Browse and read articles without authentication
- 🔍 Full-text search with PostgreSQL FTS
- 🏷️ Category and tag-based content discovery
- 💬 Guest comments (nickname-only, no registration)
- 📱 Mobile-responsive design
- ⚡ Fast page loads (<2 seconds)
- 🎨 Syntax-highlighted code blocks

### Admin Experience
- 🔐 Secure JWT authentication
- ✍️ Markdown editor with live preview
- 📝 Article CRUD operations
- 📊 Basic analytics (views, popular articles)
- 🗂️ Category and tag management
- 🛡️ Comment moderation
- 🚀 Draft and publish workflow

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS + Typography plugin
- **Content**: Markdown/MDX
- **Animation**: Framer Motion
- **Testing**: Jest, React Testing Library, Playwright

### Backend
- **Language**: Go 1.22+
- **Router**: Chi
- **Database**: PostgreSQL 15+
- **Query Builder**: sqlc (type-safe SQL)
- **Migrations**: goose
- **Authentication**: JWT with HTTP-only cookies
- **Password Hashing**: bcrypt (cost 12)

## Quick Start

### Prerequisites
- Go 1.22+ ([install](https://go.dev/doc/install))
- Node.js 20+ ([install](https://nodejs.org/))
- PostgreSQL 15+ or Docker

### 1. Clone Repository
```bash
git clone https://github.com/gryffin-uit-alpha/myblogspot.git
cd myblogspot
```

### 2. Start Database
```bash
docker-compose up -d
```

### 3. Setup Backend
```bash
cd backend

# Copy environment file
cp .env.example .env

# Install dependencies
go mod download

# Run migrations
goose -dir internal/db/migrations postgres "user=myblogspot password=secret dbname=myblogspot_dev sslmode=disable" up

# Generate sqlc code
sqlc generate

# Start server
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

# Start development server
npm run dev
```

Frontend now running on **http://localhost:3000**

### 5. Access Application
- **Public Site**: http://localhost:3000
- **Admin Login**: http://localhost:3000/admin/login
  - Username: `admin`
  - Password: `changeme` (⚠️ change immediately!)
- **Backend API**: http://localhost:8080/api/v1
- **PgAdmin**: http://localhost:5050 (admin@myblogspot.local / admin)

## Project Structure

```
myblogspot/
├── backend/                 # Go backend API
│   ├── cmd/server/         # Application entry point
│   ├── internal/           # Private application code
│   │   ├── db/            # Database layer (sqlc, migrations)
│   │   ├── handler/       # HTTP handlers
│   │   ├── middleware/    # HTTP middleware
│   │   ├── service/       # Business logic
│   │   └── model/         # Domain models
│   └── tests/             # Test files
├── frontend/               # Next.js frontend
│   ├── src/app/          # App Router pages
│   ├── src/components/   # React components
│   ├── src/lib/          # Utilities and API clients
│   └── __tests__/        # Tests
├── docs/                   # Documentation
├── specs/                  # Feature specifications
└── docker-compose.yml      # Local development services
```

## Development

### Backend
```bash
# Run tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Format code
gofmt -w .

# Lint
go vet ./...
```

### Frontend
```bash
# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Lint
npm run lint

# Format
npm run format
```

## Documentation

- **Specification**: [specs/001-personal-publishing-platform/spec.md](specs/001-personal-publishing-platform/spec.md)
- **Implementation Plan**: [specs/001-personal-publishing-platform/plan.md](specs/001-personal-publishing-platform/plan.md)
- **API Contracts**: [specs/001-personal-publishing-platform/contracts/](specs/001-personal-publishing-platform/contracts/)
- **Data Model**: [specs/001-personal-publishing-platform/data-model.md](specs/001-personal-publishing-platform/data-model.md)
- **Tasks**: [specs/001-personal-publishing-platform/tasks.md](specs/001-personal-publishing-platform/tasks.md)

## Deployment

### Frontend (Vercel)
```bash
npm install -g vercel
cd frontend
vercel --prod
```

### Backend (Docker)
```bash
cd backend
docker build -t myblogspot-backend .
docker run -p 8080:8080 myblogspot-backend
```

## License

MIT

## Author

gryffin-uit-alpha
