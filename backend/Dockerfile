# Production-Grade Multi-stage Dockerfile for MyBlogSpot Backend
# Ref: Knowledge_Base/Docker.md & Security.md

# ==========================================
# STAGE 1: Build statically compiled binary
# ==========================================
FROM golang:1.26-alpine AS builder

RUN apk add --no-cache ca-certificates git tzdata

WORKDIR /app

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Copy source code
COPY . .

# Build binary without CGO, stripped debug symbols (-s -w)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -trimpath \
    -ldflags="-s -w -X main.version=1.0.0" \
    -o /app/bin/server ./cmd/server

# Create uploads directory structure with nonroot UID 65532
RUN mkdir -p /app/uploads/general /app/uploads/articles /app/uploads/homepage && \
    chown -R 65532:65532 /app/uploads

# ==========================================
# STAGE 2: Distroless Minimal Non-root Runtime
# ==========================================
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /app

# Copy timezone data & SSL certs from builder
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy uploads directory structure with nonroot ownership
COPY --from=builder --chown=nonroot:nonroot /app/uploads /app/uploads

# Copy statically compiled binary
COPY --from=builder /app/bin/server /app/server

# Run with non-root UID 65532
USER nonroot:nonroot

EXPOSE 8080

ENTRYPOINT ["/app/server"]
