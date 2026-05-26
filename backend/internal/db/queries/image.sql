-- name: CreateImage :one
INSERT INTO images (
    filename,
    original_filename,
    url,
    folder,
    alt_text,
    size_bytes,
    mime_type
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
RETURNING *;

-- name: GetImage :one
SELECT * FROM images
WHERE id = $1;

-- name: ListImages :many
SELECT * FROM images
WHERE ($1::text = '' OR folder = $1)
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountImages :one
SELECT COUNT(*) FROM images
WHERE ($1::text = '' OR folder = $1);

-- name: DeleteImage :exec
DELETE FROM images
WHERE id = $1;

-- name: UpdateImageAltText :exec
UPDATE images
SET alt_text = $1
WHERE id = $2;

-- name: ListImagesByFolder :many
SELECT * FROM images
WHERE folder = $1
ORDER BY created_at DESC;
