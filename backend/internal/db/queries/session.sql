-- name: CreateSession :one
INSERT INTO sessions (session_token)
VALUES ($1)
RETURNING *;

-- name: GetSessionByToken :one
SELECT * FROM sessions
WHERE session_token = $1;

-- name: UpdateSessionNickname :exec
UPDATE sessions
SET nickname = $1, updated_at = NOW()
WHERE session_token = $2;
