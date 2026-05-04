/**
 * Applies RLS policies and creates the avatars Storage bucket for a Supabase project.
 *
 * Usage:
 *   DIRECT_URL=<url> SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/setup-supabase.mjs
 */

import { PrismaClient } from "@prisma/client";

const directUrl = process.env.DIRECT_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!directUrl || !supabaseUrl || !serviceRoleKey) {
  console.error("Missing required environment variables: DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const prisma = new PrismaClient({ datasourceUrl: directUrl });

const rlsStatements = [
  // Enable RLS
  `ALTER TABLE "UserProfile" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "PeriodLog" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "PrivacySettings" ENABLE ROW LEVEL SECURITY`,

  // Drop policies if they exist (idempotent re-run)
  `DROP POLICY IF EXISTS "own_profile_select" ON "UserProfile"`,
  `DROP POLICY IF EXISTS "own_profile_update" ON "UserProfile"`,
  `DROP POLICY IF EXISTS "own_profile_insert" ON "UserProfile"`,
  `DROP POLICY IF EXISTS "own_log_select" ON "PeriodLog"`,
  `DROP POLICY IF EXISTS "own_log_insert" ON "PeriodLog"`,
  `DROP POLICY IF EXISTS "own_log_update" ON "PeriodLog"`,
  `DROP POLICY IF EXISTS "own_log_delete" ON "PeriodLog"`,
  `DROP POLICY IF EXISTS "own_privacy_select" ON "PrivacySettings"`,
  `DROP POLICY IF EXISTS "own_privacy_update" ON "PrivacySettings"`,
  `DROP POLICY IF EXISTS "own_privacy_insert" ON "PrivacySettings"`,

  // UserProfile policies
  `CREATE POLICY "own_profile_select" ON "UserProfile" FOR SELECT USING (auth.uid() = "userId")`,
  `CREATE POLICY "own_profile_insert" ON "UserProfile" FOR INSERT WITH CHECK (auth.uid() = "userId")`,
  `CREATE POLICY "own_profile_update" ON "UserProfile" FOR UPDATE USING (auth.uid() = "userId")`,
  `CREATE POLICY "own_profile_delete" ON "UserProfile" FOR DELETE USING (auth.uid() = "userId")`,

  // PeriodLog policies
  `CREATE POLICY "own_log_select" ON "PeriodLog" FOR SELECT USING (auth.uid() = "userId")`,
  `CREATE POLICY "own_log_insert" ON "PeriodLog" FOR INSERT WITH CHECK (auth.uid() = "userId")`,
  `CREATE POLICY "own_log_update" ON "PeriodLog" FOR UPDATE USING (auth.uid() = "userId")`,
  `CREATE POLICY "own_log_delete" ON "PeriodLog" FOR DELETE USING (auth.uid() = "userId")`,

  // PrivacySettings policies
  `CREATE POLICY "own_privacy_select" ON "PrivacySettings" FOR SELECT USING (auth.uid() = "userId")`,
  `CREATE POLICY "own_privacy_insert" ON "PrivacySettings" FOR INSERT WITH CHECK (auth.uid() = "userId")`,
  `CREATE POLICY "own_privacy_update" ON "PrivacySettings" FOR UPDATE USING (auth.uid() = "userId")`,
  `CREATE POLICY "own_privacy_delete" ON "PrivacySettings" FOR DELETE USING (auth.uid() = "userId")`,
];

async function applyRLS() {
  console.log("Applying RLS policies...");
  for (const sql of rlsStatements) {
    await prisma.$executeRawUnsafe(sql);
    console.log(`  ✓ ${sql.slice(0, 60)}...`);
  }
  console.log("RLS policies applied.\n");
}

async function createAvatarsBucket() {
  console.log("Creating avatars Storage bucket...");
  const res = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
    },
    body: JSON.stringify({
      id: "avatars",
      name: "avatars",
      public: false,
      file_size_limit: 5242880, // 5 MB
      allowed_mime_types: ["image/jpeg", "image/png", "image/webp"],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    if (data?.error === "Duplicate" || data?.message?.includes("already exists")) {
      console.log("  ✓ avatars bucket already exists — skipping.\n");
    } else {
      throw new Error(`Storage API error: ${JSON.stringify(data)}`);
    }
  } else {
    console.log("  ✓ avatars bucket created.\n");
  }

  // Set storage RLS policies via SQL
  const storagePolicies = [
    `DROP POLICY IF EXISTS "avatars_select" ON storage.objects`,
    `DROP POLICY IF EXISTS "avatars_insert" ON storage.objects`,
    `DROP POLICY IF EXISTS "avatars_update" ON storage.objects`,
    `DROP POLICY IF EXISTS "avatars_delete" ON storage.objects`,
    `CREATE POLICY "avatars_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])`,
    `CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])`,
    `CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])`,
    `CREATE POLICY "avatars_delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])`,
  ];

  console.log("Applying Storage RLS policies...");
  for (const sql of storagePolicies) {
    await prisma.$executeRawUnsafe(sql);
    console.log(`  ✓ ${sql.slice(0, 60)}...`);
  }
  console.log("Storage policies applied.\n");
}

try {
  await applyRLS();
  await createAvatarsBucket();
  console.log("✅  All done.");
} catch (err) {
  console.error("❌  Error:", err.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
