import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface SearchResultsViewportProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  desktopScrollable?: boolean;
  ariaLabel?: string;
}

export const SearchResultsViewport = ({
  children,
  className,
  contentClassName,
  desktopScrollable = false,
  ariaLabel = "Search results",
}: SearchResultsViewportProps) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(desktopScrollable);

  const updateScrollIndicators = useCallback(() => {
    const viewport = viewportRef.current;

    if (!viewport || !desktopScrollable) {
      setShowTopFade(false);
      setShowBottomFade(false);
      return;
    }

    const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;

    setShowTopFade(viewport.scrollTop > 8);
    setShowBottomFade(maxScrollTop - viewport.scrollTop > 8);
  }, [desktopScrollable]);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport || !desktopScrollable) {
      return;
    }

    const handleResize = () => updateScrollIndicators();

    viewport.addEventListener("scroll", updateScrollIndicators, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      viewport.removeEventListener("scroll", updateScrollIndicators);
      window.removeEventListener("resize", handleResize);
    };
  }, [desktopScrollable, updateScrollIndicators]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateScrollIndicators);

    return () => window.cancelAnimationFrame(frame);
  }, [children, updateScrollIndicators]);

  const scrollByAmount = useCallback((top: number) => {
    viewportRef.current?.scrollBy({ top, behavior: "smooth" });
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;

    if (!desktopScrollable || !viewport) {
      return;
    }

    const pageDistance = Math.max(viewport.clientHeight * 0.85, 240);

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        scrollByAmount(80);
        break;
      case "ArrowUp":
        event.preventDefault();
        scrollByAmount(-80);
        break;
      case "PageDown":
        event.preventDefault();
        scrollByAmount(pageDistance);
        break;
      case "PageUp":
        event.preventDefault();
        scrollByAmount(-pageDistance);
        break;
      case "Home":
        event.preventDefault();
        viewport.scrollTo({ top: 0, behavior: "smooth" });
        break;
      case "End":
        event.preventDefault();
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
        break;
      case " ":
        event.preventDefault();
        scrollByAmount(event.shiftKey ? -pageDistance : pageDistance);
        break;
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-border/80 bg-card/85 shadow-elegant supports-[backdrop-filter]:backdrop-blur-sm",
        className,
      )}
    >
      {desktopScrollable && (
        <>
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 z-10 hidden h-12 bg-gradient-to-b from-card via-card/95 to-transparent transition-opacity duration-200 lg:block",
              showTopFade ? "opacity-100" : "opacity-0",
            )}
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden h-16 bg-gradient-to-t from-card via-card/95 to-transparent transition-opacity duration-200 lg:block",
              showBottomFade ? "opacity-100" : "opacity-0",
            )}
          />
        </>
      )}

      <div
        ref={viewportRef}
        tabIndex={desktopScrollable ? 0 : undefined}
        role={desktopScrollable ? "region" : undefined}
        aria-label={desktopScrollable ? ariaLabel : undefined}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative min-w-0 px-4 py-4",
          desktopScrollable
            ? "search-results-scrollbar lg:max-h-[calc(100dvh-21rem)] lg:overflow-y-scroll lg:pr-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            : "overflow-visible",
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
};