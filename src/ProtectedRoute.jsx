import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from './utils/supabase';
import FullScreenLoader from './components/FullScreenLoader';

function ProtectedRoute({ children, adminOnly = false }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAccess(currentSession) {
      if (!mounted) return;

      setSession(currentSession);

      if (!currentSession) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      if (adminOnly) {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentSession.user.id)
          .maybeSingle();

        if (!mounted) return;

        setIsAdmin(!error && data?.role === 'admin');
      }

      setLoading(false);
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        checkAccess(null);
      } else {
        checkAccess(data.session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      checkAccess(newSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [adminOnly]);

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;