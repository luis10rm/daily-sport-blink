import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { X, Trophy, Calendar, Users, Goal, Newspaper } from "lucide-react";
import { useWorldCupMatches, useWorldCupStandings, useWorldCupScorers } from "@/hooks/useWorldCupData";
import { useWorldCupPosts } from "@/hooks/useWorldCupPosts";

interface Props {
  onClose: () => void;
}

const PANEL_DURATION = 6000;

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });

export const WorldCupStoryPanels = ({ onClose }: Props) => {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();
  const goTo = useCallback(
    (to: string) => (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if ("preventDefault" in e) e.preventDefault();
      navigate(to);
    },
    [navigate]
  );

  const { data: matchesRes } = useWorldCupMatches();
  const { data: standingsRes } = useWorldCupStandings();
  const { data: scorersRes } = useWorldCupScorers();
  const { data: posts = [] } = useWorldCupPosts();

  const todaysMatches = useMemo(() => {
    const all = matchesRes?.data?.matches || [];
    const now = new Date();
    return all
      .filter((m) => isSameDay(new Date(m.utcDate), now))
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
  }, [matchesRes]);

  const polandGroup = useMemo(() => {
    const groups = standingsRes?.data?.standings || [];
    return groups.find((g) => g.table?.some((row) => row.team.tla === "POL")) || groups[0];
  }, [standingsRes]);

  const topScorers = useMemo(() => {
    return (scorersRes?.data?.scorers || []).slice(0, 5);
  }, [scorersRes]);

  const topPost = posts[0];

  const panels = [
    { kind: "schedule" as const, key: "schedule" },
    { kind: "group" as const, key: "group" },
    { kind: "scorers" as const, key: "scorers" },
    { kind: "post" as const, key: "post" },
  ];

  const total = panels.length;

  const next = useCallback(() => {
    setProgress(0);
    setIndex((i) => (i + 1 >= total ? -1 : i + 1));
  }, [total]);

  const prev = useCallback(() => {
    setProgress(0);
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    if (index === -1) onClose();
  }, [index, onClose]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          next();
          return 0;
        }
        return p + 100 / (PANEL_DURATION / 100);
      });
    }, 100);
    return () => clearInterval(t);
  }, [paused, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, next, prev]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) prev();
    else if (x > (rect.width * 2) / 3) next();
  };

  const panel = panels[index];

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div
        className="relative w-full h-full max-w-lg mx-auto flex flex-col bg-gradient-to-br from-emerald-950 via-slate-950 to-amber-950"
        onClick={handleClick}
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
          {panels.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-100"
                style={{ width: i < index ? "100%" : i === index ? `${progress}%` : "0%" }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-20 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Strefa MŚ 2026</p>
              <p className="text-white/60 text-xs">Aktualizacja na żywo</p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-2 rounded-full hover:bg-white/10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Panel content */}
        <div className="flex-1 flex items-center justify-center px-6 pt-24 pb-20 text-white">
          {panel?.kind === "schedule" && (
            <div className="w-full">
              <div className="flex items-center gap-2 text-amber-400 mb-4">
                <Calendar className="w-5 h-5" />
                <h3 className="text-lg font-bold">Terminarz dnia</h3>
              </div>
              {todaysMatches.length === 0 ? (
                <p className="text-white/70">Dziś brak meczów — wykorzystaj dzień na lekturę.</p>
              ) : (
                <ul className="space-y-3">
                  {todaysMatches.slice(0, 5).map((m) => (
                    <li key={m.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <span className="text-sm font-medium">
                        {m.homeTeam.tla || m.homeTeam.shortName} vs {m.awayTeam.tla || m.awayTeam.shortName}
                      </span>
                      <span className="text-xs text-amber-300 tabular-nums">{fmtTime(m.utcDate)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {panel?.kind === "group" && (
            <div className="w-full">
              <div className="flex items-center gap-2 text-amber-400 mb-4">
                <Users className="w-5 h-5" />
                <h3 className="text-lg font-bold">
                  {polandGroup?.group ? `Grupa ${polandGroup.group}` : "Tabela grupowa"}
                </h3>
              </div>
              {polandGroup?.table?.length ? (
                <ul className="space-y-2">
                  {polandGroup.table.map((row) => (
                    <li
                      key={row.team.id}
                      className={`flex items-center justify-between rounded-lg p-2.5 ${
                        row.team.tla === "POL" ? "bg-amber-500/20 ring-1 ring-amber-400" : "bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-5 text-white/60">{row.position}.</span>
                        {row.team.crest && <img src={row.team.crest} alt="" className="w-5 h-5" />}
                        <span className="text-sm font-medium">{row.team.shortName || row.team.name}</span>
                      </div>
                      <span className="text-sm font-bold tabular-nums">{row.points} pkt</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/70">Tabela pojawi się po pierwszych meczach.</p>
              )}
            </div>
          )}

          {panel?.kind === "scorers" && (
            <div className="w-full">
              <div className="flex items-center gap-2 text-amber-400 mb-4">
                <Goal className="w-5 h-5" />
                <h3 className="text-lg font-bold">Król strzelców</h3>
              </div>
              {topScorers.length === 0 ? (
                <p className="text-white/70">Czekamy na pierwsze gole turnieju.</p>
              ) : (
                <ol className="space-y-2">
                  {topScorers.map((s, i) => (
                    <li key={s.player.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-amber-400 font-bold">{i + 1}</span>
                        <div>
                          <div className="text-sm font-semibold">{s.player.name}</div>
                          <div className="text-xs text-white/60">{s.team.shortName || s.team.name}</div>
                        </div>
                      </div>
                      <span className="text-lg font-bold tabular-nums">{s.goals ?? 0}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {panel?.kind === "post" && (
            <div className="w-full">
              <div className="flex items-center gap-2 text-amber-400 mb-4">
                <Newspaper className="w-5 h-5" />
                <h3 className="text-lg font-bold">Top z MŚ</h3>
              </div>
              {topPost ? (
                <a
                  href={`/blink/${topPost.slug}`}
                  onClick={goTo(`/blink/${topPost.slug}`)}
                  onTouchEnd={goTo(`/blink/${topPost.slug}`)}
                  className="block bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-colors"
                >
                  {topPost.image_url && (
                    <img src={topPost.image_url} alt="" className="w-full h-40 object-cover" loading="lazy" />
                  )}
                  <div className="p-4">
                    <h4 className="font-bold text-base leading-tight mb-2">{topPost.title}</h4>
                    <p className="text-sm text-white/70 line-clamp-3">{topPost.excerpt}</p>
                  </div>
                </a>
              ) : (
                <p className="text-white/70">Brak wpisów z MŚ. Wkrótce zacznie się dziać.</p>
              )}
              <a
                href="/mistrzostwa-swiata-2026"
                onClick={goTo("/mistrzostwa-swiata-2026")}
                onTouchEnd={goTo("/mistrzostwa-swiata-2026")}
                className="mt-4 inline-flex items-center gap-2 bg-amber-400 text-amber-950 px-4 py-2 rounded-full text-sm font-bold"
              >
                Przejdź do hubu MŚ
              </a>
            </div>
          )}
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-white/60 text-xs">
          {index + 1} / {total}
        </div>
      </div>
    </div>
  );
};
