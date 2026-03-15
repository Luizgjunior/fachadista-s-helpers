import { Upload, Trash2, Clipboard, Wind } from "lucide-react";
import ToggleSwitch from "./ToggleSwitch";

interface ImageUploadZoneProps {
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  loading: boolean;
  blurReference: boolean;
  onToggleBlur: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDrop: (e: React.DragEvent) => void;
}

const ImageUploadZone = ({
  images, setImages, isDragging, setIsDragging, loading,
  blurReference, onToggleBlur, fileInputRef, onDrop
}: ImageUploadZoneProps) => (
  <div className="space-y-4 md:space-y-6">
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`relative group rounded-3xl md:rounded-[45px] overflow-hidden bg-surface border shadow-xl shadow-muted/50 transition-all duration-500 flex flex-col items-center justify-center ${
        images.length > 0 ? 'aspect-[4/3] md:aspect-video' : 'min-h-[260px] md:min-h-[380px] lg:aspect-video'
      } ${isDragging ? 'border-primary bg-brand-light scale-[0.99]' : 'border-border/60'}`}
    >
      {images.length > 0 ? (
        <div className="w-full h-full relative group p-3 md:p-4 grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 overflow-y-auto max-h-full">
          {images.map((img, idx) => (
            <div key={idx} className="relative aspect-video rounded-xl md:rounded-2xl overflow-hidden shadow-lg group/img">
              <img
                src={img}
                className={`w-full h-full object-cover transition-all duration-500 ${blurReference ? 'blur-md scale-110' : ''}`}
                alt={`Projeto ${idx + 1}`}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImages(prev => prev.filter((_, i) => i !== idx));
                }}
                className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-destructive text-destructive-foreground p-1 md:p-1.5 rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity shadow-lg"
              >
                <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
          ))}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="aspect-video rounded-xl md:rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-brand-light transition-all text-muted-foreground hover:text-primary"
          >
            <Upload className="w-5 h-5 md:w-6 md:h-6 mb-1.5 md:mb-2" />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Adicionar</span>
          </div>
          {loading && <div className="scan-line" />}
        </div>
      ) : (
        <div className="text-center p-6 md:p-12 w-full">
          <div className="bg-secondary p-6 md:p-10 rounded-full inline-block mb-6 md:mb-8 border border-border shadow-sm">
            <Upload className={`w-8 h-8 md:w-14 md:h-14 ${isDragging ? 'text-primary' : 'text-muted-foreground/50'}`} />
          </div>
          <h3 className="text-lg md:text-3xl font-black mb-2 md:mb-3 uppercase tracking-tighter text-foreground">Arraste seu Render</h3>
          <p className="text-muted-foreground text-[10px] md:text-sm uppercase tracking-widest mb-6 md:mb-10 max-w-[200px] md:max-w-none mx-auto leading-relaxed">Snapshot direto do seu software 3D</p>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-center md:gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full md:w-auto bg-primary text-primary-foreground px-6 py-4 md:px-10 md:py-5 rounded-xl md:rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 hover:opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 md:gap-3"
            >
              <Upload className="w-4 h-4" /> Selecionar Arquivo
            </button>
            <div className="w-full md:w-auto bg-surface border-2 border-dashed border-border text-muted-foreground px-6 py-4 md:px-10 md:py-5 rounded-xl md:rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 md:gap-3">
              <Clipboard className="w-4 h-4" /> Colar (Ctrl+V)
            </div>
          </div>
        </div>
      )}
    </div>

    {images.length > 0 && (
      <div className="flex items-center justify-between bg-surface/50 backdrop-blur-sm border border-border/60 p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
        <div className="flex items-center gap-2.5 md:gap-3">
          <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl ${blurReference ? 'bg-brand-light text-primary' : 'bg-secondary text-muted-foreground'}`}>
            <Wind className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-foreground">Desfoque de Referência</p>
            <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-tight font-medium hidden sm:block">Focar apenas na composição e volumes</p>
          </div>
        </div>
        <ToggleSwitch enabled={blurReference} onToggle={onToggleBlur} />
      </div>
    )}
  </div>
);

export default ImageUploadZone;
