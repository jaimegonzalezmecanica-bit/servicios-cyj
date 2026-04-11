"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { IncidentMarker } from "@/lib/mock-data";

/*
  Condominio Laguna Norte
  Av. La Montaña Norte 3650, Valle Grande, Lampa, Chile
  Exact coordinates from maptons.com
*/
const MAP_CENTER: L.LatLngExpression = [-33.3273, -70.7628];
const MAP_ZOOM = 17;

/* Default positions when condominios don't have lat/lng yet */
const DEFAULT_POSITIONS: Record<string, L.LatLngExpression> = {
  faisanes:   [-33.3258, -70.7618],
  garzas:     [-33.3262, -70.7628],
  flamencos:  [-33.3264, -70.7642],
  gaviotas:   [-33.3274, -70.7638],
  becacinas:  [-33.3278, -70.7625],
  bandurrias: [-33.3285, -70.7635],
  albatros:   [-33.3288, -70.7618],
  canquen:    [-33.3294, -70.7630],
};

/* Incident positions spread around the condominium grounds */
const INCIDENT_POSITIONS: Record<string, L.LatLngExpression> = {
  m1: [-33.3265, -70.7613],
  m2: [-33.3268, -70.7619],
  m3: [-33.3285, -70.7611],
  m4: [-33.3289, -70.7619],
  m5: [-33.3282, -70.7623],
  m6: [-33.3267, -70.7629],
  m7: [-33.3269, -70.7609],
  m8: [-33.3292, -70.7637],
};

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical": return "#dc2626";
    case "warning": return "#f97316";
    case "info": return "#3b82f6";
    default: return "#64748b";
  }
}

export interface CondominioMapData {
  id: string;
  name: string;
  type: string;
  lat?: number;
  lng?: number;
}

interface MapViewProps {
  incidents: IncidentMarker[];
  filter: string;
  onSelectMarker: (marker: IncidentMarker) => void;
  condominios?: CondominioMapData[];
  editMode?: boolean;
  onPositionChange?: (id: string, lat: number, lng: number) => void;
}

export default function MapView({
  incidents,
  filter,
  onSelectMarker,
  condominios = [],
  editMode = false,
  onPositionChange,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const condominioMarkersRef = useRef<Map<string, L.Marker>>(new Map());

  /* Filter incidents */
  const filteredIncidents = (() => {
    switch (filter) {
      case "Críticos": return incidents.filter((m) => m.severity === "critical");
      case "Resueltos": return incidents.slice(4, 6);
      case "Hoy": return incidents.slice(0, 5);
      default: return incidents;
    }
  })();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      zoomControl: true,
      attributionControl: true,
    });

    /* OpenStreetMap tiles (free, no API key) */
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    /* Condominium perimeter (approximate geofence for Laguna Norte) */
    const perimeter = [
      [-33.3250, -70.7610],
      [-33.3250, -70.7650],
      [-33.3298, -70.7650],
      [-33.3298, -70.7610],
    ];
    L.polygon(perimeter, {
      color: "#0f4c81",
      weight: 2,
      dashArray: "8, 6",
      fillColor: "#0f4c81",
      fillOpacity: 0.05,
    }).addTo(map);

    /* Community label - Laguna Norte (café color as shown on map) */
    L.marker([-33.3276, -70.7633], {
      icon: L.divIcon({
        className: "",
        html: `<div style="
          background: rgba(139,90,43,0.92);
          color: white;
          padding: 5px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          border: 1px solid rgba(255,255,255,0.3);
          letter-spacing: 0.5px;
        ">Laguna Norte</div>`,
        iconSize: [140, 26],
        iconAnchor: [70, 13],
      }),
    }).addTo(map);

    /* Main entrance marker */
    const entranceIcon = L.divIcon({
      className: "",
      html: `
        <div style="
          background: #16a34a;
          color: white;
          border-radius: 6px;
          padding: 3px 8px;
          font-size: 10px;
          font-weight: 700;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ">ENTRADA</div>
      `,
      iconSize: [60, 20],
      iconAnchor: [30, 10],
    });

    L.marker([-33.3298, -70.7630], { icon: entranceIcon })
      .addTo(map)
      .bindPopup("<strong>Acceso Principal</strong><br>Av. La Montaña Norte 3650");

    /* "You are here" marker */
    const userIcon = L.divIcon({
      className: "",
      html: `
        <div style="position:relative;">
          <div style="
            width: 24px; height: 24px;
            background: #0f4c81;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 0 4px rgba(15,76,129,0.3), 0 2px 8px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
          ">
            <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker(MAP_CENTER, { icon: userIcon })
      .addTo(map)
      .bindPopup("<strong>Tú estás aquí</strong><br>Condominio Laguna Norte, Lampa");

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* Render / re-render condominio markers */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    /* Remove old condominio markers */
    condominioMarkersRef.current.forEach((marker) => map.removeLayer(marker));
    condominioMarkersRef.current.clear();

    /* Add condominio markers from data */
    condominios.forEach((c) => {
      const pos = (c.lat && c.lng)
        ? [c.lat, c.lng] as L.LatLngExpression
        : (DEFAULT_POSITIONS[c.id] || MAP_CENTER);

      const isDeptos = c.type === "torres" || c.type === "deptos";
      const bg = isDeptos ? "#1e40af" : "#047857";
      const label = isDeptos ? "Depto" : "Casas";

      const cIcon = L.divIcon({
        className: "",
        html: `<div style="
          background:${editMode ? "#dc2626" : bg};
          color: white;
          border-radius:10px;
          padding:3px 8px;
          font-size:11px;
          font-weight:700;
          border:2px solid ${editMode ? "#fca5a5" : "white"};
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          white-space:nowrap;
          display:flex;
          align-items:center;
          gap:4px;
          ${editMode ? "cursor:grab;animation:pulse 1.5s infinite;" : ""}
        ">${editMode ? "&#x270B; " : ""}${c.name}</div>`,
        iconSize: [editMode ? 120 : 100, 24],
        iconAnchor: [editMode ? 60 : 50, 12],
      });

      const marker = L.marker(pos, {
        icon: cIcon,
        draggable: editMode,
        autoPan: editMode,
      });

      if (editMode && onPositionChange) {
        marker.on("dragstart", () => {
          (marker.getElement() as HTMLElement)?.style.setProperty("opacity", "0.7");
        });

        marker.on("dragend", () => {
          const newPos = marker.getLatLng();
          (marker.getElement() as HTMLElement)?.style.setProperty("opacity", "1");
          onPositionChange(c.id, newPos.lat, newPos.lng);
        });
      }

      marker.addTo(map).bindPopup(
        `<strong>${c.name}</strong><br>${label}<br>Condominio Laguna Norte<br>Av. La Montaña Norte 3650`
      );

      condominioMarkersRef.current.set(c.id, marker);
    });
  }, [condominios, editMode, onPositionChange]);

  /* Update incident markers when filter changes */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    /* Remove old incident markers */
    map.eachLayer((layer) => {
      if ((layer as any)._isIncidentMarker) {
        map.removeLayer(layer);
      }
    });

    /* Add new incident markers */
    filteredIncidents.forEach((incident) => {
      const pos = INCIDENT_POSITIONS[incident.id] || [MAP_CENTER[0] + (Math.random() - 0.5) * 0.003, MAP_CENTER[1] + (Math.random() - 0.5) * 0.003];
      const color = getSeverityColor(incident.severity);

      const markerIcon = L.divIcon({
        className: "",
        html: `
          <div style="
            width: 32px; height: 32px;
            background: ${color};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              ${incident.severity === "info"
                ? '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'
                : '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
              }
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker(pos as L.LatLngExpression, { icon: markerIcon });
      (marker as any)._isIncidentMarker = true;
      marker.addTo(map);

      marker.on("click", () => {
        onSelectMarker(incident);
      });
    });
  }, [filteredIncidents, onSelectMarker]);

  return <div ref={containerRef} className="w-full h-full rounded-2xl" />;
}
