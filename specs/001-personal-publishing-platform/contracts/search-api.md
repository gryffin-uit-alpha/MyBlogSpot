# Search API Contract

**Version**: v1  
**Base Path**: `/api/v1`

---

## Search Articles

**Endpoint**: `GET /api/v1/search`

**Description**: Full-text search across article titles and content (PostgreSQL FTS).

**Authentication**: None (public)

**Rate Limit**: 30 requests per minute per IP

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | - | Search query (1-100 characters) |
| `page` | integer | No | 1 | Page number |
| `per_page` | integer | No | 20 | Items per page (max: 50) |

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-...",
      "title": "Getting Started with Go",
      "slug": "getting-started-with-go",
      "summary": "A beginner's guide to Go programming language",
      "excerpt": "...Go is a <mark>statically typed</mark>, compiled <mark>programming language</mark>...",
      "relevance_score": 0.85,
      "category": {
        "id": "223e4567-...",
        "name": "Backend Engineering",
        "slug": "backend-engineering"
      },
      "tags": [
        { "id": "323e4567-...", "name": "Go", "slug": "go" }
      ],
      "view_count": 1523,
      "published_at": "2026-05-10T14:30:00Z"
    }
  ],
  "meta": {
    "query": "go programming",
    "total": 12,
    "page": 1,
    "per_page": 20
  }
}
```

**Error Responses**:
- `400 Bad Request`: Empty or invalid query
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Search query must be 1-100 characters"
  }
}
```
- `429 Too Many Requests`: Rate limit exceeded

**Example Requests**:
```bash
# Simple search
GET /api/v1/search?q=docker

# Multi-word search
GET /api/v1/search?q=kubernetes%20deployment

# Phrase search
GET /api/v1/search?q=%22microservices%20architecture%22
```

---

## Search Behavior

### Full-Text Search Features
- Searches across article `title` and `content` fields
- Uses PostgreSQL FTS with English stemming (e.g., "running" matches "run")
- Supports multi-word queries (AND logic: all words must match)
- Supports phrase queries with double quotes
- Results ranked by relevance using `ts_rank`

### Relevance Scoring
- Title matches weighted higher than content matches
- Exact phrase matches scored higher than partial matches
- Multiple matches in same article increase relevance

### Excerpt Generation
- Returns ~200 character excerpt with matching terms
- Matching terms wrapped in `<mark>` tags for highlighting
- Excerpt truncated with ellipsis (`...`)

---

## Performance

- Full-text search uses GIN index on `search_vector` column
- Target response time: <1 second for 1000+ articles
- Rate limiting prevents abuse

---

## Notes

- Only searches published articles (`status = 'published'`)
- Empty queries return 400 error
- Minimum query length: 1 character, maximum: 100 characters
- Special characters are sanitized (SQL injection prevention)
- Results sorted by relevance (highest first)
