-- Add content generation prompt setting
INSERT INTO settings (key, value, updated_at)
VALUES (
  'article_content_prompt', 
  'Na podstawie oryginalnego artykułu napisz unikatową, skróconą wersję newsa sportowego w języku polskim. Treść musi być:
- 300-500 słów
- Napisana prostym, angażującym językiem
- Zawierać wszystkie kluczowe fakty z oryginału
- Mieć dynamiczny, dziennikarski ton
- Podzielona na 2-3 akapity
- Bez powtarzania tytułu na początku',
  now()
)
ON CONFLICT (key) DO NOTHING;