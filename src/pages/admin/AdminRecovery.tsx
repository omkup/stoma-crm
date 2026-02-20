import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ShieldAlert } from 'lucide-react';

const AdminRecovery = () => {
  const [recoveryKey, setRecoveryKey] = useState('');
  const [verified, setVerified] = useState(false);

  // Promote tab
  const [userId, setUserId] = useState('');
  const [promoteLoading, setPromoteLoading] = useState(false);

  // Create tab
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoteLoading(true);
    const { data, error } = await supabase.functions.invoke('admin-recovery', {
      body: { recovery_key: recoveryKey, action: 'promote', user_id: userId },
    });
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Xatolik yuz berdi");
    } else {
      toast.success(data?.message || "Admin tayinlandi");
      setUserId('');
    }
    setPromoteLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Parol kamida 6 belgi bo'lishi kerak");
      return;
    }
    setCreateLoading(true);
    const { data, error } = await supabase.functions.invoke('admin-recovery', {
      body: { recovery_key: recoveryKey, action: 'create', email, password, full_name: fullName },
    });
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Xatolik yuz berdi");
    } else {
      toast.success(data?.message || "Admin yaratildi");
      setEmail('');
      setPassword('');
      setFullName('');
    }
    setCreateLoading(false);
  };

  if (!verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <ShieldAlert className="w-12 h-12 mx-auto text-destructive mb-2" />
            <CardTitle>Admin Recovery</CardTitle>
            <CardDescription>Tizimga kirish uchun maxfiy kalitni kiriting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Recovery kalit</Label>
                <Input
                  type="password"
                  value={recoveryKey}
                  onChange={e => setRecoveryKey(e.target.value)}
                  placeholder="Maxfiy kalitni kiriting"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (recoveryKey.length < 4) {
                    toast.error("Kalit juda qisqa");
                    return;
                  }
                  setVerified(true);
                }}
              >
                Tasdiqlash
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <ShieldAlert className="w-12 h-12 mx-auto text-destructive mb-2" />
          <CardTitle>Admin Recovery</CardTitle>
          <CardDescription>Mavjud foydalanuvchini admin qilish yoki yangi admin yaratish</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="promote">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="promote">Admin tayinlash</TabsTrigger>
              <TabsTrigger value="create">Yangi admin</TabsTrigger>
            </TabsList>
            <TabsContent value="promote">
              <form onSubmit={handlePromote} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Foydalanuvchi ID (UUID)</Label>
                  <Input value={userId} onChange={e => setUserId(e.target.value)} required placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                </div>
                <Button type="submit" className="w-full" disabled={promoteLoading}>
                  {promoteLoading ? 'Tayinlanmoqda...' : 'Admin qilish'}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="create">
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Ism familiya</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Parol</Label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={createLoading}>
                  {createLoading ? 'Yaratilmoqda...' : 'Yangi admin yaratish'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRecovery;
