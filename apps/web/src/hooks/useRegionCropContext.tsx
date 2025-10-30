/**
 * useRegionCropContext Hook
 * Manages region and crop selection context with localStorage persistence
 * TDD §4: Custom hooks for shared logic
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { RegionCropContext } from 'shared';

interface RegionCropContextValue extends RegionCropContext {
  setRegion: (region: RegionCropContext['region']) => void;
  setCrop: (crop: RegionCropContext['crop']) => void;
  setSeason: (season: RegionCropContext['season']) => void;
  clearContext: () => void;
}

const RegionCropContextContext = createContext<
  RegionCropContextValue | undefined
>(undefined);

const STORAGE_KEY = 'cropsense-region-crop-context';

/**
 * Provider component for region/crop context
 */
export function RegionCropContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [context, setContext] = useState<RegionCropContext>(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return {};
        }
      }
    }
    return {};
  });

  // Persist to localStorage when context changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    }
  }, [context]);

  const setRegion = (region: RegionCropContext['region']) => {
    setContext((prev) => ({ ...prev, region }));
  };

  const setCrop = (crop: RegionCropContext['crop']) => {
    setContext((prev) => ({ ...prev, crop }));
  };

  const setSeason = (season: RegionCropContext['season']) => {
    setContext((prev) => ({ ...prev, season }));
  };

  const clearContext = () => {
    setContext({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const value: RegionCropContextValue = {
    ...context,
    setRegion,
    setCrop,
    setSeason,
    clearContext,
  };

  return (
    <RegionCropContextContext.Provider value={value}>
      {children}
    </RegionCropContextContext.Provider>
  );
}

/**
 * Hook to access region/crop context
 * @throws Error if used outside RegionCropContextProvider
 */
export function useRegionCropContext() {
  const context = useContext(RegionCropContextContext);
  if (!context) {
    throw new Error(
      'useRegionCropContext must be used within RegionCropContextProvider'
    );
  }
  return context;
}

