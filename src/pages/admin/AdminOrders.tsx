import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

const statusLabels: Record<string, string> = {
  NEW: 'Yangi', SENT_TO_DOCTOR: 'Yuborilgan', IN_PROGRESS: 'Jarayonda', DONE: 'Bajarildi', CANCELLED: 'Bekor qilingan'
};
const statusColors: Record<string, string> = {
  NEW: 'bg-muted text-muted-foreground', SENT_TO_DOCTOR: 'bg-info text-info-foreground',
  IN_PROGRESS: 'bg-warning text-warning-foreground', DONE: 'bg-success text-success-foreground', CANCELLED: 'bg-destructive text-destructive-foreground'
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      let query = supabase.from('visit_orders').select(`
        *, patients(full_name, phone)
      `).order('created_at', { ascending: false });
      if (statusFilter !== 'all') query = query.eq('status', statusFilter as any);
      const { data } = await query;
      if (data) {
        const doctorIds = [...new Set(data.map(o => o.assigned_doctor_id))];
        const orderIds = data.map(o => o.id);
        const [profilesRes, servicesRes] = await Promise.all([
          supabase.from('profiles').select('id, full_name').in('id', doctorIds),
          supabase.from('visit_services').select('visit_order_id, services(name_uz)').in('visit_order_id', orderIds),
        ]);
        const profileMap = Object.fromEntries((profilesRes.data || []).map(p => [p.id, p.full_name]));
        const servicesByOrder: Record<string, string[]> = {};
        (servicesRes.data || []).forEach((vs: any) => {
          if (!servicesByOrder[vs.visit_order_id]) servicesByOrder[vs.visit_order_id] = [];
          if (vs.services?.name_uz) servicesByOrder[vs.visit_order_id].push(vs.services.name_uz);
        });
        setOrders(data.map(o => ({
          ...o,
          doctor_name: profileMap[o.assigned_doctor_id] || '',
          service_names: servicesByOrder[o.id] || [],
        })));
      } else {
        setOrders([]);
      }
    };
    fetchOrders();
  }, [statusFilter]);

  return (
    <DashboardLayout title="Barcha buyurtmalar">
      <div className="flex gap-3 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Holat" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="NEW">Yangi</SelectItem>
            <SelectItem value="SENT_TO_DOCTOR">Yuborilgan</SelectItem>
            <SelectItem value="IN_PROGRESS">Jarayonda</SelectItem>
            <SelectItem value="DONE">Bajarildi</SelectItem>
            <SelectItem value="CANCELLED">Bekor qilingan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bemor</TableHead>
              <TableHead>Xizmatlar</TableHead>
              <TableHead>Shifokor</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead>Narx</TableHead>
              <TableHead>To'lov</TableHead>
              <TableHead>Qarz</TableHead>
              <TableHead>Holat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(o => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.patients?.full_name}</TableCell>
                <TableCell>{o.service_names.length > 0 ? o.service_names.join(', ') : '—'}</TableCell>
                <TableCell>{o.doctor_name}</TableCell>
                <TableCell>{format(new Date(o.visit_datetime), 'dd.MM.yyyy HH:mm')}</TableCell>
                <TableCell>{Number(o.price).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={o.payment_status === 'PAID' ? 'default' : 'secondary'}>
                    {o.payment_status === 'PAID' ? "To'langan" : o.payment_status === 'PARTIAL' ? 'Qisman' : o.payment_status === 'DEBT' ? 'Qarz' : "To'lanmagan"}
                  </Badge>
                </TableCell>
                <TableCell className={Number(o.debt_amount) > 0 ? 'font-semibold text-destructive' : ''}>
                  {Number(o.debt_amount || 0).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[o.status]}>{statusLabels[o.status]}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Buyurtmalar topilmadi</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
};

export default AdminOrders;
