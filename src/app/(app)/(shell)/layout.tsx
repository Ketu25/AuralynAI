import { loadAppUser } from "@/lib/user-data";
import { redirect } from "next/navigation";

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await loadAppUser();
  if (!profile.onboardingCompleted) redirect("/onboarding");
  return children;
}
