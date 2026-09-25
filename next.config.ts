import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * Shopify's CDN, and nothing else.
     *
     * next/image refuses remote sources that are not listed here, which is
     * the point — it is an open image-resizing proxy otherwise. Product
     * photography is the only remote imagery the site loads; the 3D assets
     * are served from /public and the tone plates are CSS.
     *
     * `cdn.shopify.com` covers both a real store and the mock storefront the
     * Shopify path is developed against.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
