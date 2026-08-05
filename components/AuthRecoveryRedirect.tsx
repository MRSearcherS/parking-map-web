'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthRecoveryRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function goToResetPassword() {
      if (window.location.pathname !== '/reset-password') {
        router.replace('/reset-password');
      }
    }

    if (window.location.hash.includes('type=recovery')) {
      sessionStorage.setItem('passwordRecoveryInProgress', 'true');
      goToResetPassword();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        sessionStorage.setItem('passwordRecoveryInProgress', 'true');
        goToResetPassword();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  return null;
}
