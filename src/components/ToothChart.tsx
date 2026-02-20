import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

// FDI numbering system for adult teeth
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];

const PROCEDURE_TYPES = [
  { value: 'plomba', label: 'Plomba' },
  { value: 'kanal', label: 'Kanal davolash' },
  { value: 'ekstraksiya', label: 'Ekstraksiya (sug\'urish)' },
  { value: 'protez', label: 'Protezlash' },
  { value: 'implant', label: 'Implant' },
  { value: 'tozalash', label: 'Professional tozalash' },
  { value: 'oqartirish', label: 'Oqartirish' },
  { value: 'toj', label: 'Toj qo\'yish' },
  { value: 'boshqa', label: 'Boshqa' },
];

export interface ToothEntry {
  tooth_number: number;
  procedure: string;
  notes: string;
}

interface ToothChartProps {
  selectedTeeth: ToothEntry[];
  onChange: (teeth: ToothEntry[]) => void;
  readOnly?: boolean;
}

const ToothButton = ({
  number,
  isSelected,
  onClick,
  readOnly,
}: {
  number: number;
  isSelected: boolean;
  onClick: () => void;
  readOnly?: boolean;
}) => (
  <button
    type="button"
    disabled={readOnly}
    onClick={onClick}
    className={`
      w-9 h-10 rounded text-xs font-medium border transition-all
      ${isSelected
        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
        : 'bg-card text-foreground border-border hover:border-primary/50 hover:bg-accent'
      }
      ${readOnly ? 'cursor-default' : 'cursor-pointer'}
    `}
  >
    {number}
  </button>
);

const ToothChart: React.FC<ToothChartProps> = ({ selectedTeeth, onChange, readOnly = false }) => {
  const [editingTooth, setEditingTooth] = useState<number | null>(null);
  const [tempProcedure, setTempProcedure] = useState('');
  const [tempNotes, setTempNotes] = useState('');

  const isSelected = (n: number) => selectedTeeth.some(t => t.tooth_number === n);
  const getEntry = (n: number) => selectedTeeth.find(t => t.tooth_number === n);

  const toggleTooth = (n: number) => {
    if (readOnly) return;
    if (isSelected(n)) {
      onChange(selectedTeeth.filter(t => t.tooth_number !== n));
      if (editingTooth === n) setEditingTooth(null);
    } else {
      setEditingTooth(n);
      setTempProcedure('');
      setTempNotes('');
    }
  };

  const confirmTooth = () => {
    if (editingTooth === null) return;
    onChange([
      ...selectedTeeth.filter(t => t.tooth_number !== editingTooth),
      { tooth_number: editingTooth, procedure: tempProcedure, notes: tempNotes }
    ]);
    setEditingTooth(null);
  };

  const removeTooth = (n: number) => {
    onChange(selectedTeeth.filter(t => t.tooth_number !== n));
  };

  const procedureLabel = (val: string) => PROCEDURE_TYPES.find(p => p.value === val)?.label || val;

  const renderRow = (teeth: number[], label: string) => (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-muted-foreground w-6 text-right mr-1">{label}</span>
      {teeth.map(n => (
        <ToothButton key={n} number={n} isSelected={isSelected(n)} onClick={() => toggleTooth(n)} readOnly={readOnly} />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-xl p-4 border">
        <p className="text-xs text-muted-foreground mb-3 text-center font-medium">Yuqori jag' (FDI)</p>
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-3">
            {renderRow(UPPER_RIGHT, 'O\'ng')}
            <div className="w-px bg-border" />
            {renderRow(UPPER_LEFT, '')}
            <span className="text-[10px] text-muted-foreground w-6 ml-1">Chap</span>
          </div>
        </div>

        <div className="border-t border-dashed border-border my-3" />

        <p className="text-xs text-muted-foreground mb-3 text-center font-medium">Pastki jag'</p>
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-3">
            {renderRow(LOWER_RIGHT, 'O\'ng')}
            <div className="w-px bg-border" />
            {renderRow(LOWER_LEFT, '')}
            <span className="text-[10px] text-muted-foreground w-6 ml-1">Chap</span>
          </div>
        </div>
      </div>

      {/* Add tooth detail form */}
      {editingTooth !== null && !readOnly && (
        <div className="bg-accent/50 rounded-lg p-4 border border-primary/20 space-y-3">
          <p className="text-sm font-medium">Tish #{editingTooth} uchun ma'lumot</p>
          <div className="space-y-2">
            <Label className="text-xs">Muolaja turi</Label>
            <Select value={tempProcedure} onValueChange={setTempProcedure}>
              <SelectTrigger><SelectValue placeholder="Muolajani tanlang" /></SelectTrigger>
              <SelectContent>
                {PROCEDURE_TYPES.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Izoh</Label>
            <Input value={tempNotes} onChange={e => setTempNotes(e.target.value)} placeholder="Qo'shimcha izoh..." />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={confirmTooth} disabled={!tempProcedure}>Qo'shish</Button>
            <Button size="sm" variant="outline" onClick={() => setEditingTooth(null)}>Bekor qilish</Button>
          </div>
        </div>
      )}

      {/* Selected teeth summary */}
      {selectedTeeth.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Tanlangan tishlar ({selectedTeeth.length})</p>
          <div className="flex flex-wrap gap-2">
            {selectedTeeth.map(t => (
              <Badge key={t.tooth_number} variant="secondary" className="gap-1 text-xs py-1 px-2">
                <span className="font-semibold">#{t.tooth_number}</span>
                {t.procedure && <span>— {procedureLabel(t.procedure)}</span>}
                {t.notes && <span className="text-muted-foreground">({t.notes})</span>}
                {!readOnly && (
                  <button onClick={() => removeTooth(t.tooth_number)} className="ml-1 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ToothChart;
