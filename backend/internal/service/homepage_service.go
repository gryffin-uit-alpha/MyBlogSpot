package service

import (
	"context"
	"fmt"

	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
)

type HomepageService struct {
	queries *db.Queries
}

func NewHomepageService(queries *db.Queries) *HomepageService {
	return &HomepageService{queries: queries}
}

type HomepageSettings struct {
	HeroTitle    string `json:"hero_title"`
	HeroSubtitle string `json:"hero_subtitle"`
	HeroCTAText  string `json:"hero_cta_text"`
	HeroCTALink  string `json:"hero_cta_link"`
	AboutTitle   string `json:"about_title"`
	AboutContent string `json:"about_content"`
}

func (s *HomepageService) GetSettings(ctx context.Context) (*HomepageSettings, error) {
	settings, err := s.queries.GetHomepageSettings(ctx)
	if err != nil {
		defaultSettings, err := s.queries.CreateDefaultHomepageSettings(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to get or create settings: %w", err)
		}
		return &HomepageSettings{
			HeroTitle:    defaultSettings.HeroTitle,
			HeroSubtitle: defaultSettings.HeroSubtitle,
			HeroCTAText:  defaultSettings.HeroCtaText,
			HeroCTALink:  defaultSettings.HeroCtaLink,
			AboutTitle:   defaultSettings.AboutTitle,
			AboutContent: defaultSettings.AboutContent,
		}, nil
	}

	return &HomepageSettings{
		HeroTitle:    settings.HeroTitle,
		HeroSubtitle: settings.HeroSubtitle,
		HeroCTAText:  settings.HeroCtaText,
		HeroCTALink:  settings.HeroCtaLink,
		AboutTitle:   settings.AboutTitle,
		AboutContent: settings.AboutContent,
	}, nil
}

func (s *HomepageService) UpdateSettings(ctx context.Context, req *HomepageSettings) error {
	_, err := s.queries.UpsertHomepageSettings(ctx, db.UpsertHomepageSettingsParams{
		HeroTitle:    req.HeroTitle,
		HeroSubtitle: req.HeroSubtitle,
		HeroCtaText:  req.HeroCTAText,
		HeroCtaLink:  req.HeroCTALink,
		AboutTitle:   req.AboutTitle,
		AboutContent: req.AboutContent,
	})
	if err != nil {
		return fmt.Errorf("failed to update settings: %w", err)
	}
	return nil
}
