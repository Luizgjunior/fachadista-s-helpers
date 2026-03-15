interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
}

const ToggleSwitch = ({ enabled, onToggle }: ToggleSwitchProps) => (
  <button
    onClick={onToggle}
    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${enabled ? 'bg-toggle-on' : 'bg-toggle-off'}`}
  >
    <div className={`absolute top-1 w-4 h-4 bg-surface rounded-full transition-all duration-300 ${enabled ? 'left-7' : 'left-1'}`} />
  </button>
);

export default ToggleSwitch;
