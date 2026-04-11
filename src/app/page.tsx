"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Phone,
  Mail,
  FileText,
  HelpCircle,
  Share2,
  LogOut,
  Heart,
  Filter,
  Plus,
  Crown,
  BadgeCheck,
  Home,
  Eye,
  Search,
  Lock,
  Building2,
  AlertCircle,
  Megaphone,
  Calendar,
  Wrench,
  Smartphone,
  Download,
  X,
  Trash2,
} from "lucide-react";
import {
  mockAlerts,
  incidentMarkers,
  reportCategories,
  communityStats,
  ROLES,
  hasPermission,
  getRole,
  sampleUsers,
  roleDistribution,
  towers,
  guardsOnDuty,
  announcements as mockAnnouncements,
  type Announcement,
  guardsOnDuty as mockGuards,
  type GuardOnDuty,
  type Alert,
  type IncidentMarker,
  type RoleId,
  type Role,
  type UserProfile,
  type SampleUser,
} from "@/lib/mock-data";

/* ═══════════════════════════════════════════════════════════
   DYNAMIC IMPORT: Leaflet Map (no SSR)
   ═══════════════════════════════════════════════════════════ */

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#0f4c81] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 mt-2">Cargando mapa...</p>
      </div>
    </div>
  ),
});

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

type TabId = "home" | "report" | "map" | "alerts" | "roles" | "admin" | "profile";

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ElementType;
  required: (role: Role) => boolean;
}

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */

const ALL_TABS: TabDef[] = [
  { id: "home", label: "Inicio", icon: Shield, required: (r) => r.permissions.canSOS || r.permissions.canViewAlerts },
  { id: "report", label: "Reportar", icon: AlertTriangle, required: (r) => r.permissions.canReport },
  { id: "map", label: "Mapa", icon: Map, required: (r) => r.permissions.canViewMap },
  { id: "alerts", label: "Alertas", icon: Bell, required: (r) => r.permissions.canViewAlerts },
  { id: "roles", label: "Roles", icon: Users, required: (r) => r.permissions.canManageUsers || r.permissions.canManageRoles },
  { id: "admin", label: "Admin", icon: Settings, required: (r) => r.permissions.canViewStats || r.permissions.canManageAlerts || r.permissions.canAssignGuards },
  { id: "profile", label: "Perfil", icon: User, required: () => true },
];

const ALERT_FILTERS = ["Todas", "Activas", "Resueltas", "Mías"];

const MAP_FILTERS = ["Todos", "Hoy", "Críticos", "Resueltos", "Mi zona"];

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

function CategoryIcon({ name, size = 18 }: { name: string; size?: number }) {
  const props = { size };
  switch (name) {
    case "user-x": return <UserX {...props} />;
    case "volume-2": return <Volume2 {...props} />;
    case "car": return <Car {...props} />;
    case "shield-alert": return <ShieldAlert {...props} />;
    case "door-open": return <DoorOpen {...props} />;
    case "paw-print": return <PawPrint {...props} />;
    case "flame": return <Flame {...props} />;
    case "flag": return <Flag {...props} />;
    case "more-horizontal": return <MoreHorizontal {...props} />;
    default: return <AlertTriangle {...props} />;
  }
}

function RoleIcon({ icon, size = 18, className = "" }: { icon: string; size?: number; className?: string }) {
  const props = { size, className };
  switch (icon) {
    case "crown": return <Crown {...props} />;
    case "shield": return <Shield {...props} />;
    case "users": return <Users {...props} />;
    case "badge-check": return <BadgeCheck {...props} />;
    case "home": return <Home {...props} />;
    case "user": return <User {...props} />;
    case "heart": return <Heart {...props} />;
    case "eye": return <Eye {...props} />;
    default: return <User {...props} />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "activa": return "border-red-500 bg-red-50 text-red-700";
    case "en_revision": return "border-amber-500 bg-amber-50 text-amber-700";
    case "resuelta": return "border-green-500 bg-green-50 text-green-700";
    default: return "border-slate-300 bg-slate-50 text-slate-700";
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case "critical": return "#dc2626";
    case "warning": return "#f97316";
    case "info": return "#3b82f6";
    default: return "#64748b";
  }
}

/* ═══════════════════════════════════════════════════════════
   PWA INSTALL BANNER
   ═══════════════════════════════════════════════════════════ */

function PWAInstallBanner({ onInstall, onDismiss }: { onInstall: () => void; onDismiss: () => void }) {
  const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  if (isStandalone) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[90] animate-slide-down">
      <div className="bg-gradient-to-r from-[#0f4c81] to-[#0a3a63] px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm">Instalar App en tu Celular</p>
            <p className="text-blue-200 text-[11px]">Acceso rapido sin navegador</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={onInstall}
            className="bg-white text-[#0f4c81] hover:bg-blue-50 text-xs font-bold px-3 py-2 rounded-lg h-8 shadow-sm"
          >
            <Smartphone className="w-4 h-4 mr-1" />
            Instalar
          </Button>
          <button
            onClick={onDismiss}
            className="text-white/60 hover:text-white p-1 active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      {isIOS && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
          <p className="text-[11px] text-amber-800 text-center">
            <span className="font-semibold">iOS:</span> Toca el boton Compartir &rarr; &quot;Agregar a Inicio&quot;
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   INSTALL GUIDE MODAL
   ═══════════════════════════════════════════════════════════ */

function InstallGuide({ onClose }: { onClose: () => void }) {
  const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  const isAndroid = /android/.test(navigator.userAgent.toLowerCase());

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl w-full max-w-md p-6 pb-8 space-y-4 animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto" />
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-[#0f4c81] rounded-2xl flex items-center justify-center mx-auto">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Instalar en tu Celular</h3>
          <p className="text-sm text-slate-500">Sigue estos pasos para tener la app como nativa</p>
        </div>

        {isAndroid ? (
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Abre en Chrome</p>
                <p className="text-xs text-slate-500 mt-0.5">Visita esta pagina desde Google Chrome en tu Android</p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Toca el menu de Chrome</p>
                <p className="text-xs text-slate-500 mt-0.5">Pulsa los tres puntos (...) arriba a la derecha</p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">&quot;Agregar a pantalla de inicio&quot;</p>
                <p className="text-xs text-slate-500 mt-0.5">Selecciona esta opcion para crear el acceso directo</p>
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-3 flex items-start gap-3">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Listo!</p>
                <p className="text-xs text-slate-500 mt-0.5">La app aparecera en tu pantalla principal como cualquier otra app</p>
              </div>
            </div>
          </div>
        ) : isIOS ? (
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Abre en Safari</p>
                <p className="text-xs text-slate-500 mt-0.5">Visita esta pagina desde Safari en tu iPhone o iPad</p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Toca el icono Compartir</p>
                <p className="text-xs text-slate-500 mt-0.5">Pulsa el boton de compartir (cuadro con flecha) abajo</p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">&quot;Agregar a pantalla de inicio&quot;</p>
                <p className="text-xs text-slate-500 mt-0.5">Desplaza y selecciona esta opcion</p>
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-3 flex items-start gap-3">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Confirmar &quot;Agregar&quot;</p>
                <p className="text-xs text-slate-500 mt-0.5">Presiona &quot;Agregar&quot; en el dialogo que aparece</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Abre en Chrome o Edge</p>
                <p className="text-xs text-slate-500 mt-0.5">Visita desde un navegador compatible con PWA</p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Busca el prompt de instalacion</p>
                <p className="text-xs text-slate-500 mt-0.5">Aparecera un banner superior ofreciendo instalar la app</p>
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-3 flex items-start gap-3">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Presiona &quot;Instalar&quot;</p>
                <p className="text-xs text-slate-500 mt-0.5">La app se instalara y aparecera en tu escritorio/inicio</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-[11px] text-slate-500">
            <span className="font-semibold text-[#0f4c81]">Ventajas de instalar:</span> Funciona sin internet, acceso rapido desde el inicio,
            notificaciones push, experiencia nativa y sin barra del navegador.
          </p>
        </div>

        <Button onClick={onClose} variant="outline" className="w-full py-5 rounded-xl text-base">
          Entendido
        </Button>
      </div>
    </div>
  );
}

const INSTALL_DISMISSED_KEY = "cyj-install-dismissed";

/* ═══════════════════════════════════════════════════════════
   LOGIN SCREEN
   ═══════════════════════════════════════════════════════════ */

function LoginScreen({ onLogin }: { onLogin: (user: UserProfile) => void }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!identifier.trim()) { setError("Ingresa tu email o teléfono"); return; }
    if (!password.trim()) { setError("Ingresa tu contraseña"); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        onLogin(data.user);
      } else {
        setError(data.error || "Credenciales inválidas");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f4c81] via-[#0d3d66] to-[#0a2d4a] flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-6">
        {/* Logo */}
        <div className="w-28 h-28 rounded-3xl bg-white shadow-2xl flex items-center justify-center mb-6 overflow-hidden">
          <Image src="/download/logo-cyj.png" alt="Servicios Integrales CyJ" width={110} height={110} className="object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center">Servicios Integrales CyJ</h1>
        <p className="text-blue-200 text-sm mt-1 text-center">Plataforma de Seguridad Comunitaria</p>

        {/* Login form */}
        <div className="w-full max-w-sm mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-blue-200 text-xs font-medium">Email o Teléfono</Label>
            <Input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="usuario@email.com"
              className="bg-white/10 border-white/20 text-white placeholder:text-blue-300/50 rounded-xl h-12"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-blue-200 text-xs font-medium">Contraseña</Label>
            <div className="relative">
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="bg-white/10 border-white/20 text-white placeholder:text-blue-300/50 rounded-xl h-12 pr-10"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/50" />
            </div>
          </div>
          {error && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3">
              <p className="text-red-200 text-xs font-medium text-center">{error}</p>
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-base font-semibold rounded-xl h-12 shadow-lg shadow-green-600/30 disabled:opacity-50"
          >
            {isLoading ? "Verificando..." : "Iniciar Sesión"}
          </Button>
          <div className="flex justify-center">
            <button className="text-blue-300/70 text-xs hover:text-blue-200 transition-colors">
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Demo credentials hint */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2">
            <p className="text-blue-200 text-[10px] font-semibold text-center">Cuentas de prueba (contraseña: cyj2025)</p>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="bg-white/5 rounded-lg px-2 py-1.5">
                <p className="text-blue-100 font-medium">Super Admin</p>
                <p className="text-blue-300/60">roberto.silva@cyj.cl</p>
              </div>
              <div className="bg-white/5 rounded-lg px-2 py-1.5">
                <p className="text-blue-100 font-medium">Admin</p>
                <p className="text-blue-300/60">maria.lopez@cyj.cl</p>
              </div>
              <div className="bg-white/5 rounded-lg px-2 py-1.5">
                <p className="text-blue-100 font-medium">Guardia</p>
                <p className="text-blue-300/60">juan.torres@cyj.cl</p>
              </div>
              <div className="bg-white/5 rounded-lg px-2 py-1.5">
                <p className="text-blue-100 font-medium">Residente</p>
                <p className="text-blue-300/60">carlos.perez@email.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Community info */}
        <div className="w-full max-w-sm mt-10">
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-white text-xs font-semibold">Comunidad Segura</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-white font-bold text-lg">722</p>
                <p className="text-blue-300/60 text-[10px]">Miembros</p>
              </div>
              <div>
                <p className="text-white font-bold text-lg">6</p>
                <p className="text-blue-300/60 text-[10px]">Torres</p>
              </div>
              <div>
                <p className="text-white font-bold text-lg">24/7</p>
                <p className="text-blue-300/60 text-[10px]">Vigilancia</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 text-center space-y-2">
        <p className="text-blue-300/50 text-[10px]">Al iniciar sesión aceptas los términos de uso de la plataforma</p>
        <p className="text-blue-300/40 text-[10px]">Servicios Integrales CyJ v2.1.0</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SOS OVERLAY
   ═══════════════════════════════════════════════════════════ */

function SOSOverlay({ onCancel }: { onCancel: () => void }) {
  const [countdown, setCountdown] = useState(30);
  const [isHolding, setIsHolding] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => { setCountdown((p) => p - 1); }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (isHolding) {
      const timer = setTimeout(() => { onCancel(); }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isHolding, onCancel]);

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-red-700 via-red-600 to-red-800 flex flex-col items-center justify-center text-white">
      <div className="relative z-10 flex flex-col items-center gap-6 px-8">
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
        <button
          onMouseDown={() => setIsHolding(true)}
          onMouseUp={() => setIsHolding(false)}
          onMouseLeave={() => setIsHolding(false)}
          onTouchStart={() => setIsHolding(true)}
          onTouchEnd={() => setIsHolding(false)}
          className={`mt-4 px-8 py-4 rounded-2xl text-base font-semibold transition-all ${
            isHolding ? "bg-white text-red-600 scale-95" : "bg-white/10 text-white/80 border border-white/20"
          }`}
        >
          {isHolding ? "Soltando... cancelando" : "Mantener presionado para cancelar"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TOP BAR
   ═══════════════════════════════════════════════════════════ */

function TopBar({ currentUser, currentRole, onNavigate }: { currentUser: UserProfile; currentRole: Role; onNavigate: (tab: TabId) => void }) {
  return (
    <div className="bg-gradient-to-r from-[#0f4c81] to-[#0d3d66] px-4 pt-3 pb-3 flex-shrink-0">
      <div className="flex items-center justify-between text-white/80">
        <span className="text-[10px] font-medium">9:41</span>
        <div className="flex items-center gap-1.5">
          <div className="flex items-end gap-0.5">
            <div className="w-1 h-1.5 bg-white/80 rounded-sm" />
            <div className="w-1 h-2.5 bg-white/80 rounded-sm" />
            <div className="w-1 h-3 bg-white/80 rounded-sm" />
            <div className="w-1 h-4 bg-white/60 rounded-sm" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
            <Image src="/download/logo-cyj.png" alt="CyJ" width={22} height={22} className="object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">Servicios Integrales CyJ</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
        </div>
        <button
          className="relative w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:scale-95"
          onClick={() => onNavigate("alerts")}
        >
          <Bell className="w-4 h-4 text-white" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[8px] text-white font-bold flex items-center justify-center">
            3
          </span>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 1: HOME
   ═══════════════════════════════════════════════════════════ */

function HomeTab({
  currentUser,
  currentRole,
  alerts,
  announcements,
  onNavigate,
  onSOSActivate,
}: {
  currentUser: UserProfile;
  currentRole: Role;
  alerts: Alert[];
  announcements: Announcement[];
  onNavigate: (tab: TabId) => void;
  onSOSActivate: () => void;
}) {
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);
  const { toast } = useToast();
  const recentAlerts = alerts.slice(0, 3);

  const handleSOS = () => {
    setShowSOSConfirm(false);
    onSOSActivate();
    toast({ title: "Alerta SOS Activada", description: "Tu ubicación ha sido compartida con la comunidad." });
  };

  const quickActions = [
    { label: "Reportar", icon: Flag, tab: "report" as TabId, color: "bg-orange-50 text-orange-600", perm: "canReport" as const },
    { label: "Ver Mapa", icon: Map, tab: "map" as TabId, color: "bg-cyan-50 text-cyan-600", perm: "canViewMap" as const },
    { label: "Comunidad", icon: Users, tab: "alerts" as TabId, color: "bg-purple-50 text-purple-600", perm: "canViewAlerts" as const },
    { label: "Administrar", icon: Settings, tab: "admin" as TabId, color: "bg-slate-100 text-slate-600", perm: "canViewStats" as const },
  ];

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Hola,</p>
          <h1 className="text-lg font-bold text-slate-900">{currentUser.name}</h1>
        </div>
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0f4c81] to-[#0a2d4a] flex items-center justify-center text-white font-bold text-sm">
          {currentUser.avatarInitial}
        </div>
      </div>

      {/* Condo badge */}
      <div className="bg-[#0f4c81]/5 rounded-xl px-4 py-2.5 flex items-center gap-2 border border-[#0f4c81]/10">
        <Building2 className="w-4 h-4 text-[#0f4c81]" />
        <span className="text-sm text-[#0f4c81] font-medium">{currentUser.condo} | Torre {currentUser.tower} - U.{currentUser.unit}</span>
      </div>

      {/* Safety Status Card */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          <div>
            <h2 className="text-lg font-bold">Tu comunidad está SEGURA</h2>
            <p className="text-green-100 text-sm">{communityStats.activeAlerts === 0 ? "No hay alertas activas" : `${communityStats.activeAlerts} alerta(s) activa(s)`}</p>
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
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="bg-white/10 rounded-lg px-3 py-1.5 text-center">
            <div className="text-sm font-bold">{communityStats.guardsOnDuty}</div>
            <div className="text-[9px] text-green-100">Guardias</div>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-1.5 text-center">
            <div className="text-sm font-bold">{communityStats.towers}</div>
            <div className="text-[9px] text-green-100">Torres</div>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-1.5 text-center">
            <div className="text-sm font-bold">{communityStats.resolvedToday}</div>
            <div className="text-[9px] text-green-100">Resueltas hoy</div>
          </div>
        </div>
      </div>

      {/* SOS Button */}
      {currentRole.permissions.canSOS && (
        <div className="flex justify-center py-2">
          <button onClick={() => setShowSOSConfirm(true)} className="relative group">
            <div className="absolute inset-0 w-[110px] h-[110px] rounded-full bg-red-400/30 animate-ping" />
            <div className="absolute inset-0 w-[110px] h-[110px] rounded-full bg-red-400/20 animate-pulse" style={{ animationDelay: "0.5s" }} />
            <div className="relative w-[110px] h-[110px] rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-xl shadow-red-500/30 flex items-center justify-center active:scale-95 transition-transform">
              <div className="text-center">
                <span className="text-3xl font-black text-white tracking-wider">SOS</span>
                <p className="text-[9px] text-red-100 mt-0.5 font-medium">EMERGENCIA</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* SOS Confirmation */}
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
              <Button onClick={handleSOS} className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-base font-semibold rounded-xl">Activar SOS</Button>
              <Button variant="outline" onClick={() => setShowSOSConfirm(false)} className="w-full py-5 text-base rounded-xl">Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {quickActions
          .filter((a) => hasPermission(currentUser.role, a.perm))
          .map((item) => (
            <button key={item.label} onClick={() => onNavigate(item.tab)} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
              <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center`}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-medium text-slate-600">{item.label}</span>
            </button>
          ))}
      </div>

      {/* Announcement Banner */}
      {announcements.length > 0 && (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
        <Megaphone className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800 truncate">{announcements[0].title}</p>
          <p className="text-[11px] text-amber-600 mt-0.5 line-clamp-2">{announcements[0].description}</p>
        </div>
      </div>
      )}

      {/* Recent Alerts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Alertas Recientes</h3>
          <button onClick={() => onNavigate("alerts")} className="text-sm text-[#0f4c81] font-medium flex items-center gap-1">
            Ver todas <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {recentAlerts.map((alert) => (
            <div key={alert.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                alert.status === "activa" ? "bg-red-100 text-red-600" : alert.status === "en_revision" ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
              }`}>
                <CategoryIcon name={alert.categoryIcon} size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-900 truncate">{alert.title}</h4>
                  <Badge variant="outline" className={`text-[10px] px-2 py-0 border-0 ${getStatusColor(alert.status)}`}>
                    {alert.status === "activa" ? "Activa" : alert.status === "en_revision" ? "Revisión" : "Resuelta"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {alert.time}
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
   TAB 2: REPORT
   ═══════════════════════════════════════════════════════════ */

function ReportTab({
  onNavigate,
  onReportSubmitted,
}: {
  onNavigate: (tab: TabId) => void;
  onReportSubmitted: (alert: Alert) => void;
}) {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [useLocation, setUseLocation] = useState(true);
  const [priority, setPriority] = useState("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Archivo muy grande", description: "Máximo 5 MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
      setPhotoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!selectedCategory) { toast({ title: "Selecciona una categoría", description: "Debes elegir el tipo de incidente.", variant: "destructive" }); return; }
    if (!description.trim()) { toast({ title: "Agrega una descripción", description: "Describe lo que sucedió.", variant: "destructive" }); return; }
    setIsSubmitting(true);
    try {
      const locationText = useLocation ? "Av. La Montaña Norte 3650, Condominio Laguna Norte, Lampa, Chile" : "No especificada";
      const res = await fetch("/api/alert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: selectedCategory, description, location: locationText, isAnonymous, priority, photo: photoBase64 || undefined }) });
      const data = await res.json();
      if (data.success && data.alert) {
        onReportSubmitted(data.alert);
        setShowSuccess(true);
        setTimeout(() => { setShowSuccess(false); onNavigate("alerts"); }, 2000);
      }
    } catch { toast({ title: "Error", description: "No se pudo enviar el reporte.", variant: "destructive" }); }
    finally { setIsSubmitting(false); }
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Reporte Enviado</h2>
        <p className="text-sm text-slate-500 text-center">Tu reporte ha sido registrado exitosamente. La comunidad será notificada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Reportar Incidente</h1>
        <p className="text-sm text-slate-500 mt-1">Selecciona la categoría y describe lo que sucedió</p>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">Categoría</Label>
        <div className="grid grid-cols-4 gap-2">
          {reportCategories.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all active:scale-95 ${selectedCategory === cat.id ? "border-[#0f4c81] bg-[#0f4c81]/5" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + "15", color: cat.color }}>
                <CategoryIcon name={cat.icon} size={20} />
              </div>
              <span className="text-[10px] font-medium text-slate-600 text-center leading-tight">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">Descripción</Label>
        <Textarea placeholder="Describe lo que sucedió..." value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[100px] rounded-xl resize-none border-slate-200" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><MapPin className="w-5 h-5 text-[#0f4c81]" /><span className="text-sm font-semibold text-slate-700">Ubicación actual</span></div>
          <Switch checked={useLocation} onCheckedChange={setUseLocation} />
        </div>
        {useLocation && (
          <p className="text-[11px] text-slate-400 leading-relaxed">Av. La Montaña Norte 3650, Condominio Laguna Norte, Valle Grande, Lampa, Chile</p>
        )}
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">Evidencia fotográfica</Label>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
        {photoPreview ? (
          <div className="relative rounded-xl overflow-hidden border border-slate-200">
            <img src={photoPreview} alt="Evidencia" className="w-full h-40 object-cover" />
            <button onClick={handleRemovePhoto} className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center gap-2 active:bg-slate-50 transition-colors">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center"><Camera className="w-6 h-6 text-slate-400" /></div>
            <span className="text-sm font-medium text-slate-500">Agregar foto</span>
            <span className="text-[10px] text-slate-400">Toma una foto o selecciona de la galería</span>
          </button>
        )}
      </div>
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
        <div>
          <span className="text-sm font-semibold text-slate-700">Reportar de forma anónima</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Tu identidad no será visible para otros</p>
        </div>
        <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">Prioridad</Label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: "low", label: "Baja", color: "bg-blue-100 text-blue-700 border-blue-200" },
            { value: "medium", label: "Media", color: "bg-amber-100 text-amber-700 border-amber-200" },
            { value: "high", label: "Alta", color: "bg-orange-100 text-orange-700 border-orange-200" },
            { value: "critical", label: "Crítica", color: "bg-red-100 text-red-700 border-red-200" },
          ].map((p) => (
            <button key={p.value} onClick={() => setPriority(p.value)} className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all active:scale-95 ${priority === p.value ? p.color : "border-slate-200 bg-white text-slate-500"}`}>{p.label}</button>
          ))}
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-base font-semibold rounded-xl">
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            Enviando...
          </span>
        ) : (
          <span className="flex items-center gap-2"><Send className="w-5 h-5" /> Enviar Reporte</span>
        )}
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 3: MAP (Leaflet)
   ═══════════════════════════════════════════════════════════ */

function MapTab() {
  const [selectedFilter, setSelectedFilter] = useState("Todos");
  const [selectedMarker, setSelectedMarker] = useState<IncidentMarker | null>(null);

  const handleSelectMarker = useCallback((marker: IncidentMarker) => {
    setSelectedMarker(marker);
  }, []);

  return (
    <div className="space-y-0 pb-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Mapa de Incidentes</h1>
        <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm"><Filter className="w-5 h-5 text-slate-600" /></button>
      </div>
      <div className="relative h-[380px] rounded-2xl overflow-hidden shadow-sm border border-slate-200 mt-3">
        <MapView
          incidents={incidentMarkers}
          filter={selectedFilter}
          onSelectMarker={handleSelectMarker}
        />
        {/* Legend overlay */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl p-2.5 shadow-lg space-y-1.5 z-[1000]">
          <p className="text-[10px] font-semibold text-slate-700">Leyenda</p>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#0f4c81] border border-white shadow" />
            <span className="text-[10px] text-slate-500">Torre</span>
          </div>
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
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
        {MAP_FILTERS.map((f) => (
          <button key={f} onClick={() => setSelectedFilter(f)} className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${selectedFilter === f ? "bg-[#0f4c81] text-white shadow-md" : "bg-white border border-slate-200 text-slate-600"}`}>{f}</button>
        ))}
      </div>
      {selectedMarker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedMarker(null)} />
          <div className="relative bg-white rounded-t-3xl w-full max-w-md p-6 pb-8 space-y-3 animate-slide-up">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto" />
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: getSeverityColor(selectedMarker.severity) + "15" }}>
                <AlertTriangle className="w-6 h-6" style={{ color: getSeverityColor(selectedMarker.severity) }} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">{selectedMarker.title}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{selectedMarker.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedMarker.time}</span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedMarker.distance}</span>
                </div>
              </div>
            </div>
            <Button className="w-full bg-[#0f4c81] hover:bg-[#0a3a63] text-white rounded-xl">Ver detalles completos</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 4: ALERTS (stateful)
   ═══════════════════════════════════════════════════════════ */

function AlertsTab({ alerts }: { alerts: Alert[] }) {
  const [selectedFilter, setSelectedFilter] = useState("Todas");
  const filteredAlerts = selectedFilter === "Activas" ? alerts.filter((a) => a.status === "activa") : selectedFilter === "Resueltas" ? alerts.filter((a) => a.status === "resuelta") : selectedFilter === "Mías" ? alerts.filter((_, i) => i % 3 === 0) : alerts;

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Alertas Comunitarias</h1>
        <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm"><Filter className="w-5 h-5 text-slate-600" /></button>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {ALERT_FILTERS.map((f) => (
          <button key={f} onClick={() => setSelectedFilter(f)} className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${selectedFilter === f ? "bg-[#0f4c81] text-white shadow-md" : "bg-white border border-slate-200 text-slate-600"}`}>{f}</button>
        ))}
      </div>
      {filteredAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center"><Bell className="w-8 h-8 text-slate-300" /></div>
          <p className="text-sm text-slate-400">No hay alertas en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAlerts.map((alert) => (
            <div key={alert.id} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${alert.status === "activa" ? "border-l-red-500" : alert.status === "en_revision" ? "border-l-amber-500" : "border-l-green-500"}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${alert.priority === "critical" ? "bg-red-100 text-red-600" : alert.priority === "high" ? "bg-orange-100 text-orange-600" : alert.priority === "medium" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}>
                  <CategoryIcon name={alert.categoryIcon} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-900 truncate">{alert.title}</h4>
                    <Badge variant="outline" className={`text-[10px] px-2 py-0 border-0 flex-shrink-0 ${getStatusColor(alert.status)}`}>
                      {alert.status === "activa" ? "Activa" : alert.status === "en_revision" ? "En revisión" : "Resuelta"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{alert.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {alert.time}</span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {alert.location.split(" - ")[0]}</span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {alert.comments}</span>
                  </div>
                  {alert.isAnonymous && <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><User className="w-3 h-3" /> Anónimo</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 5: ROLES (Admin/Comité only) — FULL USER MANAGEMENT
   ═══════════════════════════════════════════════════════════ */

function RolesTab({
  currentUser,
  currentRole,
  users,
  onUsersChange,
}: {
  currentUser: UserProfile;
  currentRole: Role;
  users: SampleUser[];
  onUsersChange: (users: SampleUser[]) => void;
}) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<SampleUser | null>(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* Create user form state */
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<string>("");
  const [newTower, setNewTower] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const filteredUsers = users.filter((u) => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.unit.includes(search)) return false;
    if (filterRole !== "all" && u.role !== filterRole) return false;
    return true;
  });

  const maxCount = Math.max(...roleDistribution.map((r) => r.count));

  /* ─── Create User ─── */
  const handleCreateUser = async () => {
    if (!newName.trim()) { toast({ title: "Nombre requerido", variant: "destructive" }); return; }
    if (!newRole) { toast({ title: "Selecciona un rol", variant: "destructive" }); return; }
    if (!newPhone.trim()) { toast({ title: "Teléfono requerido", variant: "destructive" }); return; }
    if (!newEmail.trim()) { toast({ title: "Email requerido", variant: "destructive" }); return; }
    setIsCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), role: newRole, tower: newTower, unit: newUnit, phone: newPhone.trim(), email: newEmail.trim(), password: newPassword || undefined }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        onUsersChange([...users, data.user as SampleUser]);
        toast({ title: "Usuario creado", description: `${data.user.name} ha sido agregado. Contraseña: cyj2025` });
        setNewName(""); setNewRole(""); setNewTower(""); setNewUnit(""); setNewPhone(""); setNewEmail(""); setNewPassword("");
        setShowCreateUser(false);
      } else {
        toast({ title: "Error", description: data.error || "No se pudo crear el usuario.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo crear el usuario.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  /* ─── Change Role ─── */
  const handleChangeRole = async (userId: string, newRoleId: string) => {
    const roleData = ROLES.find((r) => r.id === newRoleId);
    if (!roleData) return;
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRoleId }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        const updated = users.map((u) => u.id === userId ? { ...u, role: newRoleId as RoleId, roleName: roleData.name } : u);
        onUsersChange(updated);
        setShowRoleSelector(false);
        if (selectedUser) {
          setSelectedUser({ ...selectedUser, role: newRoleId as RoleId, roleName: roleData.name });
        }
        toast({ title: "Rol actualizado", description: `El rol de ${selectedUser?.name} ha sido cambiado a ${roleData.name}.` });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar el rol.", variant: "destructive" });
    }
  };

  /* ─── Delete User ─── */
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = users.filter((u) => u.id !== selectedUser.id);
        onUsersChange(updated);
        setShowDeleteConfirm(false);
        setSelectedUser(null);
        toast({ title: "Usuario eliminado", description: `${selectedUser.name} ha sido eliminado.` });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el usuario.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Gestión de Roles y Usuarios</h1>
        <p className="text-sm text-slate-500 mt-1">Total de residentes: {users.length}</p>
      </div>

      {/* Role Distribution Bar Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-700">Distribución de Roles</h3>
        <div className="space-y-2">
          {roleDistribution.map((rd) => {
            const role = getRole(rd.roleId);
            if (!role) return null;
            const pct = (rd.count / maxCount) * 100;
            return (
              <div key={rd.roleId} className="flex items-center gap-2">
                <div className="w-24 flex-shrink-0">
                  <span className="text-[10px] font-medium text-slate-600 truncate block">{role.name}</span>
                </div>
                <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                  <div className="h-full rounded-full transition-all flex items-center pl-2" style={{ width: `${pct}%`, backgroundColor: role.color, minWidth: "32px" }}>
                    <span className="text-[9px] font-bold text-white">{rd.count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search + Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o unidad..."
            className="pl-9 rounded-xl border-slate-200 h-10"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          <button onClick={() => setFilterRole("all")} className={`px-3 py-1.5 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all ${filterRole === "all" ? "bg-[#0f4c81] text-white" : "bg-white border border-slate-200 text-slate-600"}`}>Todos</button>
          {ROLES.map((r) => (
            <button key={r.id} onClick={() => setFilterRole(r.id)} className={`px-3 py-1.5 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all ${filterRole === r.id ? "text-white" : "bg-white border border-slate-200 text-slate-600"}`} style={filterRole === r.id ? { backgroundColor: r.color } : {}}>
              {r.name}
            </button>
          ))}
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Users className="w-8 h-8 text-slate-300" />
            <p className="text-sm text-slate-400">No se encontraron usuarios</p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const role = getRole(user.role);
            return (
              <button key={user.id} onClick={() => { setSelectedUser(user); setShowRoleSelector(false); }} className="w-full bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center gap-3 active:bg-slate-50 transition-colors text-left">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: role?.color || "#64748b" }}>
                    {user.avatarInitial}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${user.online ? "bg-green-500" : "bg-slate-300"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-400">{user.tower !== "N/A" ? `Torre ${user.tower} - U.${user.unit}` : "Personal de seguridad"}</p>
                </div>
                <div className="px-2 py-0.5 rounded-full text-[9px] font-bold border flex-shrink-0" style={{ backgroundColor: (role?.color || "#64748b") + "20", color: role?.color || "#64748b", borderColor: (role?.color || "#64748b") + "40" }}>
                  {user.roleName}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Add User button (admin only) */}
      {currentRole.permissions.canManageUsers && (
        <Button className="w-full bg-[#0f4c81] hover:bg-[#0a3a63] text-white rounded-xl" onClick={() => setShowCreateUser(true)}>
          <Plus className="w-4 h-4 mr-2" /> Agregar Usuario
        </Button>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreateUser(false)} />
          <div className="relative bg-white rounded-t-3xl w-full max-w-md p-6 pb-8 space-y-4 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Crear Nuevo Usuario</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Nombre completo *</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ej: Juan Pérez" className="rounded-xl h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Rol *</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="w-full rounded-xl h-11">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Torre</Label>
                  <Select value={newTower} onValueChange={setNewTower}>
                    <SelectTrigger className="w-full rounded-xl h-11">
                      <SelectValue placeholder="Torre" />
                    </SelectTrigger>
                    <SelectContent>
                      {towers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Unidad</Label>
                  <Input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="Ej: 101" className="rounded-xl h-11" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Teléfono *</Label>
                <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+56 9 1234 5678" className="rounded-xl h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Email *</Label>
                <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" placeholder="usuario@email.com" className="rounded-xl h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Contraseña</Label>
                <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="text" placeholder="cyj2025" className="rounded-xl h-11" />
                <p className="text-[10px] text-slate-400">Si dejas vacío, la contraseña será: cyj2025</p>
              </div>
            </div>
            <div className="space-y-2">
              <Button onClick={handleCreateUser} disabled={isCreating} className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-11">
                {isCreating ? "Creando..." : "Crear Usuario"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateUser(false)} className="w-full rounded-xl">Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Bottom Sheet */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setSelectedUser(null); setShowRoleSelector(false); }} />
          <div className="relative bg-white rounded-t-3xl w-full max-w-md p-6 pb-8 space-y-4 animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto" />
            <div className="flex items-center gap-4">
              {(() => {
                const role = getRole(selectedUser.role);
                return (
                  <>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: role?.color || "#64748b" }}>
                      {selectedUser.avatarInitial}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-slate-900">{selectedUser.name}</h3>
                      <div className="px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 mt-1" style={{ backgroundColor: (role?.color || "#64748b") + "20", color: role?.color || "#64748b", borderColor: (role?.color || "#64748b") + "40" }}>
                        <RoleIcon icon={role?.icon || "user"} size={12} /> {selectedUser.roleName}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Torre / Unidad</span><span className="font-medium text-slate-900">{selectedUser.tower !== "N/A" ? `Torre ${selectedUser.tower} - U.${selectedUser.unit}` : "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Teléfono</span><span className="font-medium text-slate-900">{selectedUser.phone}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-medium text-slate-900 text-xs">{selectedUser.email}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Estado</span><span className={`font-medium ${selectedUser.online ? "text-green-600" : "text-slate-400"}`}>{selectedUser.online ? "En línea" : "Desconectado"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Miembro desde</span><span className="font-medium text-slate-900">{selectedUser.memberSince}</span></div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-600 mb-2">Permisos del rol</p>
              <div className="grid grid-cols-2 gap-1">
                {(() => {
                  const role = getRole(selectedUser.role);
                  if (!role) return null;
                  const perms: { key: string; label: string }[] = [
                    { key: "canSOS", label: "SOS" },
                    { key: "canReport", label: "Reportar" },
                    { key: "canViewAlerts", label: "Ver Alertas" },
                    { key: "canManageAlerts", label: "Gestionar Alertas" },
                    { key: "canViewMap", label: "Ver Mapa" },
                    { key: "canManageUsers", label: "Gestionar Usuarios" },
                    { key: "canViewStats", label: "Ver Estadísticas" },
                    { key: "canAssignGuards", label: "Asignar Guardias" },
                  ];
                  return perms.map((p) => (
                    <div key={p.key} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${role.permissions[p.key as keyof typeof role.permissions] ? "bg-green-500" : "bg-slate-300"}`} />
                      <span className="text-[10px] text-slate-600">{p.label}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Role change dropdown */}
            {currentRole.permissions.canManageUsers && (
              <div className="space-y-2">
                <Button
                  className="w-full bg-[#0f4c81] hover:bg-[#0a3a63] text-white rounded-xl"
                  onClick={() => setShowRoleSelector(!showRoleSelector)}
                >
                  Cambiar Rol
                </Button>
                {showRoleSelector && (
                  <Select
                    value={selectedUser.role}
                    onValueChange={(val) => handleChangeRole(selectedUser.id, val)}
                  >
                    <SelectTrigger className="w-full rounded-xl h-11">
                      <SelectValue placeholder="Seleccionar nuevo rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Delete user */}
            {currentRole.permissions.canManageRoles && (
              <div className="space-y-2">
                {!showDeleteConfirm ? (
                  <Button
                    className="w-full bg-red-50 text-red-600 hover:bg-red-100 rounded-xl border border-red-200"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar Usuario
                  </Button>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-red-800">¿Eliminar a {selectedUser.name}?</p>
                    <p className="text-xs text-red-600">Esta acción no se puede deshacer.</p>
                    <div className="flex gap-2">
                      <Button onClick={handleDeleteUser} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl h-10 text-sm">Confirmar</Button>
                      <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-xl h-10 text-sm">Cancelar</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button variant="outline" onClick={() => { setSelectedUser(null); setShowRoleSelector(false); }} className="w-full rounded-xl">Cerrar</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 6: ADMIN (Admin/Comité/Super Admin)
   ═══════════════════════════════════════════════════════════ */

function AdminTab({
  currentRole,
  alerts,
  announcements,
  onAnnouncementsChange,
  guards,
  onGuardsChange,
  currentUser,
}: {
  currentRole: Role;
  alerts: Alert[];
  announcements: Announcement[];
  onAnnouncementsChange: (a: Announcement[]) => void;
  guards: GuardOnDuty[];
  onGuardsChange: (g: GuardOnDuty[]) => void;
  currentUser: UserProfile;
}) {
  const { toast } = useToast();

  /* ─── Announcement state ─── */
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annDescription, setAnnDescription] = useState("");
  const [annPriority, setAnnPriority] = useState<"info" | "warning" | "important">("info");
  const [annSubmitting, setAnnSubmitting] = useState(false);

  /* ─── Guard shift state ─── */
  const [showAssignShift, setShowAssignShift] = useState(false);
  const [shiftName, setShiftName] = useState("");
  const [shiftType, setShiftType] = useState("Turno Mañana");
  const [shiftStart, setShiftStart] = useState("07:00");
  const [shiftEnd, setShiftEnd] = useState("15:00");
  const [shiftZone, setShiftZone] = useState("Torres A-B");
  const [shiftPhone, setShiftPhone] = useState("");
  const [shiftSubmitting, setShiftSubmitting] = useState(false);

  /* ─── Create Announcement ─── */
  const handleCreateAnnouncement = async () => {
    if (!annTitle.trim()) { toast({ title: "Título requerido", variant: "destructive" }); return; }
    if (!annDescription.trim()) { toast({ title: "Descripción requerida", variant: "destructive" }); return; }
    setAnnSubmitting(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: annTitle.trim(), description: annDescription.trim(), priority: annPriority, author: currentUser.name }),
      });
      const data = await res.json();
      if (data.success && data.announcement) {
        onAnnouncementsChange([data.announcement, ...announcements]);
        toast({ title: "Anuncio creado", description: "El anuncio ha sido publicado exitosamente." });
        setAnnTitle(""); setAnnDescription(""); setAnnPriority("info");
        setShowCreateAnnouncement(false);
      } else {
        toast({ title: "Error", description: data.error || "No se pudo crear el anuncio.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo crear el anuncio.", variant: "destructive" });
    } finally {
      setAnnSubmitting(false);
    }
  };

  /* ─── Assign Guard Shift ─── */
  const handleAssignShift = async () => {
    if (!shiftName.trim()) { toast({ title: "Nombre requerido", variant: "destructive" }); return; }
    if (!shiftStart || !shiftEnd) { toast({ title: "Horario requerido", variant: "destructive" }); return; }
    if (!shiftZone.trim()) { toast({ title: "Zona requerida", variant: "destructive" }); return; }
    setShiftSubmitting(true);
    try {
      const res = await fetch("/api/guards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: shiftName.trim(), shift: shiftType, startTime: shiftStart, endTime: shiftEnd, zone: shiftZone, phone: shiftPhone.trim() }),
      });
      const data = await res.json();
      if (data.success && data.guard) {
        onGuardsChange([...guards, data.guard]);
        toast({ title: "Turno asignado", description: `Se ha asignado turno a ${data.guard.name}.` });
        setShiftName(""); setShiftType("Turno Mañana"); setShiftStart("07:00"); setShiftEnd("15:00"); setShiftZone("Torres A-B"); setShiftPhone("");
        setShowAssignShift(false);
      } else {
        toast({ title: "Error", description: data.error || "No se pudo asignar el turno.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo asignar el turno.", variant: "destructive" });
    } finally {
      setShiftSubmitting(false);
    }
  };

  /* ─── Remove Guard ─── */
  const handleRemoveGuard = async (guardId: string) => {
    try {
      const res = await fetch("/api/guards", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardId }),
      });
      const data = await res.json();
      if (data.success) {
        onGuardsChange(guards.filter((g) => g.id !== guardId));
        toast({ title: "Turno eliminado", description: "El turno ha sido removido." });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el turno.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Panel de Administración</h1>
        <p className="text-sm text-slate-500 mt-1">Servicios Integrales CyJ</p>
      </div>

      {/* Stats Cards */}
      {currentRole.permissions.canViewStats && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Residentes", value: String(communityStats.totalMembers), color: "bg-[#0f4c81]/5 text-[#0f4c81]", icon: Users },
            { label: "Guardias Activos", value: `${guards.length}/12`, color: "bg-green-50 text-green-700", icon: Shield },
            { label: "Alertas Hoy", value: String(alerts.filter((a) => a.status === "activa").length), color: "bg-amber-50 text-amber-700", icon: AlertCircle },
            { label: "Reportes Pendientes", value: String(communityStats.pendingReports), color: "bg-red-50 text-red-700", icon: FileText },
          ].map((s) => (
            <div key={s.label} className={`${s.color} rounded-xl p-4`}>
              <s.icon className="w-5 h-5 opacity-60 mb-1" />
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-[10px] opacity-70 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Towers Section */}
      {currentRole.permissions.canManageFacilities && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Torres</h2>
            <span className="text-xs text-slate-400">{communityStats.towers} torres • {communityStats.totalUnits} unidades</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {towers.map((t) => (
              <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">{t.name}</h3>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${t.status === "operativa" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {t.status === "operativa" ? "Operativa" : "Mantención"}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  <p>{t.units} unidades • {t.floors} pisos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guards Section */}
      {currentRole.permissions.canAssignGuards && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Guardias</h2>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs h-7" onClick={() => setShowAssignShift(true)}>
              <Plus className="w-3 h-3 mr-1" /> Asignar Turno
            </Button>
          </div>
          {guards.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <Shield className="w-8 h-8 text-slate-300" />
              <p className="text-sm text-slate-400">No hay guardias asignados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {guards.map((g) => (
                <div key={g.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700">
                    <BadgeCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{g.name}</p>
                    <p className="text-[11px] text-slate-400">{g.shift} • {g.startTime} - {g.endTime}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{g.zone}</span>
                    {currentRole.permissions.canManageRoles && (
                      <button onClick={() => handleRemoveGuard(g.id)} className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center active:bg-red-100">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reports Section */}
      {currentRole.permissions.canViewReports && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Reportes</h2>
            <button className="text-xs text-[#0f4c81] font-medium">Ver Todos</button>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 4).map((a) => (
              <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${a.status === "activa" ? "bg-red-100 text-red-600" : a.status === "en_revision" ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"}`}>
                  <CategoryIcon name={a.categoryIcon} size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{a.title}</p>
                  <p className="text-[10px] text-slate-400">{a.time} • {a.location}</p>
                </div>
                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 border-0 flex-shrink-0 ${getStatusColor(a.status)}`}>
                  {a.status === "activa" ? "Activa" : a.status === "en_revision" ? "Revisión" : "Resuelta"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Announcements Section */}
      {currentRole.permissions.canPostAnnouncements && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Anuncios</h2>
            <Button size="sm" className="bg-[#0f4c81] hover:bg-[#0a3a63] text-white rounded-lg text-xs h-7" onClick={() => setShowCreateAnnouncement(true)}>
              <Plus className="w-3 h-3 mr-1" /> Crear
            </Button>
          </div>
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <Megaphone className="w-8 h-8 text-slate-300" />
              <p className="text-sm text-slate-400">No hay anuncios</p>
            </div>
          ) : (
            <div className="space-y-2">
              {announcements.map((a) => (
                <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900 truncate">{a.title}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${a.priority === "important" ? "bg-red-100 text-red-700" : a.priority === "warning" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                      {a.priority === "important" ? "Importante" : a.priority === "warning" ? "Aviso" : "Info"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{a.description}</p>
                  <p className="text-[10px] text-slate-400">{a.author} • {a.date}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ CREATE ANNOUNCEMENT MODAL ═══ */}
      {showCreateAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreateAnnouncement(false)} />
          <div className="relative bg-white rounded-t-3xl w-full max-w-md p-6 pb-8 space-y-4 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Crear Anuncio</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Título *</Label>
                <Input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Ej: Mantención programada" className="rounded-xl h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Descripción *</Label>
                <Textarea value={annDescription} onChange={(e) => setAnnDescription(e.target.value)} placeholder="Describe el anuncio..." className="min-h-[80px] rounded-xl resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Prioridad</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "info" as const, label: "Info", color: "bg-blue-100 text-blue-700 border-blue-200" },
                    { value: "warning" as const, label: "Aviso", color: "bg-amber-100 text-amber-700 border-amber-200" },
                    { value: "important" as const, label: "Importante", color: "bg-red-100 text-red-700 border-red-200" },
                  ]).map((p) => (
                    <button key={p.value} onClick={() => setAnnPriority(p.value)} className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all active:scale-95 ${annPriority === p.value ? p.color : "border-slate-200 bg-white text-slate-500"}`}>{p.label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Button onClick={handleCreateAnnouncement} disabled={annSubmitting} className="w-full bg-[#0f4c81] hover:bg-[#0a3a63] text-white rounded-xl h-11">
                {annSubmitting ? "Publicando..." : "Publicar Anuncio"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateAnnouncement(false)} className="w-full rounded-xl">Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ASSIGN GUARD SHIFT MODAL ═══ */}
      {showAssignShift && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAssignShift(false)} />
          <div className="relative bg-white rounded-t-3xl w-full max-w-md p-6 pb-8 space-y-4 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Asignar Turno de Guardia</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Nombre del guardia *</Label>
                <Input value={shiftName} onChange={(e) => setShiftName(e.target.value)} placeholder="Ej: Juan Pérez" className="rounded-xl h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Tipo de turno</Label>
                <Select value={shiftType} onValueChange={setShiftType}>
                  <SelectTrigger className="w-full rounded-xl h-11">
                    <SelectValue placeholder="Seleccionar turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Turno Mañana">Turno Mañana (07:00-15:00)</SelectItem>
                    <SelectItem value="Turno Tarde">Turno Tarde (15:00-23:00)</SelectItem>
                    <SelectItem value="Turno Noche">Turno Noche (23:00-07:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Hora inicio *</Label>
                  <Input type="time" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} className="rounded-xl h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Hora fin *</Label>
                  <Input type="time" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} className="rounded-xl h-11" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Zona *</Label>
                <Select value={shiftZone} onValueChange={setShiftZone}>
                  <SelectTrigger className="w-full rounded-xl h-11">
                    <SelectValue placeholder="Seleccionar zona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Torres A-B">Torres A-B</SelectItem>
                    <SelectItem value="Torres C-D">Torres C-D</SelectItem>
                    <SelectItem value="Torres E-F">Torres E-F</SelectItem>
                    <SelectItem value="Acceso Principal">Acceso Principal</SelectItem>
                    <SelectItem value="Estacionamiento">Estacionamiento</SelectItem>
                    <SelectItem value="Perímetro">Perímetro Completo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Teléfono</Label>
                <Input value={shiftPhone} onChange={(e) => setShiftPhone(e.target.value)} placeholder="+56 9 1234 5678" className="rounded-xl h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Button onClick={handleAssignShift} disabled={shiftSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-11">
                {shiftSubmitting ? "Asignando..." : "Asignar Turno"}
              </Button>
              <Button variant="outline" onClick={() => setShowAssignShift(false)} className="w-full rounded-xl">Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 7: PROFILE
   ═══════════════════════════════════════════════════════════ */

function ProfileTab({
  currentUser,
  currentRole,
  onLogout,
  onSwitchRole,
}: {
  currentUser: UserProfile;
  currentRole: Role;
  onLogout: () => void;
  onSwitchRole: (user: UserProfile) => void;
}) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({ sos: true, reports: true, updates: false, community: true });
  const [privacy, setPrivacy] = useState({ location: true, profile: true, anonymous: false });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const handleSave = async () => {
    try {
      const res = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notifications, privacy }) });
      const data = await res.json();
      if (data.success) toast({ title: "Perfil actualizado", description: "Tus preferencias han sido guardadas." });
    } catch { toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" }); }
  };

  const permLabels: { key: keyof Role["permissions"]; label: string }[] = [
    { key: "canSOS", label: "Botón SOS" },
    { key: "canReport", label: "Reportar incidentes" },
    { key: "canViewAlerts", label: "Ver alertas" },
    { key: "canViewMap", label: "Ver mapa" },
    { key: "canManageAlerts", label: "Gestionar alertas" },
    { key: "canManageUsers", label: "Gestionar usuarios" },
    { key: "canViewStats", label: "Ver estadísticas" },
    { key: "canAssignGuards", label: "Asignar guardias" },
  ];

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
          <Image src="/download/logo-cyj.png" alt="CyJ" width={64} height={64} className="object-cover" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">{currentUser.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="px-2 py-0.5 rounded-full text-[10px] font-bold border" style={{ backgroundColor: currentRole.color + "20", color: currentRole.color, borderColor: currentRole.color + "40" }}>
              <span className="inline-flex items-center gap-1"><RoleIcon icon={currentRole.icon} size={10} /> {currentRole.name}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{currentUser.condo}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { value: currentUser.reports, label: "Reportes", color: "bg-blue-50 text-blue-700" },
          { value: currentUser.familyMembers, label: "Familiares", color: "bg-green-50 text-green-700" },
          { value: currentUser.memberSince, label: "Miembro desde", color: "bg-purple-50 text-purple-700" },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
            <div className="text-lg font-bold">{s.value}</div>
            <div className="text-[10px] mt-0.5 opacity-70">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Personal Data */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <h3 className="px-4 py-3 text-sm font-bold text-slate-900 bg-slate-50 border-b border-slate-100">Datos Personales</h3>
        {[
          { icon: User, label: "Nombre", value: currentUser.name },
          { icon: Phone, label: "Teléfono", value: currentUser.phone },
          { icon: Mail, label: "Email", value: currentUser.email },
          { icon: MapPin, label: "Dirección", value: currentUser.address },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-3"><item.icon className="w-4 h-4 text-slate-400" /><span className="text-xs text-slate-500">{item.label}</span></div>
            <span className="text-sm text-slate-900 font-medium">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Family (for residente_p) */}
      {currentUser.role === "residente_p" && (
        <button className="w-full bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between active:bg-slate-50">
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-slate-500" />
            <div className="text-left">
              <span className="text-sm font-medium text-slate-700">Mi Familia</span>
              <p className="text-[11px] text-slate-400">Administrar familiares autorizados</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{currentUser.familyMembers}</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </button>
      )}

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
            <div><span className="text-sm font-medium text-slate-700">{item.label}</span><p className="text-[11px] text-slate-400">{item.desc}</p></div>
            <Switch checked={notifications[item.key]} onCheckedChange={(v) => setNotifications({ ...notifications, [item.key]: v })} />
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
            <div><span className="text-sm font-medium text-slate-700">{item.label}</span><p className="text-[11px] text-slate-400">{item.desc}</p></div>
            <Switch checked={privacy[item.key]} onCheckedChange={(v) => setPrivacy({ ...privacy, [item.key]: v })} />
          </div>
        ))}
      </div>

      {/* My Role */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <h3 className="px-4 py-3 text-sm font-bold text-slate-900 bg-slate-50 border-b border-slate-100">Mi Rol</h3>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: currentRole.color }}>
              <RoleIcon icon={currentRole.icon} size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{currentRole.name}</p>
              <p className="text-[11px] text-slate-500">{currentRole.description}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {permLabels.map((p) => (
              <div key={p.key} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${currentRole.permissions[p.key] ? "bg-green-500" : "bg-slate-300"}`} />
                <span className={`text-[10px] ${currentRole.permissions[p.key] ? "text-slate-700" : "text-slate-400"}`}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Community */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <h3 className="px-4 py-3 text-sm font-bold text-slate-900 bg-slate-50 border-b border-slate-100">Comunidad</h3>
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between">
          <span className="text-xs text-slate-500">Condominio</span>
          <span className="text-sm text-slate-900 font-medium">{currentUser.condo}</span>
        </div>
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between">
          <span className="text-xs text-slate-500">Torre / Unidad</span>
          <span className="text-sm text-slate-900 font-medium">Torre {currentUser.tower} - U.{currentUser.unit}</span>
        </div>
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between">
          <span className="text-xs text-slate-500">Rol</span>
          <span className="text-sm font-medium" style={{ color: currentRole.color }}>{currentRole.name}</span>
        </div>
        <div className="px-4 py-3 flex justify-between">
          <span className="text-xs text-slate-500">Admin</span>
          <span className="text-sm text-[#0f4c81] font-medium">admin@cyj.cl</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button onClick={() => toast({ title: "Compartir", description: "Enlace copiado al portapapeles" })} className="w-full bg-green-50 text-green-700 rounded-xl p-4 flex items-center gap-3 active:bg-green-100 transition-colors">
          <Share2 className="w-5 h-5" /><span className="text-sm font-semibold">Compartir App</span>
        </button>
        <button onClick={() => toast({ title: "Centro de Ayuda", description: "Próximamente disponible" })} className="w-full bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 active:bg-slate-50 transition-colors">
          <HelpCircle className="w-5 h-5 text-slate-600" /><span className="text-sm font-medium text-slate-700">Centro de Ayuda</span><ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
        </button>
        <button className="w-full bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 active:bg-slate-50 transition-colors">
          <FileText className="w-5 h-5 text-slate-600" /><span className="text-sm font-medium text-slate-700">Términos y Condiciones</span><ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
        </button>
      </div>

      {/* Save */}
      <Button onClick={handleSave} className="w-full bg-[#0f4c81] hover:bg-[#0a3a63] text-white py-5 rounded-xl">Guardar Cambios</Button>

      {/* Logout */}
      <button onClick={() => setShowLogoutConfirm(true)} className="w-full border-2 border-red-200 text-red-600 rounded-xl p-4 flex items-center justify-center gap-2 active:bg-red-50 transition-colors">
        <LogOut className="w-5 h-5" /><span className="text-sm font-semibold">Cerrar Sesión</span>
      </button>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-white rounded-2xl w-[85%] max-w-sm p-6 space-y-4 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto"><LogOut className="w-7 h-7 text-red-600" /></div>
              <h3 className="text-lg font-bold text-slate-900">¿Cerrar sesión?</h3>
              <p className="text-sm text-slate-500">No recibirás más alertas de la comunidad</p>
            </div>
            <div className="space-y-2">
              <Button onClick={() => { setShowLogoutConfirm(false); onLogout(); }} className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl">Cerrar Sesión</Button>
              <Button variant="outline" onClick={() => setShowLogoutConfirm(false)} className="w-full rounded-xl">Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-[10px] text-slate-300 pb-2">Servicios Integrales CyJ v2.1.0 • Hecho con <Heart className="w-3 h-3 inline text-red-400" /> en Chile</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentRole, setCurrentRole] = useState<RoleId>("residente_p");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [sosActive, setSosActive] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const deferredPrompt = useRef<any>(null);

  /* ─── STATEFUL ALERTS ─── */
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);

  /* ─── STATEFUL USERS ─── */
  const [users, setUsers] = useState<SampleUser[]>(sampleUsers);

  /* ─── STATEFUL ANNOUNCEMENTS ─── */
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>(mockAnnouncements);

  /* ─── STATEFUL GUARDS ─── */
  const [guardsList, setGuardsList] = useState<GuardOnDuty[]>(mockGuards);

  /* PWA install prompt */
  useEffect(() => {
    const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (!dismissed && !isStandalone) {
      const timer = setTimeout(() => setShowInstallBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for beforeinstallprompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handlePWAInstall = useCallback(() => {
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt();
      deferredPrompt.current.userChoice.then((choice: any) => {
        if (choice.outcome === "accepted") {
          console.log("CyJ App installed!");
        }
        deferredPrompt.current = null;
      });
    } else {
      setShowInstallGuide(true);
    }
    setShowInstallBanner(false);
  }, []);

  const handleDismissBanner = useCallback(() => {
    setShowInstallBanner(false);
    localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
  }, []);

  const role = useMemo(() => getRole(currentRole), [currentRole]);
  const visibleTabs = useMemo(() => {
    if (!role) return ALL_TABS.filter((t) => t.id === "profile");
    return ALL_TABS.filter((t) => t.required(role));
  }, [role]);

  const handleLogin = useCallback((user: UserProfile) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    setActiveTab("home");
    setIsLoggedIn(true);
  }, []);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setActiveTab("home");
    setSosActive(false);
  }, []);

  const handleSwitchRole = useCallback((user: UserProfile) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    setActiveTab("home");
  }, []);

  const handleNavigate = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  /* ─── Report submitted callback ─── */
  const handleReportSubmitted = useCallback((alert: Alert) => {
    setAlerts((prev) => [alert, ...prev]);
  }, []);

  const renderTabContent = () => {
    if (!role || !currentUser) return null;
    switch (activeTab) {
      case "home": return <HomeTab currentUser={currentUser} currentRole={role} alerts={alerts} announcements={announcementsList} onNavigate={handleNavigate} onSOSActivate={() => setSosActive(true)} />;
      case "report": return <ReportTab onNavigate={handleNavigate} onReportSubmitted={handleReportSubmitted} />;
      case "map": return <MapTab />;
      case "alerts": return <AlertsTab alerts={alerts} />;
      case "roles": return <RolesTab currentUser={currentUser} currentRole={role} users={users} onUsersChange={setUsers} />;
      case "admin": return <AdminTab currentRole={role} alerts={alerts} announcements={announcementsList} onAnnouncementsChange={setAnnouncementsList} guards={guardsList} onGuardsChange={setGuardsList} currentUser={currentUser} />;
      case "profile": return <ProfileTab currentUser={currentUser} currentRole={role} onLogout={handleLogout} onSwitchRole={handleSwitchRole} />;
      default: return null;
    }
  };

  // Login screen
  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-md bg-slate-50 min-h-screen relative flex flex-col shadow-none md:shadow-2xl md:rounded-[2.5rem] md:border md:border-slate-200 overflow-hidden">
        {/* Top Bar */}
        <TopBar currentUser={currentUser!} currentRole={role!} onNavigate={handleNavigate} />

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="p-4 pt-4">{renderTabContent()}</div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex-shrink-0 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around px-1 pt-2 pb-1">
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`relative flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-all active:scale-95 min-w-[48px] ${isActive ? "text-[#0f4c81]" : "text-slate-400"}`}>
                  <div className={`p-1.5 rounded-xl transition-colors ${isActive ? "bg-[#0f4c81]/10" : ""}`}>
                    <tab.icon className={`w-5 h-5 transition-all ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
                  </div>
                  <span className={`text-[9px] font-medium ${isActive ? "font-semibold" : ""}`}>{tab.label}</span>
                  {tab.id === "alerts" && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />}
                </button>
              );
            })}
          </div>
          <div className="flex justify-center pb-1.5"><div className="w-32 h-1 bg-slate-200 rounded-full" /></div>
        </div>
      </div>

      {/* SOS Overlay */}
      {sosActive && <SOSOverlay onCancel={() => setSosActive(false)} />}
    </div>
  );
}
