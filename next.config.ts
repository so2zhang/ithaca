import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API routes read prompts/*.md at runtime; tell Vercel to ship them with the functions.
  outputFileTracingIncludes: { "/api/**": ["./prompts/**"] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
