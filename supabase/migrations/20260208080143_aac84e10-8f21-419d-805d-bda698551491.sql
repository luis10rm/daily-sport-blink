
INSERT INTO public.settings (key, value)
VALUES ('article_image_prompt', 'Stwórz atrakcyjną, profesjonalną grafikę do artykułu sportowego.

KONTEKST ARTYKUŁU:
- Tytuł: {title}
- Kategoria: {category}
- Opis: {excerpt}

ZASADY:
1. Grafika musi być wizualnie dynamiczna i przyciągająca wzrok
2. Styl: profesjonalna fotografia sportowa lub kinowy kadr filmowy
3. Żywe, nasycone kolory z dramatycznym, kinowym oświetleniem
4. Kompozycja dynamiczna z poczuciem ruchu i akcji sportowej
5. Format 16:9, idealna jako miniaturka artykułu w serwisie informacyjnym
6. BEZ tekstu, napisów, logotypów, znaków wodnych ani osób z twarzami
7. Tematycznie ściśle dopasowana do treści i kontekstu artykułu
8. Wysoka jakość, fotorealistyczna lub wysokiej jakości render 3D
9. Użyj symbolicznych elementów sportu (piłki, rakiety, samochody wyścigowe itp.) pasujących do kategorii
10. Tło powinno budować atmosferę - stadion, kort, tor wyścigowy lub abstrakcyjne dynamiczne tło')
ON CONFLICT (key) DO NOTHING;
