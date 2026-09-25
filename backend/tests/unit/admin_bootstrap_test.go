package unit

import (
	"context"
	"testing"

	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
)

func TestAdminService_BootstrapInitialAdmin(t *testing.T) {
	ctx := context.Background()
	adminService := service.NewAdminService(testQueries, "test-secret-key-1234567890123456")

	username := "bootstrap_tester"
	password := "bootstrap_pass_123"
	email := "bootstrap@example.com"

	// Cleanup any previous run
	_, _ = testPool.Exec(ctx, "DELETE FROM admins WHERE username = $1", username)

	// Test 1: Empty username/password should do nothing and return nil
	err := adminService.BootstrapInitialAdmin(ctx, "", "", "")
	if err != nil {
		t.Fatalf("Expected nil on empty credentials, got: %v", err)
	}

	// Test 2: First bootstrap creates the admin
	err = adminService.BootstrapInitialAdmin(ctx, username, password, email)
	if err != nil {
		t.Fatalf("Failed to bootstrap initial admin: %v", err)
	}

	// Verify login works with the bootstrapped admin
	resp, err := adminService.Login(ctx, model.LoginRequest{
		Username: username,
		Password: password,
	})
	if err != nil {
		t.Fatalf("Login failed for bootstrapped admin: %v", err)
	}
	if resp.Token == "" {
		t.Errorf("Expected non-empty token")
	}
	if resp.Admin.Username != username {
		t.Errorf("Expected username %s, got %s", username, resp.Admin.Username)
	}

	// Test 3: Second bootstrap should be idempotent (no error, no duplicate)
	err = adminService.BootstrapInitialAdmin(ctx, username, password, email)
	if err != nil {
		t.Fatalf("Expected idempotent bootstrap to succeed without error, got: %v", err)
	}

	// Cleanup
	_, _ = testPool.Exec(ctx, "DELETE FROM admins WHERE username = $1", username)
}
