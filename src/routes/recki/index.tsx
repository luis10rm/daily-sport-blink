import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/recki/")({
  beforeLoad: () => {
    throw redirect({ to: "/tech", replace: true });
  },
});
