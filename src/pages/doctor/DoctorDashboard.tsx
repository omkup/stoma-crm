import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { FileText, Clock, Package } from 'lucide-react';

const statusLabels: Record<string, string> = {
  SENT_TO_DOCTOR: 'Yuborilgan', IN_PROGRESS: 'Jarayonda', DONE: 'Bajarildi'
};
const statusColors: Record<string, string> = {
  SENT_TO_DOCTOR: 'bg-info text-info-foreground', IN_PROGRESS: 'bg-warning text-warning-foreground', DONE: 'bg-success text-success-foreground'
};

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      const { data } = await supabase.from('visit_orders').select(`
        *, patients(full_name, phone, birth_date, gender)
      `).eq('assigned_doctor_id', user.id)
        .in('status', ['SENT_TO_DOCTOR', 'IN_PROGRESS', 'DONE'])
        .order('visit_datetime', { ascending: false });

      if (data) {
        // Fetch visit_services for each order
        const orderIds = data.map(o => o.id);
        const { data: vs } = await supabase.from('visit_services')
          .select('visit_order_id, services(name_uz)')
          .in('visit_order_id', orderIds);

        const servicesByOrder: Record<string, string[]> = {};
        (vs || []).forEach((item: any) => {
          if (!servicesByOrder[item.visit_order_id]) servicesByOrder[item.visit_order_id] = [];
          if (item.services?.name_uz) servicesByOrder[item.visit_order_id].push(item.services.name_uz);
        });

        setOrders(data.map(o => ({
          ...o,
          service_names: servicesByOrder[o.id] || [],
        })));
      }
    };
    fetchOrders();
  }, [user]);

  const filterByStatus = (status: string) => orders.filter(o => o.status === status);

  const OrderCard = ({ order }: { order: any }) => (
    <Card className="stoma-card-hover cursor-pointer" onClick={() => navigate(`/doctor/orders/${order.id}`)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold text-foreground">{order.patients?.full_name}</p>
            <p className="text-sm text-muted-foreground">{order.patients?.phone}</p>
          </div>
          <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3 flex-wrap">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {format(new Date(order.visit_datetime), 'dd.MM.yyyy HH:mm')}
          </div>
          {order.service_names.length > 0 && (
            <div className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5" />
              {order.service_names.join(', ')}
            </div>
          )}
        </div>
        {order.complaint && (
          <p className="text-sm mt-2 text-muted-foreground border-t pt-2">
            <span className="font-medium text-foreground">Shikoyat:</span> {order.complaint}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Mening qabullarim">
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Yangi ({filterByStatus('SENT_TO_DOCTOR').length})</TabsTrigger>
          <TabsTrigger value="progress">Jarayonda ({filterByStatus('IN_PROGRESS').length})</TabsTrigger>
          <TabsTrigger value="done">Bajarildi ({filterByStatus('DONE').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3">
          {filterByStatus('SENT_TO_DOCTOR').map(o => <OrderCard key={o.id} order={o} />)}
          {filterByStatus('SENT_TO_DOCTOR').length === 0 && <p className="text-muted-foreground text-center py-8">Yangi qabullar yo'q</p>}
        </TabsContent>
        <TabsContent value="progress" className="space-y-3">
          {filterByStatus('IN_PROGRESS').map(o => <OrderCard key={o.id} order={o} />)}
          {filterByStatus('IN_PROGRESS').length === 0 && <p className="text-muted-foreground text-center py-8">Jarayonda qabullar yo'q</p>}
        </TabsContent>
        <TabsContent value="done" className="space-y-3">
          {filterByStatus('DONE').map(o => <OrderCard key={o.id} order={o} />)}
          {filterByStatus('DONE').length === 0 && <p className="text-muted-foreground text-center py-8">Bajarilgan qabullar yo'q</p>}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
