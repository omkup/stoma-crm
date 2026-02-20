import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Stethoscope, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const PASSWORD_MIN_LENGTH = 8;

const validatePassword = (password: string): string | null => {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Parol kamida ${PASSWORD_MIN_LENGTH} ta belgidan iborat bo'lishi kerak`;
  }
  if (!/[A-Z]/.test(password)) {
    return "Parolda kamida 1 ta katta harf bo'lishi kerak";
  }
  if (!/[a-z]/.test(password)) {
    return "Parolda kamida 1 ta kichik harf bo'lishi kerak";
  }
  if (!/[0-9]/.test(password)) {
    return "Parolda kamida 1 ta raqam bo'lishi kerak";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Parolda kamida 1 ta maxsus belgi bo'lishi kerak (!@#$...)";
  }
  return null;
};

const LEAKED_PASSWORDS = [
  'password', '12345678', 'qwerty123', 'letmein1', 'welcome1',
  'admin123', 'iloveyou', 'monkey12', 'dragon12', '123456789',
  'Password1!', 'Qwerty123!',
];

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordError = validatePassword(form.password);
    if (passwordError) {
      toast.error("Parol xavfsizligi", { description: passwordError });
      return;
    }

    if (LEAKED_PASSWORDS.some(p => form.password.toLowerCase().includes(p.toLowerCase()))) {
      toast.error("Parol xavfsizligi", { description: "Bu parol juda oddiy yoki ommaviy ma'lumotlar bazasida topilgan. Boshqa parol tanlang." });
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Xatolik", { description: "Parollar mos kelmaydi" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: form.full_name },
      },
    });

    if (error) {
      toast.error("Ro'yxatdan o'tish xatoligi", { description: error.message });
    } else {
      toast.success("Muvaffaqiyatli ro'yxatdan o'tdingiz!", {
        description: "Email manzilingizni tasdiqlang va tizimga kiring.",
      });
      navigate('/login');
    }
    setLoading(false);
  };

  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl stoma-gradient mb-2">
            <Stethoscope className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">StomaCRM</h1>
          <p className="text-muted-foreground text-sm">Yangi hisob yaratish</p>
        </div>

        <Card className="border shadow-lg">
          <CardHeader className="pb-4">
            <h2 className="text-lg font-semibold text-center text-foreground">Ro'yxatdan o'tish</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Ism familiya</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={e => update('full_name', e.target.value)}
                  placeholder="Ism Familiya"
                  required
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Elektron pochta</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  placeholder="pochta@misol.uz"
                  required
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Parol</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  placeholder="Kamida 8 ta belgi"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Katta harf, kichik harf, raqam va maxsus belgi kerak
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Parolni tasdiqlang</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => update('confirmPassword', e.target.value)}
                  placeholder="Parolni qayta kiriting"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <UserPlus className="w-4 h-4 mr-2" />
                {loading ? "Yaratilmoqda..." : "Ro'yxatdan o'tish"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Hisobingiz bormi?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Kirish
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
