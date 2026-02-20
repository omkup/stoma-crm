import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const OrderForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    patient_id: searchParams.get('patient') || '',
    visit_datetime: '',
    complaint: '',
    assigned_doctor_id: '',
    reception_note: '',
  });

  useEffect(() => {
    Promise.all([
      supabase.from('patients').select('id, full_name, phone').eq('is_deleted', false).order('full_name'),
      supabase.from('doctor_directory').select('id, full_name'),
    ]).then(([p, d]) => {
      setPatients(p.data || []);
      setDoctors(d.data || []);
      if (d.error) {
        console.error('Doctor directory error:', d.error);
        toast.error("Shifokorlar ro'yxatini yuklashda xatolik", { description: d.error.message });
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.assigned_doctor_id) {
      toast.error("Shifokorni tanlang");
      return;
    }
    setLoading(true);

    const insertData: any = {
      patient_id: form.patient_id,
      visit_datetime: new Date(form.visit_datetime).toISOString(),
      complaint: form.complaint || null,
      price: 0,
      assigned_doctor_id: form.assigned_doctor_id,
      reception_note: form.reception_note || null,
      created_by: user?.id,
      status: 'NEW' as const,
    };

    const { error } = await supabase.from('visit_orders').insert(insertData);
    if (error) {
      toast.error("Xatolik", { description: error.message });
      setLoading(false);
      return;
    }

    toast.success("Buyurtma yaratildi");
    navigate('/reception/orders');
    setLoading(false);
  };

  return (
    <DashboardLayout title="Yangi qabul buyurtmasi">
      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-xl border">
          <div className="space-y-2">
            <Label>Bemor *</Label>
            <Select value={form.patient_id} onValueChange={v => setForm(p => ({...p, patient_id: v}))}>
              <SelectTrigger><SelectValue placeholder="Bemorni tanlang" /></SelectTrigger>
              <SelectContent>
                {patients.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name} ({p.phone})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Qabul sanasi va vaqti *</Label>
            <Input type="datetime-local" value={form.visit_datetime} onChange={e => setForm(p => ({...p, visit_datetime: e.target.value}))} required />
          </div>
          <div className="space-y-2">
            <Label>Shikoyat</Label>
            <Textarea value={form.complaint} onChange={e => setForm(p => ({...p, complaint: e.target.value}))} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Shifokor *</Label>
            {doctors.length === 0 ? (
              <p className="text-sm text-destructive">Shifokorlar ro'yxati topilmadi. Admin shifokorlarni qo'shganini tekshiring.</p>
            ) : (
              <Select value={form.assigned_doctor_id} onValueChange={v => setForm(p => ({...p, assigned_doctor_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Shifokorni tanlang" /></SelectTrigger>
                <SelectContent>
                  {doctors.map(d => (
                    <SelectItem key={d.id!} value={d.id!}>{d.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label>Registratura izohi</Label>
            <Textarea value={form.reception_note} onChange={e => setForm(p => ({...p, reception_note: e.target.value}))} rows={2} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>{loading ? 'Saqlanmoqda...' : 'Yaratish'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Bekor qilish</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default OrderForm;
