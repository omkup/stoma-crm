import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Activity, Package, Hash } from 'lucide-react';

const COLORS = ['hsl(174, 62%, 38%)', 'hsl(210, 80%, 55%)', 'hsl(38, 92%, 50%)', 'hsl(152, 60%, 42%)', 'hsl(0, 72%, 55%)', 'hsl(270, 60%, 55%)'];

const AdminReports = () => {
  const [doctorStats, setDoctorStats] = useState<any[]>([]);
  const [serviceStats, setServiceStats] = useState<any[]>([]);
  const [toothStats, setToothStats] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [revenueByService, setRevenueByService] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      // Fetch orders and visit_services for revenue data
      const [ordersRes, visitServicesRes, clinicalRes] = await Promise.all([
        supabase.from('visit_orders').select('id, price, paid_amount, payment_status, assigned_doctor_id'),
        supabase.from('visit_services').select('visit_order_id, service_id, price, quantity, services(name_uz)'),
        supabase.from('clinical_records').select('tooth_map'),
      ]);

      const orders = ordersRes.data || [];
      const visitServices = visitServicesRes.data || [];

      // Fetch doctor names
      const doctorIds = [...new Set(orders.map(o => o.assigned_doctor_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', doctorIds);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name]));

      setTotalOrders(orders.length);
      setTotalRevenue(orders.reduce((s, o) => s + Number(o.paid_amount || 0), 0));

      // Doctor stats with revenue
      const byDoctor: Record<string, { name: string; count: number; revenue: number }> = {};
      orders.forEach(o => {
        const id = o.assigned_doctor_id;
        if (!byDoctor[id]) byDoctor[id] = { name: profileMap[id] || 'Noma\'lum', count: 0, revenue: 0 };
        byDoctor[id].count++;
        byDoctor[id].revenue += Number(o.paid_amount || 0);
      });
      setDoctorStats(Object.values(byDoctor));

      // Service stats (from visit_services)
      const byService: Record<string, { name: string; count: number; revenue: number }> = {};
      visitServices.forEach((vs: any) => {
        const sName = vs.services?.name_uz || 'Noma\'lum';
        const sid = vs.service_id;
        if (!byService[sid]) byService[sid] = { name: sName, count: 0, revenue: 0 };
        byService[sid].count += vs.quantity;
        byService[sid].revenue += Number(vs.price) * vs.quantity;
      });
      const sortedServices = Object.values(byService).sort((a, b) => b.count - a.count);
      setServiceStats(sortedServices);
      setRevenueByService(sortedServices.filter(s => s.revenue > 0));

      // Tooth stats (from clinical_records tooth_map)
      const toothCount: Record<number, number> = {};
      (clinicalRes.data || []).forEach((cr: any) => {
        if (cr.tooth_map && Array.isArray(cr.tooth_map)) {
          cr.tooth_map.forEach((t: any) => {
            const num = t.tooth_number;
            toothCount[num] = (toothCount[num] || 0) + 1;
          });
        }
      });
      const topTeeth = Object.entries(toothCount)
        .map(([num, count]) => ({ tooth: `#${num}`, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setToothStats(topTeeth);
    };
    fetch();
  }, []);

  return (
    <DashboardLayout title="Hisobotlar">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="stoma-stat-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg stoma-gradient flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalRevenue.toLocaleString()} so'm</p>
            <p className="text-sm text-muted-foreground">Umumiy daromad</p>
          </div>
        </div>
        <div className="stoma-stat-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-info flex items-center justify-center">
            <Activity className="w-5 h-5 text-info-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalOrders}</p>
            <p className="text-sm text-muted-foreground">Jami qabullar</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue by doctor */}
        <Card>
          <CardHeader><CardTitle className="text-base">Shifokorlar bo'yicha daromad</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={doctorStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis />
                <Tooltip formatter={(val: number) => `${val.toLocaleString()} so'm`} />
                <Bar dataKey="revenue" fill="hsl(174, 62%, 38%)" radius={[4, 4, 0, 0]} name="Daromad" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by service */}
        <Card>
          <CardHeader><CardTitle className="text-base">Xizmatlar bo'yicha daromad</CardTitle></CardHeader>
          <CardContent>
            {revenueByService.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={revenueByService} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {revenueByService.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => `${val.toLocaleString()} so'm`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">Ma'lumot yo'q</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service usage */}
        <Card>
          <CardHeader><CardTitle className="text-base">Eng ko'p ishlatiladigan xizmatlar</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {serviceStats.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{s.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold">{s.count} ta</span>
                    <span className="text-xs text-muted-foreground ml-2">({s.revenue.toLocaleString()} so'm)</span>
                  </div>
                </div>
              ))}
              {serviceStats.length === 0 && <p className="text-muted-foreground text-sm">Ma'lumot yo'q</p>}
            </div>
          </CardContent>
        </Card>

        {/* Most treated teeth */}
        <Card>
          <CardHeader><CardTitle className="text-base">Eng ko'p davolangan tishlar</CardTitle></CardHeader>
          <CardContent>
            {toothStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={toothStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="tooth" type="category" fontSize={12} width={40} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(210, 80%, 55%)" radius={[0, 4, 4, 0]} name="Soni" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Hash className="w-8 h-8 mb-2" />
                <p className="text-sm">Tish kartasi ma'lumotlari yo'q</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
