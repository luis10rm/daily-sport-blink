import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/recki/kategoria/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/tech/kategoria/$slug", params: { slug: params.slug }, replace: true });
  },
});
