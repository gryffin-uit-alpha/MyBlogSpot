# Admin API Contract

**Version**: v1  
**Base Path**: `/api/v1/admin`  
**Authentication**: Required (JWT token in HTTP-only cookie)

---

## Authentication

### Login

**Endpoint**: `POST /api/v1/admin/login`

**Rate Limit**: 5 attempts per 15 minutes per IP

**Request Body**:
```json
{
  "username": "admin",
  "password": "changeme"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "123e4567-...",
    "username": "admin",
    "email": "admin@myblogspot.local"
  }
}
```

**Sets Cookie**: `auth_token` (HttpOnly, Secure, SameSite=Strict, Max-Age=3600)

**Error Responses**:
- `401 Unauthorized`: Invalid credentials
- `429 Too Many Requests`: Rate limit exceeded

---

### Logout

**Endpoint**: `POST /api/v1/admin/logout`

**Authentication**: Required

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": null
}
```

**Clears Cookie**: `auth_token`

---

### Get Current Admin

**Endpoint**: `GET /api/v1/admin/me`

**Authentication**: Required

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "123e4567-...",
    "username": "admin",
    "email": "admin@myblogspot.local",
    "last_login_at": "2026-05-12T10:00:00Z"
  }
}
```

---

## Article Management

### List All Articles

**Endpoint**: `GET /api/v1/admin/articles`

**Description**: List all articles (including drafts).

**Query Parameters**: `page`, `per_page`, `status` (`draft` or `published` or `all`)

**Success Response**: Same as public articles, but includes drafts

---

### Get Article (Admin)

**Endpoint**: `GET /api/v1/admin/articles/:id`

**Path Parameters**: `id` (UUID)

**Success Response**: Full article details (including draft status)

---

### Create Article

**Endpoint**: `POST /api/v1/admin/articles`

**Request Body**:
```json
{
  "title": "Getting Started with Go",
  "slug": "getting-started-with-go",
  "summary": "A beginner's guide to Go...",
  "content": "# Introduction\n\nGo is...",
  "category_id": "223e4567-...",
  "tags": ["go", "programming", "backend"],
  "status": "draft"
}
```

**Validation**:
- `title`: 1-255 characters, required
- `slug`: Auto-generated if not provided, must be unique
- `summary`: 0-500 characters, optional
- `content`: 1-100,000 characters, required
- `category_id`: Valid UUID or null, optional
- `tags`: Array of tag names (strings), 0-10 items
- `status`: `draft` or `published`, default: `draft`

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "123e4567-...",
    "title": "Getting Started with Go",
    "slug": "getting-started-with-go",
    "status": "draft",
    "created_at": "2026-05-12T10:30:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation failure
- `400 Bad Request`: Duplicate slug (`DUPLICATE_SLUG`)

---

### Update Article

**Endpoint**: `PUT /api/v1/admin/articles/:id`

**Request Body**: Same as create (all fields optional)

**Success Response** (200 OK): Updated article

---

### Delete Article

**Endpoint**: `DELETE /api/v1/admin/articles/:id`

**Success Response** (204 No Content)

**Notes**: Deletes article and cascades to comments and article_tags

---

### Publish Article

**Endpoint**: `POST /api/v1/admin/articles/:id/publish`

**Description**: Change status from `draft` to `published` and set `published_at`.

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "123e4567-...",
    "status": "published",
    "published_at": "2026-05-12T10:35:00Z"
  }
}
```

---

### Unpublish Article

**Endpoint**: `POST /api/v1/admin/articles/:id/unpublish`

**Description**: Change status from `published` to `draft` and clear `published_at`.

**Success Response** (200 OK)

---

## Comment Moderation

### List All Comments

**Endpoint**: `GET /api/v1/admin/comments`

**Query Parameters**: `page`, `per_page`, `article_id` (filter by article)

**Success Response**: List of all comments across all articles

---

### Delete Comment

**Endpoint**: `DELETE /api/v1/admin/comments/:id`

**Success Response** (204 No Content)

---

## Category Management

### Create Category

**Endpoint**: `POST /api/v1/admin/categories`

**Request Body**:
```json
{
  "name": "DevOps",
  "slug": "devops",
  "description": "DevOps practices..."
}
```

**Success Response** (201 Created)

---

### Update Category

**Endpoint**: `PUT /api/v1/admin/categories/:id`

**Request Body**: Same as create

**Success Response** (200 OK)

---

### Delete Category

**Endpoint**: `DELETE /api/v1/admin/categories/:id`

**Success Response** (204 No Content)

**Notes**: Nullifies `category_id` on articles with this category

---

## Tag Management

### Create Tag

**Endpoint**: `POST /api/v1/admin/tags`

**Request Body**:
```json
{
  "name": "Go",
  "slug": "go"
}
```

**Success Response** (201 Created)

---

### Delete Tag

**Endpoint**: `DELETE /api/v1/admin/tags/:id`

**Success Response** (204 No Content)

**Notes**: Cascades to `article_tags` join table

---

## Analytics

### Get Analytics

**Endpoint**: `GET /api/v1/admin/analytics`

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total_articles": 156,
    "published_articles": 142,
    "draft_articles": 14,
    "total_views": 45231,
    "total_comments": 892,
    "popular_articles": [
      {
        "id": "123e4567-...",
        "title": "Getting Started with Go",
        "slug": "getting-started-with-go",
        "view_count": 5231,
        "comment_count": 45
      }
    ],
    "popular_categories": [
      { "name": "DevOps", "article_count": 45 }
    ],
    "popular_tags": [
      { "name": "Go", "article_count": 23 }
    ]
  }
}
```

---

## Authentication Middleware

All `/api/v1/admin/*` endpoints (except `/login`) require authentication.

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Token Validation**:
- JWT signature verified with secret key
- Token expiration checked (`exp` claim)
- Admin ID extracted from `sub` claim

---

## Notes

- All admin endpoints return `401` if not authenticated
- JWT tokens expire after 1 hour
- Frontend should handle token refresh before expiration
- Logout clears the `auth_token` cookie
- Rate limiting on login prevents brute force attacks
