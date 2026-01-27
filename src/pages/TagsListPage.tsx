import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { PatronBar } from "@/components/PatronBar";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { SEO } from "@/components/SEO";
import { useTags } from "@/hooks/useTags";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, ArrowRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const TagsListPage = () => {
  const { data: tags = [], isLoading } = useTags(1);

  useDocumentTitle("Tagi - Szortsy");

  // Group tags alphabetically
  const groupedTags = tags.reduce((acc, tag) => {
    const firstLetter = tag.name.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(tag);
    return acc;
  }, {} as Record<string, typeof tags>);

  const sortedLetters = Object.keys(groupedTags).sort((a, b) =>
    a.localeCompare(b, "pl")
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO
        type="ItemList"
        data={{
          name: "Tagi - Szortsy",
          description: "Lista wszystkich tagów w serwisie Szortsy",
          numberOfItems: tags.length,
        }}
      />
      <Header />
      <PatronBar />

      <main className="container py-8 md:py-12">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Strona główna</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Tagi</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Tag className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Tagi
            </h1>
            <p className="text-muted-foreground">
              {tags.length} {tags.length === 1 ? "tag" : "tagów"} w serwisie
            </p>
          </div>
        </div>

        {/* Tags List */}
        {isLoading ? (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="h-8 w-12 mb-4" />
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <Skeleton key={j} className="h-10 w-32 rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : tags.length > 0 ? (
          <div className="space-y-8">
            {sortedLetters.map((letter) => (
              <div key={letter}>
                <h2 className="text-2xl font-bold text-foreground mb-4 border-b border-border pb-2">
                  {letter}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {groupedTags[letter].map((tag) => (
                    <Link
                      key={tag.id}
                      to={`/tag/${tag.slug}`}
                      className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
                    >
                      <span>{tag.name}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                        {tag.post_count}
                      </span>
                      <ArrowRight className="h-3 w-3 opacity-0 -ml-1 transition-all group-hover:opacity-100 group-hover:ml-0" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-muted/50 py-16 text-center">
            <Tag className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Brak tagów
            </h2>
            <p className="text-muted-foreground">
              Nie znaleziono żadnych tagów w serwisie.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TagsListPage;
