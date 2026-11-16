import type { NextConfig } from "next";

// Pull Supabase hostname from the existing env var — never hard-code the project URL.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
let supabaseHostname = "";
try {
  if (supabaseUrl && !supabaseUrl.includes("placeholder")) {
    supabaseHostname = new URL(supabaseUrl).hostname;
  }
} catch {
  // Invalid URL — leave hostname empty so we don't crash at build time.
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Allow Supabase Storage images (course covers, avatars, portfolio images, etc.)
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
