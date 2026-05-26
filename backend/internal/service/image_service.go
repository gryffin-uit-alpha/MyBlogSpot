package service

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/jackc/pgx/v5/pgtype"
)

type ImageService struct {
	queries    *db.Queries
	uploadPath string
	baseURL    string
}

func NewImageService(queries *db.Queries, uploadPath, baseURL string) *ImageService {
	return &ImageService{
		queries:    queries,
		uploadPath: uploadPath,
		baseURL:    baseURL,
	}
}

type ImageUploadResult struct {
	ID       uuid.UUID `json:"id"`
	URL      string    `json:"url"`
	Filename string    `json:"filename"`
	Folder   string    `json:"folder"`
	AltText  string    `json:"alt_text"`
}

func (s *ImageService) UploadImage(ctx context.Context, file multipart.File, header *multipart.FileHeader, folder, altText string) (*ImageUploadResult, error) {
	if folder == "" {
		folder = "general"
	}

	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}

	contentType := header.Header.Get("Content-Type")
	if !allowedTypes[contentType] {
		return nil, fmt.Errorf("unsupported file type: %s", contentType)
	}

	ext := filepath.Ext(header.Filename)
	if ext == "" {
		ext = ".jpg"
	}

	filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), uuid.New().String()[:8], ext)

	folderPath := filepath.Join(s.uploadPath, folder)
	if err := os.MkdirAll(folderPath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create folder: %w", err)
	}

	filePath := filepath.Join(folderPath, filename)
	dst, err := os.Create(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	size, err := io.Copy(dst, file)
	if err != nil {
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	url := fmt.Sprintf("%s/uploads/%s/%s", s.baseURL, folder, filename)

	altTextPg := pgtype.Text{}
	if altText != "" {
		altTextPg = pgtype.Text{String: altText, Valid: true}
	}

	image, err := s.queries.CreateImage(ctx, db.CreateImageParams{
		Filename:         filename,
		OriginalFilename: header.Filename,
		Url:              url,
		Folder:           folder,
		AltText:          altTextPg,
		SizeBytes:        size,
		MimeType:         contentType,
	})
	if err != nil {
		os.Remove(filePath)
		return nil, fmt.Errorf("failed to save to database: %w", err)
	}

	return &ImageUploadResult{
		ID:       uuid.UUID(image.ID.Bytes),
		URL:      image.Url,
		Filename: image.Filename,
		Folder:   image.Folder,
		AltText:  altText,
	}, nil
}

func (s *ImageService) ListImages(ctx context.Context, folder *string, limit, offset int32) ([]db.Image, int64, error) {
	var folderParam string
	if folder != nil && *folder != "" {
		folderParam = *folder
	}

	images, err := s.queries.ListImages(ctx, db.ListImagesParams{
		Column1: folderParam,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list images: %w", err)
	}

	count, err := s.queries.CountImages(ctx, folderParam)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count images: %w", err)
	}

	return images, count, nil
}

func (s *ImageService) DeleteImage(ctx context.Context, idStr string) error {
	id, err := uuid.Parse(idStr)
	if err != nil {
		return fmt.Errorf("invalid image ID: %w", err)
	}

	idPg := pgtype.UUID{Bytes: id, Valid: true}

	image, err := s.queries.GetImage(ctx, idPg)
	if err != nil {
		return fmt.Errorf("image not found: %w", err)
	}

	filePath := filepath.Join(s.uploadPath, image.Folder, image.Filename)
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	if err := s.queries.DeleteImage(ctx, idPg); err != nil {
		return fmt.Errorf("failed to delete from database: %w", err)
	}

	return nil
}

func (s *ImageService) GetMarkdownSyntax(image *ImageUploadResult) string {
	altText := image.AltText
	if altText == "" {
		altText = strings.TrimSuffix(image.Filename, filepath.Ext(image.Filename))
	}
	return fmt.Sprintf("![%s](%s)", altText, image.URL)
}
