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

func pgUUIDToUUID(u pgtype.UUID) uuid.UUID {
	return uuid.UUID(u.Bytes)
}
