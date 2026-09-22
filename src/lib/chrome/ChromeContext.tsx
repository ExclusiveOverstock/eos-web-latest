"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Lets a page tell the site chrome to get out of the way.
 *
 * The brief asks for navigation to become more subtle over immersive
 * sections, and the naive way to do that is for Header to check the
 * pathname. That breaks immediately: the homepage is immersive at the top
 * and an ordinary page 200px further down, and a route list has to be
 * maintained forever as experiences are added.
 *
 * So immersion is declared by whatever is actually on screen. A section
 * renders <ImmersiveChrome /> while it owns the viewport, the header reads
 * the flag, and no component needs to know which routes exist.
 */

type ChromeContextValue = {
  immersive: boolean;
  setImmersive: (value: boolean) => void;
};

const ChromeContext = createContext<ChromeContextValue>({
  immersive: false,
  setImmersive: () => {},
});

export function ChromeProvider({ children }: { children: ReactNode }) {
  // A count rather than a boolean: two immersive sections can briefly
  // overlap during a route transition, and the outgoing one's cleanup would
  // otherwise switch the chrome back on over the incoming one.
  const [depth, setDepth] = useState(0);

  const setImmersive = useCallback((value: boolean) => {
    setDepth((d) => Math.max(0, d + (value ? 1 : -1)));
  }, []);

  const value = useMemo(
    () => ({ immersive: depth > 0, setImmersive }),
    [depth, setImmersive],
  );

  return <ChromeContext.Provider value={value}>{children}</ChromeContext.Provider>;
}

export function useChrome() {
  return useContext(ChromeContext);
}

/** Render inside a section that should quieten the header. */
export function ImmersiveChrome() {
  const { setImmersive } = useChrome();

  useEffect(() => {
    setImmersive(true);
    return () => setImmersive(false);
  }, [setImmersive]);

  return null;
}
