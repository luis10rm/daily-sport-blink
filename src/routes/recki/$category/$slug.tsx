import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/recki/$category/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/tech/$category/$slug",
      params: { category: params.category, slug: params.slug },
      replace: true,
    });
  },
});
