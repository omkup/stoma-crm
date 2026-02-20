import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';

interface ServiceItem {
  service_id: string;
  service_name: string;
  price: number;
  quantity: number;
}

interface ServiceSelectorProps {
  services: Array<{ id: string; name_uz: string; base_price: number }>;
  items: ServiceItem[];
  onChange: (items: ServiceItem[]) => void;
  readOnly?: boolean;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ services, items, onChange, readOnly = false }) => {
  const [selectedServiceId, setSelectedServiceId] = useState('');

  const addService = () => {
    const service = services.find(s => s.id === selectedServiceId);
    if (!service) return;
    if (items.some(i => i.service_id === selectedServiceId)) return;
    onChange([...items, {
      service_id: service.id,
      service_name: service.name_uz,
      price: Number(service.base_price),
      quantity: 1,
    }]);
    setSelectedServiceId('');
  };

  const removeService = (serviceId: string) => {
    onChange(items.filter(i => i.service_id !== serviceId));
  };

  const updateItem = (serviceId: string, field: 'price' | 'quantity', value: number) => {
    onChange(items.map(i => i.service_id === serviceId ? { ...i, [field]: value } : i));
  };

  const totalPrice = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  return (
    <div className="space-y-3">
      {!readOnly && (
        <div className="flex gap-2">
          <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Xizmat qo'shish..." /></SelectTrigger>
            <SelectContent>
              {services.filter(s => !items.some(i => i.service_id === s.id)).map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name_uz} — {Number(s.base_price).toLocaleString()} so'm
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" size="icon" variant="outline" onClick={addService} disabled={!selectedServiceId}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}

      {items.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Xizmat</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground w-28">Narx</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground w-20">Soni</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground w-28">Jami</th>
                {!readOnly && <th className="w-10" />}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.service_id} className="border-t">
                  <td className="px-3 py-2">{item.service_name}</td>
                  <td className="px-3 py-2">
                    {readOnly ? (
                      <span className="text-right block">{item.price.toLocaleString()}</span>
                    ) : (
                      <Input
                        type="number"
                        value={item.price}
                        onChange={e => updateItem(item.service_id, 'price', Number(e.target.value))}
                        className="h-8 text-right"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {readOnly ? (
                      <span className="text-center block">{item.quantity}</span>
                    ) : (
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e => updateItem(item.service_id, 'quantity', Math.max(1, Number(e.target.value)))}
                        className="h-8 text-center"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">{(item.price * item.quantity).toLocaleString()}</td>
                  {!readOnly && (
                    <td className="px-2 py-2">
                      <button onClick={() => removeService(item.service_id)} className="text-muted-foreground hover:text-destructive">
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/30">
                <td colSpan={readOnly ? 3 : 3} className="px-3 py-2 font-semibold text-right">Jami:</td>
                <td className="px-3 py-2 font-bold text-right">{totalPrice.toLocaleString()} so'm</td>
                {!readOnly && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg border-dashed">
          Xizmatlar tanlanmagan
        </p>
      )}
    </div>
  );
};

export default ServiceSelector;
