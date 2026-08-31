export const config = { runtime: "edge" };

const SITE_URL = "https://szortsy.pl";
const SITE_NAME = "Szortsy";
const DEFAULT_TITLE = "Szortsy - Wiadomości sportowe krótko i na temat";
const DEFAULT_DESCRIPTION =
  "Szortsy – najważniejsze wiadomości sportowe w 60 sekund. Piłka nożna, F1, tenis, MMA i więcej. Krótko, konkretnie, codziennie. Bądź na bieżąco!";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const BACKEND_URL =
  process.env.VITE_SUPABASE_URL ?? "https://izyknazjzdkfdxnekvos.supabase.co";
const BACKEND_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Iml6eWtuYXpqemRrZmR4bmVrdm9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5ODk0NTYsImV4cCI6MjA4NDU2NTQ1Nn0.JooTJ-SLkn50yyZBkmvJETHKQQvYZh_9tVmjUTk7SOM";

const NOINDEX = "noindex, follow";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const jsonForHtml = (value) =>
  JSON.stringify(value).replace(/</g, "\\u003c").replace(/-->/g, "--\\u003e");

const fullTitle = (title) =>
  !title || title === DEFAULT_TITLE || title.includes("| Szortsy")
    ? title || DEFAULT_TITLE
    : `${title} | Szortsy`;

const fetchRows = async (table, params) => {
  if (!BACKEND_ANON_KEY) return null;
  const url = new URL(`/rest/v1/${table}`, BACKEND_URL);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  try {
    const response = await fetch(url, {
      headers: {
        apikey: BACKEND_ANON_KEY,
        Authorization: `Bearer ${BACKEND_ANON_KEY}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) return null;
    const data = await response.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
};

const fetchOne = async (table, params) => {
  const rows = await fetchRows(table, { ...params, limit: "1" });
  if (rows === null) return undefined;
  return rows[0] ?? null;
};

const baseMeta = (path) => ({
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  canonical: `${SITE_URL}${path === "/" ? "/" : path}`,
  robots: "index, follow",
  ogType: "website",
  image: DEFAULT_IMAGE,
  schema: null,
  content: null,
});

const addTag = (tags, tag) => tag && tags.push(tag);

// --- Server-rendered body content (so crawlers get text without executing JS) ---

const stripUnsafe = (html = "") =>
  String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");

const plainParagraphs = (text = "") =>
  String(text)
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => `<p>${escapeHtml(chunk)}</p>`)
    .join("\n");

const contentHtml = (content = "") => {
  const raw = String(content || "").trim();
  if (!raw) return "";
  return /<\/?(p|h[1-6]|ul|ol|li|blockquote|div|br)\b/i.test(raw)
    ? stripUnsafe(raw)
    : plainParagraphs(raw);
};

const formatPlDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const articleBody = ({ title, excerpt, content, publishedAt, author, section, sourceUrl, image }) =>
  [
    `<article>`,
    `<h1>${escapeHtml(title || "")}</h1>`,
    section ? `<p><strong>${escapeHtml(section)}</strong></p>` : "",
    publishedAt
      ? `<p><time datetime="${escapeHtml(publishedAt)}">${escapeHtml(formatPlDate(publishedAt))}</time>${author ? ` — ${escapeHtml(author)}` : ""}</p>`
      : "",
    image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title || "")}" width="1200" height="675" />` : "",
    excerpt ? `<p>${escapeHtml(excerpt)}</p>` : "",
    contentHtml(content),
    sourceUrl ? `<p><a href="${escapeHtml(sourceUrl)}" rel="nofollow noopener">Źródło</a></p>` : "",
    `</article>`,
  ]
    .filter(Boolean)
    .join("\n");

const listBody = (heading, intro, items) =>
  [
    `<h1>${escapeHtml(heading)}</h1>`,
    intro ? `<p>${escapeHtml(intro)}</p>` : "",
    items.length
      ? `<ul>\n${items
          .map(
            (item) =>
              `<li><a href="${escapeHtml(item.href)}"><h2>${escapeHtml(item.title)}</h2></a>${
                item.date ? `<time datetime="${escapeHtml(item.date)}">${escapeHtml(formatPlDate(item.date))}</time>` : ""
              }${item.excerpt ? `<p>${escapeHtml(item.excerpt)}</p>` : ""}</li>`,
          )
          .join("\n")}\n</ul>`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

const POST_LIST_SELECT = "slug,title,excerpt,published_at,channel";

const fetchSportList = async (extra = {}) => {
  const rows = await fetchRows("posts", {
    select: POST_LIST_SELECT,
    is_hidden: "eq.false",
    channel: "eq.sport",
    order: "published_at.desc",
    limit: "30",
    ...extra,
  });
  return (rows || []).map((post) => ({
    href: `${SITE_URL}/blink/${post.slug}`,
    title: post.title,
    excerpt: post.excerpt,
    date: post.published_at,
  }));
};


const replaceHead = (html, meta) => {
  let next = html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>/gi, "");

  [
    "description",
    "robots",
    "twitter:card",
    "twitter:title",
    "twitter:description",
    "twitter:image",
  ].forEach((name) => {
    next = next.replace(
      new RegExp(`<meta\\s+[^>]*name=["']${escapeRegex(name)}["'][^>]*>`, "gi"),
      "",
    );
  });

  [
    "og:title",
    "og:description",
    "og:url",
    "og:type",
    "og:image",
    "og:site_name",
    "og:locale",
    "article:published_time",
    "article:modified_time",
    "article:author",
    "article:section",
  ].forEach((property) => {
    next = next.replace(
      new RegExp(`<meta\\s+[^>]*property=["']${escapeRegex(property)}["'][^>]*>`, "gi"),
      "",
    );
  });

  next = next.replace(/<script\s+[^>]*data-server-seo[^>]*>[\s\S]*?<\/script>/gi, "");

  const title = fullTitle(meta.title);
  const tags = [];
  addTag(tags, `<title>${escapeHtml(title)}</title>`);
  addTag(tags, `<meta name="description" content="${escapeHtml(meta.description)}" />`);
  addTag(tags, `<meta name="robots" content="${escapeHtml(meta.robots)}" />`);
  addTag(tags, `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`);
  addTag(tags, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  addTag(tags, `<meta property="og:description" content="${escapeHtml(meta.description)}" />`);
  addTag(tags, `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`);
  addTag(tags, `<meta property="og:type" content="${escapeHtml(meta.ogType)}" />`);
  addTag(tags, `<meta property="og:image" content="${escapeHtml(meta.image || DEFAULT_IMAGE)}" />`);
  addTag(tags, `<meta property="og:site_name" content="${SITE_NAME}" />`);
  addTag(tags, `<meta property="og:locale" content="pl_PL" />`);
  addTag(tags, `<meta name="twitter:card" content="summary_large_image" />`);
  addTag(tags, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  addTag(tags, `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`);
  addTag(tags, `<meta name="twitter:image" content="${escapeHtml(meta.image || DEFAULT_IMAGE)}" />`);

  if (meta.articlePublishedTime) {
    addTag(tags, `<meta property="article:published_time" content="${escapeHtml(meta.articlePublishedTime)}" />`);
  }
  if (meta.articleModifiedTime) {
    addTag(tags, `<meta property="article:modified_time" content="${escapeHtml(meta.articleModifiedTime)}" />`);
  }
  if (meta.articleAuthor) {
    addTag(tags, `<meta property="article:author" content="${escapeHtml(meta.articleAuthor)}" />`);
  }
  if (meta.articleSection) {
    addTag(tags, `<meta property="article:section" content="${escapeHtml(meta.articleSection)}" />`);
  }
  if (meta.schema) {
    addTag(tags, `<script type="application/ld+json" data-server-seo>${jsonForHtml(meta.schema)}</script>`);
  }

  return next.replace("</head>", `  ${tags.join("\n    ")}\n  </head>`);
};

const postMeta = (post, path) => {
  const positiveCategory = post.positive_category;
  const sportCategory = post.sport_category;
  const author = post.author;
  const isPositive = post.channel === "positive" && positiveCategory?.slug;
  const canonical = isPositive
    ? `${SITE_URL}/pozytywne/${positiveCategory.slug}/${post.slug}`
    : `${SITE_URL}/blink/${post.slug}`;
  const section = isPositive ? positiveCategory?.name : sportCategory?.name;
  const authorName = author?.display_name || SITE_NAME;

  return {
    ...baseMeta(path),
    title: post.title,
    description: post.excerpt || DEFAULT_DESCRIPTION,
    canonical,
    ogType: "article",
    image: post.image_url || DEFAULT_IMAGE,
    articlePublishedTime: post.published_at,
    articleModifiedTime: post.updated_at,
    articleAuthor: authorName,
    articleSection: section,
    schema: {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      headline: post.title,
      description: post.excerpt,
      image: post.image_url ? { "@type": "ImageObject", url: post.image_url, width: 1200, height: 675 } : undefined,
      datePublished: post.published_at,
      dateModified: post.updated_at,
      author: author?.slug
        ? { "@type": "Person", name: authorName, url: `${SITE_URL}/autor/${author.slug}` }
        : { "@type": "Organization", name: SITE_NAME },
      publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: `${SITE_URL}/logo-seo.png` } },
      isBasedOn: post.source_url,
      articleSection: section,
      keywords: post.tags?.length ? post.tags : undefined,
      inLanguage: "pl-PL",
    },
    content: articleBody({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      publishedAt: post.published_at,
      author: authorName,
      section,
      sourceUrl: post.source_url,
      image: post.image_url,
    }),
  };
};


const resolveMeta = async (path) => {
  const meta = baseMeta(path);

  if (path === "/") {
    const items = await fetchSportList();
    return {
      ...meta,
      content: listBody("Szortsy — wiadomości sportowe krótko i na temat", DEFAULT_DESCRIPTION, items),
    };
  }

  if (path === "/archiwum") {
    return {
      ...meta,
      title: "Archiwum",
      description: "Archiwalne artykuły sportowe starsze niż 7 dni w serwisie Szortsy.",
      robots: NOINDEX,
    };
  }

  if (path === "/tech") {
    return {
      ...meta,
      title: "Tech — recenzje sprzętu i newsy technologiczne",
      description: "Krótkie, konkretne recenzje smartfonów, audio, gamingu, smart home i AI. Bez lania wody.",
    };
  }

  if (path === "/pozytywne") {
    return {
      ...meta,
      title: "Pozytywne wiadomości",
      description: "Dobre wiadomości z kraju i ze świata — krótko, jasno i bez doomscrollingu.",
    };
  }

  if (path === "/mistrzostwa-swiata-2026") {
    return {
      ...meta,
      title: "Mistrzostwa Świata 2026",
      description: "Hub Mistrzostw Świata 2026: mecze, drabinka pucharowa, statystyki i najważniejsze newsy.",
    };
  }

  if (path === "/autorzy") {
    return {
      ...meta,
      title: "Autorzy",
      description: "Poznaj autorów i redakcję serwisu Szortsy.",
    };
  }

  if (path === "/tagi") {
    return { ...meta, title: "Tagi", description: "Lista tagów w serwisie Szortsy.", robots: NOINDEX };
  }

  if (path === "/pozytywne/archiwum") {
    return {
      ...meta,
      title: "Archiwum Pozytywnych",
      description: "Archiwum pozytywnych wiadomości w serwisie Szortsy.",
      robots: NOINDEX,
    };
  }

  if (path.startsWith("/dzien/") || path.startsWith("/podsumowanie/")) {
    return { ...meta, title: "Podsumowanie dnia", robots: NOINDEX };
  }

  const blink = path.match(/^\/blink\/([^/]+)$/);
  if (blink) {
    const slug = decodeURIComponent(blink[1]);
    const redirect = await fetchOne("post_redirects", {
      select: "to_slug",
      from_slug: `eq.${slug}`,
    });
    if (redirect?.to_slug) return { redirectTo: `/blink/${redirect.to_slug}` };

    const post = await fetchOne("posts", {
      select:
        "slug,title,excerpt,content,image_url,source_url,tags,channel,published_at,updated_at,sport_category:sport_categories!fk_posts_category(slug,name),positive_category:positive_categories!posts_positive_category_id_fkey(slug,name),author:authors(display_name,slug)",
      slug: `eq.${slug}`,
      is_hidden: "eq.false",
    });
    if (post === undefined) return meta;
    return post ? postMeta(post, path) : { ...meta, title: "Artykuł nie znaleziony", robots: NOINDEX };
  }

  const positive = path.match(/^\/pozytywne\/([^/]+)\/([^/]+)$/);
  if (positive) {
    const slug = decodeURIComponent(positive[2]);
    const post = await fetchOne("posts", {
      select:
        "slug,title,excerpt,content,image_url,source_url,tags,channel,published_at,updated_at,sport_category:sport_categories!fk_posts_category(slug,name),positive_category:positive_categories!posts_positive_category_id_fkey(slug,name),author:authors(display_name,slug)",
      slug: `eq.${slug}`,
      channel: "eq.positive",
      is_hidden: "eq.false",
    });
    if (post === undefined) return meta;
    return post ? postMeta(post, path) : { ...meta, title: "Artykuł nie znaleziony", robots: NOINDEX };
  }

  const positiveCategory = path.match(/^\/pozytywne\/kategoria\/([^/]+)$/);
  if (positiveCategory) {
    const slug = decodeURIComponent(positiveCategory[1]);
    const row = await fetchOne("positive_categories", { select: "slug,name,description", slug: `eq.${slug}` });
    if (row === undefined) return meta;
    if (!row) return { ...meta, title: "Kategoria nie znaleziona", robots: NOINDEX };
    return {
      ...meta,
      title: `${row.name} - Pozytywne`,
      description: row.description || `Pozytywne wiadomości z kategorii ${row.name} na Szortsy.`,
    };
  }

  const techCategory = path.match(/^\/tech\/kategoria\/([^/]+)$/);
  if (techCategory) {
    const slug = decodeURIComponent(techCategory[1]);
    const row = await fetchOne("review_categories", { select: "slug,name,description", slug: `eq.${slug}` });
    if (row === undefined) return meta;
    if (!row) return { ...meta, title: "Kategoria Tech nie znaleziona", robots: NOINDEX };
    return {
      ...meta,
      title: `${row.name} - Tech`,
      description: row.description || `Recenzje i newsy Tech z kategorii ${row.name} na Szortsy.`,
    };
  }

  const techArticle = path.match(/^\/tech\/([^/]+)\/([^/]+)$/);
  if (techArticle) {
    const slug = decodeURIComponent(techArticle[2]);
    const review = await fetchOne("reviews", {
      select: "slug,title,excerpt,content,verdict,cover_image_url,published_at,updated_at,category:review_categories(slug,name)",
      slug: `eq.${slug}`,
      status: "eq.published",
    });
    if (review === undefined) return meta;
    if (!review) return { ...meta, title: "Wpis Tech nie znaleziony", robots: NOINDEX };
    const canonical = `${SITE_URL}/tech/${review.category?.slug || techArticle[1]}/${review.slug}`;
    return {
      ...meta,
      title: review.title,
      description: review.excerpt || review.verdict || "Recenzja na Szortsy Tech.",
      canonical,
      ogType: "article",
      image: review.cover_image_url || DEFAULT_IMAGE,
      articlePublishedTime: review.published_at,
      articleModifiedTime: review.updated_at,
      articleSection: review.category?.name,
      schema: {
        "@context": "https://schema.org",
        "@type": "Article",
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
        headline: review.title,
        description: review.excerpt || review.verdict,
        image: review.cover_image_url,
        datePublished: review.published_at,
        dateModified: review.updated_at,
        publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: `${SITE_URL}/logo-seo.png` } },
        articleSection: review.category?.name,
        inLanguage: "pl-PL",
      },
      content: articleBody({
        title: review.title,
        excerpt: review.excerpt || review.verdict,
        content: review.content,
        publishedAt: review.published_at,
        section: review.category?.name,
        image: review.cover_image_url,
      }),
    };
  }

  const tag = path.match(/^\/tag\/([^/]+)$/);
  if (tag) {
    const slug = decodeURIComponent(tag[1]);
    const row = await fetchOne("tags", {
      select: "slug,name,description,post_count,force_index",
      slug: `eq.${slug}`,
    });
    if (row === undefined) return meta;
    if (!row) return { ...meta, title: "Tag nie znaleziony", robots: NOINDEX };
    const shouldNoindex = !row.force_index && Number(row.post_count || 0) < 4;
    return {
      ...meta,
      title: row.name,
      description: row.description || `Wiadomości sportowe związane z ${row.name} na Szortsy.`,
      robots: shouldNoindex ? NOINDEX : "index, follow",
    };
  }

  const sportCategory = path.match(/^\/kategoria\/([^/]+)$/);
  if (sportCategory) {
    const slug = decodeURIComponent(sportCategory[1]);
    if (slug === "wspo-praca-reklamowa") return { ...meta, title: "Współpraca reklamowa", robots: NOINDEX };
    const row = await fetchOne("sport_categories", { select: "id,slug,name,description", slug: `eq.${slug}` });
    if (row === undefined) return meta;
    if (row) {
      const items = row.id ? await fetchSportList({ category_id: `eq.${row.id}` }) : [];
      const description = row.description || `Najnowsze wiadomości sportowe z kategorii ${row.name}.`;
      return {
        ...meta,
        title: `${row.name} - Wiadomości`,
        description,
        content: listBody(`${row.name} — wiadomości`, description, items),
      };
    }
    return { ...meta, title: "Kategoria nie znaleziona", robots: NOINDEX };
  }

  const author = path.match(/^\/autor\/([^/]+)$/);
  if (author) {
    const slug = decodeURIComponent(author[1]);
    const row = await fetchOne("authors_public", {
      select: "slug,display_name,bio,role_title,avatar_url",
      slug: `eq.${slug}`,
    });
    if (row === undefined) return meta;
    if (!row) return { ...meta, title: "Autor nie znaleziony", robots: NOINDEX };
    return {
      ...meta,
      title: row.display_name,
      description: row.bio || `${row.display_name} — autor w serwisie Szortsy.`,
      image: row.avatar_url || DEFAULT_IMAGE,
      schema: {
        "@context": "https://schema.org",
        "@type": "Person",
        name: row.display_name,
        description: row.bio || row.role_title,
        image: row.avatar_url,
        url: `${SITE_URL}/autor/${row.slug}`,
        worksFor: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      },
    };
  }

  return meta;
};

export default async function handler(request) {
  const url = new URL(request.url);
  const path = url.searchParams.get("path") || url.pathname || "/";
  const cleanPath = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  const meta = await resolveMeta(cleanPath);

  if (meta.redirectTo) {
    return Response.redirect(new URL(meta.redirectTo, SITE_URL), 301);
  }

  const indexResponse = await fetch(new URL("/index.html", request.url), {
    headers: { Accept: "text/html" },
  });
  const html = await indexResponse.text();
  let body = replaceHead(html, meta);

  if (meta.content) {
    body = body.replace(
      '<div id="root"></div>',
      `<div id="root"><div id="ssr-content">\n${meta.content}\n</div></div>`,
    );
  }

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
    },
  });
}