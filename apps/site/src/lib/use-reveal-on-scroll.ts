import { useEffect, useRef, useState } from "react";

type RevealOptions = {
  threshold?: number;
  rootMargin?: string;
};

export function useRevealOnScroll<T extends HTMLElement>(options: RevealOptions = {}) {
  // Threshold 0: tall sections (e.g. the user guide) never reach 15% of their height in view.
  const { threshold = 0, rootMargin = "0px 0px -8% 0px" } = options;
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      setIsVisible(true);
      observer.disconnect();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          reveal();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);

    requestAnimationFrame(() => {
      const rect = node.getBoundingClientRect();
      const viewHeight = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < viewHeight && rect.bottom > 0) {
        reveal();
      }
    });

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, isVisible };
}
