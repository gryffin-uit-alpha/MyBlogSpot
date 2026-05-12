-- name: CreateComment :one
INSERT INTO comments (article_id, nickname, content, ip_address)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetCommentByID :one
SELECT * FROM comments
WHERE id = $1;

-- name: ListCommentsByArticle :many
SELECT * FROM comments
WHERE article_id = $1
ORDER BY created_at ASC
LIMIT $2 OFFSET $3;

-- name: ListAllComments :many
SELECT c.*, a.title as article_title, a.slug as article_slug
FROM comments c
INNER JOIN articles a ON c.article_id = a.id
ORDER BY c.created_at DESC
LIMIT $1 OFFSET $2;

-- name: DeleteComment :exec
DELETE FROM comments
WHERE id = $1;

-- name: CountCommentsByArticle :one
SELECT COUNT(*) FROM comments
WHERE article_id = $1;

-- name: CountRecentCommentsByIP :one
SELECT COUNT(*) FROM comments
WHERE ip_address = $1 AND created_at > $2;
