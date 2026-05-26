package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"

	"github.com/google/uuid"
	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/jackc/pgx/v5/pgtype"
)

type SessionService struct {
	queries *db.Queries
}

func NewSessionService(queries *db.Queries) *SessionService {
	return &SessionService{queries: queries}
}

// GenerateSessionToken creates a random session token
func (s *SessionService) GenerateSessionToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// CreateSession creates a new session with a random token
func (s *SessionService) CreateSession(ctx context.Context) (uuid.UUID, string, error) {
	token, err := s.GenerateSessionToken()
	if err != nil {
		return uuid.Nil, "", fmt.Errorf("failed to generate token: %w", err)
	}

	session, err := s.queries.CreateSession(ctx, token)
	if err != nil {
		return uuid.Nil, "", fmt.Errorf("failed to create session: %w", err)
	}

	return uuid.UUID(session.ID.Bytes), token, nil
}

// GetSessionByToken retrieves a session by its token
func (s *SessionService) GetSessionByToken(ctx context.Context, token string) (*db.Session, error) {
	session, err := s.queries.GetSessionByToken(ctx, token)
	if err != nil {
		return nil, fmt.Errorf("session not found: %w", err)
	}
	return &session, nil
}

// UpdateNickname sets or updates the nickname for a session
func (s *SessionService) UpdateNickname(ctx context.Context, token, nickname string) error {
	err := s.queries.UpdateSessionNickname(ctx, db.UpdateSessionNicknameParams{
		Nickname:     pgtype.Text{String: nickname, Valid: true},
		SessionToken: token,
	})
	if err != nil {
		return fmt.Errorf("failed to update nickname: %w", err)
	}
	return nil
}
