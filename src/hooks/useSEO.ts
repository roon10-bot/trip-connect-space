import { useEffect } from "react";

interface UseSEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
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

export const useSEO = ({ title, description, canonical, ogImage, noindex }: UseSEOProps) => {
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
  }, [title, description, canonical, ogImage, noindex]);
};
