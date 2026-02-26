import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/onboarding", "/api/", "/checkin/", "/doc/", "/d/"],
      },
    ],
    sitemap: "https://aircheck.com.br/sitemap.xml",
  };
}
