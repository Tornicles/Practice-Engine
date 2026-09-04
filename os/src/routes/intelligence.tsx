import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/intelligence")({
  beforeLoad: () => {
    throw redirect({ to: "/content", search: { tab: "intelligence" } });
  },
  component: () => null,
});
