import { AppChrome } from "@/components/app-chrome";
import { loadAppUser } from "@/lib/user-data";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await loadAppUser();
  return <AppChrome username={profile.displayName}>{children}</AppChrome>;
}
