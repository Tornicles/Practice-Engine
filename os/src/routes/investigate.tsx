import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/investigate")({
  beforeLoad: () => {
    throw redirect({ to: "/development", search: { tab: "improve" } });
  },
  component: () => null,
});
