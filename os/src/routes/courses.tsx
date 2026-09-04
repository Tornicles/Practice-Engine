import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/courses")({
  beforeLoad: () => {
    throw redirect({ to: "/content", search: { tab: "courses" } });
  },
  component: () => null,
});
