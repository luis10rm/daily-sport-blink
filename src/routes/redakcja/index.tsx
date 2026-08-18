import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/redakcja/")({
  beforeLoad: () => {
    throw redirect({ to: "/autorzy", replace: true });
  },
});
