package integration

import (
	"context"
	"testing"

	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
	"github.com/gryffin-uit-alpha/myblogspot/internal/util"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const testJWTSecret = "test-secret-key-for-jwt"

func TestAdminLogin(t *testing.T) {
	setupTestDB(t)
	defer cleanupDatabase(t)

	ctx := context.Background()

	// Create test admin
	passwordHash, err := util.HashPassword("testpass123")
	require.NoError(t, err)

	admin, err := testQueries.CreateAdmin(ctx, db.CreateAdminParams{
		Username:     "testadmin",
		PasswordHash: passwordHash,
		Email:        "test@example.com",
	})
	require.NoError(t, err)

	adminService := service.NewAdminService(testQueries, testJWTSecret)

	t.Run("successful login", func(t *testing.T) {
		req := model.LoginRequest{
			Username: "testadmin",
			Password: "testpass123",
		}

		resp, err := adminService.Login(ctx, req)
		require.NoError(t, err)
		assert.NotEmpty(t, resp.Token)
		assert.Equal(t, admin.Username, resp.Admin.Username)
		assert.Equal(t, admin.Email, resp.Admin.Email)
	})

	t.Run("invalid username", func(t *testing.T) {
		req := model.LoginRequest{
			Username: "wronguser",
			Password: "testpass123",
		}

		_, err := adminService.Login(ctx, req)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "invalid credentials")
	})

	t.Run("invalid password", func(t *testing.T) {
		req := model.LoginRequest{
			Username: "testadmin",
			Password: "wrongpass",
		}

		_, err := adminService.Login(ctx, req)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "invalid credentials")
	})

	t.Run("token validation", func(t *testing.T) {
		req := model.LoginRequest{
			Username: "testadmin",
			Password: "testpass123",
		}

		resp, err := adminService.Login(ctx, req)
		require.NoError(t, err)

		// Validate token
		claims, err := util.ValidateToken(resp.Token, testJWTSecret)
		require.NoError(t, err)
		assert.NotEmpty(t, claims.AdminID)
	})

	// Cleanup
	_, err = testPool.Exec(ctx, "DELETE FROM admins WHERE username = 'testadmin'")
	require.NoError(t, err)
}
