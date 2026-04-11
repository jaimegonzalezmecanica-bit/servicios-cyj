// Mock data for Servicios Integrales CyJ

/* ═══════════════════════════════════════════════════════════
   ROLE SYSTEM
   ═══════════════════════════════════════════════════════════ */

export type RoleId =
  | "super_admin"
  | "admin"
  | "residente_guardia";

export interface Role {
  id: RoleId;
  name: string;
  description: string;
  permissions: {
    canSOS: boolean;
    canReport: boolean;
    canViewAlerts: boolean;
    canManageAlerts: boolean;
    canViewMap: boolean;
    canManageUsers: boolean;
    canViewReports: boolean;
    canManageRoles: boolean;
    canViewStats: boolean;
    canAssignGuards: boolean;
    canManageFacilities: boolean;
    canPostAnnouncements: boolean;
  };
  color: string;
  icon: string;
  maxUsers?: number;
}

export const ROLES: Role[] = [
  {
    id: "super_admin",
    name: "Super Administrador",
    description: "Control total del sistema. Gestiona comunidades, usuarios, roles y configuración general.",
    permissions: { canSOS: true, canReport: true, canViewAlerts: true, canManageAlerts: true, canViewMap: true, canManageUsers: true, canViewReports: true, canManageRoles: true, canViewStats: true, canAssignGuards: true, canManageFacilities: true, canPostAnnouncements: true },
    color: "#7c3aed",
    icon: "crown",
    maxUsers: 1,
  },
  {
    id: "admin",
    name: "Administrador",
    description: "Gestión completa de la comunidad, usuarios y alertas. Acceso a reportes y estadísticas.",
    permissions: { canSOS: true, canReport: true, canViewAlerts: true, canManageAlerts: true, canViewMap: true, canManageUsers: true, canViewReports: true, canManageRoles: false, canViewStats: true, canAssignGuards: true, canManageFacilities: true, canPostAnnouncements: true },
    color: "#2563eb",
    icon: "shield",
    maxUsers: 3,
  },
  {
    id: "residente_guardia",
    name: "Residente",
    description: "Acceso estándar: botón SOS, reportar incidentes, ver alertas y mapa de la comunidad.",
    permissions: { canSOS: true, canReport: true, canViewAlerts: true, canManageAlerts: false, canViewMap: true, canManageUsers: false, canViewReports: false, canManageRoles: false, canViewStats: false, canAssignGuards: false, canManageFacilities: false, canPostAnnouncements: false },
    color: "#d97706",
    icon: "user",
  },
];

export function hasPermission(roleId: RoleId, permission: keyof Role["permissions"]): boolean {
  const role = ROLES.find(r => r.id === roleId);
  return role?.permissions[permission] ?? false;
}

export function getRole(roleId: RoleId): Role | undefined {
  return ROLES.find(r => r.id === roleId);
}

/* ═══════════════════════════════════════════════════════════
   INTERFACES
   ═══════════════════════════════════════════════════════════ */

export interface Alert {
  id: string;
  category: string;
  categoryIcon: string;
  title: string;
  description: string;
  time: string;
  location: string;
  status: "activa" | "en_revision" | "resuelta";
  priority: "low" | "medium" | "high" | "critical";
  comments: number;
  isAnonymous: boolean;
  lat: number;
  lng: number;
  photo?: string | null;
}

export interface UserProfile {
  name: string;
  role: RoleId;
  roleName: string;
  condo: string;
  phone: string;
  email: string;
  address: string;
  unit: string;
  conjunto: string;
  reports: number;
  memberSince: string;
  avatarInitial: string;
  familyMembers: number;
}

export interface IncidentMarker {
  id: string;
  category: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  severity: "critical" | "warning" | "info";
  time: string;
  distance: string;
}

export interface SampleUser {
  id: string;
  name: string;
  role: RoleId;
  roleName: string;
  conjunto: string;
  unit: string;
  phone: string;
  email: string;
  online: boolean;
  memberSince: string;
  avatarInitial: string;
}

/* ═══════════════════════════════════════════════════════════
   DEMO ACCOUNTS
   ═══════════════════════════════════════════════════════════ */

export const demoAccounts: UserProfile[] = [];

/* ═══════════════════════════════════════════════════════════
   DEFAULT USER
   ═══════════════════════════════════════════════════════════ */

export const userProfile: UserProfile = {
  name: "Carlos Pérez",
  role: "residente_guardia",
  roleName: "Residente",
  condo: "Servicios Integrales CyJ",
  phone: "+56 9 1234 5678",
  email: "carlos.perez@email.com",
  address: "Torre A - Unidad 456",
  unit: "456",
  conjunto: "flamencos",
  reports: 8,
  memberSince: "2023",
  avatarInitial: "C",
  familyMembers: 3,
};

/* ═══════════════════════════════════════════════════════════
   COMMUNITY STATS
   ═══════════════════════════════════════════════════════════ */

export const communityStats = {
  totalAlerts: 156,
  activeAlerts: 3,
  resolvedToday: 12,
  membersOnline: 189,
  totalMembers: 722,
  totalUnits: 380,
  towers: 6,
  guardsOnDuty: 4,
  totalFamilies: 412,
  pendingReports: 7,
};

/* ═══════════════════════════════════════════════════════════
   ROLE DISTRIBUTION
   ═══════════════════════════════════════════════════════════ */

export const roleDistribution = [
  { roleId: "super_admin", count: 1 },
  { roleId: "admin", count: 2 },
  { roleId: "residente_guardia", count: 245 },
];

/* ═══════════════════════════════════════════════════════════
   CONJUNTOS HABITACIONALES
   ═══════════════════════════════════════════════════════════ */

export interface Conjunto {
  id: string;
  name: string;
  type: "casas" | "torres";
  houses?: number;
  towersCount?: number;
  units?: number;
  floors?: number;
  status: "operativo" | "mantención";
  lat?: number;
  lng?: number;
}

export const conjuntos: Conjunto[] = [
  { id: "flamencos",  name: "Flamencos",  type: "casas",  status: "operativo", lat: -33.3264, lng: -70.7642 },
  { id: "faisanes",   name: "Faisanes",   type: "casas",  status: "operativo", lat: -33.3258, lng: -70.7618 },
  { id: "garzas",     name: "Garzas",     type: "casas",  status: "operativo", lat: -33.3262, lng: -70.7628 },
  { id: "gaviotas",   name: "Gaviotas",   type: "casas",  status: "operativo", lat: -33.3274, lng: -70.7638 },
  { id: "becacinas",  name: "Becacinas",  type: "casas",  status: "operativo", lat: -33.3278, lng: -70.7625 },
  { id: "bandurrias", name: "Bandurrias", type: "casas",  status: "operativo", lat: -33.3285, lng: -70.7635 },
  { id: "albatros",   name: "Albatros",   type: "casas",  status: "operativo", lat: -33.3288, lng: -70.7618 },
  { id: "canquen",    name: "Canquén",    type: "torres", towersCount: 2, status: "operativo", lat: -33.3294, lng: -70.7630 },
];

// Backward compatibility alias
export type Tower = Conjunto;
export const towers = conjuntos;

/* ═══════════════════════════════════════════════════════════
   SAMPLE USERS (for admin panel)
   ═══════════════════════════════════════════════════════════ */

export const sampleUsers: SampleUser[] = [
  { id: "u1", name: "Roberto Silva Alarcón", role: "super_admin", roleName: "Super Administrador", conjunto: "flamencos", unit: "1", phone: "+56 9 1111 1111", email: "roberto.silva@cyj.cl", online: true, memberSince: "2021", avatarInitial: "R" },
  { id: "u2", name: "María López Fernández", role: "admin", roleName: "Administradora", conjunto: "canquen", unit: "201", phone: "+56 9 2222 2222", email: "maria.lopez@cyj.cl", online: true, memberSince: "2022", avatarInitial: "M" },
  { id: "u3", name: "Pedro Contreras Ruiz", role: "admin", roleName: "Administrador", conjunto: "faisanes", unit: "5", phone: "+56 9 3333 3333", email: "pedro.contreras@cyj.cl", online: false, memberSince: "2022", avatarInitial: "P" },
  { id: "u4", name: "Carlos Pérez Gutiérrez", role: "residente_guardia", roleName: "Residente", conjunto: "flamencos", unit: "12", phone: "+56 9 1234 5678", email: "carlos.perez@email.com", online: true, memberSince: "2023", avatarInitial: "C" },
  { id: "u5", name: "Valentina Rojas Parra", role: "residente_guardia", roleName: "Residente", conjunto: "canquen", unit: "102", phone: "+56 9 1212 3434", email: "valentina.rojas@email.com", online: true, memberSince: "2022", avatarInitial: "V" },
  { id: "u6", name: "Francisco Morales Ibañez", role: "residente_guardia", roleName: "Residente", conjunto: "bandurrias", unit: "6", phone: "+56 9 1313 5353", email: "francisco.morales@email.com", online: false, memberSince: "2021", avatarInitial: "F" },
  { id: "u7", name: "Camila Núñez Olivera", role: "residente_guardia", roleName: "Residente", conjunto: "albatros", unit: "4", phone: "+56 9 1414 6464", email: "camila.nunez@email.com", online: true, memberSince: "2023", avatarInitial: "C" },
  { id: "u8", name: "Diego Pizarro Sepúlveda", role: "residente_guardia", roleName: "Residente", conjunto: "faisanes", unit: "9", phone: "+56 9 1515 7575", email: "diego.pizarro@email.com", online: false, memberSince: "2024", avatarInitial: "D" },
  { id: "u9", name: "Isabella Castro Godoy", role: "residente_guardia", roleName: "Residente", conjunto: "canquen", unit: "305", phone: "+56 9 1616 8686", email: "isabella.castro@email.com", online: true, memberSince: "2023", avatarInitial: "I" },
  { id: "u10", name: "Patricia Lillo Salazar", role: "residente_guardia", roleName: "Residente", conjunto: "gaviotas", unit: "11", phone: "+56 9 2121 2121", email: "patricia.lillo@email.com", online: false, memberSince: "2022", avatarInitial: "P" },
  { id: "u11", name: "Sebastián Agüero Cortés", role: "residente_guardia", roleName: "Residente", conjunto: "becacinas", unit: "7", phone: "+56 9 2222 3232", email: "sebastian.aguero@email.com", online: true, memberSince: "2021", avatarInitial: "S" },
  { id: "u12", name: "Javiera Donoso Vega", role: "residente_guardia", roleName: "Residente", conjunto: "albatros", unit: "15", phone: "+56 9 2424 5454", email: "javiera.donoso@email.com", online: false, memberSince: "2024", avatarInitial: "J" },
];

/* ═══════════════════════════════════════════════════════════
   ALERTS
   ═══════════════════════════════════════════════════════════ */

export const mockAlerts: Alert[] = [
  {
    id: "1",
    category: "Persona sospechosa",
    categoryIcon: "user-x",
    title: "Persona extraña merodeando sector B",
    description: "Se ha visto a una persona desconocida merodeando por el sector B durante las últimas horas. No responde a saludos y se porta de manera sospechosa.",
    time: "hace 5 min",
    location: "Torre B - Sector B, Condominio Laguna Norte",
    status: "activa",
    priority: "high",
    comments: 8,
    isAnonymous: false,
    lat: -33.3262,
    lng: -70.7616,
  },
  {
    id: "2",
    category: "Ruido molesto",
    categoryIcon: "volume-2",
    title: "Fiesta ruidosa en unidad 12B",
    description: "Música alta y gritos desde hace más de 2 horas. Se solicita intervención de guardia.",
    time: "hace 15 min",
    location: "Torre B - Unidad 12B, Condominio Laguna Norte",
    status: "en_revision",
    priority: "medium",
    comments: 5,
    isAnonymous: true,
    lat: -33.3265,
    lng: -70.7613,
  },
  {
    id: "3",
    category: "Vehículo sospechoso",
    categoryIcon: "car",
    title: "Auto negro sin placas estacionado",
    description: "Vehículo sedan negro sin placas estacionado en zona prohibida desde ayer. No se ha identificado al propietario.",
    time: "hace 30 min",
    location: "Estacionamiento Visitas, Condominio Laguna Norte",
    status: "activa",
    priority: "high",
    comments: 3,
    isAnonymous: false,
    lat: -33.3300,
    lng: -70.7625,
  },
  {
    id: "4",
    category: "Acceso no autorizado",
    categoryIcon: "door-open",
    title: "Puerta lateral encontrada abierta",
    description: "La puerta de acceso peatonal del lado norte fue encontrada abierta fuera de horario autorizado.",
    time: "hace 1 hora",
    location: "Acceso Norte, Condominio Laguna Norte",
    status: "resuelta",
    priority: "critical",
    comments: 12,
    isAnonymous: false,
    lat: -33.3250,
    lng: -70.7625,
  },
  {
    id: "5",
    category: "Mascota suelta",
    categoryIcon: "paw-print",
    title: "Perro grande sin correa en áreas comunes",
    description: "Un perro de raza grande se encuentra suelto cerca del parque. No tiene collar visible.",
    time: "hace 2 horas",
    location: "Parque Central, Condominio Laguna Norte",
    status: "en_revision",
    priority: "low",
    comments: 2,
    isAnonymous: false,
    lat: -33.3280,
    lng: -70.7630,
  },
  {
    id: "6",
    category: "Robo/hurto",
    categoryIcon: "shield-alert",
    title: "Robo de bicicleta en bodega común",
    description: "Mi bicicleta fue sustraída de la bodega común durante la noche. Cámara de seguridad registró ingreso sospechoso.",
    time: "hace 3 horas",
    location: "Bodega Común - Subsuelo, Condominio Laguna Norte",
    status: "activa",
    priority: "critical",
    comments: 15,
    isAnonymous: false,
    lat: -33.3282,
    lng: -70.7611,
  },
  {
    id: "7",
    category: "Incendio",
    categoryIcon: "flame",
    title: "Olor a humo en pasillo Torre A",
    description: "Se detecta fuerte olor a humo en el tercer piso de la Torre A. Posible cortocircuito en ducto de basura.",
    time: "hace 4 horas",
    location: "Torre A - Piso 3, Condominio Laguna Norte",
    status: "resuelta",
    priority: "critical",
    comments: 20,
    isAnonymous: false,
    lat: -33.3262,
    lng: -70.7606,
  },
  {
    id: "8",
    category: "Ruido molesto",
    categoryIcon: "volume-2",
    title: "Obras de construcción fuera de horario",
    description: "Se están realizando obras de demolición en la unidad 8A fuera del horario permitido por el reglamento.",
    time: "hace 5 horas",
    location: "Torre C - Unidad 8A, Condominio Laguna Norte",
    status: "resuelta",
    priority: "low",
    comments: 4,
    isAnonymous: true,
    lat: -33.3272,
    lng: -70.7626,
  },
  {
    id: "9",
    category: "Persona sospechosa",
    categoryIcon: "user-x",
    title: "Intento de acceso con llave falsa",
    description: "Un individuo intentó ingresar a la Torre B usando una llave que no correspondía. Fue visto por el conserje.",
    time: "hace 6 horas",
    location: "Torre B - Entrada Principal, Condominio Laguna Norte",
    status: "en_revision",
    priority: "critical",
    comments: 10,
    isAnonymous: false,
    lat: -33.3262,
    lng: -70.7619,
  },
  {
    id: "10",
    category: "Vehículo sospechoso",
    categoryIcon: "car",
    title: "Camioneta dudosa en zona de juego infantil",
    description: "Una camioneta blanca ha estado estacionada frente a la zona de juegos por más de una hora con el motor encendido.",
    time: "hace 8 horas",
    location: "Zona de Juegos, Condominio Laguna Norte",
    status: "resuelta",
    priority: "medium",
    comments: 7,
    isAnonymous: false,
    lat: -33.3290,
    lng: -70.7640,
  },
];

/* ═══════════════════════════════════════════════════════════
   INCIDENT MARKERS (for map)
   ═══════════════════════════════════════════════════════════ */

export const incidentMarkers: IncidentMarker[] = [
  {
    id: "m1",
    category: "Persona sospechosa",
    title: "Persona extraña sector B",
    description: "Se ha visto a una persona desconocida merodeando por el sector B.",
    lat: -33.3265,
    lng: -70.7613,
    severity: "critical",
    time: "hace 5 min",
    distance: "150m",
  },
  {
    id: "m2",
    category: "Ruido molesto",
    title: "Fiesta ruidosa Torre B",
    description: "Música alta y gritos desde hace más de 2 horas.",
    lat: -33.3268,
    lng: -70.7619,
    severity: "warning",
    time: "hace 15 min",
    distance: "200m",
  },
  {
    id: "m3",
    category: "Vehículo sospechoso",
    title: "Auto negro sin placas",
    description: "Vehículo sedan negro sin placas en zona prohibida.",
    lat: -33.3285,
    lng: -70.7611,
    severity: "critical",
    time: "hace 30 min",
    distance: "300m",
  },
  {
    id: "m4",
    category: "Acceso no autorizado",
    title: "Puerta lateral abierta",
    description: "Puerta de acceso peatonal encontrada abierta.",
    lat: -33.3250,
    lng: -70.7625,
    severity: "critical",
    time: "hace 1 hora",
    distance: "50m",
  },
  {
    id: "m5",
    category: "Mascota suelta",
    title: "Perro suelto en parque",
    description: "Perro de raza grande sin correa en áreas comunes.",
    lat: -33.3282,
    lng: -70.7623,
    severity: "info",
    time: "hace 2 horas",
    distance: "100m",
  },
  {
    id: "m6",
    category: "Robo/hurto",
    title: "Robo de bicicleta",
    description: "Bicicleta sustraída de la bodega común.",
    lat: -33.3267,
    lng: -70.7629,
    severity: "critical",
    time: "hace 3 horas",
    distance: "250m",
  },
  {
    id: "m7",
    category: "Incendio",
    title: "Olor a humo Torre A",
    description: "Olor a humo en pasillo tercer piso.",
    lat: -33.3269,
    lng: -70.7609,
    severity: "critical",
    time: "hace 4 horas",
    distance: "180m",
  },
  {
    id: "m8",
    category: "Vehículo sospechoso",
    title: "Camioneta dudosa zona juegos",
    description: "Camioneta blanca estacionada frente a zona de juegos.",
    lat: -33.3292,
    lng: -70.7637,
    severity: "warning",
    time: "hace 8 horas",
    distance: "400m",
  },
];

/* ═══════════════════════════════════════════════════════════
   REPORT CATEGORIES
   ═══════════════════════════════════════════════════════════ */

export const reportCategories = [
  { id: "persona", label: "Persona sospechosa", icon: "user-x", color: "#ef4444" },
  { id: "ruido", label: "Ruido molesto", icon: "volume-2", color: "#f59e0b" },
  { id: "vehiculo", label: "Vehículo sospechoso", icon: "car", color: "#f97316" },
  { id: "robo", label: "Robo/hurto", icon: "shield-alert", color: "#dc2626" },
  { id: "acceso", label: "Acceso no autorizado", icon: "door-open", color: "#8b5cf6" },
  { id: "mascota", label: "Mascota suelta", icon: "paw-print", color: "#06b6d4" },
  { id: "incendio", label: "Incendio", icon: "flame", color: "#ea580c" },
  { id: "otro", label: "Otro", icon: "more-horizontal", color: "#64748b" },
];

/* ═══════════════════════════════════════════════════════════
   GUARDS ON DUTY
   ═══════════════════════════════════════════════════════════ */

export interface GuardOnDuty {
  id: string;
  name: string;
  shift: string;
  startTime: string;
  endTime: string;
  zone: string;
  phone: string;
}

export const guardsOnDuty: GuardOnDuty[] = [
  { id: "g1", name: "Juan Torres Rivera", shift: "Turno Mañana", startTime: "07:00", endTime: "15:00", zone: "Torres A-B", phone: "+56 9 7777 7777" },
  { id: "g2", name: "Miguel Soto Pérez", shift: "Turno Mañana", startTime: "07:00", endTime: "15:00", zone: "Torres C-D", phone: "+56 9 8888 8888" },
  { id: "g3", name: "David Fuentes Castro", shift: "Turno Tarde", startTime: "15:00", endTime: "23:00", zone: "Torres E-F", phone: "+56 9 9999 9999" },
  { id: "g4", name: "Matías Bravo Quiroz", shift: "Turno Tarde", startTime: "15:00", endTime: "23:00", zone: "Acceso Principal", phone: "+56 9 2323 4343" },
];

/* ═══════════════════════════════════════════════════════════
   ANNOUNCEMENTS
   ═══════════════════════════════════════════════════════════ */

export interface Announcement {
  id: string;
  title: string;
  description: string;
  date: string;
  author: string;
  priority: "info" | "warning" | "important";
}

export const announcements: Announcement[] = [
  { id: "a1", title: "Mantención Torre D", description: "Programada para el 15/04. Se suspenderá agua de 09:00 a 14:00 hrs.", date: "10/04/2025", author: "Administración CyJ", priority: "warning" },
  { id: "a2", title: "Reunión Comité de Seguridad", description: "Próxima reunión el 20/04 a las 19:00 en sala comunitaria.", date: "08/04/2025", author: "Ana Martínez", priority: "info" },
  { id: "a3", title: "Nuevo sistema de cámaras", description: "Se han instalado 8 nuevas cámaras de seguridad en accesos y estacionamientos.", date: "05/04/2025", author: "Administración CyJ", priority: "important" },
];
