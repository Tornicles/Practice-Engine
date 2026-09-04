import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/passport")({
  beforeLoad: () => {
    throw redirect({ to: "/settings", search: { tab: "profile" } });
  },
  component: () => null,
});
