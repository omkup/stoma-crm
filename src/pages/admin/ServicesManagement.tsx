import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface Service {
  id: string;
  name_uz: string;
  base_price: number;
  duration_minutes: number | null;
  is_active: boolean;
}

const ServicesManagement = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ name_uz: '', base_price: '', duration_minutes: '' });

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('*').order('name_uz');
    setServices((data as Service[]) || []);
  };

  useEffect(() => { fetchServices(); }, []);

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({ name_uz: s.name_uz, base_price: String(s.base_price), duration_minutes: s.duration_minutes ? String(s.duration_minutes) : '' });
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name_uz: form.name_uz,
      base_price: Number(form.base_price),
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
    };

    if (editing) {
      await supabase.from('services').update(payload).eq('id', editing.id);
      toast.success("Xizmat yangilandi");
    } else {
      await supabase.from('services').insert(payload);
      toast.success("Xizmat qo'shildi");
    }
    setOpen(false);
    setEditing(null);
    setForm({ name_uz: '', base_price: '', duration_minutes: '' });
    fetchServices();
  };

  const toggleActive = async (s: Service) => {
    await supabase.from('services').update({ is_active: !s.is_active }).eq('id', s.id);
    fetchServices();
  };

  return (
    <DashboardLayout title="Xizmatlar va narxlar">
      <div className="flex justify-between items-center mb-4">
        <p className="text-muted-foreground text-sm">{services.length} ta xizmat</p>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Yangi xizmat</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Xizmatni tahrirlash' : 'Yangi xizmat'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label>Xizmat nomi</Label>
                <Input value={form.name_uz} onChange={e => setForm(p => ({...p, name_uz: e.target.value}))} required />
              </div>
              <div className="space-y-2">
                <Label>Narxi (so'm)</Label>
                <Input type="number" value={form.base_price} onChange={e => setForm(p => ({...p, base_price: e.target.value}))} required />
              </div>
              <div className="space-y-2">
                <Label>Davomiyligi (daqiqa)</Label>
                <Input type="number" value={form.duration_minutes} onChange={e => setForm(p => ({...p, duration_minutes: e.target.value}))} />
              </div>
              <Button type="submit" className="w-full">Saqlash</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomi</TableHead>
              <TableHead>Narxi</TableHead>
              <TableHead>Davomiyligi</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name_uz}</TableCell>
                <TableCell>{Number(s.base_price).toLocaleString()} so'm</TableCell>
                <TableCell>{s.duration_minutes ? `${s.duration_minutes} daq` : '—'}</TableCell>
                <TableCell>
                  <Badge variant={s.is_active ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => toggleActive(s)}>
                    {s.is_active ? 'Faol' : 'Nofaol'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
};

export default ServicesManagement;
