import { useEffect } from 'react';

export const VisitorTracker = () => {
  useEffect(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastVisitDate = localStorage.getItem('last_site_visit_date');

      if (lastVisitDate !== today) {
        localStorage.setItem('last_site_visit_date', today);
        const currentVisits = parseInt(localStorage.getItem('site_local_visits') || '0', 10);
        localStorage.setItem('site_local_visits', (currentVisits + 1).toString());
      }
    } catch {
      // Ignore storage restrictions
    }
  }, []);

  return null;
};
