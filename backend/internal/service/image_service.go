package service

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/jackc/pgx/v5/pgtype"
)

type ImageService struct {
	queries    *db.Queries
	uploadPath string
	baseURL    string
	s3Client   *s3.Client
	s3Bucket   string
}

func NewImageService(queries *db.Queries, uploadPath, baseURL string) *ImageService {
	svc := &ImageService{
		queries:    queries,
		uploadPath: uploadPath,
		baseURL:    baseURL,
		s3Bucket:   os.Getenv("S3_BUCKET"),
	}

	if svc.s3Bucket != "" {
		cfg, err := awsconfig.LoadDefaultConfig(context.Background())
		if err != nil {
			log.Printf("⚠️ Warning: failed to load AWS config for S3 (%s): %v", svc.s3Bucket, err)
		} else {
			svc.s3Client = s3.NewFromConfig(cfg)
			log.Printf("☁️ S3 Image Storage enabled (Bucket: %s)", svc.s3Bucket)
		}
	}

	return svc
}

type ImageUploadResult struct {
	ID               uuid.UUID `json:"id"`
	URL              string    `json:"url"`
	Filename         string    `json:"filename"`
	OriginalFilename string    `json:"original_filename"`
	Folder           string    `json:"folder"`
	AltText          string    `json:"alt_text"`
	CreatedAt        time.Time `json:"created_at"`
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
	s3Key := fmt.Sprintf("%s/%s", folder, filename)

	data, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("failed to read uploaded file: %w", err)
	}
	size := int64(len(data))

	if s.s3Client != nil && s.s3Bucket != "" {
		_, err := s.s3Client.PutObject(ctx, &s3.PutObjectInput{
			Bucket:      aws.String(s.s3Bucket),
			Key:         aws.String(s3Key),
			Body:        bytes.NewReader(data),
			ContentType: aws.String(contentType),
		})
		if err != nil {
			return nil, fmt.Errorf("failed to upload image to S3: %w", err)
		}
	} else {
		folderPath := filepath.Join(s.uploadPath, folder)
		if err := os.MkdirAll(folderPath, 0755); err != nil {
			return nil, fmt.Errorf("failed to create folder: %w", err)
		}
		filePath := filepath.Join(folderPath, filename)
		if err := os.WriteFile(filePath, data, 0644); err != nil {
			return nil, fmt.Errorf("failed to save file: %w", err)
		}
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
		if s.s3Client != nil && s.s3Bucket != "" {
			_, _ = s.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
				Bucket: aws.String(s.s3Bucket),
				Key:    aws.String(s3Key),
			})
		} else {
			os.Remove(filepath.Join(s.uploadPath, folder, filename))
		}
		return nil, fmt.Errorf("failed to save to database: %w", err)
	}

	return &ImageUploadResult{
		ID:               uuid.UUID(image.ID.Bytes),
		URL:              image.Url,
		Filename:         image.Filename,
		OriginalFilename: image.OriginalFilename,
		Folder:           image.Folder,
		AltText:          altText,
		CreatedAt:        image.CreatedAt.Time,
	}, nil
}

// ServeUploadHandler serves uploaded images from AWS S3 (or local fallback in dev)
func (s *ImageService) ServeUploadHandler(w http.ResponseWriter, r *http.Request) {
	relPath := strings.TrimPrefix(r.URL.Path, "/uploads/")
	relPath = strings.TrimPrefix(relPath, "/")
	if relPath == "" || strings.Contains(relPath, "..") {
		http.NotFound(w, r)
		return
	}

	if s.s3Client != nil && s.s3Bucket != "" {
		out, err := s.s3Client.GetObject(r.Context(), &s3.GetObjectInput{
			Bucket: aws.String(s.s3Bucket),
			Key:    aws.String(relPath),
		})
		if err == nil {
			defer out.Body.Close()
			if out.ContentType != nil {
				w.Header().Set("Content-Type", *out.ContentType)
			}
			if out.ContentLength != nil {
				w.Header().Set("Content-Length", fmt.Sprintf("%d", *out.ContentLength))
			}
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
			w.WriteHeader(http.StatusOK)
			_, _ = io.Copy(w, out.Body)
			return
		}
	}

	// Fallback to local filesystem if present
	localFile := filepath.Join(s.uploadPath, filepath.FromSlash(relPath))
	http.ServeFile(w, r, localFile)
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

	if s.s3Client != nil && s.s3Bucket != "" {
		s3Key := fmt.Sprintf("%s/%s", image.Folder, image.Filename)
		_, err := s.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
			Bucket: aws.String(s.s3Bucket),
			Key:    aws.String(s3Key),
		})
		if err != nil {
			return fmt.Errorf("failed to delete file from S3: %w", err)
		}
	} else {
		filePath := filepath.Join(s.uploadPath, image.Folder, image.Filename)
		if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("failed to delete file: %w", err)
		}
	}

	if err := s.queries.DeleteImage(ctx, idPg); err != nil {
		return fmt.Errorf("failed to delete from database: %w", err)
	}

	return nil
}

func (s *ImageService) GetMarkdownSyntax(image *ImageUploadResult) string {
	altText := image.AltText
	if altText == "" {
		altText = image.OriginalFilename
	}
	if altText == "" {
		altText = strings.TrimSuffix(image.Filename, filepath.Ext(image.Filename))
	}
	return fmt.Sprintf("![%s](%s)", altText, image.URL)
}
