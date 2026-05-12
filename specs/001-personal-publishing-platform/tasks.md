# Tasks: MyBlogSpot - Personal Publishing Platform

**Input**: Design documents from `/specs/001-personal-publishing-platform/`  
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/, research.md, quickstart.md

**Tests**: Tests are MANDATORY per constitution (TDD approach, ≥80% coverage, real PostgreSQL for integration tests)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/internal/db/queries/`, `backend/internal/handler/`, `backend/internal/service/`, `backend/internal/middleware/`
- **Frontend**: `frontend/src/app/`, `frontend/src/components/`, `frontend/src/lib/api/`
- **Tests Backend**: `backend/tests/integration/`, `backend/tests/unit/`, `backend/tests/benchmark/`
- **Tests Frontend**: `frontend/__tests__/components/`, `frontend/__tests__/lib/`, `frontend/__tests__/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create backend directory structure per implementation plan (cmd/server, internal/{config,db,handler,middleware,service,model,util}, tests/)
- [ ] T002 Create frontend directory structure (src/{app,components,lib,styles,types}, public/, __tests__/)
- [ ] T003 [P] Initialize Go module in backend/ (go.mod, go.sum)
- [ ] T004 [P] Initialize Node.js project in frontend/ (package.json, tsconfig.json, next.config.js, tailwind.config.js)
- [ ] T005 [P] Install backend dependencies (chi, sqlc, goose, bcrypt, jwt-go, testify)
- [ ] T006 [P] Install frontend dependencies (next, react, tailwindcss, @tailwindcss/typography, framer-motion, next-mdx-remote)
- [ ] T007 [P] Create .gitignore files (backend and frontend)
- [ ] T008 [P] Create .env.example files (backend/.env.example and frontend/.env.local.example)
- [ ] T009 Create docker-compose.yml for local PostgreSQL database
- [ ] T010 [P] Configure ESLint and Prettier for frontend
- [ ] T011 [P] Configure sqlc in backend/internal/db/sqlc.yaml
- [ ] T012 [P] Configure goose migrations directory backend/internal/db/migrations/
- [ ] T013 Create README.md files (root, backend/, frontend/)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T014 Create database schema SQL in backend/internal/db/schema.sql (all tables: admins, articles, categories, tags, article_tags, comments)
- [ ] T015 Create initial migration 001_create_schema.sql in backend/internal/db/migrations/ (copy from schema.sql)
- [ ] T016 Create seed migration 002_seed_data.sql (seed admin account, sample categories, tags)
- [ ] T017 [P] Write sqlc queries for admins in backend/internal/db/queries/admin.sql (CreateAdmin, GetAdminByUsername, GetAdminByID, UpdateLastLogin)
- [ ] T018 [P] Write sqlc queries for articles in backend/internal/db/queries/article.sql (CreateArticle, GetArticle, UpdateArticle, DeleteArticle, ListPublishedArticles, IncrementViewCount)
- [ ] T019 [P] Write sqlc queries for categories in backend/internal/db/queries/category.sql (CreateCategory, GetCategory, ListCategories, UpdateCategory, DeleteCategory)
- [ ] T020 [P] Write sqlc queries for tags in backend/internal/db/queries/tag.sql (CreateTag, GetTag, ListTags, DeleteTag, GetOrCreateTagByName)
- [ ] T021 [P] Write sqlc queries for article_tags in backend/internal/db/queries/article_tag.sql (AddArticleTag, RemoveArticleTag, GetArticleTags, GetTagArticles)
- [ ] T022 [P] Write sqlc queries for comments in backend/internal/db/queries/comment.sql (CreateComment, GetComment, ListCommentsByArticle, DeleteComment, CountCommentsByArticle)
- [ ] T023 [P] Write sqlc queries for search in backend/internal/db/queries/search.sql (SearchArticles using PostgreSQL FTS)
- [ ] T024 Run `sqlc generate` to create type-safe Go code in backend/internal/db/
- [ ] T025 Create configuration management in backend/internal/config/config.go (load env vars, DB config, JWT secret, CORS)
- [ ] T026 Create database connection pooling in backend/internal/db/db.go (PostgreSQL connection with pgx)
- [ ] T027 [P] Create domain models in backend/internal/model/ (article.go, comment.go, category.go, tag.go, admin.go, response.go)
- [ ] T028 [P] Create utility functions in backend/internal/util/ (jwt.go for token generation/validation, hash.go for bcrypt, pagination.go, error.go)
- [ ] T029 [P] Implement authentication middleware in backend/internal/middleware/auth.go (validate JWT from cookie or Authorization header)
- [ ] T030 [P] Implement rate limit middleware in backend/internal/middleware/ratelimit.go (token bucket algorithm with sync.Map)
- [ ] T031 [P] Implement CORS middleware in backend/internal/middleware/cors.go (configure allowed origins from env)
- [ ] T032 [P] Implement logging middleware in backend/internal/middleware/logger.go (structured JSON logging with request ID)
- [ ] T033 [P] Implement input validation middleware in backend/internal/middleware/validator.go (validate request bodies)
- [ ] T034 Create main server entry point in backend/cmd/server/main.go (initialize DB, configure routes, start HTTP server)
- [ ] T035 Create health check handler in backend/internal/handler/health.go (GET /health endpoint)
- [ ] T036 [P] Setup Tailwind CSS in frontend/src/styles/globals.css with typography plugin
- [ ] T037 [P] Create root layout in frontend/src/app/layout.tsx (HTML structure, metadata, global styles)
- [ ] T038 [P] Create API client configuration in frontend/src/lib/api/client.ts (axios/fetch wrapper with base URL)
- [ ] T039 [P] Create standardized response types in frontend/src/types/api.ts (ApiResponse, PaginatedResponse, ApiError)
- [ ] T040 Verify backend starts successfully and health check responds (manual test)
- [ ] T041 Verify frontend builds and runs in development mode (manual test)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Public Article Reading (Priority: P1) 🎯 MVP

**Goal**: Visitors can browse and read published articles without authentication in a clean, mobile-responsive layout

**Independent Test**: Publish sample articles via seed data and verify they are accessible at public URLs without login prompts

### Tests for User Story 1 (MANDATORY per constitution) ⚠️

> **NON-NEGOTIABLE: Write these tests FIRST (TDD), ≥80% coverage, real PostgreSQL**

- [ ] T042 [P] [US1] Contract test for GET /api/v1/articles in backend/tests/integration/article_list_test.go (use real DB)
- [ ] T043 [P] [US1] Contract test for GET /api/v1/articles/:slug in backend/tests/integration/article_detail_test.go
- [ ] T044 [P] [US1] Contract test for POST /api/v1/articles/:id/view in backend/tests/integration/article_view_test.go
- [ ] T045 [P] [US1] Unit test for ArticleService in backend/tests/unit/article_service_test.go
- [ ] T046 [P] [US1] Benchmark test for article list query in backend/tests/benchmark/article_list_bench_test.go
- [ ] T047 [P] [US1] Frontend component test for ArticleCard in frontend/__tests__/components/article/ArticleCard.test.tsx
- [ ] T048 [P] [US1] Frontend component test for ArticleList in frontend/__tests__/components/article/ArticleList.test.tsx
- [ ] T049 [P] [US1] Frontend API client test for articles API in frontend/__tests__/lib/api/articles.test.ts
- [ ] T050 [P] [US1] E2E test for article browsing flow in frontend/__tests__/e2e/article-reading.spec.ts (Playwright)

### Implementation for User Story 1

**Backend API**:
- [ ] T051 [US1] Implement ArticleService in backend/internal/service/article_service.go (ListPublished, GetBySlug, IncrementViewCount methods)
- [ ] T052 [US1] Implement article list handler in backend/internal/handler/article.go (GET /api/v1/articles with pagination)
- [ ] T053 [US1] Implement article detail handler in backend/internal/handler/article.go (GET /api/v1/articles/:slug)
- [ ] T054 [US1] Implement view count handler in backend/internal/handler/article.go (POST /api/v1/articles/:id/view with rate limiting)
- [ ] T055 [US1] Register public article routes in backend/cmd/server/main.go (chi router group)
- [ ] T056 [US1] Add database indexes for article queries in migration (status, published_at, slug) - verify with EXPLAIN ANALYZE
- [ ] T057 [US1] Verify API endpoints with curl/Postman (manual test with real database)

**Frontend UI**:
- [ ] T058 [P] [US1] Create Article type in frontend/src/types/article.ts
- [ ] T059 [P] [US1] Create articles API client in frontend/src/lib/api/articles.ts (getArticles, getArticle, trackView)
- [ ] T060 [P] [US1] Create useArticles hook in frontend/src/lib/hooks/useArticles.ts
- [ ] T061 [P] [US1] Create ArticleCard component in frontend/src/components/article/ArticleCard.tsx (title, summary, date, tags, category)
- [ ] T062 [P] [US1] Create ArticleList component in frontend/src/components/article/ArticleList.tsx (grid layout with pagination)
- [ ] T063 [P] [US1] Create ArticleContent component in frontend/src/components/article/ArticleContent.tsx (markdown rendering with prose class)
- [ ] T064 [P] [US1] Create CodeBlock component in frontend/src/components/article/CodeBlock.tsx (syntax highlighting with prism-react-renderer)
- [ ] T065 [P] [US1] Create Header component in frontend/src/components/layout/Header.tsx (logo, navigation)
- [ ] T066 [P] [US1] Create Footer component in frontend/src/components/layout/Footer.tsx
- [ ] T067 [US1] Create homepage in frontend/src/app/page.tsx (fetch and display article list with Server Components)
- [ ] T068 [US1] Create article list page in frontend/src/app/articles/page.tsx (paginated list)
- [ ] T069 [US1] Create article detail page in frontend/src/app/articles/[slug]/page.tsx (full article with markdown rendering)
- [ ] T070 [US1] Add client-side view tracking in article detail page (call trackView API on mount)
- [ ] T071 [US1] Verify mobile responsiveness with browser dev tools (test on iPhone, Android viewports)
- [ ] T072 [US1] Verify page load performance <2 seconds (use Lighthouse)
- [ ] T073 [US1] Run `go test -cover ./...` and verify ≥80% coverage for US1 code
- [ ] T074 [US1] Run benchmark tests and verify API response time <200ms p95

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Content Discovery (Priority: P1) 🎯 MVP

**Goal**: Visitors can discover content through categories, tags, and full-text search

**Independent Test**: Create articles with categories/tags and verify filtering and search functionality works

### Tests for User Story 2 (MANDATORY per constitution) ⚠️

> **NON-NEGOTIABLE: Write these tests FIRST (TDD), ≥80% coverage, real PostgreSQL**

- [ ] T075 [P] [US2] Contract test for GET /api/v1/categories in backend/tests/integration/category_test.go
- [ ] T076 [P] [US2] Contract test for GET /api/v1/tags in backend/tests/integration/tag_test.go
- [ ] T077 [P] [US2] Contract test for GET /api/v1/search in backend/tests/integration/search_test.go (test FTS with real DB)
- [ ] T078 [P] [US2] Unit test for SearchService in backend/tests/unit/search_service_test.go
- [ ] T079 [P] [US2] Frontend component test for SearchBar in frontend/__tests__/components/search/SearchBar.test.tsx
- [ ] T080 [P] [US2] Frontend E2E test for search flow in frontend/__tests__/e2e/search.spec.ts

### Implementation for User Story 2

**Backend API**:
- [ ] T081 [P] [US2] Implement CategoryService in backend/internal/service/category_service.go (List, GetBySlug, GetWithArticleCount)
- [ ] T082 [P] [US2] Implement TagService in backend/internal/service/tag_service.go (List, GetBySlug, GetWithArticleCount)
- [ ] T083 [US2] Implement SearchService in backend/internal/service/search_service.go (SearchArticles using PostgreSQL FTS with ts_rank)
- [ ] T084 [P] [US2] Implement category handlers in backend/internal/handler/category.go (GET /api/v1/categories, GET /api/v1/categories/:slug, GET /api/v1/categories/:slug/articles)
- [ ] T085 [P] [US2] Implement tag handlers in backend/internal/handler/tag.go (GET /api/v1/tags, GET /api/v1/tags/:slug, GET /api/v1/tags/:slug/articles)
- [ ] T086 [US2] Implement search handler in backend/internal/handler/search.go (GET /api/v1/search with rate limiting 30 req/min)
- [ ] T087 [US2] Register category, tag, and search routes in backend/cmd/server/main.go
- [ ] T088 [US2] Create GIN index on articles.search_vector column in migration
- [ ] T089 [US2] Verify search performance <1 second with test data (1000+ articles)

**Frontend UI**:
- [ ] T090 [P] [US2] Create Category and Tag types in frontend/src/types/category.ts and frontend/src/types/tag.ts
- [ ] T091 [P] [US2] Create categories API client in frontend/src/lib/api/categories.ts
- [ ] T092 [P] [US2] Create tags API client in frontend/src/lib/api/tags.ts
- [ ] T093 [P] [US2] Create search API client in frontend/src/lib/api/search.ts
- [ ] T094 [P] [US2] Create SearchBar component in frontend/src/components/search/SearchBar.tsx (input with debounce)
- [ ] T095 [P] [US2] Create SearchResults component in frontend/src/components/search/SearchResults.tsx (highlighted excerpts)
- [ ] T096 [US2] Add SearchBar to Header component in frontend/src/components/layout/Header.tsx
- [ ] T097 [US2] Create search results page in frontend/src/app/search/page.tsx (display results with query param)
- [ ] T098 [US2] Create categories list page in frontend/src/app/categories/page.tsx (all categories with article counts)
- [ ] T099 [US2] Create category articles page in frontend/src/app/categories/[slug]/page.tsx (articles in category)
- [ ] T100 [US2] Create tag articles page in frontend/src/app/tags/[slug]/page.tsx (articles with tag)
- [ ] T101 [US2] Add category and tag badges to ArticleCard component (clickable links)
- [ ] T102 [US2] Verify search returns relevant results with test queries
- [ ] T103 [US2] Verify search term highlighting in excerpts
- [ ] T104 [US2] Run `go test -cover ./...` and verify ≥80% coverage for US2 code

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 4 - Admin Authentication (Priority: P1) 🎯 MVP

**Goal**: Administrator can securely login through a hidden endpoint with JWT authentication

**Independent Test**: Access admin endpoint and verify authentication is required, public pages have no admin entry points

### Tests for User Story 4 (MANDATORY per constitution) ⚠️

> **NON-NEGOTIABLE: Write these tests FIRST (TDD), ≥80% coverage, real PostgreSQL**

- [ ] T105 [P] [US4] Contract test for POST /api/v1/admin/login in backend/tests/integration/admin_auth_test.go (test JWT generation, cookie setting)
- [ ] T106 [P] [US4] Contract test for POST /api/v1/admin/logout in backend/tests/integration/admin_auth_test.go
- [ ] T107 [P] [US4] Contract test for GET /api/v1/admin/me in backend/tests/integration/admin_auth_test.go
- [ ] T108 [P] [US4] Unit test for AdminService in backend/tests/unit/admin_service_test.go (test bcrypt verification)
- [ ] T109 [P] [US4] Unit test for JWT utilities in backend/tests/unit/jwt_test.go (token generation, validation, expiration)
- [ ] T110 [P] [US4] Unit test for auth middleware in backend/tests/unit/auth_middleware_test.go
- [ ] T111 [P] [US4] Frontend component test for LoginForm in frontend/__tests__/components/admin/LoginForm.test.tsx
- [ ] T112 [P] [US4] Frontend E2E test for admin login flow in frontend/__tests__/e2e/admin-login.spec.ts

### Implementation for User Story 4

**Backend API**:
- [ ] T113 [US4] Implement AdminService in backend/internal/service/admin_service.go (Authenticate, GetByID, UpdateLastLogin methods)
- [ ] T114 [US4] Implement admin authentication handler in backend/internal/handler/admin.go (POST /api/v1/admin/login with rate limiting 5 attempts/15 min)
- [ ] T115 [US4] Implement admin logout handler in backend/internal/handler/admin.go (POST /api/v1/admin/logout - clear cookie)
- [ ] T116 [US4] Implement get current admin handler in backend/internal/handler/admin.go (GET /api/v1/admin/me)
- [ ] T117 [US4] Register admin auth routes in backend/cmd/server/main.go (public routes without middleware)
- [ ] T118 [US4] Verify JWT token generation and cookie attributes (HttpOnly, Secure, SameSite=Strict)
- [ ] T119 [US4] Verify rate limiting works on login endpoint (test with 6 failed attempts)
- [ ] T120 [US4] Verify authentication middleware blocks unauthenticated requests to protected routes

**Frontend UI**:
- [ ] T121 [P] [US4] Create Admin type in frontend/src/types/admin.ts
- [ ] T122 [P] [US4] Create admin API client in frontend/src/lib/api/admin.ts (login, logout, getCurrentAdmin)
- [ ] T123 [US4] Create AuthContext in frontend/src/lib/auth/context.tsx (manage auth state, admin info)
- [ ] T124 [US4] Create useAuth hook in frontend/src/lib/hooks/useAuth.ts (access auth context)
- [ ] T125 [P] [US4] Create LoginForm component in frontend/src/components/admin/LoginForm.tsx (username, password inputs with validation)
- [ ] T126 [P] [US4] Create AdminNav component in frontend/src/components/admin/AdminNav.tsx (admin sidebar navigation)
- [ ] T127 [US4] Create admin layout in frontend/src/app/admin/layout.tsx (check auth, redirect if not logged in)
- [ ] T128 [US4] Create admin login page in frontend/src/app/admin/login/page.tsx (render LoginForm)
- [ ] T129 [US4] Create admin dashboard page in frontend/src/app/admin/dashboard/page.tsx (placeholder with welcome message)
- [ ] T130 [US4] Add logout button to AdminNav component
- [ ] T131 [US4] Verify login redirects to dashboard on success
- [ ] T132 [US4] Verify invalid credentials show error message
- [ ] T133 [US4] Verify unauthenticated access to /admin/dashboard redirects to login
- [ ] T134 [US4] Verify public pages have NO links to admin interface
- [ ] T135 [US4] Run `go test -cover ./...` and verify ≥80% coverage for US4 code

**Checkpoint**: At this point, admin authentication is functional and secure

---

## Phase 6: User Story 5 - Article Management (Priority: P1) 🎯 MVP

**Goal**: Authenticated admin can create, edit, publish, and delete articles through a markdown editor

**Independent Test**: Login as admin, perform CRUD operations, verify changes appear on public site

### Tests for User Story 5 (MANDATORY per constitution) ⚠️

> **NON-NEGOTIABLE: Write these tests FIRST (TDD), ≥80% coverage, real PostgreSQL**

- [ ] T136 [P] [US5] Contract test for GET /api/v1/admin/articles in backend/tests/integration/admin_article_test.go (includes drafts)
- [ ] T137 [P] [US5] Contract test for POST /api/v1/admin/articles in backend/tests/integration/admin_article_test.go
- [ ] T138 [P] [US5] Contract test for PUT /api/v1/admin/articles/:id in backend/tests/integration/admin_article_test.go
- [ ] T139 [P] [US5] Contract test for DELETE /api/v1/admin/articles/:id in backend/tests/integration/admin_article_test.go
- [ ] T140 [P] [US5] Contract test for POST /api/v1/admin/articles/:id/publish in backend/tests/integration/admin_article_test.go
- [ ] T141 [P] [US5] Contract test for POST /api/v1/admin/articles/:id/unpublish in backend/tests/integration/admin_article_test.go
- [ ] T142 [P] [US5] Frontend component test for ArticleEditor in frontend/__tests__/components/admin/ArticleEditor.test.tsx
- [ ] T143 [P] [US5] Frontend E2E test for article CRUD flow in frontend/__tests__/e2e/admin-article-crud.spec.ts

### Implementation for User Story 5

**Backend API**:
- [ ] T144 [US5] Extend ArticleService with admin methods in backend/internal/service/article_service.go (Create, Update, Delete, Publish, Unpublish, ListAll)
- [ ] T145 [US5] Implement admin article list handler in backend/internal/handler/admin.go (GET /api/v1/admin/articles - includes drafts)
- [ ] T146 [US5] Implement admin article detail handler in backend/internal/handler/admin.go (GET /api/v1/admin/articles/:id)
- [ ] T147 [US5] Implement create article handler in backend/internal/handler/admin.go (POST /api/v1/admin/articles with validation)
- [ ] T148 [US5] Implement update article handler in backend/internal/handler/admin.go (PUT /api/v1/admin/articles/:id)
- [ ] T149 [US5] Implement delete article handler in backend/internal/handler/admin.go (DELETE /api/v1/admin/articles/:id)
- [ ] T150 [US5] Implement publish handler in backend/internal/handler/admin.go (POST /api/v1/admin/articles/:id/publish - set published_at)
- [ ] T151 [US5] Implement unpublish handler in backend/internal/handler/admin.go (POST /api/v1/admin/articles/:id/unpublish - clear published_at)
- [ ] T152 [US5] Register admin article routes with auth middleware in backend/cmd/server/main.go
- [ ] T153 [US5] Implement slug generation utility in backend/internal/util/slug.go (auto-generate from title)
- [ ] T154 [US5] Implement tag association logic in ArticleService (parse tag names, get or create tags, link to article)
- [ ] T155 [US5] Verify duplicate slug returns 400 error
- [ ] T156 [US5] Verify publish/unpublish toggles article visibility on public site
- [ ] T157 [US5] Verify article deletion cascades to comments and article_tags

**Frontend UI**:
- [ ] T158 [P] [US5] Extend articles API client in frontend/src/lib/api/articles.ts (admin methods: create, update, delete, publish, unpublish)
- [ ] T159 [P] [US5] Create ArticleEditor component in frontend/src/components/admin/ArticleEditor.tsx (title, content textarea, category select, tag input, status toggle)
- [ ] T160 [P] [US5] Create MarkdownPreview component in frontend/src/components/admin/MarkdownPreview.tsx (real-time preview with syntax highlighting)
- [ ] T161 [US5] Create admin articles list page in frontend/src/app/admin/articles/page.tsx (table with edit/delete buttons)
- [ ] T162 [US5] Create new article page in frontend/src/app/admin/articles/new/page.tsx (render ArticleEditor)
- [ ] T163 [US5] Create edit article page in frontend/src/app/admin/articles/[id]/edit/page.tsx (fetch article, render ArticleEditor with initial values)
- [ ] T164 [US5] Add "New Article" button to admin articles list page
- [ ] T165 [US5] Implement save as draft functionality (POST with status=draft)
- [ ] T166 [US5] Implement publish functionality (POST with status=published or use /publish endpoint)
- [ ] T167 [US5] Implement delete with confirmation modal
- [ ] T168 [US5] Add split-screen layout (editor on left, preview on right)
- [ ] T169 [US5] Verify markdown preview updates in real-time as user types
- [ ] T170 [US5] Verify code syntax highlighting works in preview
- [ ] T171 [US5] Verify tag input supports multi-select or comma-separated input
- [ ] T172 [US5] Create test article and verify it appears on public site when published
- [ ] T173 [US5] Run `go test -cover ./...` and verify ≥80% coverage for US5 code

**Checkpoint**: All P1 MVP user stories (US1, US2, US4, US5) are now complete - platform is functional!

---

## Phase 7: User Story 3 - Guest Comments (Priority: P2)

**Goal**: Visitors can leave nickname-only comments on articles without registration

**Independent Test**: Submit guest comments and verify they display on article pages

### Tests for User Story 3 (MANDATORY per constitution) ⚠️

- [ ] T174 [P] [US3] Contract test for GET /api/v1/articles/:id/comments in backend/tests/integration/comment_test.go
- [ ] T175 [P] [US3] Contract test for POST /api/v1/articles/:id/comments in backend/tests/integration/comment_test.go (test rate limiting)
- [ ] T176 [P] [US3] Frontend component test for CommentForm in frontend/__tests__/components/comment/CommentForm.test.tsx
- [ ] T177 [P] [US3] Frontend component test for CommentList in frontend/__tests__/components/comment/CommentList.test.tsx

### Implementation for User Story 3

**Backend API**:
- [ ] T178 [US3] Implement CommentService in backend/internal/service/comment_service.go (Create, ListByArticle, GetCount)
- [ ] T179 [US3] Implement list comments handler in backend/internal/handler/comment.go (GET /api/v1/articles/:id/comments)
- [ ] T180 [US3] Implement create comment handler in backend/internal/handler/comment.go (POST /api/v1/articles/:id/comments with rate limiting 3/hour per IP)
- [ ] T181 [US3] Register comment routes in backend/cmd/server/main.go
- [ ] T182 [US3] Implement IP extraction utility in backend/internal/util/ip.go (handle X-Forwarded-For header)
- [ ] T183 [US3] Verify rate limiting prevents spam (test 4 comments in quick succession)
- [ ] T184 [US3] Verify nickname and content validation (2-50 chars, 1-1000 chars)

**Frontend UI**:
- [ ] T185 [P] [US3] Create Comment type in frontend/src/types/comment.ts
- [ ] T186 [P] [US3] Create comments API client in frontend/src/lib/api/comments.ts
- [ ] T187 [P] [US3] Create useComments hook in frontend/src/lib/hooks/useComments.ts
- [ ] T188 [P] [US3] Create CommentForm component in frontend/src/components/comment/CommentForm.tsx (nickname, content inputs)
- [ ] T189 [P] [US3] Create CommentItem component in frontend/src/components/comment/CommentItem.tsx (display nickname, content, timestamp)
- [ ] T190 [P] [US3] Create CommentList component in frontend/src/components/comment/CommentList.tsx (chronological list)
- [ ] T191 [US3] Add comments section to article detail page frontend/src/app/articles/[slug]/page.tsx (below article content)
- [ ] T192 [US3] Verify comments display in chronological order (oldest first)
- [ ] T193 [US3] Verify comment submission shows success message
- [ ] T194 [US3] Verify rate limit error displays user-friendly message
- [ ] T195 [US3] Run `go test -cover ./...` and verify ≥80% coverage for US3 code

**Checkpoint**: Guest comment system is functional

---

## Phase 8: User Story 6 - Comment Moderation (Priority: P2)

**Goal**: Admin can view and delete inappropriate comments

**Independent Test**: Submit test comments and verify admin can delete them

### Tests for User Story 6 (MANDATORY per constitution) ⚠️

- [ ] T196 [P] [US6] Contract test for GET /api/v1/admin/comments in backend/tests/integration/admin_comment_test.go
- [ ] T197 [P] [US6] Contract test for DELETE /api/v1/admin/comments/:id in backend/tests/integration/admin_comment_test.go
- [ ] T198 [P] [US6] Frontend E2E test for comment moderation in frontend/__tests__/e2e/admin-comment-moderation.spec.ts

### Implementation for User Story 6

**Backend API**:
- [ ] T199 [US6] Extend CommentService with admin methods in backend/internal/service/comment_service.go (ListAll, Delete)
- [ ] T200 [US6] Implement list all comments handler in backend/internal/handler/admin.go (GET /api/v1/admin/comments with pagination and article_id filter)
- [ ] T201 [US6] Implement delete comment handler in backend/internal/handler/admin.go (DELETE /api/v1/admin/comments/:id)
- [ ] T202 [US6] Register admin comment routes with auth middleware in backend/cmd/server/main.go
- [ ] T203 [US6] Verify deleted comments are removed from public article pages

**Frontend UI**:
- [ ] T204 [P] [US6] Extend comments API client in frontend/src/lib/api/comments.ts (admin methods: listAll, delete)
- [ ] T205 [US6] Create admin comments page in frontend/src/app/admin/comments/page.tsx (table with article context, delete buttons)
- [ ] T206 [US6] Add delete button with confirmation modal to each comment row
- [ ] T207 [US6] Add filter by article dropdown (optional)
- [ ] T208 [US6] Verify deleted comments disappear from list and public pages
- [ ] T209 [US6] Run `go test -cover ./...` and verify ≥80% coverage for US6 code

**Checkpoint**: Comment moderation is functional

---

## Phase 9: User Story 7 - Content Organization (Priority: P2)

**Goal**: Admin can create, update, and delete categories and tags

**Independent Test**: Create categories/tags and verify they appear in article editor and on public pages

### Tests for User Story 7 (MANDATORY per constitution) ⚠️

- [ ] T210 [P] [US7] Contract test for POST /api/v1/admin/categories in backend/tests/integration/admin_category_test.go
- [ ] T211 [P] [US7] Contract test for PUT /api/v1/admin/categories/:id in backend/tests/integration/admin_category_test.go
- [ ] T212 [P] [US7] Contract test for DELETE /api/v1/admin/categories/:id in backend/tests/integration/admin_category_test.go
- [ ] T213 [P] [US7] Contract test for POST /api/v1/admin/tags in backend/tests/integration/admin_tag_test.go
- [ ] T214 [P] [US7] Contract test for DELETE /api/v1/admin/tags/:id in backend/tests/integration/admin_tag_test.go

### Implementation for User Story 7

**Backend API**:
- [ ] T215 [US7] Extend CategoryService with admin methods in backend/internal/service/category_service.go (Create, Update, Delete)
- [ ] T216 [US7] Extend TagService with admin methods in backend/internal/service/tag_service.go (Create, Delete)
- [ ] T217 [US7] Implement create category handler in backend/internal/handler/admin.go (POST /api/v1/admin/categories)
- [ ] T218 [US7] Implement update category handler in backend/internal/handler/admin.go (PUT /api/v1/admin/categories/:id)
- [ ] T219 [US7] Implement delete category handler in backend/internal/handler/admin.go (DELETE /api/v1/admin/categories/:id - nullify article category_id)
- [ ] T220 [US7] Implement create tag handler in backend/internal/handler/admin.go (POST /api/v1/admin/tags)
- [ ] T221 [US7] Implement delete tag handler in backend/internal/handler/admin.go (DELETE /api/v1/admin/tags/:id - cascade to article_tags)
- [ ] T222 [US7] Register admin category and tag routes in backend/cmd/server/main.go
- [ ] T223 [US7] Verify category update affects all articles with that category
- [ ] T224 [US7] Verify tag deletion removes tag from all articles

**Frontend UI**:
- [ ] T225 [P] [US7] Extend categories API client in frontend/src/lib/api/categories.ts (admin methods)
- [ ] T226 [P] [US7] Extend tags API client in frontend/src/lib/api/tags.ts (admin methods)
- [ ] T227 [US7] Create admin categories page in frontend/src/app/admin/categories/page.tsx (table with create/edit/delete)
- [ ] T228 [US7] Add create category modal/form to categories page
- [ ] T229 [US7] Add edit category inline or modal
- [ ] T230 [US7] Add delete category with confirmation
- [ ] T231 [US7] Add tags management section to categories page or separate page frontend/src/app/admin/tags/page.tsx
- [ ] T232 [US7] Verify new categories appear in article editor dropdown
- [ ] T233 [US7] Verify new tags are available for article tagging
- [ ] T234 [US7] Run `go test -cover ./...` and verify ≥80% coverage for US7 code

**Checkpoint**: Content organization tools are functional

---

## Phase 10: User Story 8 - Engagement Tracking (Priority: P3)

**Goal**: Admin can view basic analytics (view counts, popular articles)

**Independent Test**: View articles, check admin dashboard shows accurate view counts

### Tests for User Story 8 (MANDATORY per constitution) ⚠️

- [ ] T235 [P] [US8] Contract test for GET /api/v1/admin/analytics in backend/tests/integration/admin_analytics_test.go
- [ ] T236 [P] [US8] Unit test for AnalyticsService in backend/tests/unit/analytics_service_test.go

### Implementation for User Story 8

**Backend API**:
- [ ] T237 [US8] Implement AnalyticsService in backend/internal/service/analytics_service.go (GetDashboardStats, GetPopularArticles, GetPopularCategories, GetPopularTags)
- [ ] T238 [US8] Implement analytics handler in backend/internal/handler/admin.go (GET /api/v1/admin/analytics)
- [ ] T239 [US8] Register admin analytics route in backend/cmd/server/main.go
- [ ] T240 [US8] Write optimized analytics queries (aggregate queries with indexes)
- [ ] T241 [US8] Verify query performance <500ms for dashboard stats

**Frontend UI**:
- [ ] T242 [P] [US8] Create Analytics type in frontend/src/types/analytics.ts
- [ ] T243 [P] [US8] Create analytics API client in frontend/src/lib/api/analytics.ts
- [ ] T244 [US8] Update admin dashboard page frontend/src/app/admin/dashboard/page.tsx (fetch and display analytics)
- [ ] T245 [US8] Add stat cards (total articles, total views, total comments)
- [ ] T246 [US8] Add popular articles table (title, views, comments)
- [ ] T247 [US8] Add popular categories and tags lists
- [ ] T248 [US8] Verify analytics update when articles are viewed
- [ ] T249 [US8] Run `go test -cover ./...` and verify ≥80% coverage for US8 code

**Checkpoint**: All user stories are now complete!

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, constitution compliance verification, deployment preparation

**Constitution Compliance Verification**:
- [ ] T250 Verify all Go code passes gofmt (run `gofmt -l .` and ensure no output)
- [ ] T251 Verify all Go code passes go vet (run `go vet ./...` with no errors)
- [ ] T252 Verify all Go code passes golint (run `golint ./...` with no errors)
- [ ] T253 Run `go test -cover ./...` and verify overall backend coverage ≥80%
- [ ] T254 Run `npm run test:coverage` and verify frontend coverage ≥70%
- [ ] T255 Verify all integration tests use real PostgreSQL (no mocks in backend/tests/integration/)
- [ ] T256 Verify all API responses follow standardized JSON structure (success, data, error fields)
- [ ] T257 Verify all endpoints return proper HTTP status codes (200, 201, 400, 401, 404, 500)
- [ ] T258 Verify error messages are user-friendly (no internal stack traces exposed)
- [ ] T259 Verify pagination implemented on all list endpoints (default 20, max 50)
- [ ] T260 Run EXPLAIN ANALYZE on all database queries and verify indexes are used
- [ ] T261 Verify no N+1 query problems exist (use JOIN or eager loading)
- [ ] T262 Check for cyclomatic complexity violations (use gocyclo tool, max 15 per function)
- [ ] T263 Verify all database queries use sqlc (no raw SQL in handlers)
- [ ] T264 Verify input validation on all user-supplied data (comments, search, article content)
- [ ] T265 Verify rate limiting on authentication endpoints (test with automated requests)
- [ ] T266 Verify rate limiting on comment submission (test 4 comments/hour)
- [ ] T267 Verify rate limiting on search endpoint (test 31 requests/minute)
- [ ] T268 Verify no secrets in version control (check .env files are gitignored, search for hardcoded secrets)
- [ ] T269 Run benchmark tests and verify API response time <200ms p95 (use Apache Bench or k6)
- [ ] T270 Verify article page load <2 seconds (use Lighthouse)
- [ ] T271 Verify homepage load <1.5 seconds (use Lighthouse)
- [ ] T272 Verify search results <1 second (use browser dev tools)
- [ ] T273 Verify mobile responsiveness on iPhone and Android viewports (Chrome DevTools)

**Code Quality & Documentation**:
- [ ] T274 [P] Add godoc comments to all exported functions and types in backend/
- [ ] T275 [P] Add JSDoc comments to complex functions in frontend/src/lib/
- [ ] T276 [P] Update backend README.md with API documentation links
- [ ] T277 [P] Update frontend README.md with component documentation
- [ ] T278 [P] Create deployment guide in docs/deployment.md
- [ ] T279 [P] Create contributing guide in docs/CONTRIBUTING.md

**Deployment Preparation**:
- [ ] T280 Create production Dockerfile for backend (multi-stage build)
- [ ] T281 Create .dockerignore for backend (exclude tests, .env)
- [ ] T282 Configure Next.js production build settings in frontend/next.config.js
- [ ] T283 Create GitHub Actions workflow in .github/workflows/ci.yml (run tests on PR)
- [ ] T284 Create GitHub Actions workflow in .github/workflows/deploy-backend.yml (build and push Docker image)
- [ ] T285 Configure Vercel deployment for frontend (vercel.json or auto-detect)
- [ ] T286 Create database backup script in backend/scripts/backup.sh
- [ ] T287 Document environment variables for production in .env.example files
- [ ] T288 Test production build locally (backend Docker image, frontend npm run build)

**Security Hardening**:
- [ ] T289 Generate strong JWT secret for production (store in environment variable)
- [ ] T290 Configure CORS for production domains only
- [ ] T291 Enable HTTPS redirect in production (via reverse proxy or middleware)
- [ ] T292 Configure secure cookie flags (Secure=true in production)
- [ ] T293 Add security headers middleware (HSTS, X-Content-Type-Options, X-Frame-Options)
- [ ] T294 Review and update default admin password (document in deployment guide)

**Final Validation**:
- [ ] T295 Run full E2E test suite (Playwright tests for all user flows)
- [ ] T296 Perform manual smoke test of all user stories
- [ ] T297 Test admin authentication with invalid tokens
- [ ] T298 Test article visibility (draft vs published)
- [ ] T299 Test search with various query types
- [ ] T300 Test comment rate limiting
- [ ] T301 Generate and review test coverage reports (backend and frontend)
- [ ] T302 Run load test with 100 concurrent users (use k6 or Apache Bench)
- [ ] T303 Review Lighthouse performance scores (target: >90 for all pages)
- [ ] T304 Document known issues and future enhancements in README.md or GitHub issues

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - US1, US2, US4, US5 (P1 MVP) can proceed in parallel (if team capacity allows)
  - US3 depends on US1 (needs article pages for comments)
  - US6 depends on US3 (needs comments to moderate)
  - US7 is independent of other stories (can run in parallel)
  - US8 depends on US1 (needs view tracking)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1 MVP)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1 MVP)**: Can start after Foundational - No dependencies on other stories
- **User Story 4 (P1 MVP)**: Can start after Foundational - No dependencies on other stories
- **User Story 5 (P1 MVP)**: Depends on US4 (admin auth) - Can run in parallel with US1, US2 once US4 complete
- **User Story 3 (P2)**: Depends on US1 (needs article pages) - Independent test possible with seed data
- **User Story 6 (P2)**: Depends on US3 (needs comments) and US4 (admin auth)
- **User Story 7 (P2)**: Depends on US4 (admin auth) - Can run in parallel with other stories
- **User Story 8 (P3)**: Depends on US1 (needs view tracking) and US4 (admin auth)

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Backend: queries → models → services → handlers → routes
- Frontend: types → API clients → hooks → components → pages
- Integration: backend complete → frontend complete → E2E tests
- Story complete before moving to next priority

### Parallel Opportunities

- **Setup Phase**: All tasks marked [P] can run in parallel (T003-T012)
- **Foundational Phase**: sqlc queries (T017-T023), models (T027), utilities (T028), middleware (T029-T033), frontend setup (T036-T039) can run in parallel
- **User Story Tests**: All tests for a story marked [P] can run in parallel
- **User Story Implementation**: Backend and frontend can be developed in parallel once APIs are defined
- **P1 MVP Stories**: US1, US2, US4 can start in parallel (US5 needs US4 complete first)
- **Polish Phase**: Documentation (T274-T279) and deployment prep (T280-T288) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task T042: Contract test for GET /api/v1/articles
Task T043: Contract test for GET /api/v1/articles/:slug
Task T044: Contract test for POST /api/v1/articles/:id/view
Task T045: Unit test for ArticleService
Task T046: Benchmark test for article list query
Task T047: Frontend component test for ArticleCard
Task T048: Frontend component test for ArticleList
Task T049: Frontend API client test for articles API
Task T050: E2E test for article browsing flow

# Launch all frontend components for User Story 1 together:
Task T061: Create ArticleCard component
Task T063: Create ArticleContent component
Task T064: Create CodeBlock component
Task T065: Create Header component
Task T066: Create Footer component
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Public Article Reading)
4. **STOP and VALIDATE**: Test User Story 1 independently with seed data
5. Deploy/demo if ready (frontend + backend + database)

**Result**: Visitors can browse and read articles - minimum viable blog

### Incremental Delivery (MVP + Core Features)

1. Complete Setup + Foundational → Foundation ready
2. Complete User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Complete User Story 2 → Test independently → Deploy/Demo (+ discovery)
4. Complete User Story 4 → Test independently → Deploy/Demo (+ admin auth)
5. Complete User Story 5 → Test independently → Deploy/Demo (+ content management)
6. **CHECKPOINT**: Platform is fully functional for solo content creator
7. Add User Story 3, 6, 7, 8 as time permits

### Parallel Team Strategy

With multiple developers:

1. **Week 1**: Team completes Setup + Foundational together
2. **Week 2**: Once Foundational is done:
   - Developer A: User Story 1 (Public Reading)
   - Developer B: User Story 2 (Discovery)
   - Developer C: User Story 4 (Admin Auth)
3. **Week 3**: 
   - Developer A: User Story 3 (Comments)
   - Developer B: User Story 7 (Content Org)
   - Developer C: User Story 5 (Article Management) - depends on US4 from week 2
4. **Week 4**: 
   - Developer A: User Story 6 (Comment Moderation)
   - Developer B: User Story 8 (Analytics)
   - Developer C: Polish & Deployment
5. Stories complete and integrate independently

---

## Notes

- **[P] tasks**: Different files, no dependencies, can run in parallel
- **[Story] label**: Maps task to specific user story for traceability (US1, US2, etc.)
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Constitution compliance verified in Phase 11
- Target: ≥80% backend coverage, ≥70% frontend coverage
- All integration tests use real PostgreSQL (testcontainers)
- Benchmark tests verify <200ms p95 API response time

---

## Task Count Summary

- **Total Tasks**: 304
- **Phase 1 (Setup)**: 13 tasks
- **Phase 2 (Foundational)**: 28 tasks
- **Phase 3 (US1)**: 33 tasks (9 tests + 24 implementation)
- **Phase 4 (US2)**: 30 tasks (6 tests + 24 implementation)
- **Phase 5 (US4)**: 31 tasks (8 tests + 23 implementation)
- **Phase 6 (US5)**: 38 tasks (8 tests + 30 implementation)
- **Phase 7 (US3)**: 22 tasks (4 tests + 18 implementation)
- **Phase 8 (US6)**: 14 tasks (3 tests + 11 implementation)
- **Phase 9 (US7)**: 25 tasks (5 tests + 20 implementation)
- **Phase 10 (US8)**: 15 tasks (2 tests + 13 implementation)
- **Phase 11 (Polish)**: 55 tasks (compliance + deployment)

**MVP Scope** (P1 stories): Phases 1-6 = 173 tasks (~2-3 weeks for solo developer)  
**Full Platform**: All phases = 304 tasks (~4-6 weeks for solo developer)

**Parallel Opportunities**: ~120 tasks marked [P] can run in parallel if team capacity allows
