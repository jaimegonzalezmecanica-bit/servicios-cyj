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
const MAP_CENTER: L.LatLngExpression = [-33.3276, -70.7630];
const MAP_ZOOM = 16;

/* Tower positions spread around the condominium grounds */
const TOWER_POSITIONS: Record<string, L.LatLngExpression> = {
  A: [-33.3262, -70.7606],
  B: [-33.3262, -70.7616],
  C: [-33.3272, -70.7626],
  D: [-33.3282, -70.7616],
  E: [-33.3288, -70.7606],
  F: [-33.3276, -70.7642],
};

/* Incident positions relative to towers */
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

interface MapViewProps {
  incidents: IncidentMarker[];
  filter: string;
  onSelectMarker: (marker: IncidentMarker) => void;
}

export default function MapView({ incidents, filter, onSelectMarker }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

    /* Tower markers */
    Object.entries(TOWER_POSITIONS).forEach(([id, pos]) => {
      const towerIcon = L.divIcon({
        className: "",
        html: `<div style="
          background: #0f4c81;
          color: white;
          border-radius: 8px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">${id}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker(pos, { icon: towerIcon })
        .addTo(map)
        .bindPopup(`<strong>Torre ${id}</strong><br>Condominio Laguna Norte<br>Av. La Montaña Norte 3650`);
    });

    /* Condominium perimeter (approximate geofence for Laguna Norte) */
    const perimeter = [
      [-33.3245, -70.7590],
      [-33.3245, -70.7660],
      [-33.3305, -70.7660],
      [-33.3305, -70.7590],
    ];
    L.polygon(perimeter, {
      color: "#0f4c81",
      weight: 2,
      dashArray: "8, 6",
      fillColor: "#0f4c81",
      fillOpacity: 0.05,
    }).addTo(map);

    /* Community label */
    L.marker(MAP_CENTER, {
      icon: L.divIcon({
        className: "",
        html: `<div style="
          background: rgba(15,76,129,0.9);
          color: white;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.3);
        ">Condominio Laguna Norte</div>`,
        iconSize: [180, 24],
        iconAnchor: [90, 12],
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

    L.marker([-33.3300, -70.7625], { icon: entranceIcon })
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
