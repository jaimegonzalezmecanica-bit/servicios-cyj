"use client";

import React, { useState, useEffect, useRef, FormEvent } from "react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertTriangle,
  MapPin,
  Map,
  Smartphone,
  Building2,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  Quote,
  Mail,
  Phone,
  HelpCircle,
  Star,
  Send,
  CheckCircle2,
  Download,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react";

/* ─── Navigation Links ─── */
const NAV_LINKS = [
  { label: "Quiénes Somos", href: "#quienes-somos" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Galería", href: "#galeria" },
  { label: "Testimonios", href: "#testimonios" },
  { label: "Demo", href: "#demo" },
  { label: "Precios", href: "#precios" },
  { label: "Soporte", href: "#soporte" },
  { label: "Contacto", href: "#contacto" },
];

/* ─── Features Data ─── */
const FEATURES = [
  {
    icon: AlertTriangle,
    title: "Botón SOS",
    description:
      "Activa una alerta de emergencia instantánea con un solo toque. Tu ubicación se envía automáticamente a la comunidad y autoridades.",
  },
  {
    icon: MapPin,
    title: "Reportes Georreferenciados",
    description:
      "Reporta incidentes con ubicación precisa. Todos los vecinos pueden visualizar y responder a eventos en tiempo real.",
  },
  {
    icon: Map,
    title: "Mapa de Incidentes",
    description:
      "Visualiza un mapa interactivo con todos los reportes de tu comunidad. Identifica zonas de mayor actividad.",
  },
  {
    icon: Smartphone,
    title: "Fácil de Usar",
    description:
      "Interfaz intuitiva diseñada para todos los miembros de la familia. Sin complicaciones, solo seguridad al alcance de tu mano.",
  },
  {
    icon: Building2,
    title: "Planes por Comunidad",
    description:
      "Planes flexibles adaptados al tamaño de tu comunidad. Desde 1 hasta más de 1000 usuarios, todos protegidos.",
  },
  {
    icon: ShieldCheck,
    title: "Seguridad Garantizada",
    description:
      "Tus datos están protegidos con encriptación de última generación. Privacidad y seguridad son nuestra prioridad.",
  },
];

/* ─── Gallery Data ─── */
const GALLERY_ITEMS = [
  {
    image: "/download/gallery-sos.jpg",
    title: "Botón SOS Inmediato",
    description:
      "Alerta de emergencia con un solo toque, enviando tu ubicación en tiempo real.",
  },
  {
    image: "/download/gallery-reports.jpg",
    title: "Reportes Inteligentes",
    description:
      "Categoriza y gestiona incidentes de forma eficiente con análisis automático.",
  },
  {
    image: "/download/gallery-map.jpg",
    title: "Mapa Interactivo",
    description:
      "Visualiza todos los incidentes de tu comunidad en un mapa en tiempo real.",
  },
  {
    image: "/download/gallery-family.jpg",
    title: "Seguridad Familiar",
    description:
      "Protege a los tuyos con herramientas diseñadas para toda la familia.",
  },
  {
    image: "/download/gallery-geolocation.jpg",
    title: "Geolocalización Precisa",
    description:
      "Ubicación exacta de cada incidente para una respuesta rápida y efectiva.",
  },
  {
    image: "/download/gallery-security.jpg",
    title: "Tranquilidad Total",
    description:
      "Vive con la tranquilidad de saber que tu comunidad está conectada y protegida.",
  },
];

/* ─── Testimonials Data ─── */
const TESTIMONIALS = [
  {
    text: "Desde que implementamos VigilApp en nuestro condominio, la sensación de seguridad aumentó notablemente. Los vecinos se sienten más conectados y protegidos.",
    author: "María González",
    role: "Administradora, Condominio Los Aromos",
  },
  {
    text: "El botón SOS nos salvó en una situación de emergencia. La respuesta fue inmediata y todos en la comunidad pudieron colaborar. Totalmente recomendado.",
    author: "Carlos Muñoz",
    role: "Residente, Villa del Mar",
  },
];

/* ─── FAQ Data ─── */
const FAQ_ITEMS = [
  {
    question: "¿La app tiene costo?",
    answer:
      "VigilApp funciona bajo un modelo de suscripción mensual por comunidad. El costo depende de la cantidad de usuarios y se calcula en UF. Ofrecemos planes flexibles con tarifas decrecientes según el tamaño de la comunidad.",
  },
  {
    question: "¿Quién puede usar la app?",
    answer:
      "Todos los residentes del condominio pueden descargar y usar VigilApp sin costo adicional. La suscripción la paga la comunidad o administración, y todos los vecinos tienen acceso completo a todas las funcionalidades.",
  },
  {
    question: "¿Qué pasa si no tengo internet?",
    answer:
      "Las alertas SOS están optimizadas para funcionar incluso con baja conectividad. La app intentará enviar la alerta por múltiples canales y se encola automáticamente cuando se recupera la conexión a internet.",
  },
  {
    question: "¿Está disponible en iPhone y Android?",
    answer:
      "Sí, VigilApp está disponible tanto en la App Store para dispositivos iPhone como en Google Play para dispositivos Android. Ambas versiones tienen las mismas funcionalidades completas.",
  },
];

/* ─── Pricing Data ─── */
const PRICING_TIERS = [
  { range: "1-10", price: "0,025", label: "Plan básico", popular: false },
  { range: "11-25", price: "0,024", label: "Comunidades pequeñas", popular: false },
  { range: "26-50", price: "0,023", label: "Comunidades medianas", popular: false },
  { range: "51-100", price: "0,022", label: "Plan intermedio", popular: true },
  { range: "101-200", price: "0,021", label: "Plan avanzado", popular: false },
  { range: "201-500", price: "0,020", label: "Plan plus", popular: false },
  { range: "501-1000", price: "0,019", label: "Grandes comunidades", popular: false },
  { range: "1001+", price: "0,018", label: "Plan especial", popular: false },
];

/* ─── WhatsApp SVG Icon ─── */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      className={className}
    >
      <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.96A15.924 15.924 0 0016.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.31 22.598c-.39 1.1-1.932 2.014-3.168 2.28-.846.18-1.95.324-5.67-1.218-4.762-1.972-7.826-6.824-8.064-7.14-.228-.316-1.928-2.568-1.928-4.896s1.22-3.474 1.652-3.95c.432-.474.942-.594 1.258-.594.316 0 .632.002.908.016.292.016.682-.11 1.068.816.392.942 1.332 3.27 1.45 3.506.116.236.196.512.04.826-.158.316-.236.512-.472.788-.236.276-.496.616-.708.826-.236.236-.482.492-.206.964.276.472 1.228 2.026 2.638 3.282 1.812 1.616 3.34 2.118 3.814 2.354.472.236.748.196 1.024-.118.276-.316 1.18-1.376 1.496-1.85.316-.472.632-.392 1.064-.236.432.158 2.748 1.296 3.22 1.532.472.236.788.354.906.548.118.196.118 1.12-.272 2.22z" />
    </svg>
  );
}

/* ─── Shield Logo Component ─── */
function ShieldLogo() {
  return (
    <svg
      viewBox="0 0 40 44"
      fill="none"
      className="w-8 h-9"
    >
      <path
        d="M20 2L4 10v12c0 11.1 6.84 21.5 16 24 9.16-2.5 16-12.9 16-24V10L20 2z"
        fill="url(#shield-gradient)"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M15 22l4 4 7-8"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient
          id="shield-gradient"
          x1="4"
          y1="2"
          x2="36"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#1e40af" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Fade-in animation on scroll ─── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isVisible } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════ */
export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    condominio: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const { toast } = useToast();

  /* ─── Scroll listener ─── */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ─── Smooth scroll handler ─── */
  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  /* ─── Form handler ─── */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        setFormSuccess(true);
        setFormData({ name: "", email: "", condominio: "", message: "" });
        toast({
          title: "¡Solicitud enviada!",
          description: "Nos pondremos en contacto contigo pronto.",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Hubo un error al enviar la solicitud.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── NAVIGATION ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-slate-900/95 backdrop-blur-md shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center gap-2 text-white font-bold text-xl"
            >
              <ShieldLogo />
              <span>VigilApp</span>
            </a>

            {/* Desktop links */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo(link.href);
                  }}
                  className="text-sm text-white/80 hover:text-white px-3 py-2 rounded-md transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`lg:hidden transition-all duration-300 overflow-hidden ${
            mobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-slate-900/95 backdrop-blur-md border-t border-white/10 px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(link.href);
                }}
                className="block text-white/80 hover:text-white px-3 py-3 rounded-md transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <main>
        {/* ═══════════════════════════════════════════
            SECTION 1: HERO
            ═══════════════════════════════════════════ */}
        <section className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "40px 40px",
              }}
            />
          </div>
          {/* Gradient orbs */}
          <div className="absolute top-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-300">
                    Seguridad comunitaria inteligente
                  </span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Seguridad inteligente para tu{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                    comunidad
                  </span>
                </h1>
                <p className="text-lg text-slate-300 max-w-xl">
                  Botón SOS, reportes vecinales y geolocalización. Conecta a tu
                  comunidad con tecnología que protege lo que más importa.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base"
                    onClick={() => scrollTo("#demo")}
                  >
                    Agendar una Demo
                    <ChevronDown className="w-4 h-4 ml-2 rotate-[-90deg]" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/20 text-white hover:bg-white/10 px-8 py-3 text-base"
                    onClick={() => scrollTo("#funcionalidades")}
                  >
                    Ver Funcionalidades
                  </Button>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="relative flex justify-center">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-3xl blur-2xl" />
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <Image
                    src="/download/hero-app.jpg"
                    alt="VigilApp - Aplicación de seguridad comunitaria"
                    width={1152}
                    height={864}
                    className="w-full h-auto max-w-lg lg:max-w-none"
                    priority
                  />
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <div className="w-5 h-8 border-2 border-white/30 rounded-full flex justify-center pt-1">
              <div className="w-1 h-2 bg-white/50 rounded-full animate-bounce" />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            SECTION 2: QUIÉNES SOMOS
            ═══════════════════════════════════════════ */}
        <section id="quienes-somos" className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <FadeIn>
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-2 text-sm font-medium">
                    <Star className="w-4 h-4" />
                    Sobre Nosotros
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                    Quiénes Somos
                  </h2>
                  <p className="text-slate-600 leading-relaxed text-lg">
                    VigilApp nació con la misión de transformar la seguridad
                    comunitaria en Chile. Somos una empresa tecnológica que cree
                    en el poder de la colaboración vecinal y la innovación para
                    crear comunidades más seguras y conectadas.
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    Nuestra plataforma integra tecnología de última generación
                    con una interfaz simple e intuitiva, permitiendo que todos los
                    miembros de una comunidad puedan reportar incidentes,
                    activar alertas de emergencia y mantenerse informados en
                    tiempo real.
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-6 pt-6">
                    <div className="bg-blue-50 rounded-xl p-6 text-center">
                      <div className="text-3xl font-bold text-blue-700">
                        500+
                      </div>
                      <div className="text-sm text-blue-600 mt-1">
                        Condominios Conectados
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-6 text-center">
                      <div className="text-3xl font-bold text-blue-700">
                        10K+
                      </div>
                      <div className="text-sm text-blue-600 mt-1">
                        Usuarios Activos
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={200}>
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-blue-50 rounded-3xl" />
                  <div className="relative rounded-2xl overflow-hidden shadow-xl">
                    <Image
                      src="/download/about-community.jpg"
                      alt="Comunidad segura con VigilApp"
                      width={1152}
                      height={864}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            SECTION 3: FUNCIONALIDADES
            ═══════════════════════════════════════════ */}
        <section
          id="funcionalidades"
          className="py-20 lg:py-28 bg-slate-50"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="text-center max-w-2xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-2 text-sm font-medium mb-4">
                  <Smartphone className="w-4 h-4" />
                  Funcionalidades
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                  Todo lo que necesitas para proteger tu comunidad
                </h2>
                <p className="mt-4 text-slate-600">
                  Herramientas poderosas diseñadas para la seguridad vecinal
                </p>
              </div>
            </FadeIn>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {FEATURES.map((feature, idx) => (
                <FadeIn key={feature.title} delay={idx * 100}>
                  <div className="group bg-white rounded-2xl p-6 lg:p-8 shadow-sm hover:shadow-lg border border-slate-100 hover:border-blue-200 transition-all duration-300 hover:-translate-y-1">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-5 transition-colors duration-300">
                      <feature.icon className="w-7 h-7 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            SECTION 4: GALERÍA
            ═══════════════════════════════════════════ */}
        <section id="galeria" className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="text-center max-w-2xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-2 text-sm font-medium mb-4">
                  <Map className="w-4 h-4" />
                  Galería
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                  Conoce VigilApp en acción
                </h2>
                <p className="mt-4 text-slate-600">
                  Explora las funcionalidades que hacen de VigilApp la mejor
                  opción para tu comunidad
                </p>
              </div>
            </FadeIn>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {GALLERY_ITEMS.map((item, idx) => (
                <FadeIn key={item.title} delay={idx * 100}>
                  <div className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 cursor-pointer aspect-[4/3]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                      <h3 className="text-white text-lg font-semibold mb-2">
                        {item.title}
                      </h3>
                      <p className="text-white/80 text-sm leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            SECTION 5: TESTIMONIOS
            ═══════════════════════════════════════════ */}
        <section
          id="testimonios"
          className="py-20 lg:py-28 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="text-center max-w-2xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 text-sm font-medium text-blue-300 mb-4">
                  <Quote className="w-4 h-4" />
                  Testimonios
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white">
                  Lo que dicen nuestros usuarios
                </h2>
              </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {TESTIMONIALS.map((t, idx) => (
                <FadeIn key={t.author} delay={idx * 150}>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors duration-300">
                    <Quote className="w-10 h-10 text-blue-400 mb-4" />
                    <p className="text-slate-200 leading-relaxed mb-6 text-lg">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div>
                      <div className="font-semibold text-white">{t.author}</div>
                      <div className="text-slate-400 text-sm">{t.role}</div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            SECTION 6: DEMO FORM
            ═══════════════════════════════════════════ */}
        <section id="demo" className="py-20 lg:py-28 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              <FadeIn>
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-2 text-sm font-medium">
                    <Send className="w-4 h-4" />
                    Agenda una Demo
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                    ¿Listo para proteger tu comunidad?
                  </h2>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    Completa el formulario y un especialista se pondrá en
                    contacto contigo para mostrarte cómo VigilApp puede
                    transformar la seguridad de tu comunidad.
                  </p>
                  <div className="space-y-4 pt-4">
                    {[
                      "Demo personalizada para tu comunidad",
                      "Sin compromiso de contratación",
                      "Respuesta en menos de 24 horas",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={200}>
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
                  {formSuccess ? (
                    <div className="text-center py-12 space-y-4">
                      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                      <h3 className="text-2xl font-bold text-slate-900">
                        ¡Solicitud Enviada!
                      </h3>
                      <p className="text-slate-600">
                        Gracias por tu interés. Nos pondremos en contacto contigo
                        pronto.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setFormSuccess(false)}
                      >
                        Enviar otra solicitud
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre completo</Label>
                        <Input
                          id="name"
                          placeholder="Tu nombre"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="tu@email.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="condominio">Condominio</Label>
                        <Input
                          id="condominio"
                          placeholder="Nombre del condominio"
                          value={formData.condominio}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              condominio: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Mensaje</Label>
                        <Textarea
                          id="message"
                          placeholder="Cuéntanos sobre tu comunidad..."
                          rows={4}
                          value={formData.message}
                          onChange={(e) =>
                            setFormData({ ...formData, message: e.target.value })
                          }
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <svg
                              className="animate-spin h-4 w-4"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Enviando...
                          </span>
                        ) : (
                          "Enviar solicitud"
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            SECTION 7: FAQ
            ═══════════════════════════════════════════ */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-2 text-sm font-medium mb-4">
                  <HelpCircle className="w-4 h-4" />
                  Preguntas Frecuentes
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                  ¿Tienes dudas?
                </h2>
                <p className="mt-4 text-slate-600">
                  Encuentra respuestas a las preguntas más comunes
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={100}>
              <Accordion type="single" collapsible className="space-y-3">
                {FAQ_ITEMS.map((item, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`faq-${idx}`}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-6 data-[state=open]:bg-blue-50 data-[state=open]:border-blue-200 transition-colors"
                  >
                    <AccordionTrigger className="text-left text-slate-900 font-medium hover:no-underline py-5">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 pb-5 leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </FadeIn>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            SECTION 8: PRECIOS
            ═══════════════════════════════════════════ */}
        <section id="precios" className="py-20 lg:py-28 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="text-center max-w-2xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-2 text-sm font-medium mb-4">
                  <Building2 className="w-4 h-4" />
                  Precios
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                  Planes adaptados a tu comunidad
                </h2>
                <p className="mt-4 text-slate-600">
                  Precios en UF por usuario/mes. Mientras más grande tu
                  comunidad, menor el costo por usuario.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={100}>
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="text-left px-6 py-4 font-semibold">
                          Rango de Usuarios
                        </th>
                        <th className="text-left px-6 py-4 font-semibold">
                          Plan
                        </th>
                        <th className="text-left px-6 py-4 font-semibold">
                          Precio (UF/usuario/mes)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {PRICING_TIERS.map((tier) => (
                        <tr
                          key={tier.range}
                          className={`border-b border-slate-100 last:border-0 transition-colors ${
                            tier.popular
                              ? "bg-blue-50/50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900">
                                {tier.range} usuarios
                              </span>
                              {tier.popular && (
                                <span className="bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                                  Popular
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {tier.label}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-blue-700">
                              {tier.price}
                            </span>{" "}
                            <span className="text-slate-500">UF</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    <strong className="text-slate-900">Nota:</strong> El
                    mínimo por comunidad es de{" "}
                    <strong className="text-blue-700">0,2 UF/mes</strong>,
                    independientemente de la cantidad de usuarios.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            SECTION 9: SOPORTE
            ═══════════════════════════════════════════ */}
        <section id="soporte" className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="text-center max-w-2xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-2 text-sm font-medium mb-4">
                  <Phone className="w-4 h-4" />
                  Soporte
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                  Estamos aquí para ayudarte
                </h2>
                <p className="mt-4 text-slate-600">
                  Múltiples canales de contacto para tu comodidad
                </p>
              </div>
            </FadeIn>

            <div className="grid sm:grid-cols-3 gap-6 lg:gap-8 max-w-4xl mx-auto">
              <FadeIn delay={0}>
                <div className="bg-slate-50 rounded-2xl p-8 text-center hover:shadow-lg hover:bg-blue-50 transition-all duration-300 border border-slate-100 hover:border-blue-200">
                  <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-5">
                    <HelpCircle className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    FAQ
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Revisa nuestras preguntas frecuentes para resolver tus dudas
                    rápidamente.
                  </p>
                </div>
              </FadeIn>

              <FadeIn delay={100}>
                <div className="bg-slate-50 rounded-2xl p-8 text-center hover:shadow-lg hover:bg-blue-50 transition-all duration-300 border border-slate-100 hover:border-blue-200">
                  <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-5">
                    <Mail className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Correo Electrónico
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Escríbenos a
                  </p>
                  <a
                    href="mailto:soporte@vigilapp.cl"
                    className="text-blue-600 font-medium hover:underline"
                  >
                    soporte@vigilapp.cl
                  </a>
                </div>
              </FadeIn>

              <FadeIn delay={200}>
                <div className="bg-slate-50 rounded-2xl p-8 text-center hover:shadow-lg hover:bg-green-50 transition-all duration-300 border border-slate-100 hover:border-green-200">
                  <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-5">
                    <Phone className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    WhatsApp
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Contáctanos directamente
                  </p>
                  <a
                    href="https://wa.me/56944401850"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 font-medium hover:underline"
                  >
                    +56 9 4440 1850
                  </a>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            SECTION 10: CONTACTO / CTA FINAL
            ═══════════════════════════════════════════ */}
        <section
          id="contacto"
          className="py-20 lg:py-28 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <FadeIn>
              <div className="space-y-6">
                <ShieldLogo />
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                  ¿Protegemos tu comunidad hoy?
                </h2>
                <p className="text-xl text-blue-200 max-w-2xl mx-auto">
                  Únete a las más de 500 comunidades que ya confían en VigilApp
                  para su seguridad.
                </p>
                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  <Button
                    size="lg"
                    className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-3 text-base font-semibold"
                    onClick={() => scrollTo("#demo")}
                  >
                    Agendar una Demo
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 px-8 py-3 text-base"
                    onClick={() => scrollTo("#precios")}
                  >
                    Ver Precios
                  </Button>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════ */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldLogo />
                <span className="font-bold text-xl">VigilApp</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Seguridad inteligente para comunidades en Chile. Conectando
                vecinos con tecnología que protege lo que más importa.
              </p>
              <div className="flex gap-4 pt-2">
                {[
                  { icon: Facebook, label: "Facebook" },
                  { icon: Instagram, label: "Instagram" },
                  { icon: Twitter, label: "Twitter" },
                ].map(({ icon: Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-blue-600 flex items-center justify-center transition-colors"
                    aria-label={label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Contacto</h4>
              <ul className="space-y-3 text-slate-400">
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <a
                    href="mailto:soporte@vigilapp.cl"
                    className="hover:text-white transition-colors"
                  >
                    soporte@vigilapp.cl
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <a
                    href="https://wa.me/56944401850"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    +56 9 4440 1850
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>Santiago, Chile</span>
                </li>
              </ul>
            </div>

            {/* Download */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Descargar App</h4>
              <div className="space-y-3">
                <a
                  href="#"
                  className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 rounded-xl px-4 py-3 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <div>
                    <div className="text-xs text-slate-400">
                      Disponible en
                    </div>
                    <div className="text-sm font-medium">App Store</div>
                  </div>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 rounded-xl px-4 py-3 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <div>
                    <div className="text-xs text-slate-400">
                      Consíguelo en
                    </div>
                    <div className="text-sm font-medium">Google Play</div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © 2025 VigilApp. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-white transition-colors">
                Política de Privacidad
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Términos de Uso
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════
          FLOATING WHATSAPP BUTTON
          ═══════════════════════════════════════════ */}
      <a
        href="https://wa.me/56944401850"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Contactar por WhatsApp"
      >
        {/* Tooltip */}
        <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-sm px-4 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-lg">
          ¡Hablemos por WhatsApp!
        </span>
        {/* Pulse ring */}
        <span className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" />
        {/* Button */}
        <span className="relative flex w-14 h-14 items-center justify-center bg-[#25D366] hover:bg-[#20BD5A] rounded-full shadow-lg transition-colors duration-200">
          <WhatsAppIcon className="w-7 h-7 text-white" />
        </span>
      </a>
    </div>
  );
}
