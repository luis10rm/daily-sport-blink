import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import AuthorProfile from "./pages/AuthorProfile";
import AuthorsPage from "./pages/AuthorsPage";
import Archive from "./pages/Archive";
import CategoryPage from "./pages/CategoryPage";
import TagPage from "./pages/TagPage";
import TagsListPage from "./pages/TagsListPage";
import BlinkPage from "./pages/BlinkPage";
import DailyPage from "./pages/DailyPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
              <ConditionalWallpaper />
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dzien/:date" element={<DailyPage />} />
              <Route path="/blink/:slug" element={<BlinkPage />} />
              <Route path="/archiwum" element={<Archive />} />
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
