export type LightingMode = 'Manhã' | 'Tarde' | 'Fim de Tarde' | 'Noturno' | 'Nenhuma das opção';
export type WeatherMode = 'Dia de Sol' | 'Nublado' | 'Chuvoso' | 'Pós-Chuva' | 'Nenhuma das opção';
export type SocialFormat =
  | 'Instagram / TikTok (9:16)'
  | 'Instagram Portrait (4:5)'
  | 'Post / Feed (1:1)'
  | 'YouTube / TV (16:9)'
  | 'Fotografia (3:2)'
  | 'Cinematográfico (2.35:1)'
  | 'Vertical Clássico (2:3)'
  | 'Nenhuma das opção';
export type VisualStyle = 'Hiper-realista' | 'V-Ray Render' | 'Unreal Engine 5' | 'Sketch / Croqui' | 'Maquete Eletrônica' | 'Nenhuma das opção';
export type CameraAngle = 'Nível do Olhar' | 'Grande Angular' | 'Close-up' | 'Drone / Aéreo' | 'Manter ângulo da referência' | 'Nenhuma das opção';
export type ProjectType = 'Fachada Comercial' | 'Residencial' | 'Industrial' | 'Planta Arquitetônica' | 'Detalhamento Técnico' | 'Projeto de Interiores' | 'Nenhuma das opção';
export type EnvironmentType =
  | 'Urbano / Metrópole'
  | 'Residencial / Subúrbio'
  | 'Vegetação / Floresta'
  | 'Litoral / Marítimo'
  | 'Montanhoso / Alpino'
  | 'Industrial / Galpão'
  | 'Centro Histórico'
  | 'Desértico / Árido'
  | 'Nenhuma das opção';

export type SidewalkType =
  | 'Concreto Clássico'
  | 'Pedra Portuguesa'
  | 'Bloco Intertravado'
  | 'Pedra São Tomé'
  | 'Gramado com Pisantes'
  | 'Cimento Queimado'
  | 'Nenhuma das opção';

export interface PromptParameters {
  projectType: ProjectType;
  socialFormat: SocialFormat;
  visualStyle: VisualStyle;
  environmentType: EnvironmentType;
  cameraAngle: CameraAngle;
  lighting: LightingMode;
  weather: WeatherMode;
  peopleCount: number;
  carCount: number;
  environmentDetails: string;
  illuminatedSignage: boolean;
  sidewalkEnabled: boolean;
  sidewalkType: SidewalkType;
  blurReference: boolean;
}

export interface GeneratedPrompt {
  id: string;
  english: string;
  portuguese: string;
  tags: string[];
  timestamp: number;
  previewUrl?: string;
}
