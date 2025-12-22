import { SportCategory } from "@/components/SportIcon";

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  category: SportCategory;
  publishedAt: string;
  sourceUrl: string;
  imageUrl?: string;
  isSponsored?: boolean;
}

export const sponsoredPost: Post = {
  id: "sponsored",
  title: "Nowa kolekcja butów Nike Air Zoom",
  excerpt: "Odkryj najnowszą kolekcję butów sportowych zaprojektowanych z myślą o maksymalnej wydajności. Technologia Air Zoom zapewnia doskonałą amortyzację.",
  category: "other",
  publishedAt: new Date().toISOString(),
  sourceUrl: "https://example.com/sponsor",
  imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=60",
  isSponsored: true,
};

export const samplePosts: Post[] = [
  {
    id: "1",
    title: "Real Madryt pokonuje Barcelonę w El Clásico",
    excerpt: "Vinicius Jr. strzelił zwycięskiego gola w 87. minucie, dając Królewskim triumf 2:1 na Santiago Bernabéu. To piąte z rzędu zwycięstwo Realu w lidze.",
    category: "football",
    publishedAt: "2024-12-21",
    sourceUrl: "https://example.com/real-barca",
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "2",
    title: "Verstappen mistrzem świata F1 po raz czwarty",
    excerpt: "Holender przypieczętował tytuł na torze w Las Vegas. Red Bull zdominował sezon z 21 zwycięstwami w 23 wyścigach.",
    category: "f1",
    publishedAt: "2024-12-21",
    sourceUrl: "https://example.com/verstappen",
    imageUrl: "https://images.unsplash.com/photo-1541773125685-f3c7dc5fba08?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "3",
    title: "Świątek wraca na szczyt rankingu WTA",
    excerpt: "Polska tenisistka odzyskała pozycję liderki po triumfie w turnieju WTA Finals. To jej trzeci tytuł w tym prestiżowym turnieju.",
    category: "tennis",
    publishedAt: "2024-12-20",
    sourceUrl: "https://example.com/swiatek",
    imageUrl: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "4",
    title: "Lakers z serią 8 zwycięstw z rzędu",
    excerpt: "LeBron James zdobył 35 punktów w meczu z Celtics. Los Angeles Lakers są obecnie na 2. miejscu w Konferencji Zachodniej NBA.",
    category: "basketball",
    publishedAt: "2024-12-20",
    sourceUrl: "https://example.com/lakers",
    imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "5",
    title: "Mamed Chalidow zapowiada powrót do oktagonu",
    excerpt: "Legenda polskiego MMA ogłosiła, że wróci do walki na gali KSW 100. Przeciwnik zostanie ogłoszony w przyszłym tygodniu.",
    category: "mma",
    publishedAt: "2024-12-19",
    sourceUrl: "https://example.com/chalidow",
    imageUrl: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&auto=format&fit=crop&q=60",
  },
];

// Function to get posts with sponsored post always in second position
export const getPostsWithSponsored = (): Post[] => {
  const [first, ...rest] = samplePosts;
  return [first, sponsoredPost, ...rest];
};
