#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting MyBlogSpot Application${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running${NC}"
    exit 1
fi

# Start PostgreSQL via Docker Compose
echo -e "${YELLOW}Starting PostgreSQL...${NC}"
docker compose up -d postgres

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
for i in {1..30}; do
    if docker exec myblogspot_postgres pg_isready -U myblogspot > /dev/null 2>&1; then
        echo -e "${GREEN}PostgreSQL is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}PostgreSQL failed to start${NC}"
        exit 1
    fi
    sleep 1
done

# Run database migrations (if schema.sql exists)
if [ -f "backend/internal/db/schema.sql" ]; then
    echo -e "${YELLOW}Running database migrations...${NC}"
    docker exec -i myblogspot_postgres psql -U myblogspot -d myblogspot_dev < backend/internal/db/schema.sql || echo -e "${YELLOW}Warning: Migrations may have already been applied${NC}"
fi

# Start Backend
echo -e "${YELLOW}Starting Go backend...${NC}"
cd backend
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file with defaults...${NC}"
    cat > .env << EOF
PORT=8080
ENV=development
BASE_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myblogspot_dev
DB_USER=myblogspot
DB_PASSWORD=secret
DB_SSLMODE=disable
JWT_SECRET=change-me-in-production
JWT_EXPIRATION=3600
CORS_ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60
EOF
fi

# Build and start backend in background
go build -o bin/server ./cmd/server
./bin/server &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "${GREEN}Backend is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Backend failed to start${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Start Frontend
echo -e "${YELLOW}Starting Next.js frontend...${NC}"
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}Creating .env.local file with defaults...${NC}"
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
EOF
fi

npm run dev &
FRONTEND_PID=$!
cd ..

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Shutting down...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    docker compose down
    echo -e "${GREEN}Application stopped${NC}"
    exit 0
}

trap cleanup INT TERM

echo -e "${GREEN}Application started successfully!${NC}"
echo -e "Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "Backend: ${GREEN}http://localhost:8080${NC}"
echo -e "PgAdmin: ${GREEN}http://localhost:5050${NC}"
echo -e "\nPress Ctrl+C to stop all services"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
