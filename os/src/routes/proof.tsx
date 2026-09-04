import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/proof")({
  beforeLoad: () => {
    throw redirect({ to: "/content", search: { tab: "brand" } });
  },
  component: () => null,
});
