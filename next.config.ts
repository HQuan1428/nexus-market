import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // AGENTS.md is hand-authored governance content (see workflow.md); don't
  // let `next dev` auto-rewrite it.
  agentRules: false,
};

export default nextConfig;
