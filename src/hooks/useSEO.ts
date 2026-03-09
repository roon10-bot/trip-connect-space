import { useEffect } from "react";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface UseSEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
  breadcrumbs?: BreadcrumbItem[];
}

const setOrCreateMeta = (attr: string, key: string, content: string) => {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (el) {
    el.setAttribute("content", content);
  } else {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    el.setAttribute("content", content);
    document.head.appendChild(el);
  }
};

export const useSEO = ({ title, description, canonical, ogImage, noindex, breadcrumbs }: UseSEOProps) => {
  useEffect(() => {
    // Title
    document.title = title;

    // Meta description
    setOrCreateMeta("name", "description", description);

    // Robots
    if (noindex) {
      setOrCreateMeta("name", "robots", "noindex, nofollow");
    }

    // Canonical
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (link) {
        link.href = canonical;
      } else {
        link = document.createElement("link");
        link.rel = "canonical";
        link.href = canonical;
        document.head.appendChild(link);
      }
    }

    // Open Graph
    setOrCreateMeta("property", "og:title", title);
    setOrCreateMeta("property", "og:description", description);
    if (canonical) setOrCreateMeta("property", "og:url", canonical);
    if (ogImage) setOrCreateMeta("property", "og:image", ogImage);

    // Twitter
    setOrCreateMeta("name", "twitter:title", title);
    setOrCreateMeta("name", "twitter:description", description);
    if (ogImage) setOrCreateMeta("name", "twitter:image", ogImage);

    // BreadcrumbList JSON-LD — remove any existing before adding new
    document.querySelectorAll('script[data-seo="breadcrumb"]').forEach(el => el.remove());

    let breadcrumbScript: HTMLScriptElement | null = null;
    if (breadcrumbs && breadcrumbs.length > 0) {
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": item.name,
          "item": item.url,
        })),
      };
      breadcrumbScript = document.createElement("script");
      breadcrumbScript.type = "application/ld+json";
      breadcrumbScript.setAttribute("data-seo", "breadcrumb");
      breadcrumbScript.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(breadcrumbScript);
    }

    return () => {
      document.querySelectorAll('script[data-seo="breadcrumb"]').forEach(el => el.remove());
    };
  }, [title, description, canonical, ogImage, noindex, breadcrumbs]);
};
