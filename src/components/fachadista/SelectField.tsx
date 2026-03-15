import { ChevronDown } from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface SelectFieldProps {
  icon: LucideIcon;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

const SelectField = ({ icon: Icon, label, value, options, onChange, disabled }: SelectFieldProps) => (
  <div className={`space-y-3 group/field ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
    <div className="flex items-center gap-2.5 text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] group-hover/field:text-primary transition-colors">
      <Icon className="w-4 h-4" />
      {label}
    </div>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-field-bg border border-field-border rounded-2xl px-5 py-4 text-sm text-foreground outline-none focus:border-field-focus focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer pr-12 transition-all hover:bg-surface-hover"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-surface">{opt}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
    </div>
  </div>
);

export default SelectField;
