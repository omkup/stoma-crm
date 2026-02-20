import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserPlus, ClipboardList, Search, Activity } from 'lucide-react';

const QuickAction = ({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) => (
  <button onClick={onClick} className="stoma-stat-card flex flex-col items-center gap-3 text-center cursor-pointer w-full">
    <div className="w-12 h-12 rounded-xl stoma-gradient flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary-foreground" />
    </div>
    <span className="text-sm font-medium text-foreground">{label}</span>
  </button>
);

const ReceptionDashboard = () => {
  const navigate = useNavigate();
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    supabase.from('visit_orders')
      .select('id', { count: 'exact', head: true })
      .gte('visit_datetime', today.toISOString())
      .then(({ count }) => setTodayCount(count || 0));
  }, []);

  return (
    <DashboardLayout title="Registratura paneli">
      <div className="mb-6">
        <p className="text-muted-foreground">Bugungi qabullar: <span className="font-semibold text-foreground">{todayCount}</span></p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction icon={UserPlus} label="Bemor qo'shish" onClick={() => navigate('/reception/patients/new')} />
        <QuickAction icon={Search} label="Bemor qidirish" onClick={() => navigate('/reception/patients')} />
        <QuickAction icon={ClipboardList} label="Yangi buyurtma" onClick={() => navigate('/reception/orders/new')} />
        <QuickAction icon={Activity} label="Buyurtmalar" onClick={() => navigate('/reception/orders')} />
      </div>
    </DashboardLayout>
  );
};

export default ReceptionDashboard;
