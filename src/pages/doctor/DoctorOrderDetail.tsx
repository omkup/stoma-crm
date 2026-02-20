import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ToothChart, { ToothEntry } from '@/components/ToothChart';
import ServiceSelector from '@/components/ServiceSelector';
import { compressImage, formatFileSize } from '@/lib/image-compress';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { User, Phone, CheckCircle, Clock, Upload, Image, CreditCard, AlertTriangle } from 'lucide-react';

interface ServiceItem {
  service_id: string;
  service_name: string;
  price: number;
  quantity: number;
}

const DoctorOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showDebug = searchParams.get('debug') === '1';
  const [order, setOrder] = useState<any>(null);
  const [record, setRecord] = useState<any>(null);
  const [visitServices, setVisitServices] = useState<ServiceItem[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [toothData, setToothData] = useState<ToothEntry[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [photoErrors, setPhotoErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState('');
  const [form, setForm] = useState({
    diagnosis: '', procedures_done: '', anesthesia: '', medicines_used: '',
    doctor_note: '', next_visit_datetime: ''
  });
  const [paymentInput, setPaymentInput] = useState('');
  const [loading, setLoading] = useState(false);

  const generateSignedUrls = async (photosList: any[]) => {
    const urls: Record<string, string> = {};
    const errors: Record<string, string> = {};
    await Promise.all(
      photosList.map(async (ph) => {
        const path = ph.storage_path || ph.file_url;
        if (!path) { errors[ph.id] = 'No storage_path'; return; }
        // If it's a full URL (legacy), extract path
        const storagePath = path.includes('/object/') 
          ? path.replace(/^.*\/object\/(?:public|sign)\/photo-protocols\//, '')
          : path;
        const { data, error } = await supabase.storage
          .from('photo-protocols')
          .createSignedUrl(storagePath, 600);
        if (error) { errors[ph.id] = error.message; }
        else if (data?.signedUrl) { urls[ph.id] = data.signedUrl; }
      })
    );
    setSignedUrls(urls);
    setPhotoErrors(errors);
  };

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const [orderRes, recordRes, servicesRes, allSvcRes, photosRes] = await Promise.all([
        supabase.from('visit_orders').select(`
          *, patients(full_name, phone, birth_date, gender, address, notes)
        `).eq('id', id).maybeSingle(),
        supabase.from('clinical_records').select('*').eq('visit_order_id', id).maybeSingle(),
        supabase.from('visit_services').select(`*, services(name_uz, base_price)`).eq('visit_order_id', id),
        supabase.from('services').select('*').eq('is_active', true).order('name_uz'),
        supabase.from('photo_protocols').select('*').eq('visit_order_id', id).order('created_at'),
      ]);

      setOrder(orderRes.data);
      setAllServices(allSvcRes.data || []);
      const photosList = photosRes.data || [];
      setPhotos(photosList);
      if (photosList.length > 0) generateSignedUrls(photosList);

      if (servicesRes.data) {
        setVisitServices(servicesRes.data.map((vs: any) => ({
          service_id: vs.service_id,
          service_name: vs.services?.name_uz || '',
          price: Number(vs.price),
          quantity: vs.quantity,
        })));
      }

      if (recordRes.data) {
        const r = recordRes.data;
        setRecord(r);
        setForm({
          diagnosis: r.diagnosis || '',
          procedures_done: r.procedures_done || '',
          anesthesia: r.anesthesia || '',
          medicines_used: r.medicines_used || '',
          doctor_note: r.doctor_note || '',
          next_visit_datetime: r.next_visit_datetime ? format(new Date(r.next_visit_datetime), "yyyy-MM-dd'T'HH:mm") : '',
        });
        if (r.tooth_map && Array.isArray(r.tooth_map)) {
          setToothData(r.tooth_map as unknown as ToothEntry[]);
        }
      }

      if (orderRes.data) {
        setPaymentInput(String(orderRes.data.paid_amount || 0));
      }
    };
    fetchData();
  }, [id]);

  const handleServiceChange = (items: ServiceItem[]) => setVisitServices(items);

  const saveServices = async () => {
    if (!id) return;
    await supabase.from('visit_services').delete().eq('visit_order_id', id);
    if (visitServices.length > 0) {
      await supabase.from('visit_services').insert(
        visitServices.map(s => ({
          visit_order_id: id, service_id: s.service_id, price: s.price, quantity: s.quantity,
        }))
      );
    }
    const totalPrice = visitServices.reduce((sum, s) => sum + s.price * s.quantity, 0);
    await supabase.from('visit_orders').update({ price: totalPrice, updated_by: user?.id } as any).eq('id', id);
    setOrder((prev: any) => prev ? { ...prev, price: totalPrice } : prev);
    toast.success("Xizmatlar saqlandi");
  };

  const handlePhotoUpload = async (type: 'before' | 'after') => {
    if (!id || !user) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e: any) => {
      const files = Array.from(e.target.files || []) as File[];
      if (files.length === 0) return;
      setUploadingPhoto(true);
      setUploadProgress(0);
      setCompressionInfo('');

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const result = await compressImage(file, 1600, 0.75, (pct) => {
            setUploadProgress(Math.round((i / files.length) * 100 + pct / files.length * 0.5));
          });
          setCompressionInfo(`${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)}`);

          const storagePath = `${id}/${type}/${Date.now()}.jpg`;
          setUploadProgress(Math.round(((i + 0.5) / files.length) * 100));

          const { error: uploadError } = await supabase.storage.from('photo-protocols').upload(storagePath, result.blob, {
            contentType: 'image/jpeg',
          });
          if (uploadError) {
            toast.error("Rasm yuklashda xatolik", { description: uploadError.message });
            continue;
          }
          await supabase.from('photo_protocols').insert({
            visit_order_id: id, doctor_id: user.id, type, file_url: storagePath, storage_path: storagePath,
          });
        } catch (err: any) {
          toast.error("Siqish xatolik", { description: err.message });
        }
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      const { data } = await supabase.from('photo_protocols').select('*').eq('visit_order_id', id).order('created_at');
      const photosList = data || [];
      setPhotos(photosList);
      if (photosList.length > 0) generateSignedUrls(photosList);
      setUploadingPhoto(false);
      setUploadProgress(0);
      toast.success("Rasmlar yuklandi");
    };
    input.click();
  };

  const handlePayment = async (mode: 'full' | 'partial' | 'close_debt') => {
    if (!user || !id || !order) return;
    const total = Number(order.price);
    if (total <= 0) {
      toast.error("Avval xizmatlarni belgilang");
      return;
    }

    const oldStatus = order.payment_status;
    const oldPaid = Number(order.paid_amount);
    const oldDebt = Number(order.debt_amount || 0);

    let newPaid: number;
    let newStatus: string;

    if (mode === 'full' || mode === 'close_debt') {
      newPaid = total;
      newStatus = 'PAID';
    } else {
      newPaid = Number(paymentInput);
      if (isNaN(newPaid) || newPaid <= 0) {
        toast.error("To'lov summasini kiriting");
        return;
      }
      if (newPaid > total) {
        toast.error("To'lov summasi umumiy summadan oshmasin");
        return;
      }
      newStatus = newPaid >= total ? 'PAID' : 'DEBT';
    }

    const newDebt = Math.max(0, total - newPaid);

    await supabase.from('visit_orders').update({
      payment_status: newStatus,
      paid_amount: newPaid,
      debt_amount: newDebt,
      payment_updated_by: user.id,
      payment_updated_at: new Date().toISOString(),
    } as any).eq('id', id);

    await supabase.from('payment_events').insert({
      visit_order_id: id,
      patient_id: order.patient_id,
      actor_user_id: user.id,
      old_status: oldStatus,
      new_status: newStatus,
      old_paid_amount: oldPaid,
      new_paid_amount: newPaid,
      old_debt_amount: oldDebt,
      new_debt_amount: newDebt,
    });

    setOrder((prev: any) => ({
      ...prev,
      payment_status: newStatus,
      paid_amount: newPaid,
      debt_amount: newDebt,
    }));
    setPaymentInput(String(newPaid));
    toast.success(newStatus === 'PAID' ? "To'liq to'landi" : `Qarz: ${newDebt.toLocaleString()} so'm`);
  };

  const handleSave = async (markDone: boolean) => {
    if (!user || !id) return;
    setLoading(true);

    await supabase.from('visit_services').delete().eq('visit_order_id', id);
    if (visitServices.length > 0) {
      await supabase.from('visit_services').insert(
        visitServices.map(s => ({
          visit_order_id: id, service_id: s.service_id, price: s.price, quantity: s.quantity,
        }))
      );
    }
    const totalPrice = visitServices.reduce((sum, s) => sum + s.price * s.quantity, 0);

    const payload: any = {
      diagnosis: form.diagnosis || null,
      procedures_done: form.procedures_done || null,
      anesthesia: form.anesthesia || null,
      medicines_used: form.medicines_used || null,
      doctor_note: form.doctor_note || null,
      next_visit_datetime: form.next_visit_datetime ? new Date(form.next_visit_datetime).toISOString() : null,
      tooth_map: toothData.length > 0 ? toothData : null,
      updated_by: user.id,
    };

    if (record) {
      await supabase.from('clinical_records').update(payload).eq('id', record.id);
    } else {
      await supabase.from('clinical_records').insert({
        ...payload, visit_order_id: id, doctor_id: user.id, created_by: user.id,
      });
    }

    const newStatus = markDone ? 'DONE' : 'IN_PROGRESS';
    await supabase.from('visit_orders').update({
      status: newStatus, price: totalPrice, updated_by: user.id,
    } as any).eq('id', id);

    if (markDone && form.next_visit_datetime && order) {
      const nextVisit = new Date(form.next_visit_datetime);
      const dateStr = format(nextVisit, 'dd.MM.yyyy');
      const timeStr = format(nextVisit, 'HH:mm');
      const message = `Assalomu alaykum, sizni Super Denta klinikasida ${dateStr} soat ${timeStr} da qabul kutmoqda.`;
      const remind24h = new Date(nextVisit.getTime() - 24 * 60 * 60 * 1000);
      const remind2h = new Date(nextVisit.getTime() - 2 * 60 * 60 * 1000);
      await supabase.from('reminders').insert([
        { visit_order_id: id, patient_id: order.patient_id, remind_at: remind24h.toISOString(), channel: 'sms', message },
        { visit_order_id: id, patient_id: order.patient_id, remind_at: remind24h.toISOString(), channel: 'telegram', message },
        { visit_order_id: id, patient_id: order.patient_id, remind_at: remind2h.toISOString(), channel: 'sms', message },
        { visit_order_id: id, patient_id: order.patient_id, remind_at: remind2h.toISOString(), channel: 'telegram', message },
      ]);
    }

    toast.success(markDone ? 'Qabul yakunlandi' : 'Saqlandi');
    if (markDone) navigate('/doctor/orders');
    else setLoading(false);
  };

  if (!order) return <DashboardLayout title="Yuklanmoqda..."><div /></DashboardLayout>;

  const p = order.patients;
  const totalPrice = visitServices.reduce((sum: number, s: any) => sum + (s.price * s.quantity), 0);
  const isDone = order.status === 'DONE';
  const beforePhotos = photos.filter(ph => ph.type === 'before');
  const afterPhotos = photos.filter(ph => ph.type === 'after');
  const hasServices = totalPrice > 0;
  const debtAmount = Number(order.debt_amount || 0);

  return (
    <DashboardLayout title="Qabul tafsilotlari">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Patient info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Bemor ma'lumotlari</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /><span className="font-medium">{p?.full_name}</span></div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /><span>{p?.phone}</span></div>
              {p?.birth_date && <p>Tug'ilgan: {format(new Date(p.birth_date), 'dd.MM.yyyy')}</p>}
              {p?.gender && <p>Jinsi: {p.gender === 'male' ? 'Erkak' : 'Ayol'}</p>}
              {p?.address && <p>Manzil: {p.address}</p>}
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-muted-foreground" /><span>{format(new Date(order.visit_datetime), 'dd.MM.yyyy HH:mm')}</span></div>
                {order.complaint && <p className="mt-2"><span className="font-medium">Shikoyat:</span> {order.complaint}</p>}
                {order.reception_note && <p><span className="font-medium">Registratura izohi:</span> {order.reception_note}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader><CardTitle className="text-base">Xizmatlar va narxlar</CardTitle></CardHeader>
            <CardContent>
              <ServiceSelector services={allServices} items={visitServices} onChange={handleServiceChange} readOnly={isDone} />
              <div className="mt-3 pt-3 border-t flex justify-between text-sm">
                <span className="font-medium">Jami narx:</span>
                <span className="font-bold">{totalPrice.toLocaleString()} so'm</span>
              </div>
              {!isDone && (
                <Button size="sm" variant="outline" className="mt-2 w-full" onClick={saveServices}>Xizmatlarni saqlash</Button>
              )}
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="w-4 h-4" />To'lov</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Umumiy:</span></div>
                <div className="text-right font-medium">{totalPrice.toLocaleString()} so'm</div>
                <div><span className="text-muted-foreground">To'langan:</span></div>
                <div className="text-right font-medium">{Number(order.paid_amount).toLocaleString()} so'm</div>
                {debtAmount > 0 && (
                  <>
                    <div><span className="text-muted-foreground">Qarz:</span></div>
                    <div className="text-right font-bold text-destructive">{debtAmount.toLocaleString()} so'm</div>
                  </>
                )}
                <div><span className="text-muted-foreground">Holat:</span></div>
                <div className="text-right">
                  <Badge variant={order.payment_status === 'PAID' ? 'default' : 'destructive'}>
                    {order.payment_status === 'PAID' ? "To'langan" : order.payment_status === 'PARTIAL' ? 'Qisman' : order.payment_status === 'DEBT' ? 'Qarz' : "To'lanmagan"}
                  </Badge>
                </div>
              </div>

              {!isDone && hasServices && order.payment_status !== 'PAID' && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="To'langan summa"
                      value={paymentInput}
                      onChange={e => setPaymentInput(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => handlePayment('full')}>
                      <CheckCircle className="w-3 h-3 mr-1" />To'landi
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handlePayment('partial')}>
                      Qariz qilindi
                    </Button>
                  </div>
                  {Number(paymentInput) > totalPrice && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />To'lov summasi umumiy summadan oshmasin
                    </p>
                  )}
                </div>
              )}

              {!isDone && !hasServices && (
                <p className="text-xs text-muted-foreground italic">Avval xizmatlarni belgilang</p>
              )}

              {debtAmount > 0 && (
                <Button size="sm" variant="outline" className="w-full" onClick={() => handlePayment('close_debt')}>
                  Qarz yopildi
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Photo Protocol */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Image className="w-4 h-4" />Fotoprotokol</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {uploadingPhoto && (
                <div className="space-y-1">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Yuklanmoqda... {uploadProgress}%
                    {compressionInfo && <span className="ml-2">({compressionInfo})</span>}
                  </p>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">Oldingi holat</Label>
                  {!isDone && (
                    <Button size="sm" variant="outline" onClick={() => handlePhotoUpload('before')} disabled={uploadingPhoto}>
                      <Upload className="w-3 h-3 mr-1" />Yuklash
                    </Button>
                  )}
                </div>
                {beforePhotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {beforePhotos.map(ph => (
                      <div key={ph.id} className="space-y-1">
                        {signedUrls[ph.id] ? (
                          <img src={signedUrls[ph.id]} alt="Before" className="rounded-lg border object-cover w-full aspect-square" />
                        ) : photoErrors[ph.id] ? (
                          <div className="rounded-lg border bg-muted flex items-center justify-center aspect-square p-2">
                            <p className="text-xs text-destructive text-center">Rasmni ko'rsatishga ruxsat yo'q yoki link eskirgan. Qayta yuklab ko'ring.</p>
                          </div>
                        ) : (
                          <div className="rounded-lg border bg-muted flex items-center justify-center aspect-square">
                            <p className="text-xs text-muted-foreground">Yuklanmoqda...</p>
                          </div>
                        )}
                        {showDebug && (
                          <div className="text-[10px] font-mono text-muted-foreground bg-muted p-1 rounded break-all">
                            <div>path: {ph.storage_path || ph.file_url}</div>
                            <div>signed: {signedUrls[ph.id] ? '✅ ok' : photoErrors[ph.id] ? `❌ ${photoErrors[ph.id]}` : '⏳'}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground">Rasmlar yo'q</p>}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">Muolajadan keyin</Label>
                  {!isDone && (
                    <Button size="sm" variant="outline" onClick={() => handlePhotoUpload('after')} disabled={uploadingPhoto}>
                      <Upload className="w-3 h-3 mr-1" />Yuklash
                    </Button>
                  )}
                </div>
                {afterPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {afterPhotos.map(ph => (
                      <div key={ph.id} className="space-y-1">
                        {signedUrls[ph.id] ? (
                          <img src={signedUrls[ph.id]} alt="After" className="rounded-lg border object-cover w-full aspect-square" />
                        ) : photoErrors[ph.id] ? (
                          <div className="rounded-lg border bg-muted flex items-center justify-center aspect-square p-2">
                            <p className="text-xs text-destructive text-center">Rasmni ko'rsatishga ruxsat yo'q yoki link eskirgan. Qayta yuklab ko'ring.</p>
                          </div>
                        ) : (
                          <div className="rounded-lg border bg-muted flex items-center justify-center aspect-square">
                            <p className="text-xs text-muted-foreground">Yuklanmoqda...</p>
                          </div>
                        )}
                        {showDebug && (
                          <div className="text-[10px] font-mono text-muted-foreground bg-muted p-1 rounded break-all">
                            <div>path: {ph.storage_path || ph.file_url}</div>
                            <div>signed: {signedUrls[ph.id] ? '✅ ok' : photoErrors[ph.id] ? `❌ ${photoErrors[ph.id]}` : '⏳'}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground">Rasmlar yo'q</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clinical record form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Klinik yozuv
              {isDone && <Badge className="bg-success text-success-foreground">Bajarildi</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tish kartasi</Label>
                <ToothChart selectedTeeth={toothData} onChange={setToothData} readOnly={isDone} />
              </div>
              <div className="space-y-2">
                <Label>Diagnoz</Label>
                <Textarea value={form.diagnosis} onChange={e => setForm(p => ({...p, diagnosis: e.target.value}))} rows={2} disabled={isDone} />
              </div>
              <div className="space-y-2">
                <Label>Bajarilgan muolajalar</Label>
                <Textarea value={form.procedures_done} onChange={e => setForm(p => ({...p, procedures_done: e.target.value}))} rows={3} disabled={isDone} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Anesteziya</Label>
                  <Input value={form.anesthesia} onChange={e => setForm(p => ({...p, anesthesia: e.target.value}))} disabled={isDone} />
                </div>
                <div className="space-y-2">
                  <Label>Ishlatilgan dorilar</Label>
                  <Input value={form.medicines_used} onChange={e => setForm(p => ({...p, medicines_used: e.target.value}))} disabled={isDone} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Shifokor izohi</Label>
                <Textarea value={form.doctor_note} onChange={e => setForm(p => ({...p, doctor_note: e.target.value}))} rows={2} disabled={isDone} />
              </div>
              <div className="space-y-2">
                <Label>Keyingi qabul sanasi</Label>
                <Input type="datetime-local" value={form.next_visit_datetime} onChange={e => setForm(p => ({...p, next_visit_datetime: e.target.value}))} disabled={isDone} />
                {form.next_visit_datetime && (
                  <p className="text-xs text-muted-foreground">Yakunlanganda bemorga SMS va Telegram orqali eslatma yuboriladi</p>
                )}
              </div>
              {!isDone && (
                <div className="flex gap-3 pt-2">
                  <Button onClick={() => handleSave(false)} disabled={loading} variant="outline">Saqlash</Button>
                  <Button onClick={() => handleSave(true)} disabled={loading}><CheckCircle className="w-4 h-4 mr-2" />Yakunlash</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DoctorOrderDetail;
