interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
}

const ToggleSwitch = ({ enabled, onToggle }: ToggleSwitchProps) => (
  <button
    onClick={(e) => { e.stopPropagation(); onToggle(); }}
    className={`relative w-11 h-6 md:w-12 md:h-6 rounded-full transition-all duration-300 flex-shrink-0 ${enabled ? 'bg-toggle-on' : 'bg-toggle-off'}`}
  >
    <div className={`absolute top-1 w-4 h-4 bg-surface rounded-full transition-all duration-300 shadow-sm ${enabled ? 'left-6 md:left-7' : 'left-1'}`} />
  </button>
);

export default ToggleSwitch;
