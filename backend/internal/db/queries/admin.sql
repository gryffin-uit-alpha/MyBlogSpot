-- name: CreateAdmin :one
INSERT INTO admins (username, password_hash, email)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetAdminByUsername :one
SELECT * FROM admins
WHERE username = $1;

-- name: GetAdminByID :one
SELECT * FROM admins
WHERE id = $1;

-- name: UpdateLastLogin :exec
UPDATE admins
SET last_login_at = NOW()
WHERE id = $1;
