# Category & Tag API Contract

**Version**: v1  
**Base Path**: `/api/v1`

---

## Categories

### List Categories

**Endpoint**: `GET /api/v1/categories`

**Authentication**: None (public)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-...",
      "name": "DevOps",
      "slug": "devops",
      "description": "DevOps practices, tools, and infrastructure automation",
      "article_count": 45
    }
  ]
}
```

---

### Get Category

**Endpoint**: `GET /api/v1/categories/:slug`

**Path Parameters**: `slug` - Category slug

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "123e4567-...",
    "name": "DevOps",
    "slug": "devops",
    "description": "DevOps practices...",
    "article_count": 45
  }
}
```

---

### Category Articles

**Endpoint**: `GET /api/v1/categories/:slug/articles`

**Description**: List all published articles in a category.

**Query Parameters**: Same as `/api/v1/articles` (page, per_page, sort, order)

**Success Response**: Same structure as `/api/v1/articles`

---

## Tags

### List Tags

**Endpoint**: `GET /api/v1/tags`

**Authentication**: None (public)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-...",
      "name": "Go",
      "slug": "go",
      "article_count": 23
    }
  ]
}
```

---

### Get Tag

**Endpoint**: `GET /api/v1/tags/:slug`

**Path Parameters**: `slug` - Tag slug

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "123e4567-...",
    "name": "Go",
    "slug": "go",
    "article_count": 23
  }
}
```

---

### Tag Articles

**Endpoint**: `GET /api/v1/tags/:slug/articles`

**Description**: List all published articles with a specific tag.

**Query Parameters**: Same as `/api/v1/articles`

**Success Response**: Same structure as `/api/v1/articles`

---

## Notes

- `article_count` is computed from published articles only
- Categories and tags sorted alphabetically by name
- Unused tags (article_count = 0) are included in list
