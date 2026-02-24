import { useEffect, useRef } from "react";

const InstagramFeed = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy-load the Elfsight platform script when near viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          if (document.getElementById("ElfsightPlatformScript")) return;
          const js = document.createElement("script");
          js.id = "ElfsightPlatformScript";
          js.src = "https://static.elfsight.com/platform/platform.js";
          js.async = true;
          document.head.appendChild(js);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-16 md:py-24 bg-background" ref={containerRef}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground text-center mb-10">
          Följ oss på Instagram
        </h2>
        <div
          className="elfsight-app-e5874453-4a6b-44e0-a5d1-4640c4ab5420"
          data-elfsight-app-lazy
        />
      </div>
    </section>
  );
};

export default InstagramFeed;
