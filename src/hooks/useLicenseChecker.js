import { useEffect, useRef } from 'react';
import { checkLicense } from '../services/api';

const CHECK_INTERVAL = 5 * 60 * 1000;

export default function useLicenseChecker() {
  const intervalRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const institutionId = localStorage.getItem('institutionId');
    if (!token || !institutionId) return;

    const verify = async () => {
      try {
        const res = await checkLicense(institutionId);
        const data = res.data;
        if (!data.status || data.is_expired === true) {
          localStorage.clear();
          window.location.replace('/login');
        }
      } catch {
        // network error — ignore, retry next interval
      }
    }; 

    verify();
    intervalRef.current = setInterval(verify, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}
