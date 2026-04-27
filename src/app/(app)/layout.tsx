import { AppChrome } from "@/components/app-chrome";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/user-data";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    select: { displayName: true },
  });
  return <AppChrome username={profile?.displayName}>{children}</AppChrome>;
}
