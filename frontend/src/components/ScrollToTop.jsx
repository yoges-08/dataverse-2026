import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Ensures every route navigation starts scrolled to the top, even when the
// user was at the bottom of a long page (browser back/forward + link clicks).
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}