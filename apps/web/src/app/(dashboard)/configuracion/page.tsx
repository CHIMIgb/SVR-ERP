"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Clock, Save, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/layout/Toast";
import { ventasApi, type TurnoConfig } from "@/lib/api";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => 
  `${String(i).padStart(2, "0")}:00`
);

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Permisos
  const vista = user?.vistas?.find((v) => v.ruta === "/configuracion");
  const puedeVer = vista?.puedeVer ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;

  // Estado
  const [config, setConfig] = useState<TurnoConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<TurnoConfig>>({
    apertura: "07:00",
    cierre: "20:00",
  });

  // Cargar config
  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ventasApi.config();
      if (res.success && res.data) {
        setConfig(res.data);
        setFormData({
          apertura: res.data.apertura,
          cierre: res.data.cierre,
        });
      } else {
        showToast("Error al cargar configuración", "error");
      }
    } catch {
      showToast("No se pudo conectar con el servidor", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Guardar
  const handleSave = async () => {
    if (!puedeEditar) return;
    setSaving(true);
    try {
      const res = await ventasApi.updateConfig(formData);
      if (res.success) {
        showToast("Configuración guardada correctamente", "success");
        setConfig(res.data);
      } else {
        showToast(res.error?.message ?? "Error al guardar", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setSaving(false);
    }
  };

  // Cambios en formulario
  const handleChange = (key: keyof TurnoConfig, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  if (!puedeVer) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <PageHeader title="Configuración" subtitle="Ajustes del sistema" />
        <Card className="max-w-xl mx-auto">
          <div className="flex items-center gap-4 p-8">
            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900">Sin permiso</h3>
              <p className="text-red-700 text-sm mt-1">
                Tu rol no tiene acceso a la configuración del sistema.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-2xl mx-auto">
      <PageHeader
        title="Configuración del Turno"
        subtitle="Horarios de apertura y cierre para el punto de venta"
      />

      {/* Estado de carga inicial */}
      {loading && (
        <Card>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </Card>
      )}

      {!loading && (
        <>
          {/* Formulario de horarios */}
          <Card>
            <div className="space-y-6 p-6">
              <h3 className="flex items-center gap-2 text-lg font-black text-slate-900">
                <Clock className="w-5 h-5 text-primary" />
                Horario de Atención
              </h3>
              <p className="text-sm text-slate-500">
                Define el horario en que el punto de venta está habilitado para cobrar.
                Fuera de este rango, el POS mostrará un mensaje de "Fuera de horario".
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Hora de Apertura"
                  type="time"
                  value={formData.apertura ?? ""}
                  onChange={(e) => handleChange("apertura", e.target.value)}
                  disabled={!puedeEditar}
                />
                <Input
                  label="Hora de Cierre"
                  type="time"
                  value={formData.cierre ?? ""}
                  onChange={(e) => handleChange("cierre", e.target.value)}
                  disabled={!puedeEditar}
                />
              </div>

              {puedeEditar && (
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <Button
                    variant="primary"
                    icon={<Save className="w-4 h-4" />}
                    onClick={handleSave}
                    loading={saving}
                    disabled={saving}
                  >
                    Guardar Cambios
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Vista previa de configuración actual */}
          {config && (
            <Card>
              <div className="p-6">
                <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 mb-4">
                  <Settings className="w-5 h-5 text-primary" />
                  Configuración Actual (en BD)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Apertura
                    </p>
                    <p className="font-black text-slate-900 text-2xl">{config.apertura}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Cierre
                    </p>
                    <p className="font-black text-slate-900 text-2xl">{config.cierre}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  Los cambios se aplican inmediatamente sin reiniciar el servidor.
                  El cache se invalida automáticamente (TTL 30s).
                </p>
              </div>
            </Card>
          )}

          {/* Info de impacto */}
          <Card className="bg-amber-50 border-amber-200">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-amber-900 font-bold text-sm">Impacto en el sistema</p>
                  <ul className="text-amber-800 text-xs mt-2 space-y-1 list-disc list-inside">
                    <li><strong>Punto de Venta (/ventas):</strong> Solo permite cobrar entre <code className="bg-white/50 px-1 rounded">{config?.apertura || "07:00"}</code> y <code className="bg-white/50 px-1 rounded">{config?.cierre || "20:00"}</code>.</li>
                    <li><strong>Corte de Caja (/ventas/corte):</strong> Solo permite cerrar después de la hora de cierre y hasta antes de la próxima apertura.</li>
                    <li>Cambios surten efecto inmediato (cache TTL 30s).</li>
                    <li>No requiere reinicio del backend ni del frontend.</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}