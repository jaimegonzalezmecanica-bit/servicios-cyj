"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Shield,
  AlertTriangle,
  Map,
  Bell,
  User,
  UserX,
  Volume2,
  Car,
  ShieldAlert,
  DoorOpen,
  PawPrint,
  Flame,
  MoreHorizontal,
  MapPin,
  ChevronRight,
  Camera,
  Send,
  CheckCircle2,
  Clock,
  MessageSquare,
  Settings,
  Users,
  Flag,
  X,
  Phone,
  Mail,
  FileText,
  HelpCircle,
  Share2,
  LogOut,
  Heart,
  Filter,
  Plus,
  XCircle,
} from "lucide-react";
import {
  mockAlerts,
  incidentMarkers,
  reportCategories,
  userProfile,
  communityStats,
  type Alert,
  type IncidentMarker,
} from "@/lib/mock-data";

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

type TabId = "home" | "report" | "map" | "alerts" | "profile";

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */

const TABS: TabDef[] = [
  { id: "home", label: "Inicio", icon: Shield },
  { id: "report", label: "Reportar", icon: AlertTriangle },
  { id: "map", label: "Mapa", icon: Map },
  { id: "alerts", label: "Alertas", icon: Bell },
  { id: "profile", label: "Perfil", icon: User },
];

const ALERT_FILTERS = ["Todas", "Activas", "Resueltas", "Mías"];

const MAP_FILTERS = ["Todos", "Hoy", "Críticos", "Resueltos", "Mi zona"];

/* ═══════════════════════════════════════════════════════════
   HELPER: Category Icon Component
   ═══════════════════════════════════════════════════════════ */

function CategoryIcon({ name, size = 18, className = "" }: { name: string; size?: number; className?: string }) {
  const props = { size, className };
  switch (name) {
    case "user-x":
      return <UserX {...props} />;
    case "volume-2":
      return <Volume2 {...props} />;
    case "car":
      return <Car {...props} />;
    case "shield-alert":
      return <ShieldAlert {...props} />;
    case "door-open":
      return <DoorOpen {...props} />;
    case "paw-print":
      return <PawPrint {...props} />;
    case "flame":
      return <Flame {...props} />;
    case "flag":
      return <Flag {...props} />;
    case "more-horizontal":
      return <MoreHorizontal {...props} />;
    default:
      return <AlertTriangle {...props} />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "activa":
      return "border-red-500 bg-red-50 text-red-700";
    case "en_revision":
      return "border-amber-500 bg-amber-50 text-amber-700";
    case "resuelta":
      return "border-green-500 bg-green-50 text-green-700";
    default:
      return "border-slate-300 bg-slate-50 text-slate-700";
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "critical":
      return "bg-red-600";
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-amber-500";
    case "low":
      return "bg-blue-500";
    default:
      return "bg-slate-500";
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case "critical":
      return "#dc2626";
    case "warning":
      return "#f97316";
    case "info":
      return "#3b82f6";
    default:
      return "#64748b";
  }
}

/* ═══════════════════════════════════════════════════════════
   SOS OVERLAY COMPONENT
   ═══════════════════════════════════════════════════════════ */

function SOSOverlay({ onCancel }: { onCancel: () => void }) {
  const [countdown, setCountdown] = useState(30);
  const [isHolding, setIsHolding] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (isHolding) {
      const timer = setTimeout(() => {
        onCancel();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isHolding, onCancel]);

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-red-700 via-red-600 to-red-800 flex flex-col items-center justify-center text-white">
      <div className="absolute inset-0 opacity-20">
        <Image src="/download/sos-bg.png" alt="" fill className="object-cover" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 px-8">
        {/* Pulse rings */}
        <div className="relative">
          <div className="absolute inset-0 w-32 h-32 rounded-full bg-red-400/30 animate-ping" />
          <div className="absolute inset-0 w-32 h-32 rounded-full bg-red-400/20 animate-pulse" style={{ animationDelay: "0.5s" }} />
          <div className="relative w-32 h-32 rounded-full bg-red-500 border-4 border-white/30 flex items-center justify-center">
            <span className="text-5xl font-black tracking-wider">SOS</span>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">ALERTA DE EMERGENCIA</h2>
          <p className="text-red-100 text-sm">Tu ubicación ha sido compartida con la comunidad</p>
        </div>

        {/* Countdown */}
        <div className="bg-black/20 rounded-2xl px-8 py-4 backdrop-blur-sm">
          <div className="text-5xl font-mono font-bold tabular-nums">{countdown}s</div>
          <p className="text-red-200 text-xs mt-1 text-center">Alerta activa</p>
        </div>

        <div className="w-full space-y-3">
          <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
            <MapPin className="w-5 h-5 mx-auto mb-1 text-white/80" />
            <p className="text-sm text-white/90">Ubicación enviada al administrador y guardias</p>
          </div>
        </div>

        {/* Cancel button */}
        <button
          onMouseDown={() => setIsHolding(true)}
          onMouseUp={() => setIsHolding(false)}
          onMouseLeave={() => setIsHolding(false)}
          onTouchStart={() => setIsHolding(true)}
          onTouchEnd={() => setIsHolding(false)}
          className={`mt-4 px-8 py-4 rounded-2xl text-base font-semibold transition-all ${
            isHolding
              ? "bg-white text-red-600 scale-95"
              : "bg-white/10 text-white/80 border border-white/20"
          }`}
        >
          {isHolding ? "Soltando... cancelando" : "Mantener presionado para cancelar"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 1: HOME (Inicio)
   ═══════════════════════════════════════════════════════════ */

function HomeTab({
  onNavigate,
  onSOSActivate,
}: {
  onNavigate: (tab: TabId) => void;
  onSOSActivate: () => void;
}) {
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);
  const { toast } = useToast();
  const recentAlerts = mockAlerts.slice(0, 3);

  const handleSOS = () => {
    setShowSOSConfirm(false);
    onSOSActivate();
    toast({
      title: "Alerta SOS Activada",
      description: "Tu ubicación ha sido compartida con la comunidad.",
    });
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Hola,</p>
          <h1 className="text-lg font-bold text-slate-900">{userProfile.name}</h1>
        </div>
        <button
          className="relative w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center"
          onClick={() => onNavigate("alerts")}
        >
          <Bell className="w-5 h-5 text-slate-700" />
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
            3
          </span>
        </button>
      </div>

      {/* Condo name */}
      <div className="bg-blue-50 rounded-xl px-4 py-2 flex items-center gap-2">
        <Shield className="w-4 h-4 text-blue-600" />
        <span className="text-sm text-blue-700 font-medium">{userProfile.condo}</span>
      </div>

      {/* Safety Status Card */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          <div>
            <h2 className="text-lg font-bold">Tu comunidad está SEGURA</h2>
            <p className="text-green-100 text-sm">No hay alertas activas en este momento</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="bg-white/20 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold">{communityStats.membersOnline}</div>
            <div className="text-[10px] text-green-100">En línea</div>
          </div>
          <div className="bg-white/20 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold">{communityStats.activeAlerts}</div>
            <div className="text-[10px] text-green-100">Alertas</div>
          </div>
          <div className="bg-white/20 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold">{communityStats.totalMembers}</div>
            <div className="text-[10px] text-green-100">Miembros</div>
          </div>
        </div>
      </div>

      {/* SOS Button */}
      <div className="flex justify-center py-4">
        <button
          onClick={() => setShowSOSConfirm(true)}
          className="relative group"
        >
          <div className="absolute inset-0 w-[120px] h-[120px] rounded-full bg-red-400/30 animate-ping" />
          <div className="absolute inset-0 w-[120px] h-[120px] rounded-full bg-red-400/20 animate-pulse" style={{ animationDelay: "0.5s" }} />
          <div className="relative w-[120px] h-[120px] rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-xl shadow-red-500/30 flex items-center justify-center active:scale-95 transition-transform">
            <div className="text-center">
              <span className="text-3xl font-black text-white tracking-wider">SOS</span>
              <p className="text-[9px] text-red-100 mt-0.5 font-medium">EMERGENCIA</p>
            </div>
          </div>
        </button>
      </div>

      {/* SOS Confirmation Bottom Sheet */}
      {showSOSConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSOSConfirm(false)} />
          <div className="relative bg-white rounded-t-3xl w-full max-w-md p-6 pb-8 space-y-4 animate-slide-up">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto" />
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">¿Activar alerta de emergencia?</h3>
              <p className="text-sm text-slate-500">Tu ubicación actual será compartida con todos los miembros de la comunidad y el administrador.</p>
            </div>
            <div className="space-y-2">
              <Button
                onClick={handleSOS}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-base font-semibold rounded-xl"
              >
                Activar SOS
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSOSConfirm(false)}
                className="w-full py-5 text-base rounded-xl"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Reportar", icon: Flag, tab: "report" as TabId, color: "bg-orange-50 text-orange-600" },
          { label: "Ver Mapa", icon: Map, tab: "map" as TabId, color: "bg-blue-50 text-blue-600" },
          { label: "Comunidad", icon: Users, tab: "alerts" as TabId, color: "bg-purple-50 text-purple-600" },
          { label: "Configurar", icon: Settings, tab: "profile" as TabId, color: "bg-slate-100 text-slate-600" },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => onNavigate(item.tab)}
            className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
          >
            <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center`}>
              <item.icon className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-slate-600">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Recent Alerts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Alertas Recientes</h3>
          <button
            onClick={() => onNavigate("alerts")}
            className="text-sm text-blue-600 font-medium flex items-center gap-1"
          >
            Ver todas <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {recentAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-start gap-3"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  alert.status === "activa"
                    ? "bg-red-100 text-red-600"
                    : alert.status === "en_revision"
                      ? "bg-amber-100 text-amber-600"
                      : "bg-green-100 text-green-600"
                }`}
              >
                <CategoryIcon name={alert.categoryIcon} size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-900 truncate">{alert.title}</h4>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2 py-0 border-0 ${getStatusColor(alert.status)}`}
                  >
                    {alert.status === "activa" ? "Activa" : alert.status === "en_revision" ? "Revisión" : "Resuelta"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {alert.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 2: REPORT (Reportar)
   ═══════════════════════════════════════════════════════════ */

function ReportTab({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [useLocation, setUseLocation] = useState(true);
  const [priority, setPriority] = useState<string>("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!selectedCategory) {
      toast({ title: "Selecciona una categoría", description: "Debes elegir el tipo de incidente.", variant: "destructive" });
      return;
    }
    if (!description.trim()) {
      toast({ title: "Agrega una descripción", description: "Describe lo que sucedió.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          description,
          location: useLocation ? "Ubicación actual" : "No especificada",
          isAnonymous,
          priority,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onNavigate("alerts");
        }, 2000);
      }
    } catch {
      toast({ title: "Error", description: "No se pudo enviar el reporte.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Reporte Enviado</h2>
        <p className="text-sm text-slate-500 text-center">Tu reporte ha sido registrado exitosamente. La comunidad será notificada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Reportar Incidente</h1>
        <p className="text-sm text-slate-500 mt-1">Selecciona la categoría y describe lo que sucedió</p>
      </div>

      {/* Category Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">Categoría</Label>
        <div className="grid grid-cols-4 gap-2">
          {reportCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all active:scale-95 ${
                selectedCategory === cat.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: cat.color + "15" }}
              >
                <CategoryIcon name={cat.icon} size={20} className="" />
                <style>{`
                  [data-cat-icon="${cat.id}"] { color: ${cat.color}; }
                `}</style>
              </div>
              <span className="text-[10px] font-medium text-slate-600 text-center leading-tight">
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">Descripción</Label>
        <Textarea
          placeholder="Describe lo que sucedió..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[100px] rounded-xl resize-none border-slate-200"
        />
      </div>

      {/* Location */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-slate-700">Ubicación actual</span>
          </div>
          <Switch checked={useLocation} onCheckedChange={setUseLocation} />
        </div>
        {useLocation && (
          <div className="relative h-32 rounded-xl overflow-hidden bg-slate-100">
            <Image src="/download/map-bg.png" alt="Mapa" fill className="object-cover" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-blue-500 w-4 h-4 rounded-full border-2 border-white shadow-lg" />
            </div>
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] text-slate-600">
              Calle Los Robles #234
            </div>
          </div>
        )}
      </div>

      {/* Photo attachment */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">Evidencia fotográfica</Label>
        <button className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center gap-2 active:bg-slate-50 transition-colors">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
            <Camera className="w-6 h-6 text-slate-400" />
          </div>
          <span className="text-sm font-medium text-slate-500">Agregar foto</span>
          <span className="text-[10px] text-slate-400">Toma una foto o selecciona de la galería</span>
        </button>
      </div>

      {/* Anonymous toggle */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
        <div>
          <span className="text-sm font-semibold text-slate-700">Reportar de forma anónima</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Tu identidad no será visible para otros</p>
        </div>
        <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
      </div>

      {/* Priority selector */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">Prioridad</Label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: "low", label: "Baja", color: "bg-blue-100 text-blue-700 border-blue-200" },
            { value: "medium", label: "Media", color: "bg-amber-100 text-amber-700 border-amber-200" },
            { value: "high", label: "Alta", color: "bg-orange-100 text-orange-700 border-orange-200" },
            { value: "critical", label: "Crítica", color: "bg-red-100 text-red-700 border-red-200" },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPriority(p.value)}
              className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all active:scale-95 ${
                priority === p.value ? p.color : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-base font-semibold rounded-xl"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Enviando...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Enviar Reporte
          </span>
        )}
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 3: MAP (Mapa)
   ═══════════════════════════════════════════════════════════ */

function MapTab() {
  const [selectedFilter, setSelectedFilter] = useState("Todos");
  const [selectedMarker, setSelectedMarker] = useState<IncidentMarker | null>(null);

  const filteredMarkers =
    selectedFilter === "Críticos"
      ? incidentMarkers.filter((m) => m.severity === "critical")
      : selectedFilter === "Resueltos"
        ? incidentMarkers.slice(4, 6)
        : incidentMarkers;

  return (
    <div className="space-y-0 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Mapa de Incidentes</h1>
        <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
          <Filter className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Map Area */}
      <div className="relative h-[380px] rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-100 mt-3">
        <Image src="/download/map-bg.png" alt="Mapa de la comunidad" fill className="object-cover" />

        {/* Grid overlay for map feel */}
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(30,64,175,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(30,64,175,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        {/* Condominium perimeter outline */}
        <div className="absolute inset-4 border-2 border-dashed border-blue-300 rounded-3xl" />

        {/* Current location */}
        <div className="absolute" style={{ left: "45%", top: "48%" }}>
          <div className="relative">
            <div className="absolute inset-0 w-6 h-6 bg-blue-400/30 rounded-full animate-ping" />
            <div className="relative w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap font-medium">
            Tú
          </span>
        </div>

        {/* Incident markers */}
        {filteredMarkers.map((marker) => (
          <button
            key={marker.id}
            onClick={() => setSelectedMarker(marker)}
            className="absolute transition-transform active:scale-90 hover:scale-110"
            style={{ left: `${marker.lng}%`, top: `${marker.lat}%` }}
          >
            <div
              className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
              style={{ backgroundColor: getSeverityColor(marker.severity) }}
            >
              {marker.severity === "critical" ? (
                <AlertTriangle className="w-4 h-4 text-white" />
              ) : marker.severity === "warning" ? (
                <AlertTriangle className="w-4 h-4 text-white" />
              ) : (
                <InfoIcon />
              )}
            </div>
          </button>
        ))}

        {/* Legend */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl p-2.5 shadow-lg space-y-1.5">
          <p className="text-[10px] font-semibold text-slate-700">Leyenda</p>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-600" />
            <span className="text-[10px] text-slate-500">Crítico</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-[10px] text-slate-500">Advertencia</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-[10px] text-slate-500">Info</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow" />
            <span className="text-[10px] text-slate-500">Mi ubicación</span>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
        {MAP_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
              selectedFilter === filter
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Selected marker bottom sheet */}
      {selectedMarker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedMarker(null)} />
          <div className="relative bg-white rounded-t-3xl w-full max-w-md p-6 pb-8 space-y-3 animate-slide-up">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto" />
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: getSeverityColor(selectedMarker.severity) + "15" }}
              >
                <AlertTriangle className="w-6 h-6" style={{ color: getSeverityColor(selectedMarker.severity) }} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">{selectedMarker.title}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{selectedMarker.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {selectedMarker.time}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {selectedMarker.distance}
                  </span>
                </div>
              </div>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
              Ver detalles completos
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 4: ALERTS (Alertas)
   ═══════════════════════════════════════════════════════════ */

function AlertsTab() {
  const [selectedFilter, setSelectedFilter] = useState("Todas");
  const { toast } = useToast();

  const filteredAlerts =
    selectedFilter === "Activas"
      ? mockAlerts.filter((a) => a.status === "activa")
      : selectedFilter === "Resueltas"
        ? mockAlerts.filter((a) => a.status === "resuelta")
        : selectedFilter === "Mías"
          ? mockAlerts.filter((_, i) => i % 3 === 0)
          : mockAlerts;

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Alertas Comunitarias</h1>
        <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
          <Filter className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {ALERT_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
              selectedFilter === filter
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Alert cards list */}
      {filteredAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <Bell className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm text-slate-400">No hay alertas en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
                alert.status === "activa"
                  ? "border-l-red-500"
                  : alert.status === "en_revision"
                    ? "border-l-amber-500"
                    : "border-l-green-500"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    alert.priority === "critical"
                      ? "bg-red-100 text-red-600"
                      : alert.priority === "high"
                        ? "bg-orange-100 text-orange-600"
                        : alert.priority === "medium"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-blue-100 text-blue-600"
                  }`}
                >
                  <CategoryIcon name={alert.categoryIcon} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-900 truncate">{alert.title}</h4>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-0 border-0 flex-shrink-0 ${getStatusColor(alert.status)}`}
                    >
                      {alert.status === "activa"
                        ? "Activa"
                        : alert.status === "en_revision"
                          ? "En revisión"
                          : "Resuelta"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{alert.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {alert.time}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {alert.location.split(" - ")[0]}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {alert.comments}
                    </span>
                  </div>
                  {alert.isAnonymous && (
                    <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <User className="w-3 h-3" /> Anónimo
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => {
          toast({ title: "Nueva alerta", description: "Redirigiendo al formulario de reporte..." });
        }}
        className="fixed bottom-24 right-4 md:right-[calc(50%-200px+16px)] w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-xl shadow-green-600/30 flex items-center justify-center active:scale-95 transition-transform z-40"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 5: PROFILE (Perfil)
   ═══════════════════════════════════════════════════════════ */

function ProfileTab() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    sos: true,
    reports: true,
    updates: false,
    community: true,
  });
  const [privacy, setPrivacy] = useState({
    location: true,
    profile: true,
    anonymous: false,
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSave = async () => {
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications, privacy }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Perfil actualizado", description: "Tus preferencias han sido guardadas." });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5 pb-4">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-white">{userProfile.avatarInitial}</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">{userProfile.name}</h1>
          <p className="text-sm text-blue-600 font-medium">{userProfile.role}</p>
          <p className="text-xs text-slate-400">{userProfile.condo}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { value: userProfile.reports, label: "Reportes", color: "bg-blue-50 text-blue-700" },
          { value: "Activa", label: "Comunidad", color: "bg-green-50 text-green-700" },
          { value: userProfile.memberSince, label: "Miembro desde", color: "bg-purple-50 text-purple-700" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-xl p-3 text-center`}>
            <div className="text-lg font-bold">{stat.value}</div>
            <div className="text-[10px] mt-0.5 opacity-70">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Personal Data */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <h3 className="px-4 py-3 text-sm font-bold text-slate-900 bg-slate-50 border-b border-slate-100">Datos Personales</h3>
        {[
          { icon: User, label: "Nombre", value: userProfile.name },
          { icon: Phone, label: "Teléfono", value: userProfile.phone },
          { icon: Mail, label: "Email", value: userProfile.email },
          { icon: MapPin, label: "Dirección", value: userProfile.address },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">{item.label}</span>
            </div>
            <span className="text-sm text-slate-900 font-medium">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Family */}
      <button className="w-full bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between active:bg-slate-50">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-slate-500" />
          <div className="text-left">
            <span className="text-sm font-medium text-slate-700">Familiares</span>
            <p className="text-[11px] text-slate-400">Administrar familiares autorizados</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">3</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </button>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <h3 className="px-4 py-3 text-sm font-bold text-slate-900 bg-slate-50 border-b border-slate-100">Notificaciones</h3>
        {[
          { key: "sos" as const, label: "Alertas SOS", desc: "Recibir alertas de emergencia" },
          { key: "reports" as const, label: "Reportes nuevos", desc: "Nuevos incidentes en la comunidad" },
          { key: "updates" as const, label: "Actualizaciones", desc: "Cambios en el estado de alertas" },
          { key: "community" as const, label: "Comunidad", desc: "Noticias y avisos generales" },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0">
            <div>
              <span className="text-sm font-medium text-slate-700">{item.label}</span>
              <p className="text-[11px] text-slate-400">{item.desc}</p>
            </div>
            <Switch
              checked={notifications[item.key]}
              onCheckedChange={(v) => setNotifications({ ...notifications, [item.key]: v })}
            />
          </div>
        ))}
      </div>

      {/* Privacy */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <h3 className="px-4 py-3 text-sm font-bold text-slate-900 bg-slate-50 border-b border-slate-100">Privacidad</h3>
        {[
          { key: "location" as const, label: "Mostrar ubicación", desc: "Compartir mi ubicación con la comunidad" },
          { key: "profile" as const, label: "Perfil visible", desc: "Otros pueden ver mi perfil" },
          { key: "anonymous" as const, label: "Reportes anónimos", desc: "Ocultar mi nombre en reportes" },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0">
            <div>
              <span className="text-sm font-medium text-slate-700">{item.label}</span>
              <p className="text-[11px] text-slate-400">{item.desc}</p>
            </div>
            <Switch
              checked={privacy[item.key]}
              onCheckedChange={(v) => setPrivacy({ ...privacy, [item.key]: v })}
            />
          </div>
        ))}
      </div>

      {/* Community info */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <h3 className="px-4 py-3 text-sm font-bold text-slate-900 bg-slate-50 border-b border-slate-100">Comunidad</h3>
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between">
          <span className="text-xs text-slate-500">Condominio</span>
          <span className="text-sm text-slate-900 font-medium">{userProfile.condo}</span>
        </div>
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between">
          <span className="text-xs text-slate-500">Rol</span>
          <span className="text-sm text-slate-900 font-medium">{userProfile.role}</span>
        </div>
        <div className="px-4 py-3 flex justify-between">
          <span className="text-xs text-slate-500">Admin</span>
          <span className="text-sm text-blue-600 font-medium">admin@losrobles.cl</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        <button
          onClick={() => toast({ title: "Compartir", description: "Enlace copiado al portapapeles" })}
          className="w-full bg-green-50 text-green-700 rounded-xl p-4 flex items-center gap-3 active:bg-green-100 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-semibold">Compartir App</span>
        </button>
        <button
          onClick={() => toast({ title: "Centro de Ayuda", description: "Próximamente disponible" })}
          className="w-full bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 active:bg-slate-50 transition-colors"
        >
          <HelpCircle className="w-5 h-5 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Centro de Ayuda</span>
          <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
        </button>
        <button className="w-full bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 active:bg-slate-50 transition-colors">
          <FileText className="w-5 h-5 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Términos y Condiciones</span>
          <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
        </button>
      </div>

      {/* Save button */}
      <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-xl">
        Guardar Cambios
      </Button>

      {/* Logout */}
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="w-full border-2 border-red-200 text-red-600 rounded-xl p-4 flex items-center justify-center gap-2 active:bg-red-50 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-semibold">Cerrar Sesión</span>
      </button>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-white rounded-2xl w-[85%] max-w-sm p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <LogOut className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">¿Cerrar sesión?</h3>
              <p className="text-sm text-slate-500">No recibirás más alertas de la comunidad</p>
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  toast({ title: "Sesión cerrada", description: "Has cerrado sesión exitosamente" });
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl"
              >
                Cerrar Sesión
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full rounded-xl"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Version */}
      <p className="text-center text-[10px] text-slate-300 pb-2">VigilApp v2.1.0 • Hecho con <Heart className="w-3 h-3 inline text-red-400" /> en Chile</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [sosActive, setSosActive] = useState(false);

  const handleNavigate = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return <HomeTab onNavigate={handleNavigate} onSOSActivate={() => setSosActive(true)} />;
      case "report":
        return <ReportTab onNavigate={handleNavigate} />;
      case "map":
        return <MapTab />;
      case "alerts":
        return <AlertsTab />;
      case "profile":
        return <ProfileTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      {/* Phone frame on desktop */}
      <div className="w-full max-w-md bg-slate-50 min-h-screen relative flex flex-col shadow-none md:shadow-2xl md:rounded-[2.5rem] md:border md:border-slate-200 overflow-hidden">
        {/* Status bar */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-6 pt-3 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between text-white/80">
            <span className="text-[10px] font-medium">9:41</span>
            <div className="flex items-center gap-1.5">
              <div className="flex items-end gap-0.5">
                <div className="w-1 h-1.5 bg-white/80 rounded-sm" />
                <div className="w-1 h-2.5 bg-white/80 rounded-sm" />
                <div className="w-1 h-3 bg-white/80 rounded-sm" />
                <div className="w-1 h-4 bg-white/60 rounded-sm" />
              </div>
              <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor" className="opacity-80 ml-1">
                <path d="M1 8.5h12v1H1zm1-3h10v1H2zm1-3h8v1H3z" />
                <rect x="0" y="7" width="3" height="3" rx="0.5" fill="currentColor" />
                <rect x="4" y="4" width="3" height="6" rx="0.5" fill="currentColor" />
                <rect x="8" y="1" width="3" height="9" rx="0.5" fill="currentColor" />
              </svg>
            </div>
          </div>
          {/* App bar */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-base">VigilApp</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[11px] text-white/70">En línea</span>
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="p-4 pt-4">
            {renderTabContent()}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex-shrink-0 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around px-2 pt-2 pb-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all active:scale-95 min-w-[56px] ${
                    isActive ? "text-blue-600" : "text-slate-400"
                  }`}
                >
                  <div className={`p-1.5 rounded-xl transition-colors ${isActive ? "bg-blue-50" : ""}`}>
                    <tab.icon className={`w-5 h-5 transition-all ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
                    {tab.label}
                  </span>
                  {tab.id === "alerts" && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
          {/* Home indicator bar */}
          <div className="flex justify-center pb-1.5">
            <div className="w-32 h-1 bg-slate-200 rounded-full" />
          </div>
        </div>
      </div>

      {/* SOS Overlay */}
      {sosActive && <SOSOverlay onCancel={() => setSosActive(false)} />}
    </div>
  );
}
