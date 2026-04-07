import { useState } from "react";
import { useRole } from "@/contexts/RoleContext";
import { Palette, Upload, Building2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const colorPresets = [
  { label: "Laranja Zaytan", value: "#FF6E27" },
  { label: "Azul", value: "#3B82F6" },
  { label: "Verde", value: "#10B981" },
  { label: "Roxo", value: "#8B5CF6" },
  { label: "Rosa", value: "#EC4899" },
  { label: "Vermelho", value: "#EF4444" },
];

const Configuracoes = () => {
  const { whiteLabel, setWhiteLabel } = useRole();
  const [name, setName] = useState(whiteLabel.companyName);
  const [color, setColor] = useState(whiteLabel.primaryColor);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(whiteLabel.logo);
  const [saved, setSaved] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setWhiteLabel({ companyName: name, primaryColor: color, logo: logoPreview });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Personalize a aparência da sua plataforma</p>
      </div>

      {/* Branding */}
      <div className="metric-card space-y-5">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" /> Branding
        </h3>

        {/* Logo */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-2">Logo da Empresa</label>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl border border-border flex items-center justify-center bg-muted overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <label className="cursor-pointer">
                <span className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                  <Upload className="h-3.5 w-3.5" /> Fazer upload
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
              <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG ou SVG. Máx 2MB.</p>
            </div>
          </div>
        </div>

        {/* Company Name */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Nome da Empresa</label>
          <input
            className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome da empresa"
          />
        </div>

        {/* Primary Color */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-2">Cor Primária</label>
          <div className="flex flex-wrap gap-2">
            {colorPresets.map(c => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-2 border transition-all ${
                  color === c.value ? "border-foreground shadow-sm" : "border-border hover:border-foreground/30"
                }`}
              >
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: c.value }} />
                {c.label}
                {color === c.value && <Check className="h-3 w-3" />}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="h-8 w-8 rounded cursor-pointer border-0"
            />
            <span className="text-xs text-muted-foreground">{color}</span>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          {saved ? <><Check className="h-4 w-4 mr-1" /> Salvo!</> : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
};

export default Configuracoes;
