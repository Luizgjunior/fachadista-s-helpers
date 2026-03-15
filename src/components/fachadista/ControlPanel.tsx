import { Camera, Wind, Map, Building, Layout, Palette, Focus, Sun, Globe, Lightbulb, Footprints, Users, Car, Zap } from "lucide-react";
import SelectField from "./SelectField";
import SliderField from "./SliderField";
import ToggleSwitch from "./ToggleSwitch";
import { PromptParameters, ProjectType, CameraAngle, SidewalkType } from "@/types/fachadista";

type TabType = 'scene' | 'atmos' | 'entorno';

interface ControlPanelProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  params: PromptParameters;
  setParams: React.Dispatch<React.SetStateAction<PromptParameters>>;
  images: string[];
  loading: boolean;
  onGenerate: () => void;
}

const ControlPanel = ({ activeTab, setActiveTab, params, setParams, images, loading, onGenerate }: ControlPanelProps) => (
  <div className="lg:col-span-12 xl:col-span-4 sticky top-10 self-start">
    <div className="glass-panel rounded-[45px] p-8 md:p-10 space-y-10 shadow-2xl shadow-muted/30 relative overflow-hidden">
      <div className="flex items-center gap-2 p-1.5 bg-secondary border border-border rounded-[22px] mb-4">
        {([
          { key: 'scene' as TabType, icon: Camera, label: 'Cena' },
          { key: 'atmos' as TabType, icon: Wind, label: 'Ambiente' },
          { key: 'entorno' as TabType, icon: Map, label: 'Entorno' },
        ]).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-[18px] text-[11px] font-black uppercase tracking-wider transition-all ${
              activeTab === key
                ? 'bg-surface text-primary shadow-md border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" /> <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[420px] flex flex-col">
        {activeTab === 'scene' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <SelectField
              icon={Building} label="Tipo de projeto" value={params.projectType}
              options={['Fachada Comercial', 'Residencial', 'Industrial', 'Planta Arquitetônica', 'Detalhamento Técnico', 'Projeto de Interiores', 'Nenhuma das opção']}
              onChange={(v) => setParams(p => ({ ...p, projectType: v as ProjectType }))}
            />
            <SelectField
              icon={Layout} label="Formato" value={params.socialFormat}
              options={['Instagram / TikTok (9:16)', 'Instagram Portrait (4:5)', 'Post / Feed (1:1)', 'YouTube / TV (16:9)', 'Fotografia (3:2)', 'Cinematográfico (2.35:1)', 'Vertical Clássico (2:3)', 'Nenhuma das opção']}
              onChange={(v) => setParams(p => ({ ...p, socialFormat: v as any }))}
            />
            <SelectField
              icon={Palette} label="Tipo de render" value={params.visualStyle}
              options={['Hiper-realista', 'V-Ray Render', 'Unreal Engine 5', 'Sketch / Croqui', 'Maquete Eletrônica', 'Nenhuma das opção']}
              onChange={(v) => setParams(p => ({ ...p, visualStyle: v as any }))}
            />
            <SelectField
              icon={Focus} label="Ângulo de Câmera" value={params.cameraAngle}
              options={['Manter ângulo da referência', 'Nível do Olhar', 'Grande Angular', 'Close-up', 'Drone / Aéreo', 'Nenhuma das opção']}
              onChange={(v) => setParams(p => ({ ...p, cameraAngle: v as CameraAngle }))}
            />
          </div>
        )}

        {activeTab === 'atmos' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <SelectField
              icon={Sun} label="Luz Principal" value={params.lighting}
              options={['Manhã', 'Tarde', 'Fim de Tarde', 'Noturno', 'Nenhuma das opção']}
              onChange={(v) => setParams(p => ({ ...p, lighting: v as any }))}
            />
            <SelectField
              icon={Globe} label="Clima / Sky" value={params.weather}
              options={['Dia de Sol', 'Nublado', 'Chuvoso', 'Pós-Chuva', 'Nenhuma das opção']}
              onChange={(v) => setParams(p => ({ ...p, weather: v as any }))}
            />
            <div
              onClick={() => setParams(p => ({ ...p, illuminatedSignage: !p.illuminatedSignage }))}
              className="flex items-center justify-between p-6 bg-field-bg border border-field-border rounded-[28px] group hover:border-primary/30 transition-all cursor-pointer select-none"
            >
              <div className="flex items-center gap-5">
                <div className={`p-3 rounded-2xl transition-all ${params.illuminatedSignage ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-secondary text-muted-foreground'}`}>
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[12px] font-black text-foreground uppercase tracking-widest block">Letreiro</span>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-tight">Efeito Backlit / Halo</span>
                </div>
              </div>
              <ToggleSwitch enabled={params.illuminatedSignage} onToggle={() => setParams(p => ({ ...p, illuminatedSignage: !p.illuminatedSignage }))} />
            </div>
          </div>
        )}

        {activeTab === 'entorno' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <SelectField
              icon={Map} label="Entorno" value={params.environmentType}
              options={['Urbano / Metrópole', 'Residencial / Subúrbio', 'Vegetação / Floresta', 'Litoral / Marítimo', 'Montanhoso / Alpino', 'Industrial / Galpão', 'Centro Histórico', 'Desértico / Árido', 'Nenhuma das opção']}
              onChange={(v) => setParams(p => ({ ...p, environmentType: v as any }))}
            />

            <div className="space-y-5 pt-2">
              <div
                onClick={() => setParams(p => ({ ...p, sidewalkEnabled: !p.sidewalkEnabled }))}
                className="flex items-center justify-between p-5 bg-field-bg border border-field-border rounded-[28px] group hover:border-primary/30 transition-all cursor-pointer select-none"
              >
                <div className="flex items-center gap-4">
                  <Footprints className={`w-6 h-6 ${params.sidewalkEnabled ? 'text-primary' : 'text-muted-foreground/50'}`} />
                  <div>
                    <span className="text-[12px] font-black text-foreground uppercase tracking-widest block">Calçada / Passeio</span>
                    <span className="text-[11px] font-medium text-muted-foreground uppercase">Presença no entorno</span>
                  </div>
                </div>
                <ToggleSwitch enabled={params.sidewalkEnabled} onToggle={() => setParams(p => ({ ...p, sidewalkEnabled: !p.sidewalkEnabled }))} />
              </div>

              <SelectField
                icon={Palette} label="Tipo de Calçada" value={params.sidewalkType}
                disabled={!params.sidewalkEnabled}
                options={['Concreto Clássico', 'Pedra Portuguesa', 'Bloco Intertravado', 'Pedra São Tomé', 'Gramado com Pisantes', 'Cimento Queimado', 'Nenhuma das opção']}
                onChange={(v) => setParams(p => ({ ...p, sidewalkType: v as SidewalkType }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-8 bg-field-bg p-6 md:p-8 rounded-[32px] border border-field-border shadow-inner shadow-muted/50">
              <SliderField icon={Users} label="Pessoas" value={params.peopleCount} min={0} max={25} onChange={(v) => setParams(p => ({ ...p, peopleCount: v }))} />
              <SliderField icon={Car} label="Veículos" value={params.carCount} min={0} max={20} onChange={(v) => setParams(p => ({ ...p, carCount: v }))} />
            </div>

            <div className="space-y-4">
              <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Materiais & Entorno Detalhado
              </span>
              <textarea
                value={params.environmentDetails}
                onChange={(e) => setParams(p => ({ ...p, environmentDetails: e.target.value }))}
                placeholder="Ex: Concreto ripado, vegetação tropical, asfalto molhado, mobiliário urbano minimalista..."
                className="w-full bg-field-bg border border-field-border rounded-3xl p-6 text-sm text-foreground min-h-[140px] resize-none focus:border-field-focus/50 outline-none transition-all leading-relaxed placeholder:text-muted-foreground/50 shadow-inner shadow-muted/50"
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onGenerate}
        disabled={images.length === 0 || loading}
        className={`w-full py-7 rounded-[32px] font-black text-base md:text-lg uppercase tracking-[0.4em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-5 mt-10 ${
          images.length === 0
            ? 'bg-secondary text-muted-foreground/50 opacity-50'
            : 'bg-primary text-primary-foreground hover:opacity-90 shadow-primary/30'
        }`}
      >
        {loading ? (
          <span className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
        ) : (
          <span className="text-primary-foreground">✦</span>
        )}
        {loading ? 'PROCESSANDO...' : 'GERAR MASTER PROMPT'}
      </button>
    </div>
  </div>
);

export default ControlPanel;
