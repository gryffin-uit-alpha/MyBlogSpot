# API Endpoints Overview

**Date**: 2026-05-12  
**Feature**: MyBlogSpot Personal Publishing Platform  
**Base URL**: `http://localhost:8080` (development), `https://api.myblogspot.com` (production)  
**API Version**: `v1`

---

## API Design Principles

1. **RESTful**: Resources identified by nouns, operations by HTTP verbs
2. **Versioned**: All endpoints prefixed with `/api/v1/`
3. **Consistent Responses**: Standardized JSON structure (see below)
4. **Stateless**: No server-side session state (JWT for auth)
5. **Paginated**: List endpoints support pagination
6. **Secure**: HTTPS required in production, rate limiting on sensitive endpoints

---

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response payload (object or array)
  },
  "meta": {
    // Optional metadata (pagination, counts, etc.)
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Pagination Meta
```json
{
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 156,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE (no response body) |
| 400 | Bad Request | Invalid input validation |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource does not exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_INPUT` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `DUPLICATE_SLUG` | 400 | Slug already exists |
| `INVALID_CREDENTIALS` | 401 | Login failed |

---

## Endpoint Categories

### Public Endpoints (No Authentication Required)
- Articles (read operations)
- Categories (read operations)
- Tags (read operations)
- Comments (read, create)
- Search

### Admin Endpoints (Authentication Required)
- Admin authentication
- Article management (create, update, delete)
- Comment moderation
- Category management
- Tag management
- Analytics

---

## Public Endpoints

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |

### Articles
| Method | Endpoint | Description | Details |
|--------|----------|-------------|---------|
| GET | `/api/v1/articles` | List published articles | [article-api.md](./article-api.md#list-articles) |
| GET | `/api/v1/articles/:slug` | Get article by slug | [article-api.md](./article-api.md#get-article) |
| POST | `/api/v1/articles/:id/view` | Increment view count | [article-api.md](./article-api.md#increment-views) |

### Categories
| Method | Endpoint | Description | Details |
|--------|----------|-------------|---------|
| GET | `/api/v1/categories` | List all categories | [category-tag-api.md](./category-tag-api.md#list-categories) |
| GET | `/api/v1/categories/:slug` | Get category by slug | [category-tag-api.md](./category-tag-api.md#get-category) |
| GET | `/api/v1/categories/:slug/articles` | List articles in category | [category-tag-api.md](./category-tag-api.md#category-articles) |

### Tags
| Method | Endpoint | Description | Details |
|--------|----------|-------------|---------|
| GET | `/api/v1/tags` | List all tags | [category-tag-api.md](./category-tag-api.md#list-tags) |
| GET | `/api/v1/tags/:slug` | Get tag by slug | [category-tag-api.md](./category-tag-api.md#get-tag) |
| GET | `/api/v1/tags/:slug/articles` | List articles with tag | [category-tag-api.md](./category-tag-api.md#tag-articles) |

### Comments
| Method | Endpoint | Description | Details |
|--------|----------|-------------|---------|
| GET | `/api/v1/articles/:id/comments` | List comments for article | [comment-api.md](./comment-api.md#list-comments) |
| POST | `/api/v1/articles/:id/comments` | Create comment | [comment-api.md](./comment-api.md#create-comment) |

### Search
| Method | Endpoint | Description | Details |
|--------|----------|-------------|---------|
| GET | `/api/v1/search` | Search articles | [search-api.md](./search-api.md#search-articles) |

---

## Admin Endpoints (Protected)

### Authentication
| Method | Endpoint | Description | Details |
|--------|----------|-------------|---------|
| POST | `/api/v1/admin/login` | Admin login | [admin-api.md](./admin-api.md#login) |
| POST | `/api/v1/admin/logout` | Admin logout | [admin-api.md](./admin-api.md#logout) |
| GET | `/api/v1/admin/me` | Get current admin info | [admin-api.md](./admin-api.md#get-current-admin) |

### Article Management
| Method | Endpoint | Description | Details |
|--------|----------|-------------|---------|
| GET | `/api/v1/admin/articles` | List all articles (including drafts) | [admin-api.md](./admin-api.md#list-all-articles) |
| GET | `/api/v1/admin/articles/:id` | Get article by ID | [admin-api.md](./admin-api.md#get-article-admin) |
| POST | `/api/v1/admin/articles` | Create article | [admin-api.md](./admin-api.md#create-article) |
| PUT | `/api/v1/admin/articles/:id` | Update article | [admin-api.md](./admin-api.md#update-article) |
| DELETE | `/api/v1/admin/articles/:id` | Delete article | [admin-api.md](./admin-api.md#delete-article) |
| POST | `/api/v1/admin/articles/:id/publish` | Publish article | [admin-api.md](./admin-api.md#publish-article) |
| POST | `/api/v1/admin/articles/:id/unpublish` | Unpublish article | [admin-api.md](./admin-api.md#unpublish-article) |

### Comment Moderation
| Method | Endpoint | Description | Details |
|--------|----------|-------------|---------|
| GET | `/api/v1/admin/comments` | List all comments | [admin-api.md](./admin-api.md#list-all-comments) |
| DELETE | `/api/v1/admin/comments/:id` | Delete comment | [admin-api.md](./admin-api.md#delete-comment) |

### Category Management
| Method | Endpoint | Description | Details |
|--------|----------|-------------|---------|
| POST | `/api/v1/admin/categories` | Create category | [admin-api.md](./admin-api.md#create-category) |
| PUT | `/api/v1/admin/categories/:id` | Update category | [admin-api.md](./admin-api.md#update-category) |
| DELETE | `/api/v1/admin/categories/:id` | Delete category | [admin-api.md](./admin-api.md#delete-category) |

### Tag Management
| Method | Endpoint | Description | Details |
|--------|----------|-------------|---------|
| POST | `/api/v1/admin/tags` | Create tag | [admin-api.md](./admin-api.md#create-tag) |
| DELETE | `/api/v1/admin/tags/:id` | Delete tag | [admin-api.md](./admin-api.md#delete-tag) |

### Analytics
| Method | Endpoint | Description | Details |
|--------|----------|-------------|---------|
| GET | `/api/v1/admin/analytics` | Get platform analytics | [admin-api.md](./admin-api.md#get-analytics) |

---

## Rate Limiting

| Endpoint Pattern | Limit | Window | Notes |
|-----------------|-------|--------|-------|
| `/api/v1/admin/login` | 5 attempts | 15 minutes | Per IP address |
| `/api/v1/articles/:id/comments` (POST) | 3 comments | 1 hour | Per IP address |
| `/api/v1/search` | 30 requests | 1 minute | Per IP address |
| All other public endpoints | 100 requests | 1 minute | Per IP address |
| Admin endpoints (authenticated) | 200 requests | 1 minute | Per admin session |

---

## Authentication

### JWT Token (Admin Only)

**Method**: HTTP-only cookie named `auth_token`

**Token Claims**:
```json
{
  "sub": "admin_id",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Cookie Attributes**:
- `HttpOnly`: true (JavaScript cannot access)
- `Secure`: true (HTTPS only in production)
- `SameSite`: Strict (CSRF protection)
- `Max-Age`: 3600 (1 hour)

**Authentication Header** (alternative for API clients):
```
Authorization: Bearer <jwt_token>
```

**Token Expiration**: 1 hour (3600 seconds)

**Refresh Strategy**: Frontend requests `/api/v1/admin/refresh` before token expiration

---

## CORS Configuration

**Allowed Origins**:
- Development: `http://localhost:3000`
- Production: `https://myblogspot.com`, `https://www.myblogspot.com`

**Allowed Methods**: `GET, POST, PUT, DELETE, OPTIONS`

**Allowed Headers**: `Content-Type, Authorization`

**Credentials**: `true` (allow cookies)

---

## Example Requests

### List Published Articles
```bash
curl -X GET "http://localhost:8080/api/v1/articles?page=1&per_page=20"
```

### Create Comment
```bash
curl -X POST "http://localhost:8080/api/v1/articles/123e4567-e89b-12d3-a456-426614174000/comments" \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "JohnDoe",
    "content": "Great article! Very informative."
  }'
```

### Admin Login
```bash
curl -X POST "http://localhost:8080/api/v1/admin/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "changeme"
  }'
```

### Create Article (Admin)
```bash
curl -X POST "http://localhost:8080/api/v1/admin/articles" \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=<jwt_token>" \
  -d '{
    "title": "Getting Started with Go",
    "content": "# Introduction\n\nGo is a great language...",
    "summary": "A beginner guide to Go programming",
    "category_id": "123e4567-e89b-12d3-a456-426614174000",
    "tags": ["go", "programming", "backend"],
    "status": "published"
  }'
```

---

## Detailed Contract Files

- [article-api.md](./article-api.md) - Article endpoints (public + admin)
- [comment-api.md](./comment-api.md) - Comment endpoints
- [category-tag-api.md](./category-tag-api.md) - Category and tag endpoints
- [admin-api.md](./admin-api.md) - Admin authentication and management endpoints
- [search-api.md](./search-api.md) - Search functionality

---

## Notes

- All timestamps returned in ISO 8601 format (UTC): `2026-05-12T10:30:00Z`
- UUIDs used for all entity IDs
- Slugs used for public-facing URLs (articles, categories, tags)
- Pagination uses 1-indexed pages (page=1 is first page)
- Default page size: 20 items, max: 50 items
- All POST/PUT requests require `Content-Type: application/json`
- Error messages are user-friendly (no internal details exposed)
- Input validation errors include field-specific messages
