import { type LucideIcon } from "lucide-react";

interface SliderFieldProps {
  icon: LucideIcon;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

const SliderField = ({ icon: Icon, label, value, min, max, onChange }: SliderFieldProps) => (
  <div className="space-y-4 group/field">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2.5 text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] group-hover/field:text-primary transition-colors">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <span className="text-sm font-black text-primary tabular-nums">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-1.5 bg-field-border rounded-full appearance-none cursor-pointer accent-primary"
    />
  </div>
);

export default SliderField;
