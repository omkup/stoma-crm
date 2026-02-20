import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Users, ClipboardList, UserPlus, TrendingUp } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) => (
  <div className="stoma-stat-card">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-primary-foreground" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({ patients: 0, orders: 0, doctors: 0, revenue: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [patients, orders, doctors, revenue] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('visit_orders').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'doctor'),
        supabase.from('visit_orders').select('paid_amount').eq('payment_status', 'PAID'),
      ]);
      const totalRevenue = (revenue.data || []).reduce((sum, r) => sum + Number(r.paid_amount || 0), 0);
      setStats({
        patients: patients.count || 0,
        orders: orders.count || 0,
        doctors: doctors.count || 0,
        revenue: totalRevenue,
      });
    };
    fetchStats();
  }, []);

  return (
    <DashboardLayout title="Boshqaruv paneli">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UserPlus} label="Bemorlar" value={stats.patients} color="stoma-gradient" />
        <StatCard icon={ClipboardList} label="Buyurtmalar" value={stats.orders} color="bg-info" />
        <StatCard icon={Users} label="Shifokorlar" value={stats.doctors} color="bg-success" />
        <StatCard icon={TrendingUp} label="Daromad (so'm)" value={stats.revenue.toLocaleString()} color="bg-warning" />
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
