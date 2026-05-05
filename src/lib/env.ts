import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
});

function validateEnv() {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => `  - ${String(issue.path[0])}`)
      .join("\n");
    throw new Error(
      `Missing required environment variables:\n${missing}\n\n` +
        `Add them in Vercel: Project → Settings → Environment Variables`,
    );
  }
  return result.data;
}

export const env = validateEnv();
