import type { MetadataRoute } from "next";

import { getSiteUrl } from "../lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/site-guide", "/privacy", "/legal", "/contact", "/login"],
        disallow: [
          "/dashboard",
          "/account",
          "/api/",
          "/auth/",
          "/demo-site",
          "/setup",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
