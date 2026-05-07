import { createFileRoute } from "@tanstack/react-router";
import SettingsPage from "@/pages/staff/SettingsPage";

export const Route = createFileRoute("/staff/settings")({
  component: SettingsPage,
});
