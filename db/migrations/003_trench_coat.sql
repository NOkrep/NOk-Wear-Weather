-- WW-30 (user-approved): trench coats get their own type, separate from coat-parka.
-- The type row is added here so the legacy profile can point at it; migrate.ts adds the same row on new databases.
INSERT INTO catalog.garment_types (id,group_name,label_tr,label_en,slots,aliases,target_min,target_max)
VALUES ('trench-coat','outer','Trençkot','Trench coat','["torso","arms","upper-legs"]'::jsonb,'["trench","trençkot","gabardin"]'::jsonb,100,100)
ON CONFLICT (id) DO NOTHING;
-- The historical "Su İtici Klasik Gabardin Trençkot" profile. Products and import payloads are untouched.
UPDATE catalog.legacy_profiles SET garment_type_id='trench-coat' WHERE id='cat-outer-2' AND garment_type_id='coat-parka';
