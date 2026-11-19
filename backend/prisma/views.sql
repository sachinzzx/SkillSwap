CREATE OR REPLACE VIEW public_teacher_directory AS
SELECT
  u.id,
  u.name,
  s.name AS skill,
  c.name AS category,
  us."hourlyCoinRate" AS "hourlyRate"
FROM "UserSkill" us
JOIN "User" u ON u.id = us."userId"
JOIN "Skill" s ON s.id = us."skillId"
JOIN "Category" c ON c.id = s."categoryId"
WHERE us.type = 'TEACH';
