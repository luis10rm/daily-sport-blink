-- Krok 1: Usuń kolumnę category (enum) z tabeli posts
ALTER TABLE public.posts DROP COLUMN category;

-- Krok 2: Ustaw category_id jako wymagane dla nowych postów
-- (nie robimy NOT NULL bo istniejące posty mogą nie mieć category_id)

-- Krok 3: Dodaj foreign key constraint do sport_categories
ALTER TABLE public.posts 
ADD CONSTRAINT fk_posts_category 
FOREIGN KEY (category_id) 
REFERENCES public.sport_categories(id) 
ON DELETE SET NULL;

-- Krok 4: Usuń niepotrzebny typ enum (jeśli nie jest używany gdzie indziej)
DROP TYPE IF EXISTS sport_category;