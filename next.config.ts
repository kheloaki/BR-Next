import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Parent Desktop folder has its own package-lock.json; pin Turbopack root to this app.
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
