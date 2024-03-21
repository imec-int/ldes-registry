import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "LDES Registry",
  description: "Registry of known LDESs",
  base: "/ldes-registry/",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Dashboard", link: "/dashboard" },
      { text: "About", link: "/about" },
    ],

    sidebar: [],

    socialLinks: [
      { icon: "github", link: "https://github.com/imec-int/ldes-registry" },
    ],

    lastUpdated: true,
  },
});
