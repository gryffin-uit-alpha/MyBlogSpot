package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
	"github.com/gryffin-uit-alpha/myblogspot/internal/util"
)

type contextKey string

const AdminIDKey contextKey = "admin_id"

func Auth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenString := extractToken(r)
			if tokenString == "" {
				respondJSON(w, http.StatusUnauthorized, model.ErrorResponse("UNAUTHORIZED", "Authentication required"))
				return
			}

			claims, err := util.ValidateToken(tokenString, jwtSecret)
			if err != nil {
				respondJSON(w, http.StatusUnauthorized, model.ErrorResponse("UNAUTHORIZED", "Invalid token"))
				return
			}

			ctx := context.WithValue(r.Context(), AdminIDKey, claims.AdminID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func extractToken(r *http.Request) string {
	if cookie, err := r.Cookie("auth_token"); err == nil {
		return cookie.Value
	}

	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && parts[0] == "Bearer" {
			return parts[1]
		}
	}

	return ""
}
