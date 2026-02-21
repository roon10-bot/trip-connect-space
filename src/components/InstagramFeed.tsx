import { useEffect, useRef } from "react";

const InstagramFeed = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Only load the EmbedSocial script when the section is near the viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          if (document.getElementById("EmbedSocialHashtagScript")) return;
          const js = document.createElement("script");
          js.id = "EmbedSocialHashtagScript";
          js.src = "https://embedsocial.com/cdn/ht.js";
          document.head.appendChild(js);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-16 md:py-24" ref={containerRef}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground text-center mb-10">
          Följ oss på Instagram
        </h2>
        <div
          className="embedsocial-hashtag"
          data-ref="e5e7c82ada53c8a161907e90ef1ac8763ff75b78"
        />
      </div>
    </section>
  );
};

export default InstagramFeed;
