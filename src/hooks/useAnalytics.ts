import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });

      if (import.meta.env.DEV) {
        console.log('[GA4] page_view:', location.pathname);
      }
    } else if (import.meta.env.DEV) {
      console.warn('[GA4] gtag not loaded');
    }
  }, [location]);
};
