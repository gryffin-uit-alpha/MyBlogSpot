package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/gryffin-uit-alpha/myblogspot/internal/config"
	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/gryffin-uit-alpha/myblogspot/internal/util"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	if len(os.Args) < 4 {
		log.Fatal("Usage: go run scripts/create_admin.go <username> <password> <email>")
	}

	username := os.Args[1]
	password := os.Args[2]
	email := os.Args[3]

	// Load config
	cfg := config.Load()

	// Initialize database connection
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.Name,
		cfg.Database.SSLMode,
	)

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	// Hash password
	passwordHash, err := util.HashPassword(password)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	// Create admin
	queries := db.New(pool)
	admin, err := queries.CreateAdmin(ctx, db.CreateAdminParams{
		Username:     username,
		PasswordHash: passwordHash,
		Email:        email,
	})
	if err != nil {
		log.Fatalf("Failed to create admin: %v", err)
	}

	log.Printf("Admin created successfully: %s (ID: %s)", admin.Username, admin.ID)
}
