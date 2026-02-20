import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, UserCog, KeyRound, Trash2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

const UsersManagement = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState('');
  const [resetUserName, setResetUserName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [transferTargetId, setTransferTargetId] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'doctor' });
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((data as Profile[]) || []);
  };

  useEffect(() => { fetchUsers(); }, []);

  const activeAdminCount = users.filter(u => u.role === 'admin' && u.is_active).length;

  const isLastActiveAdmin = (user: Profile) =>
    user.role === 'admin' && user.is_active && activeAdminCount <= 1;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: form.full_name, role: form.role }
      }
    });
    if (error) {
      toast.error("Xatolik", { description: error.message });
    } else {
      toast.success("Foydalanuvchi yaratildi");
      setOpen(false);
      setForm({ full_name: '', email: '', password: '', role: 'doctor' });
      setTimeout(fetchUsers, 1000);
    }
    setLoading(false);
  };

  const toggleActive = async (user: Profile) => {
    if (user.is_active && isLastActiveAdmin(user)) {
      toast.error("Oxirgi adminni o'chirish mumkin emas. Avval yangi admin tayinlang.");
      return;
    }
    await supabase.from('profiles').update({ is_active: !user.is_active }).eq('id', user.id);
    toast.success(user.is_active ? "Foydalanuvchi nofaol qilindi" : "Foydalanuvchi faollashtirildi");
    fetchUsers();
  };

  const changeRole = async (user: Profile, newRole: string) => {
    if (isLastActiveAdmin(user) && newRole !== 'admin') {
      toast.error("Oxirgi adminni o'chirish mumkin emas. Avval yangi admin tayinlang.");
      return;
    }
    const castRole = newRole as 'admin' | 'reception' | 'doctor';
    const { error } = await supabase.from('profiles').update({ role: castRole }).eq('id', user.id);
    if (error) {
      toast.error("Rol o'zgartirishda xatolik");
    } else {
      toast.success("Rol yangilandi");
      fetchUsers();
    }
  };

  const openResetPassword = (user: Profile) => {
    setResetUserId(user.id);
    setResetUserName(user.full_name);
    setNewPassword('');
    setResetOpen(true);
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Parol kamida 6 belgi bo'lishi kerak");
      return;
    }
    const { error } = await supabase.functions.invoke('admin-reset-password', {
      body: { user_id: resetUserId, new_password: newPassword },
    });
    if (error) {
      toast.error("Parolni tiklashda xatolik", { description: error.message });
    } else {
      toast.success("Parol yangilandi");
      setResetOpen(false);
    }
  };

  const handleDeleteUser = async (user: Profile) => {
    if (isLastActiveAdmin(user)) {
      toast.error("Oxirgi adminni o'chirish mumkin emas. Avval yangi admin tayinlang.");
      return;
    }
    if (!confirm(`${user.full_name} ni o'chirmoqchimisiz? Bu foydalanuvchi nofaol qilinadi.`)) return;
    await supabase.from('profiles').update({ is_active: false }).eq('id', user.id);
    toast.success("Foydalanuvchi nofaol qilindi");
    fetchUsers();
  };

  const handleTransferAdmin = async () => {
    if (!transferTargetId) {
      toast.error("Foydalanuvchini tanlang");
      return;
    }
    const { error } = await supabase.from('profiles').update({ role: 'admin' as const }).eq('id', transferTargetId);
    if (error) {
      toast.error("Admin tayinlashda xatolik");
    } else {
      toast.success("Admin huquqi o'tkazildi. Endi eski adminni nofaol qilishingiz mumkin.");
      setTransferOpen(false);
      setTransferTargetId('');
      fetchUsers();
    }
  };

  const roleLabel: Record<string, string> = { admin: 'Admin', reception: 'Registratura', doctor: 'Shifokor' };
  const nonAdminUsers = users.filter(u => u.role !== 'admin');

  return (
    <DashboardLayout title="Foydalanuvchilar boshqaruvi">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <p className="text-muted-foreground text-sm">{users.length} ta foydalanuvchi</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTransferOpen(true)}>
            <ShieldCheck className="w-4 h-4 mr-2" />Admin o'tkazish
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Yangi foydalanuvchi</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Yangi foydalanuvchi yaratish</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Ism familiya</Label>
                  <Input value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))} required />
                </div>
                <div className="space-y-2">
                  <Label>Elektron pochta</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} required />
                </div>
                <div className="space-y-2">
                  <Label>Parol</Label>
                  <Input type="password" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label>Lavozim</Label>
                  <Select value={form.role} onValueChange={v => setForm(p => ({...p, role: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="reception">Registratura</SelectItem>
                      <SelectItem value="doctor">Shifokor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Yaratilmoqda...' : 'Yaratish'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ism</TableHead>
              <TableHead>Pochta</TableHead>
              <TableHead>Lavozim</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead>Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Select value={u.role} onValueChange={v => changeRole(u, v)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue>{roleLabel[u.role] || u.role}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="reception">Registratura</SelectItem>
                      <SelectItem value="doctor">Shifokor</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant={u.is_active ? 'default' : 'secondary'}>
                    {u.is_active ? 'Faol' : 'Nofaol'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => toggleActive(u)} title={u.is_active ? 'Nofaol qilish' : 'Faollashtirish'}>
                      <UserCog className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openResetPassword(u)} title="Parolni tiklash">
                      <KeyRound className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u)} title="O'chirish">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Reset password dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{resetUserName} — Parolni tiklash</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Yangi parol</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} placeholder="Kamida 6 belgi" />
            </div>
            <Button onClick={handleResetPassword} className="w-full">Parolni yangilash</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer admin dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Admin huquqini o'tkazish</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tanlangan foydalanuvchiga admin huquqi beriladi. Keyin eski adminni nofaol qilishingiz mumkin.
            </p>
            <div className="space-y-2">
              <Label>Foydalanuvchini tanlang</Label>
              <Select value={transferTargetId} onValueChange={setTransferTargetId}>
                <SelectTrigger><SelectValue placeholder="Tanlang..." /></SelectTrigger>
                <SelectContent>
                  {nonAdminUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleTransferAdmin} className="w-full">
              Admin tayinlash
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default UsersManagement;
