import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';

const PatientsList = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      let query = supabase.from('patients').select('*').eq('is_deleted', false).order('created_at', { ascending: false });
      if (search) query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,jshshir.ilike.%${search}%`);
      const { data } = await query;
      setPatients(data || []);
    };
    fetch();
  }, [search]);

  return (
    <DashboardLayout title="Bemorlar ro'yxati">
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Ism, telefon yoki JSHSHIR..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => navigate('/reception/patients/new')}>
          <Plus className="w-4 h-4 mr-2" />Yangi bemor
        </Button>
      </div>
      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ism</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>JSHSHIR</TableHead>
              <TableHead>Jinsi</TableHead>
              <TableHead>Izoh</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map(p => (
              <TableRow key={p.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/reception/orders/new?patient=${p.id}`)}>
                <TableCell className="font-medium">{p.full_name}</TableCell>
                <TableCell>{p.phone}</TableCell>
                <TableCell className="text-muted-foreground">{p.jshshir || '—'}</TableCell>
                <TableCell>{p.gender === 'male' ? 'Erkak' : p.gender === 'female' ? 'Ayol' : '—'}</TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">{p.notes || '—'}</TableCell>
              </TableRow>
            ))}
            {patients.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Bemorlar topilmadi</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
};

export default PatientsList;
