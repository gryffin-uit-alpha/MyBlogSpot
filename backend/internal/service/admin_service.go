package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
	"github.com/gryffin-uit-alpha/myblogspot/internal/util"
	"github.com/jackc/pgx/v5/pgtype"
)

type AdminService struct {
	queries   *db.Queries
	jwtSecret string
}

func NewAdminService(queries *db.Queries, jwtSecret string) *AdminService {
	return &AdminService{
		queries:   queries,
		jwtSecret: jwtSecret,
	}
}

func (s *AdminService) Login(ctx context.Context, req model.LoginRequest) (*model.LoginResponse, error) {
	admin, err := s.queries.GetAdminByUsername(ctx, req.Username)
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	if !util.CheckPassword(req.Password, admin.PasswordHash) {
		return nil, fmt.Errorf("invalid credentials")
	}

	adminUUID := pgUUIDToUUID(admin.ID)
	token, err := util.GenerateToken(adminUUID, s.jwtSecret, 24*time.Hour)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	if err := s.queries.UpdateLastLogin(ctx, admin.ID); err != nil {
		return nil, fmt.Errorf("failed to update last login: %w", err)
	}

	return &model.LoginResponse{
		Token: token,
		Admin: model.Admin{
			ID:        adminUUID.String(),
			Username:  admin.Username,
			Email:     admin.Email,
			CreatedAt: admin.CreatedAt.Time,
			UpdatedAt: admin.UpdatedAt.Time,
		},
	}, nil
}

// BootstrapInitialAdmin creates the initial admin account if not already present
func (s *AdminService) BootstrapInitialAdmin(ctx context.Context, username, password, email string) error {
	if username == "" || password == "" {
		return nil
	}

	// Check if admin user already exists
	_, err := s.queries.GetAdminByUsername(ctx, username)
	if err == nil {
		return nil // Idempotent: admin already exists
	}

	// Hash password
	hash, err := util.HashPassword(password)
	if err != nil {
		return fmt.Errorf("failed to hash initial admin password: %w", err)
	}

	if email == "" {
		email = username + "@myblogspot.local"
	}

	_, err = s.queries.CreateAdmin(ctx, db.CreateAdminParams{
		Username:     username,
		PasswordHash: hash,
		Email:        email,
	})
	if err != nil {
		return fmt.Errorf("failed to create initial admin '%s': %w", username, err)
	}

	return nil
}

func pgUUIDToUUID(u pgtype.UUID) uuid.UUID {
	return uuid.UUID(u.Bytes)
}
