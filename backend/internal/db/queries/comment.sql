-- name: CreateComment :one
INSERT INTO comments (article_id, session_id, nickname, content, ip_address, parent_id)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetCommentByID :one
SELECT * FROM comments
WHERE id = $1;

-- name: ListCommentsByArticle :many
SELECT * FROM comments
WHERE article_id = $1 AND parent_id IS NULL AND approved = true
ORDER BY created_at ASC
LIMIT $2 OFFSET $3;

-- name: ListCommentsByArticleWithSession :many
SELECT * FROM comments
WHERE article_id = $1
  AND parent_id IS NULL
  AND (approved = true OR session_id = $2)
ORDER BY created_at ASC
LIMIT $3 OFFSET $4;

-- name: ListRepliesByComment :many
SELECT * FROM comments
WHERE parent_id = $1 AND approved = true
ORDER BY created_at ASC;

-- name: ListRepliesByCommentWithSession :many
SELECT * FROM comments
WHERE parent_id = $1 AND (approved = true OR session_id = $2)
ORDER BY created_at ASC;

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
WHERE article_id = $1 AND approved = true;

-- name: CountRecentCommentsByIP :one
SELECT COUNT(*) FROM comments
WHERE ip_address = $1 AND created_at > $2;

-- name: CountAllComments :one
SELECT COUNT(*) FROM comments;

-- name: ApproveComment :exec
UPDATE comments
SET approved = true
WHERE id = $1;

-- name: ListCommentsByArticleAdmin :many
SELECT * FROM comments
WHERE article_id = $1 AND parent_id IS NULL
ORDER BY created_at ASC
LIMIT $2 OFFSET $3;
