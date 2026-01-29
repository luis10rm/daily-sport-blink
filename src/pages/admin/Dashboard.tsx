import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { usePosts } from "@/hooks/usePosts";
import { useGenerateDailySummary } from "@/hooks/useSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileText, Eye, Star, TrendingUp, CalendarIcon, Sparkles, Loader2 } from "lucide-react";
import { format, isToday, isThisWeek, isThisMonth, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: posts, isLoading } = usePosts();
  const generateSummary = useGenerateDailySummary();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const todayPosts = posts?.filter((p) => isToday(new Date(p.published_at))) || [];
  const weekPosts = posts?.filter((p) => isThisWeek(new Date(p.published_at))) || [];
  const monthPosts = posts?.filter((p) => isThisMonth(new Date(p.published_at))) || [];
  const newsOfDay = posts?.find((p) => p.is_news_of_day);

  // Count posts for selected date
  const selectedDatePosts = posts?.filter((p) => 
    isSameDay(new Date(p.published_at), selectedDate)
  ) || [];

  const stats = [
    {
      title: "Posty dzisiaj",
      value: todayPosts.length,
      icon: FileText,
      description: "Opublikowane dzisiaj",
    },
    {
      title: "Posty w tym tygodniu",
      value: weekPosts.length,
      icon: TrendingUp,
      description: "Ostatnie 7 dni",
    },
    {
      title: "Posty w tym miesiącu",
      value: monthPosts.length,
      icon: Eye,
      description: "Bieżący miesiąc",
    },
    {
      title: "Wszystkie posty",
      value: posts?.length || 0,
      icon: Star,
      description: "Łączna liczba",
    },
  ];

  const handleGenerateSummary = async () => {
    const result = await generateSummary.mutateAsync(selectedDate);
    
    // Navigate to PostEditor with prefilled data
    navigate("/admin/posts/new", {
      state: {
        prefill: {
          title: result.title,
          excerpt: result.excerpt,
          content: result.content,
          tags: result.suggested_tags.join(", "),
        },
      },
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading">Dashboard</h1>
            <p className="text-muted-foreground">
              Przegląd statystyk i najnowszych postów
            </p>
          </div>
          <Link to="/admin/posts/new">
            <Button>Nowy post</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Daily Summary Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Podsumowanie dnia (AI)
            </CardTitle>
            <CardDescription>
              Wygeneruj długi artykuł SEO podsumowujący wszystkie newsy z wybranego dnia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[200px] justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "d MMMM yyyy", { locale: pl })
                      ) : (
                        <span>Wybierz datę</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          setIsCalendarOpen(false);
                        }
                      }}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      locale={pl}
                    />
                  </PopoverContent>
                </Popover>
                
                <span className="text-sm text-muted-foreground">
                  {selectedDatePosts.length} {selectedDatePosts.length === 1 ? "post" : "postów"}
                </span>
              </div>

              <Button
                onClick={handleGenerateSummary}
                disabled={generateSummary.isPending || selectedDatePosts.length === 0}
                className="gap-2"
              >
                {generateSummary.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generuję...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generuj podsumowanie
                  </>
                )}
              </Button>
            </div>
            
            {selectedDatePosts.length === 0 && (
              <p className="text-sm text-muted-foreground mt-3">
                Brak postów dla wybranej daty. Wybierz inny dzień.
              </p>
            )}
            
            {generateSummary.isPending && (
              <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Generuję podsumowanie dnia... To może zająć do 30 sekund.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* News of the day */}
        {newsOfDay && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                News dnia
              </CardTitle>
              <CardDescription>Aktualnie wyróżniony post</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {newsOfDay.image_url && (
                  <img
                    src={newsOfDay.image_url}
                    alt={newsOfDay.title}
                    className="h-20 w-32 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{newsOfDay.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {newsOfDay.excerpt}
                  </p>
                </div>
                <Link to={`/admin/posts/${newsOfDay.id}/edit`}>
                  <Button variant="outline" size="sm">
                    Edytuj
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent posts */}
        <Card>
          <CardHeader>
            <CardTitle>Ostatnie posty</CardTitle>
            <CardDescription>Najnowsze opublikowane posty</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : posts && posts.length > 0 ? (
              <div className="space-y-4">
                {posts.slice(0, 5).map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-4 rounded-lg border border-border p-4"
                  >
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="h-12 w-20 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{post.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(post.published_at), "d MMM yyyy, HH:mm", {
                          locale: pl,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium">
                        {post.sport_category?.name || "Inne"}
                      </span>
                      <Link to={`/admin/posts/${post.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Edytuj
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Brak postów. Utwórz pierwszy post!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
