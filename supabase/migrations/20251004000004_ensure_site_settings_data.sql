-- Ensure site_settings table has the required data
INSERT INTO site_settings (key, value) VALUES
  ('couple_info', '{"names": "Emmanuel & Martha", "wedding_date": "2026-02-14", "location": "Kampala, Uganda", "hero_image": "", "tagline": "Join us as we celebrate our love", "wedding_time": "10:00"}'),
  ('next_meeting_id', 'null'),
  ('default_currency', '"UGX"')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW()
WHERE site_settings.key = EXCLUDED.key;