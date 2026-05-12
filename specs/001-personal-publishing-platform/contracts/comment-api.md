# Comment API Contract

**Version**: v1  
**Base Path**: `/api/v1`

---

## List Comments

**Endpoint**: `GET /api/v1/articles/:id/comments`

**Description**: Get all comments for an article (chronological order).

**Authentication**: None (public)

**Path Parameters**: `id` (UUID) - Article ID

**Query Parameters**:
- `page` (integer, default: 1)
- `per_page` (integer, default: 20, max: 50)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-...",
      "nickname": "JohnDoe",
      "content": "Great article! Very informative.",
      "created_at": "2026-05-10T15:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 12
  }
}
```

---

## Create Comment

**Endpoint**: `POST /api/v1/articles/:id/comments`

**Description**: Add a guest comment to an article.

**Authentication**: None (guest comments)

**Rate Limit**: 3 comments per hour per IP

**Request Body**:
```json
{
  "nickname": "JohnDoe",
  "content": "Great article! Very informative."
}
```

**Validation**:
- `nickname`: 2-50 characters, required
- `content`: 1-1000 characters, required

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "123e4567-...",
    "article_id": "223e4567-...",
    "nickname": "JohnDoe",
    "content": "Great article! Very informative.",
    "created_at": "2026-05-10T15:30:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation failure
- `404 Not Found`: Article not found
- `429 Too Many Requests`: Rate limit exceeded (3 per hour)

---

## Notes

- Comments are immutable (no editing after submission)
- IP address stored for rate limiting (not returned in API)
- Admin can delete comments via admin endpoints
- Chronological order (oldest first)
