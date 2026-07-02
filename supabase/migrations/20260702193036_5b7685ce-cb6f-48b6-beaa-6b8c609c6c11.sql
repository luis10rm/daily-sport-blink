UPDATE public.reviews
SET content = replace(replace(replace(replace(replace(
  content,
  '&lt;', '<'),
  '&gt;', '>'),
  '&quot;', '"'),
  '&#39;', ''''),
  '&amp;', '&')
WHERE id = 'f9e416c4-57eb-4f50-94b2-076964f17c0f';