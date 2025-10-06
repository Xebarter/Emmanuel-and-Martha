-- Ensure hero_section key exists in site_settings
INSERT INTO site_settings (key, value) VALUES
  ('hero_section', '{"heartIconColor": "#ec4899", "backgroundOverlayOpacity": 0.4}')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW()
WHERE site_settings.key = EXCLUDED.key;