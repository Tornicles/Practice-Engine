import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/practice")({
  beforeLoad: () => {
    throw redirect({ to: "/development", search: { tab: "practice" } });
  },
  component: () => null,
});
