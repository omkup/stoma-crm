import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, CheckCircle, History } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const paymentStatusLabels: Record<string, string> = {
  UNPAID: "To'lanmagan", PARTIAL: 'Qisman', PAID: "To'langan", DEBT: 'Qarz',
};

const AdminDebts = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [paymentEvents, setPaymentEvents] = useState<any[]>([]);
  const [note, setNote] = useState('');

  const fetchDebts = async () => {
    let query = supabase.from('visit_orders').select(`
      *, patients(full_name, phone, jshshir)
    `).gt('debt_amount', 0).order('updated_at', { ascending: false });

    if (doctorFilter !== 'all') query = query.eq('assigned_doctor_id', doctorFilter);
    const { data } = await query;

    let filtered = data || [];
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(o =>
        o.patients?.full_name?.toLowerCase().includes(s) ||
        o.patients?.phone?.includes(s) ||
        o.patients?.jshshir?.includes(s)
      );
    }

    // Fetch doctor names
    const doctorIds = [...new Set(filtered.map(o => o.assigned_doctor_id))];
    if (doctorIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', doctorIds);
      const map = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name]));
      filtered = filtered.map(o => ({ ...o, doctor_name: map[o.assigned_doctor_id] || '' }));
    }

    setOrders(filtered);
  };

  const fetchDoctors = async () => {
    const { data } = await supabase.from('doctor_directory').select('id, full_name');
    setDoctors(data || []);
  };

  useEffect(() => { fetchDoctors(); }, []);
  useEffect(() => { fetchDebts(); }, [search, doctorFilter]);

  const openDetail = async (order: any) => {
    setSelectedOrder(order);
    setNote('');
    const { data } = await supabase.from('payment_events')
      .select('*')
      .eq('visit_order_id', order.id)
      .order('created_at', { ascending: false });
    setPaymentEvents(data || []);
  };

  const closeDebt = async () => {
    if (!selectedOrder || !user) return;
    const oldStatus = selectedOrder.payment_status;
    const oldPaid = Number(selectedOrder.paid_amount);
    const oldDebt = Number(selectedOrder.debt_amount);
    const total = Number(selectedOrder.price);

    await supabase.from('visit_orders').update({
      payment_status: 'PAID',
      paid_amount: total,
      debt_amount: 0,
      payment_updated_by: user.id,
      payment_updated_at: new Date().toISOString(),
    } as any).eq('id', selectedOrder.id);

    await supabase.from('payment_events').insert({
      visit_order_id: selectedOrder.id,
      patient_id: selectedOrder.patient_id,
      actor_user_id: user.id,
      old_status: oldStatus,
      new_status: 'PAID',
      old_paid_amount: oldPaid,
      new_paid_amount: total,
      old_debt_amount: oldDebt,
      new_debt_amount: 0,
      note: note || 'Admin tomonidan qarz yopildi',
    });

    toast.success('Qarz yopildi');
    setSelectedOrder(null);
    fetchDebts();
  };

  return (
    <DashboardLayout title="Qarzlar boshqaruvi">
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Ism, telefon yoki JSHSHIR..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Shifokor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha shifokorlar</SelectItem>
            {doctors.map(d => (
              <SelectItem key={d.id} value={d.id!}>{d.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bemor</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Shifokor</TableHead>
              <TableHead className="text-right">Umumiy</TableHead>
              <TableHead className="text-right">To'langan</TableHead>
              <TableHead className="text-right">Qarz</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(o => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.patients?.full_name}</TableCell>
                <TableCell>{o.patients?.phone}</TableCell>
                <TableCell>{o.doctor_name}</TableCell>
                <TableCell className="text-right">{Number(o.price).toLocaleString()}</TableCell>
                <TableCell className="text-right">{Number(o.paid_amount).toLocaleString()}</TableCell>
                <TableCell className="text-right font-semibold text-destructive">{Number(o.debt_amount).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant="destructive">{paymentStatusLabels[o.payment_status] || o.payment_status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => openDetail(o)}>
                      <History className="w-3 h-3 mr-1" />Batafsil
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Qarzlar topilmadi</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={o => !o && setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Qarz tafsilotlari</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Bemor:</span> <span className="font-medium">{selectedOrder.patients?.full_name}</span></div>
                <div><span className="text-muted-foreground">Telefon:</span> {selectedOrder.patients?.phone}</div>
                <div><span className="text-muted-foreground">Umumiy:</span> {Number(selectedOrder.price).toLocaleString()} so'm</div>
                <div><span className="text-muted-foreground">To'langan:</span> {Number(selectedOrder.paid_amount).toLocaleString()} so'm</div>
                <div className="col-span-2"><span className="text-muted-foreground">Qarz:</span> <span className="font-bold text-destructive">{Number(selectedOrder.debt_amount).toLocaleString()} so'm</span></div>
              </div>

              {paymentEvents.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">To'lov tarixi</Label>
                  <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                    {paymentEvents.map(ev => (
                      <div key={ev.id} className="px-3 py-2 text-xs">
                        <div className="flex justify-between">
                          <span>{ev.old_status} → {ev.new_status}</span>
                          <span className="text-muted-foreground">{format(new Date(ev.created_at), 'dd.MM.yyyy HH:mm')}</span>
                        </div>
                        <div className="text-muted-foreground">
                          To'lov: {Number(ev.old_paid_amount).toLocaleString()} → {Number(ev.new_paid_amount).toLocaleString()} so'm
                        </div>
                        {ev.note && <div className="mt-1 italic">{ev.note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Izoh (ixtiyoriy)</Label>
                <Textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Qarz bo'yicha izoh..." />
              </div>

              <Button onClick={closeDebt} className="w-full">
                <CheckCircle className="w-4 h-4 mr-2" />Qarz yopildi
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminDebts;
