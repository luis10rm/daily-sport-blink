-- Decode escaped HTML entities in reviews.content and posts.content for legacy rows
-- where users pasted encoded HTML (e.g. `&lt;p&gt;&lt;strong&gt;...`).
UPDATE public.reviews
SET content = replace(replace(replace(replace(replace(replace(
  content,
  '&lt;', '<'),
  '&gt;', '>'),
  '&quot;', '"'),
  '&#39;', ''''),
  '&nbsp;', ' '),
  '&amp;', '&')
WHERE content ILIKE '%&lt;p&gt;%'
   OR content ILIKE '%&lt;strong%'
   OR content ILIKE '%&lt;h2%'
   OR content ILIKE '%&lt;h3%'
   OR content ILIKE '%&lt;ul%'
   OR content ILIKE '%&lt;ol%'
   OR content ILIKE '%&lt;em%';

UPDATE public.posts
SET content = replace(replace(replace(replace(replace(replace(
  content,
  '&lt;', '<'),
  '&gt;', '>'),
  '&quot;', '"'),
  '&#39;', ''''),
  '&nbsp;', ' '),
  '&amp;', '&')
WHERE content ILIKE '%&lt;p&gt;%'
   OR content ILIKE '%&lt;strong%'
   OR content ILIKE '%&lt;h2%'
   OR content ILIKE '%&lt;h3%'
   OR content ILIKE '%&lt;ul%'
   OR content ILIKE '%&lt;ol%'
   OR content ILIKE '%&lt;em%';