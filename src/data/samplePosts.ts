import { SportCategory } from "@/components/SportIcon";

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  category: SportCategory;
  publishedAt: string;
  sourceUrl: string;
}

export const samplePosts: Post[] = [
  {
    id: "1",
    title: "Real Madryt pokonuje Barcelonę w El Clásico",
    excerpt: "Vinicius Jr. strzelił zwycięskiego gola w 87. minucie, dając Królewskim triumf 2:1 na Santiago Bernabéu. To piąte z rzędu zwycięstwo Realu w lidze.",
    category: "football",
    publishedAt: "2024-12-21",
    sourceUrl: "https://example.com/real-barca",
  },
  {
    id: "2",
    title: "Verstappen mistrzem świata F1 po raz czwarty",
    excerpt: "Holender przypieczętował tytuł na torze w Las Vegas. Red Bull zdominował sezon z 21 zwycięstwami w 23 wyścigach.",
    category: "f1",
    publishedAt: "2024-12-21",
    sourceUrl: "https://example.com/verstappen",
  },
  {
    id: "3",
    title: "Świątek wraca na szczyt rankingu WTA",
    excerpt: "Polska tenisistka odzyskała pozycję liderki po triumfie w turnieju WTA Finals. To jej trzeci tytuł w tym prestiżowym turnieju.",
    category: "tennis",
    publishedAt: "2024-12-20",
    sourceUrl: "https://example.com/swiatek",
  },
  {
    id: "4",
    title: "Lakers z serią 8 zwycięstw z rzędu",
    excerpt: "LeBron James zdobył 35 punktów w meczu z Celtics. Los Angeles Lakers są obecnie na 2. miejscu w Konferencji Zachodniej NBA.",
    category: "basketball",
    publishedAt: "2024-12-20",
    sourceUrl: "https://example.com/lakers",
  },
  {
    id: "5",
    title: "Mamed Chalidow zapowiada powrót do oktagonu",
    excerpt: "Legenda polskiego MMA ogłosiła, że wróci do walki na gali KSW 100. Przeciwnik zostanie ogłoszony w przyszłym tygodniu.",
    category: "mma",
    publishedAt: "2024-12-19",
    sourceUrl: "https://example.com/chalidow",
  },
  {
    id: "6",
    title: "Lewandowski z hat-trickiem w meczu z Sevillą",
    excerpt: "Polski napastnik strzelił trzy gole, prowadząc Barcelonę do zwycięstwa 4:0. To jego 15. hat-trick w karierze.",
    category: "football",
    publishedAt: "2024-12-19",
    sourceUrl: "https://example.com/lewandowski",
  },
];
