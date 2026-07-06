import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tag as TagIcon, Search } from "lucide-react";
import { TAG_INDEX_MIN_POSTS } from "@/hooks/useSEOMeta";

interface TagRow {
  id: string;
  name: string;
  slug: string;
  channel: string;
  post_count: number;
  force_index: boolean;
  updated_at: string;
}

const TagsList = () => {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["admin-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("id, name, slug, channel, post_count, force_index, updated_at")
        .order("post_count", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as TagRow[];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase
        .from("tags")
        // force_index is a new column; cast to satisfy generated types
        .update({ force_index: value } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tags"] });
      toast.success("Zapisano");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return tags;
    return tags.filter(
      (t) => t.name.toLowerCase().includes(s) || t.slug.toLowerCase().includes(s),
    );
  }, [tags, q]);

  const statusFor = (t: TagRow) => {
    if (t.post_count >= TAG_INDEX_MIN_POSTS)
      return { label: "indeksowany", tone: "default" as const };
    if (t.force_index)
      return { label: "indeksowany (wymuszony)", tone: "default" as const };
    return { label: `noindex — poniżej ${TAG_INDEX_MIN_POSTS} artykułów`, tone: "secondary" as const };
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TagIcon className="h-6 w-6" /> Tagi
          </h1>
          <p className="text-sm text-muted-foreground">
            Tagi z mniej niż {TAG_INDEX_MIN_POSTS} artykułami są domyślnie noindex. Włącz „Wymuś indeksowanie", żeby utrzymać strategiczny tag w Google.
          </p>
        </div>
        <div className="relative w-72 max-w-full">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Szukaj tagu…"
            className="pl-8"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Ładowanie…</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Tag</th>
                <th className="px-4 py-2 font-medium">Kanał</th>
                <th className="px-4 py-2 font-medium">Artykuły</th>
                <th className="px-4 py-2 font-medium">Status SEO</th>
                <th className="px-4 py-2 font-medium">Wymuś indeksowanie</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const s = statusFor(t);
                return (
                  <tr key={t.id} className="border-t border-border">
                    <td className="px-4 py-2">
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">/tag/{t.slug}</div>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{t.channel}</td>
                    <td className="px-4 py-2 tabular-nums">{t.post_count}</td>
                    <td className="px-4 py-2">
                      <Badge variant={s.tone}>{s.label}</Badge>
                    </td>
                    <td className="px-4 py-2">
                      <Switch
                        checked={t.force_index}
                        onCheckedChange={(v) => toggle.mutate({ id: t.id, value: v })}
                      />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Brak tagów.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default TagsList;
