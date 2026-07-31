"use client";

import { useState, useCallback } from "react";

interface OnboardingStatus {
  isFirstTime: boolean;
  loading: boolean;
  error: boolean;
}

export function useOnboardingCheck() {
  const [status, setStatus] = useState<OnboardingStatus>({
    isFirstTime: false,
    loading: false,
    error: false,
  });

  const check = useCallback(async (email?: string | null) => {
    if (!email) {
      setStatus({ isFirstTime: true, loading: false, error: false });
      return true;
    }

    setStatus({ isFirstTime: false, loading: true, error: false });
    try {
      const res = await fetch(`/api/user/status?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      const firstTime = data.isFirstTime !== false;
      setStatus({ isFirstTime: firstTime, loading: false, error: false });
      return firstTime;
    } catch {
      setStatus({ isFirstTime: false, loading: false, error: true });
      return false;
    }
  }, []);

  return { ...status, check };
}