import { MapPin, Wallet, CarFront, CalendarRange, Users, Route, Globe, Check } from "lucide-react";
import type { PracticalInfo as PracticalInfoData } from "@/lib/practicalInfo";
import { hasPracticalInfo } from "@/lib/practicalInfo";

interface Props {
  info: PracticalInfoData;
}

const ROWS: {
  key: keyof PracticalInfoData;
  label: string;
  Icon: typeof MapPin;
}[] = [
  { key: "address", label: "Lokalizacja", Icon: MapPin },
  { key: "price_from", label: "Ceny", Icon: Wallet },
  { key: "parking", label: "Parking", Icon: CarFront },
  { key: "season", label: "Kiedy jechać", Icon: CalendarRange },
  { key: "best_for", label: "Dla kogo", Icon: Users },
  { key: "travel", label: "Dojazd", Icon: Route },
];

export const PracticalInfo = ({ info }: Props) => {
  if (!hasPracticalInfo(info)) return null;

  const rows = ROWS.filter((r) => !!info[r.key]);

  return (
    <section
      aria-labelledby="informacje-praktyczne"
      className="mb-8 rounded-2xl border border-border bg-muted/40 p-5"
    >
      <h2
        id="informacje-praktyczne"
        className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground"
      >
        Informacje praktyczne
      </h2>

      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
        {rows.map(({ key, label, Icon }) => (
          <div key={key} className="flex gap-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-600 dark:text-fuchsia-300" />
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </dt>
              <dd className="text-sm leading-relaxed text-foreground">
                {String(info[key])}
                {key === "address" && info.map_url && (
                  <>
                    {" "}
                    <a
                      href={info.map_url}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      pokaż na mapie
                    </a>
                  </>
                )}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      {!!info.amenities?.length && (
        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Udogodnienia
          </p>
          <ul className="flex flex-wrap gap-2">
            {info.amenities.map((a, i) => (
              <li
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"
              >
                <Check className="h-3 w-3" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {info.website && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
          <a
            href={info.website}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="truncate text-primary hover:underline"
          >
            Strona obiektu
          </a>
        </div>
      )}
    </section>
  );
};

export default PracticalInfo;
