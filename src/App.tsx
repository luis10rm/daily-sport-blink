import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { WallpaperProvider } from "@/contexts/WallpaperContext";
import { ConditionalWallpaper } from "@/components/ConditionalWallpaper";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { Analytics } from "@/components/Analytics";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthorProfile from "./pages/AuthorProfile";
import AuthorsPage from "./pages/AuthorsPage";
import RedakcjaRedirect from "./pages/RedakcjaRedirect";
import Archive from "./pages/Archive";
import CategoryPage from "./pages/CategoryPage";
import TagPage from "./pages/TagPage";
import TagsListPage from "./pages/TagsListPage";
import BlinkPage from "./pages/BlinkPage";
import DailyPage from "./pages/DailyPage";
import NewsGone from "./pages/NewsGone";
import NotFound from "./pages/NotFound";
import WorldCup2026 from "./pages/WorldCup2026";
import ReckiHome from "./pages/ReckiHome";
import ReckiReview from "./pages/ReckiReview";
import PozytywneHome from "./pages/PozytywneHome";
import PozytywneArchive from "./pages/PozytywneArchive";
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const PostsList = lazy(() => import("./pages/admin/PostsList"));
const PostEditor = lazy(() => import("./pages/admin/PostEditor"));
const BannersList = lazy(() => import("./pages/admin/BannersList"));
const BannerEditor = lazy(() => import("./pages/admin/BannerEditor"));
const CategoriesList = lazy(() => import("./pages/admin/CategoriesList"));
const CategoryEditor = lazy(() => import("./pages/admin/CategoryEditor"));
const UsersList = lazy(() => import("./pages/admin/UsersList"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const WallpapersList = lazy(() => import("./pages/admin/WallpapersList"));
const WallpaperEditor = lazy(() => import("./pages/admin/WallpaperEditor"));
const AuthorsList = lazy(() => import("./pages/admin/AuthorsList"));
const AuthorEditor = lazy(() => import("./pages/admin/AuthorEditor"));
const FeedbackList = lazy(() => import("./pages/admin/FeedbackList"));
const SuggestionsList = lazy(() => import("./pages/admin/SuggestionsList"));
const SourcesList = lazy(() => import("./pages/admin/SourcesList"));
const ReviewsList = lazy(() => import("./pages/admin/ReviewsList"));
const ReviewEditor = lazy(() => import("./pages/admin/ReviewEditor"));
const ReviewCategoriesList = lazy(() => import("./pages/admin/ReviewCategoriesList"));
const ReviewCategoryEditor = lazy(() => import("./pages/admin/ReviewCategoryEditor"));
const PositivePostsList = lazy(() => import("./pages/admin/PositivePostsList"));
const PositiveCategoriesList = lazy(() => import("./pages/admin/PositiveCategoriesList"));
const PositiveCategoryEditor = lazy(() => import("./pages/admin/PositiveCategoryEditor"));
const DuplicatesList = lazy(() => import("./pages/admin/DuplicatesList"));
const TagsList = lazy(() => import("./pages/admin/TagsList"));
import { TournamentTheme } from "@/components/TournamentTheme";


const queryClient = new QueryClient();

const RedirectReckiCategory = () => {
  const { slug } = useParams();
  return <Navigate to={`/tech/kategoria/${slug ?? ""}`} replace />;
};
const RedirectReckiReview = () => {
  const { category, slug } = useParams();
  return <Navigate to={`/tech/${category ?? "wszystkie"}/${slug ?? ""}`} replace />;
};

function App() {
  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
      <AuthProvider>
        <WallpaperProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Analytics />
              <TournamentTheme />
              <ConditionalWallpaper />
              <Suspense fallback={<div className="min-h-screen" />}>
              <Routes>

              <Route path="/" element={<Index />} />
              <Route path="/dzien/:date" element={<DailyPage />} />
              <Route path="/blink/:slug" element={<BlinkPage />} />
              <Route path="/archiwum" element={<Archive />} />
              <Route path="/mistrzostwa-swiata-2026" element={<WorldCup2026 />} />
              <Route path="/tech" element={<ReckiHome />} />
              <Route path="/tech/kategoria/:slug" element={<ReckiHome />} />
              <Route path="/tech/:category/:slug" element={<ReckiReview />} />
              {/* Pozytywne channel */}
              <Route path="/pozytywne" element={<PozytywneHome />} />
              <Route path="/pozytywne/archiwum" element={<PozytywneArchive />} />
              <Route path="/pozytywne/kategoria/:slug" element={<PozytywneHome />} />
              <Route path="/pozytywne/:category/:slug" element={<BlinkPage />} />
              {/* 301-style redirects: /recki/* → /tech/* */}
              <Route path="/recki" element={<Navigate to="/tech" replace />} />
              <Route path="/recki/kategoria/:slug" element={<RedirectReckiCategory />} />
              <Route path="/recki/:category/:slug" element={<RedirectReckiReview />} />
              <Route path="/kategoria/:slug" element={<CategoryPage />} />
              <Route path="/tagi" element={<TagsListPage />} />
              <Route path="/tag/:slug" element={<TagPage />} />
              <Route path="/autorzy" element={<AuthorsPage />} />
              <Route path="/autor/:slug" element={<AuthorProfile />} />
              <Route path="/redakcja/:slug" element={<RedakcjaRedirect />} />
              <Route path="/redakcja" element={<Navigate to="/autorzy" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/posts"
              element={
                <ProtectedRoute>
                  <PostsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/posts/new"
              element={
                <ProtectedRoute>
                  <PostEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/posts/:id/edit"
              element={
                <ProtectedRoute>
                  <PostEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/duplikaty"
              element={
                <ProtectedRoute>
                  <DuplicatesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tagi"
              element={
                <ProtectedRoute>
                  <TagsList />
                </ProtectedRoute>
              }
            />
            <Route path="/admin/recki" element={<ProtectedRoute><ReviewsList /></ProtectedRoute>} />
            <Route path="/admin/recki/new" element={<ProtectedRoute><ReviewEditor /></ProtectedRoute>} />
            <Route path="/admin/recki/:id/edit" element={<ProtectedRoute><ReviewEditor /></ProtectedRoute>} />
            <Route path="/admin/recki/kategorie" element={<ProtectedRoute><ReviewCategoriesList /></ProtectedRoute>} />
            <Route path="/admin/recki/kategorie/new" element={<ProtectedRoute><ReviewCategoryEditor /></ProtectedRoute>} />
            <Route path="/admin/recki/kategorie/:id/edit" element={<ProtectedRoute><ReviewCategoryEditor /></ProtectedRoute>} />
            {/* Pozytywne admin */}
            <Route path="/admin/pozytywne" element={<ProtectedRoute><PositivePostsList /></ProtectedRoute>} />
            <Route path="/admin/pozytywne/new" element={<ProtectedRoute><PostEditor /></ProtectedRoute>} />
            <Route path="/admin/pozytywne/:id/edit" element={<ProtectedRoute><PostEditor /></ProtectedRoute>} />
            <Route path="/admin/pozytywne/kategorie" element={<ProtectedRoute><PositiveCategoriesList /></ProtectedRoute>} />
            <Route path="/admin/pozytywne/kategorie/new" element={<ProtectedRoute><PositiveCategoryEditor /></ProtectedRoute>} />
            <Route path="/admin/pozytywne/kategorie/:id/edit" element={<ProtectedRoute><PositiveCategoryEditor /></ProtectedRoute>} />
            <Route
              path="/admin/banners"
              element={
                <ProtectedRoute>
                  <BannersList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/banners/new"
              element={
                <ProtectedRoute>
                  <BannerEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/banners/:id/edit"
              element={
                <ProtectedRoute>
                  <BannerEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/wallpapers"
              element={
                <ProtectedRoute requireAdmin>
                  <WallpapersList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/wallpapers/new"
              element={
                <ProtectedRoute requireAdmin>
                  <WallpaperEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/wallpapers/:id/edit"
              element={
                <ProtectedRoute requireAdmin>
                  <WallpaperEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute requireAdmin>
                  <CategoriesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories/new"
              element={
                <ProtectedRoute requireAdmin>
                  <CategoryEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories/:id/edit"
              element={
                <ProtectedRoute requireAdmin>
                  <CategoryEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requireAdmin>
                  <UsersList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/authors"
              element={
                <ProtectedRoute>
                  <AuthorsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/authors/new"
              element={
                <ProtectedRoute>
                  <AuthorEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/authors/:id/edit"
              element={
                <ProtectedRoute>
                  <AuthorEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/feedback"
              element={
                <ProtectedRoute>
                  <FeedbackList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/suggestions"
              element={<ProtectedRoute><SuggestionsList /></ProtectedRoute>}
            />
            <Route
              path="/admin/sources"
              element={<ProtectedRoute><SourcesList /></ProtectedRoute>}
            />
              <Route path="/news/*" element={<NewsGone />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>

        </TooltipProvider>
      </WallpaperProvider>
    </AuthProvider>
  </ThemeProvider>
</QueryClientProvider>
  );
}

export default App;
