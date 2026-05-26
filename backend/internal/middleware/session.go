package middleware

import (
	"context"
	"net/http"

	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
)

const SessionIDKey contextKey = "session_id"
const SessionTokenKey contextKey = "session_token"

// SessionMiddleware handles session cookie management
func SessionMiddleware(sessionService *service.SessionService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			const cookieName = "myblogspot_session"

			// Try to get existing session from cookie
			cookie, err := r.Cookie(cookieName)
			var sessionToken string

			if err != nil || cookie.Value == "" {
				// No cookie or empty - create new session
				sessionID, token, err := sessionService.CreateSession(r.Context())
				if err == nil {
					sessionToken = token
					// Set cookie (1 year expiry)
					http.SetCookie(w, &http.Cookie{
						Name:     cookieName,
						Value:    token,
						Path:     "/",
						MaxAge:   31536000, // 1 year
						HttpOnly: true,
						SameSite: http.SameSiteLaxMode,
						Secure:   false, // Set to true in production with HTTPS
					})
					// Add session ID to context
					ctx := context.WithValue(r.Context(), SessionIDKey, sessionID)
					ctx = context.WithValue(ctx, SessionTokenKey, sessionToken)
					r = r.WithContext(ctx)
				}
			} else {
				// Have cookie - validate and get session
				sessionToken = cookie.Value
				session, err := sessionService.GetSessionByToken(r.Context(), sessionToken)
				if err == nil {
					// Valid session - add to context
					ctx := context.WithValue(r.Context(), SessionIDKey, session.ID)
					ctx = context.WithValue(ctx, SessionTokenKey, sessionToken)
					r = r.WithContext(ctx)
				} else {
					// Invalid session - create new one
					sessionID, token, err := sessionService.CreateSession(r.Context())
					if err == nil {
						sessionToken = token
						http.SetCookie(w, &http.Cookie{
							Name:     cookieName,
							Value:    token,
							Path:     "/",
							MaxAge:   31536000,
							HttpOnly: true,
							SameSite: http.SameSiteLaxMode,
							Secure:   false,
						})
						ctx := context.WithValue(r.Context(), SessionIDKey, sessionID)
						ctx = context.WithValue(ctx, SessionTokenKey, sessionToken)
						r = r.WithContext(ctx)
					}
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}
