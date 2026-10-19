-- User-approved target expansion. Products and historical import payloads are untouched.
UPDATE catalog.garment_types SET target_min=100, target_max=100;
-- Polo and blouse now have their own stable types, so remove the former shirt aliases.
UPDATE catalog.garment_types SET aliases='["button-up","gömlek"]'::jsonb WHERE id='shirt';
