import { useAuth } from '@/lib/auth-context';
import { useSearchParams } from 'react-router-dom';

const AuthDebugBanner = () => {
  const [searchParams] = useSearchParams();
  const { user, role, authLoading, profileLoading, lastError, profileRowFound } = useAuth();
  const showDebug = searchParams.get('debug') === '1';

  if (!showDebug) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-muted text-muted-foreground text-xs px-4 py-1 flex gap-4 font-mono border-t flex-wrap">
      <span>authLoading: {authLoading ? '⏳' : '✅'}</span>
      <span>profileLoading: {profileLoading ? '⏳' : '✅'}</span>
      <span>uid: {user?.id ?? 'null'}</span>
      <span>profileFound: {profileRowFound ? '✅' : '❌'}</span>
      <span>role: {role ?? 'null'}</span>
      {lastError && <span className="text-destructive">err: {lastError}</span>}
    </div>
  );
};

export default AuthDebugBanner;
