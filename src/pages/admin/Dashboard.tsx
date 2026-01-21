import { AdminLayout } from "@/components/admin/AdminLayout";
import { usePosts } from "@/hooks/usePosts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Eye, Star, TrendingUp } from "lucide-react";
import { format, isToday, isThisWeek, isThisMonth } from "date-fns";
import { pl } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { data: posts, isLoading } = usePosts();

  const todayPosts = posts?.filter((p) => isToday(new Date(p.published_at))) || [];
  const weekPosts = posts?.filter((p) => isThisWeek(new Date(p.published_at))) || [];
  const monthPosts = posts?.filter((p) => isThisMonth(new Date(p.published_at))) || [];
  const newsOfDay = posts?.find((p) => p.is_news_of_day);

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
                        {post.category}
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
