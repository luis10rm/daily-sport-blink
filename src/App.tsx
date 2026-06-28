import React from "react";
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
import Dashboard from "./pages/admin/Dashboard";
import PostsList from "./pages/admin/PostsList";
import PostEditor from "./pages/admin/PostEditor";
import BannersList from "./pages/admin/BannersList";
import BannerEditor from "./pages/admin/BannerEditor";
import CategoriesList from "./pages/admin/CategoriesList";
import CategoryEditor from "./pages/admin/CategoryEditor";
import UsersList from "./pages/admin/UsersList";
import Settings from "./pages/admin/Settings";
import WallpapersList from "./pages/admin/WallpapersList";
import WallpaperEditor from "./pages/admin/WallpaperEditor";
import AuthorsList from "./pages/admin/AuthorsList";
import AuthorEditor from "./pages/admin/AuthorEditor";
import FeedbackList from "./pages/admin/FeedbackList";
import SuggestionsList from "./pages/admin/SuggestionsList";
import SourcesList from "./pages/admin/SourcesList";
import AuthorProfile from "./pages/AuthorProfile";
import AuthorsPage from "./pages/AuthorsPage";
import Archive from "./pages/Archive";
import CategoryPage from "./pages/CategoryPage";
import TagPage from "./pages/TagPage";
import TagsListPage from "./pages/TagsListPage";
import BlinkPage from "./pages/BlinkPage";
import DailyPage from "./pages/DailyPage";
import NewsGone from "./pages/NewsGone";
import StartPage from "./pages/StartPage";
import InstallPage from "./pages/InstallPage";
import NotFound from "./pages/NotFound";
import WorldCup2026 from "./pages/WorldCup2026";
import ReckiHome from "./pages/ReckiHome";
import ReckiReview from "./pages/ReckiReview";
import ReviewsList from "./pages/admin/ReviewsList";
import ReviewEditor from "./pages/admin/ReviewEditor";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { TournamentTheme } from "@/components/TournamentTheme";
import { TournamentMascot } from "@/components/TournamentMascot";

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
              <PWAInstallBanner />
              <TournamentMascot />
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/start" element={<StartPage />} />
              <Route path="/zainstaluj" element={<InstallPage />} />
              <Route path="/dzien/:date" element={<DailyPage />} />
              <Route path="/blink/:slug" element={<BlinkPage />} />
              <Route path="/archiwum" element={<Archive />} />
              <Route path="/mistrzostwa-swiata-2026" element={<WorldCup2026 />} />
              <Route path="/tech" element={<ReckiHome />} />
              <Route path="/tech/kategoria/:slug" element={<ReckiHome />} />
              <Route path="/tech/:category/:slug" element={<ReckiReview />} />
              {/* 301-style redirects: /recki/* → /tech/* */}
              <Route path="/recki" element={<Navigate to="/tech" replace />} />
              <Route path="/recki/kategoria/:slug" element={<RedirectReckiCategory />} />
              <Route path="/recki/:category/:slug" element={<RedirectReckiReview />} />
              <Route path="/kategoria/:slug" element={<CategoryPage />} />
              <Route path="/tagi" element={<TagsListPage />} />
              <Route path="/tag/:slug" element={<TagPage />} />
              <Route path="/autorzy" element={<AuthorsPage />} />
              <Route path="/autor/:slug" element={<AuthorProfile />} />
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
            <Route path="/admin/recki" element={<ProtectedRoute><ReviewsList /></ProtectedRoute>} />
            <Route path="/admin/recki/new" element={<ProtectedRoute><ReviewEditor /></ProtectedRoute>} />
            <Route path="/admin/recki/:id/edit" element={<ProtectedRoute><ReviewEditor /></ProtectedRoute>} />
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
          </BrowserRouter>
        </TooltipProvider>
      </WallpaperProvider>
    </AuthProvider>
  </ThemeProvider>
</QueryClientProvider>
  );
}

export default App;
