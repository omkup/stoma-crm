import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

const ROLE_TIMEOUT_MS = 5000;

const Index = () => {
  const { user, role, authLoading, profileLoading, lastError, retryProfile, profileRowFound } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [authTimedOut, setAuthTimedOut] = useState(false);
  const [roleTimedOut, setRoleTimedOut] = useState(false);
  const showDebug = searchParams.get('debug') === '1';

  // Auth timeout
  useEffect(() => {
    if (!authLoading) { setAuthTimedOut(false); return; }
    const t = setTimeout(() => setAuthTimedOut(true), 6000);
    return () => clearTimeout(t);
  }, [authLoading]);

  // Role timeout — starts when profile loading begins
  useEffect(() => {
    if (!profileLoading) { setRoleTimedOut(false); return; }
    const t = setTimeout(() => setRoleTimedOut(true), ROLE_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [profileLoading]);

  // Routing — never send authenticated users to /login
  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    if (profileLoading) return;
    if (role) {
      const routes: Record<string, string> = { admin: '/admin', reception: '/reception', doctor: '/doctor' };
      navigate(routes[role] || '/login', { replace: true });
    }
    // If authenticated but no role — stay on this page, show "no role" UI (don't redirect to /login)
  }, [user, role, authLoading, profileLoading, navigate]);

  // --- Render ---
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        {authTimedOut ? (
          <div className="text-center space-y-3">
            <p className="text-destructive font-medium">Sessiyani tekshirish cho'zildi. Qayta kirib ko'ring.</p>
            <Button onClick={() => navigate('/login', { replace: true })}>Login sahifasiga</Button>
          </div>
        ) : (
          <div className="animate-pulse text-muted-foreground">Sessiya tekshirilmoqda...</div>
        )}
        {showDebug && <DebugPanel />}
      </div>
    );
  }

  if (!user) return null; // will redirect to /login

  if (profileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        {roleTimedOut ? (
          <div className="text-center space-y-3">
            <p className="text-destructive font-medium">Profil yuklanishi cho'zildi.</p>
            <Button onClick={retryProfile}>Qayta urinish</Button>
            {lastError && <p className="text-xs text-destructive">{lastError}</p>}
          </div>
        ) : (
          <div className="animate-pulse text-muted-foreground">Profil yuklanmoqda...</div>
        )}
        {showDebug && <DebugPanel />}
      </div>
    );
  }

  // Profile loaded but no role
  if (!role) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="text-center space-y-3">
          <p className="text-destructive font-medium">Admin rolni tayinlamagan</p>
          <p className="text-sm text-muted-foreground">Profilingizda rol belgilanmagan. Administrator bilan bog'laning.</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={retryProfile}>Qayta urinish</Button>
            <SignOutBtn />
          </div>
          {lastError && <p className="text-xs text-destructive mt-2">{lastError}</p>}
        </div>
        {showDebug && <DebugPanel />}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Yo'naltirilmoqda...</div>
      {showDebug && <DebugPanel />}
    </div>
  );
};

const SignOutBtn = () => {
  const { signOut } = useAuth();
  return <Button onClick={signOut}>Chiqish</Button>;
};

const DebugPanel = () => {
  const { user, role, authLoading, profileLoading, lastError, profileRowFound } = useAuth();
  return (
    <div className="rounded border border-muted bg-muted/50 p-3 text-xs font-mono space-y-1 mt-4 max-w-md">
      <p>authLoading: {String(authLoading)}</p>
      <p>profileLoading: {String(profileLoading)}</p>
      <p>authUid: {user?.id ?? 'null'}</p>
      <p>profileRowFound: {String(profileRowFound)}</p>
      <p>roleFromDb: {role ?? 'null'}</p>
      <p>lastError: {lastError ?? 'none'}</p>
    </div>
  );
};

export default Index;
