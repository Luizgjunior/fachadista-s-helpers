import { Camera, Wind, Map, Building, Layout, Palette, Focus, Sun, Globe, Lightbulb, Footprints, Users, Car, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { CREDIT_COSTS } from "@/hooks/useCredits";
import SelectField from "./SelectField";
import SliderField from "./SliderField";
import ToggleSwitch from "./ToggleSwitch";
import { PromptParameters, ProjectType, CameraAngle, SidewalkType } from "@/types/fachadista";

type TabType = 'scene' | 'atmos' | 'entorno';

const promptLoadingMessages = [
  "Analisando o projeto...",
  "Identificando materiais...",
  "Calculando iluminação ideal...",
  "Estruturando o prompt...",
  "Otimizando para Midjourney...",
];

interface ControlPanelContentProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  params: PromptParameters;
  setParams: React.Dispatch<React.SetStateAction<PromptParameters>>;
  images: string[];
  loading: boolean;
  onGenerate: () => void;
}

/** Inner content — reused in desktop panel and mobile drawer */
export const ControlPanelContent = ({ activeTab, setActiveTab, params, setParams, images, loading, onGenerate }: ControlPanelContentProps) => (
  <div className="space-y-5 md:space-y-10">
    {/* Tab bar */}
    <div className="flex items-center gap-1 p-1 md:p-1.5 bg-secondary border border-border rounded-xl md:rounded-[22px]">
      {([
        { key: 'scene' as TabType, icon: Camera, label: 'Cena' },
        { key: 'atmos' as TabType, icon: Wind, label: 'Ambiente' },
        { key: 'entorno' as TabType, icon: Map, label: 'Entorno' },
      ]).map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => setActiveTab(key)}
          className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-2.5 md:py-3.5 rounded-[10px] md:rounded-[18px] text-[10px] md:text-[11px] font-black uppercase tracking-wider transition-all ${
            activeTab === key
              ? 'bg-surface text-primary shadow-md border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span>{label}</span>
        </button>
      ))}
    </div>

    {/* Tab content */}
    <div className="min-h-[280px] md:min-h-[420px] flex flex-col">
      {activeTab === 'scene' && (
        <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          <SelectField icon={Building} label="Tipo de projeto" value={params.projectType}
            options={['Fachada Comercial', 'Residencial', 'Industrial', 'Planta Arquitetônica', 'Detalhamento Técnico', 'Projeto de Interiores', 'Nenhuma das opção']}
            onChange={(v) => setParams(p => ({ ...p, projectType: v as ProjectType }))} />
          <SelectField icon={Layout} label="Formato" value={params.socialFormat}
            options={['Instagram / TikTok (9:16)', 'Instagram Portrait (4:5)', 'Post / Feed (1:1)', 'YouTube / TV (16:9)', 'Fotografia (3:2)', 'Cinematográfico (2.35:1)', 'Vertical Clássico (2:3)', 'Nenhuma das opção']}
            onChange={(v) => setParams(p => ({ ...p, socialFormat: v as any }))} />
          <SelectField icon={Palette} label="Tipo de render" value={params.visualStyle}
            options={['Hiper-realista', 'V-Ray Render', 'Unreal Engine 5', 'Sketch / Croqui', 'Maquete Eletrônica', 'Nenhuma das opção']}
            onChange={(v) => setParams(p => ({ ...p, visualStyle: v as any }))} />
          <SelectField icon={Focus} label="Ângulo de Câmera" value={params.cameraAngle}
            options={['Manter ângulo da referência', 'Nível do Olhar', 'Grande Angular', 'Close-up', 'Drone / Aéreo', 'Nenhuma das opção']}
            onChange={(v) => setParams(p => ({ ...p, cameraAngle: v as CameraAngle }))} />
        </div>
      )}

      {activeTab === 'atmos' && (
        <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          <SelectField icon={Sun} label="Luz Principal" value={params.lighting}
            options={['Manhã', 'Tarde', 'Fim de Tarde', 'Noturno', 'Nenhuma das opção']}
            onChange={(v) => setParams(p => ({ ...p, lighting: v as any }))} />
          <SelectField icon={Globe} label="Clima / Sky" value={params.weather}
            options={['Dia de Sol', 'Nublado', 'Chuvoso', 'Pós-Chuva', 'Nenhuma das opção']}
            onChange={(v) => setParams(p => ({ ...p, weather: v as any }))} />
          <div
            onClick={() => setParams(p => ({ ...p, illuminatedSignage: !p.illuminatedSignage }))}
            className="flex items-center justify-between p-4 md:p-6 bg-field-bg border border-field-border rounded-xl md:rounded-[28px] group hover:border-primary/30 transition-all cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 md:gap-5">
              <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all ${params.illuminatedSignage ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-secondary text-muted-foreground'}`}>
                <Lightbulb className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <span className="text-[10px] md:text-[12px] font-black text-foreground uppercase tracking-widest block">Letreiro</span>
                <span className="text-[9px] md:text-[11px] font-medium text-muted-foreground uppercase tracking-tight">Backlit / Halo</span>
              </div>
            </div>
            <div className={`relative w-11 h-6 md:w-12 md:h-6 rounded-full transition-all duration-300 flex-shrink-0 ${params.illuminatedSignage ? 'bg-toggle-on' : 'bg-toggle-off'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-surface rounded-full transition-all duration-300 shadow-sm ${params.illuminatedSignage ? 'left-6 md:left-7' : 'left-1'}`} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'entorno' && (
        <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          <SelectField icon={Map} label="Entorno" value={params.environmentType}
            options={['Urbano / Metrópole', 'Residencial / Subúrbio', 'Vegetação / Floresta', 'Litoral / Marítimo', 'Montanhoso / Alpino', 'Industrial / Galpão', 'Centro Histórico', 'Desértico / Árido', 'Nenhuma das opção']}
            onChange={(v) => setParams(p => ({ ...p, environmentType: v as any }))} />

          <div className="space-y-3 md:space-y-5">
            <div
              onClick={() => setParams(p => ({ ...p, sidewalkEnabled: !p.sidewalkEnabled }))}
              className="flex items-center justify-between p-3.5 md:p-5 bg-field-bg border border-field-border rounded-xl md:rounded-[28px] group hover:border-primary/30 transition-all cursor-pointer select-none"
            >
              <div className="flex items-center gap-3 md:gap-4">
                <Footprints className={`w-5 h-5 md:w-6 md:h-6 ${params.sidewalkEnabled ? 'text-primary' : 'text-muted-foreground/50'}`} />
                <div>
                  <span className="text-[10px] md:text-[12px] font-black text-foreground uppercase tracking-widest block">Calçada</span>
                  <span className="text-[9px] md:text-[11px] font-medium text-muted-foreground uppercase">Presença no entorno</span>
                </div>
              </div>
              <div className={`relative w-11 h-6 md:w-12 md:h-6 rounded-full transition-all duration-300 flex-shrink-0 ${params.sidewalkEnabled ? 'bg-toggle-on' : 'bg-toggle-off'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-surface rounded-full transition-all duration-300 shadow-sm ${params.sidewalkEnabled ? 'left-6 md:left-7' : 'left-1'}`} />
              </div>
            </div>

            <SelectField icon={Palette} label="Tipo de Calçada" value={params.sidewalkType}
              disabled={!params.sidewalkEnabled}
              options={['Concreto Clássico', 'Pedra Portuguesa', 'Bloco Intertravado', 'Pedra São Tomé', 'Gramado com Pisantes', 'Cimento Queimado', 'Nenhuma das opção']}
              onChange={(v) => setParams(p => ({ ...p, sidewalkType: v as SidewalkType }))} />
          </div>

          <div className="grid grid-cols-1 gap-5 md:gap-8 bg-field-bg p-4 md:p-8 rounded-2xl md:rounded-[32px] border border-field-border shadow-inner shadow-muted/50">
            <SliderField icon={Users} label="Pessoas" value={params.peopleCount} min={0} max={25} onChange={(v) => setParams(p => ({ ...p, peopleCount: v }))} />
            <SliderField icon={Car} label="Veículos" value={params.carCount} min={0} max={20} onChange={(v) => setParams(p => ({ ...p, carCount: v }))} />
          </div>

          <div className="space-y-2.5 md:space-y-4">
            <span className="text-[9px] md:text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-primary" /> Materiais & Entorno
            </span>
            <textarea
              value={params.environmentDetails}
              onChange={(e) => setParams(p => ({ ...p, environmentDetails: e.target.value }))}
              placeholder="Ex: Concreto ripado, vegetação tropical..."
              className="w-full bg-field-bg border border-field-border rounded-xl md:rounded-3xl p-3.5 md:p-6 text-sm text-foreground min-h-[80px] md:min-h-[140px] resize-none focus:border-field-focus/50 outline-none transition-all leading-relaxed placeholder:text-muted-foreground/50 shadow-inner shadow-muted/50"
            />
          </div>
        </div>
      )}
    </div>

    {/* Generate button — only in desktop panel, mobile has its own bottom bar */}
    <DesktopGenerateButton images={images} loading={loading} onGenerate={onGenerate} />
  </div>
);

interface ControlPanelProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  params: PromptParameters;
  setParams: React.Dispatch<React.SetStateAction<PromptParameters>>;
  images: string[];
  loading: boolean;
  onGenerate: () => void;
}

/** Desktop sidebar wrapper — hidden on mobile */
const ControlPanel = (props: ControlPanelProps) => (
  <div className="hidden lg:block lg:col-span-12 xl:col-span-4 sticky top-28 self-start">
    <div className="glass-panel rounded-3xl xl:rounded-[45px] p-6 xl:p-10 shadow-2xl shadow-muted/30 relative overflow-hidden">
      <ControlPanelContent {...props} />
    </div>
  </div>
);

export default ControlPanel;
