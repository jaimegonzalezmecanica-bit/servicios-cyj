// Mock data for VigilApp

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
}

export interface UserProfile {
  name: string;
  role: string;
  condo: string;
  phone: string;
  email: string;
  address: string;
  reports: number;
  memberSince: string;
  avatarInitial: string;
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

export const userProfile: UserProfile = {
  name: "María González",
  role: "Residente",
  condo: "Condominio Los Robles",
  phone: "+56 9 1234 5678",
  email: "maria.gonzalez@email.com",
  address: "Calle Los Robles #234, Casa 5",
  reports: 12,
  memberSince: "2024",
  avatarInitial: "M",
};

export const mockAlerts: Alert[] = [
  {
    id: "1",
    category: "Persona sospechosa",
    categoryIcon: "user-x",
    title: "Persona extraña merodeando sector B",
    description: "Se ha visto a una persona desconocida merodeando por el sector B durante las últimas horas. No responde a saludos y se porta de manera sospechosa.",
    time: "hace 5 min",
    location: "Sector B - Calle Los Robles",
    status: "activa",
    priority: "high",
    comments: 8,
    isAnonymous: false,
    lat: 0,
    lng: 0,
  },
  {
    id: "2",
    category: "Ruido molesto",
    categoryIcon: "volume-2",
    title: "Fiesta ruidosa en unidad 12B",
    description: "Música alta y gritos desde hace más de 2 horas. Se solicita intervención de guardia.",
    time: "hace 15 min",
    location: "Torre B - Unidad 12B",
    status: "en_revision",
    priority: "medium",
    comments: 5,
    isAnonymous: true,
    lat: 0,
    lng: 0,
  },
  {
    id: "3",
    category: "Vehículo sospechoso",
    categoryIcon: "car",
    title: "Auto negro sin placas estacionado",
    description: "Vehículo sedan negro sin placas estacionado en zona prohibida desde ayer. No se ha identificado al propietario.",
    time: "hace 30 min",
    location: "Estacionamiento Visitas",
    status: "activa",
    priority: "high",
    comments: 3,
    isAnonymous: false,
    lat: 0,
    lng: 0,
  },
  {
    id: "4",
    category: "Acceso no autorizado",
    categoryIcon: "door-open",
    title: "Puerta lateral encontrada abierta",
    description: "La puerta de acceso peatonal del lado norte fue encontrada abierta fuera de horario autorizado.",
    time: "hace 1 hora",
    location: "Acceso Norte",
    status: "resuelta",
    priority: "critical",
    comments: 12,
    isAnonymous: false,
    lat: 0,
    lng: 0,
  },
  {
    id: "5",
    category: "Mascota suelta",
    categoryIcon: "paw-print",
    title: "Perro grande sin correa en áreas comunes",
    description: "Un perro de raza grande se encuentra suelto cerca del parque. No tiene collar visible.",
    time: "hace 2 horas",
    location: "Parque Central",
    status: "en_revision",
    priority: "low",
    comments: 2,
    isAnonymous: false,
    lat: 0,
    lng: 0,
  },
  {
    id: "6",
    category: "Robo/hurto",
    categoryIcon: "shield-alert",
    title: "Robo de bicicleta en bodega común",
    description: "Mi bicicleta fue sustraída de la bodega común durante la noche. Cámara de seguridad registró ingreso sospechoso.",
    time: "hace 3 horas",
    location: "Bodega Común - Subsuelo",
    status: "activa",
    priority: "critical",
    comments: 15,
    isAnonymous: false,
    lat: 0,
    lng: 0,
  },
  {
    id: "7",
    category: "Incendio",
    categoryIcon: "flame",
    title: "Olor a humo en pasillo Torre A",
    description: "Se detecta fuerte olor a humo en el tercer piso de la Torre A. Posible cortocircuito en ducto de basura.",
    time: "hace 4 horas",
    location: "Torre A - Piso 3",
    status: "resuelta",
    priority: "critical",
    comments: 20,
    isAnonymous: false,
    lat: 0,
    lng: 0,
  },
  {
    id: "8",
    category: "Ruido molesto",
    categoryIcon: "volume-2",
    title: "Obras de construcción fuera de horario",
    description: "Se están realizando obras de demolición en la unidad 8A fuera del horario permitido por el reglamento.",
    time: "hace 5 horas",
    location: "Torre C - Unidad 8A",
    status: "resuelta",
    priority: "low",
    comments: 4,
    isAnonymous: true,
    lat: 0,
    lng: 0,
  },
  {
    id: "9",
    category: "Persona sospechosa",
    categoryIcon: "user-x",
    title: "Intento de acceso con llave falsa",
    description: "Un individuo intentó ingresar a la Torre B usando una llave que no correspondía. Fue visto por el conserje.",
    time: "hace 6 horas",
    location: "Torre B - Entrada Principal",
    status: "en_revision",
    priority: "critical",
    comments: 10,
    isAnonymous: false,
    lat: 0,
    lng: 0,
  },
  {
    id: "10",
    category: "Vehículo sospechoso",
    categoryIcon: "car",
    title: "Camioneta dudosa en zona de juego infantil",
    description: "Una camioneta blanca ha estado estacionada frente a la zona de juegos por más de una hora con el motor encendido.",
    time: "hace 8 horas",
    location: "Zona de Juegos",
    status: "resuelta",
    priority: "medium",
    comments: 7,
    isAnonymous: false,
    lat: 0,
    lng: 0,
  },
];

export const incidentMarkers: IncidentMarker[] = [
  {
    id: "m1",
    category: "Persona sospechosa",
    title: "Persona extraña sector B",
    description: "Se ha visto a una persona desconocida merodeando por el sector B.",
    lat: 35,
    lng: 40,
    severity: "critical",
    time: "hace 5 min",
    distance: "150m",
  },
  {
    id: "m2",
    category: "Ruido molesto",
    title: "Fiesta ruidosa Torre B",
    description: "Música alta y gritos desde hace más de 2 horas.",
    lat: 55,
    lng: 25,
    severity: "warning",
    time: "hace 15 min",
    distance: "200m",
  },
  {
    id: "m3",
    category: "Vehículo sospechoso",
    title: "Auto negro sin placas",
    description: "Vehículo sedan negro sin placas en zona prohibida.",
    lat: 70,
    lng: 60,
    severity: "critical",
    time: "hace 30 min",
    distance: "300m",
  },
  {
    id: "m4",
    category: "Acceso no autorizado",
    title: "Puerta lateral abierta",
    description: "Puerta de acceso peatonal encontrada abierta.",
    lat: 20,
    lng: 70,
    severity: "critical",
    time: "hace 1 hora",
    distance: "50m",
  },
  {
    id: "m5",
    category: "Mascota suelta",
    title: "Perro suelto en parque",
    description: "Perro de raza grande sin correa en áreas comunes.",
    lat: 45,
    lng: 55,
    severity: "info",
    time: "hace 2 horas",
    distance: "100m",
  },
  {
    id: "m6",
    category: "Robo/hurto",
    title: "Robo de bicicleta",
    description: "Bicicleta sustraída de la bodega común.",
    lat: 30,
    lng: 30,
    severity: "critical",
    time: "hace 3 horas",
    distance: "250m",
  },
  {
    id: "m7",
    category: "Incendio",
    title: "Olor a humo Torre A",
    description: "Olor a humo en pasillo tercer piso.",
    lat: 60,
    lng: 45,
    severity: "critical",
    time: "hace 4 horas",
    distance: "180m",
  },
  {
    id: "m8",
    category: "Vehículo sospechoso",
    title: "Camioneta dudosa zona juegos",
    description: "Camioneta blanca estacionada frente a zona de juegos.",
    lat: 80,
    lng: 35,
    severity: "warning",
    time: "hace 8 horas",
    distance: "400m",
  },
];

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

export const communityStats = {
  totalAlerts: 47,
  activeAlerts: 3,
  resolvedToday: 5,
  membersOnline: 23,
  totalMembers: 156,
};
