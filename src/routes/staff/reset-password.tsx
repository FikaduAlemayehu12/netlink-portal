import { createFileRoute } from "@tanstack/react-router";
import ResetPassword from "@/pages/staff/ResetPassword";

export const Route = createFileRoute("/staff/reset-password")({
  component: ResetPassword,
});
