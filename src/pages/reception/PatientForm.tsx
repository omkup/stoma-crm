import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const PatientForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', phone: '', birth_date: '', gender: '', address: '', notes: '', jshshir: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate JSHSHIR format if provided
    if (form.jshshir && !/^\d{14}$/.test(form.jshshir)) {
      toast.error("JSHSHIR 14 ta raqamdan iborat bo'lishi kerak");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('patients').insert({
      full_name: form.full_name,
      phone: form.phone,
      birth_date: form.birth_date || null,
      gender: form.gender || null,
      address: form.address || null,
      notes: form.notes || null,
      jshshir: form.jshshir || null,
    });
    if (error) {
      toast.error("Xatolik", { description: error.message });
    } else {
      toast.success("Bemor muvaffaqiyatli qo'shildi");
      navigate('/reception/patients');
    }
    setLoading(false);
  };

  return (
    <DashboardLayout title="Yangi bemor qo'shish">
      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-xl border">
          <div className="space-y-2">
            <Label>Ism familiya *</Label>
            <Input value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))} required />
          </div>
          <div className="space-y-2">
            <Label>Telefon raqam *</Label>
            <Input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} placeholder="+998901234567" required />
          </div>
          <div className="space-y-2">
            <Label>JSHSHIR</Label>
            <Input
              value={form.jshshir}
              onChange={e => setForm(p => ({...p, jshshir: e.target.value.replace(/\D/g, '').slice(0, 14)}))}
              placeholder="14 xonali raqam"
              maxLength={14}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tug'ilgan sana</Label>
              <Input type="date" value={form.birth_date} onChange={e => setForm(p => ({...p, birth_date: e.target.value}))} />
            </div>
            <div className="space-y-2">
              <Label>Jinsi</Label>
              <Select value={form.gender} onValueChange={v => setForm(p => ({...p, gender: v}))}>
                <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Erkak</SelectItem>
                  <SelectItem value="female">Ayol</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Manzil</Label>
            <Input value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))} />
          </div>
          <div className="space-y-2">
            <Label>Izoh</Label>
            <Textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} rows={3} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>{loading ? 'Saqlanmoqda...' : 'Saqlash'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Bekor qilish</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default PatientForm;
