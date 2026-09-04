import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/methodology")({
  beforeLoad: () => {
    throw redirect({ to: "/development", search: { tab: "methodology" } });
  },
  component: () => null,
});
