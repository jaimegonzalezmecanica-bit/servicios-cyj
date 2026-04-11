"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { IncidentMarker } from "@/lib/mock-data";

/* Santiago, Chile approximate center for the condominium */
const MAP_CENTER: L.LatLngExpression = [-33.4489, -70.6693];
const MAP_ZOOM = 16;

/* Tower positions around the condominium */
const TOWER_POSITIONS: Record<string, L.LatLngExpression> = {
  A: [-33.4470, -70.6660],
  B: [-33.4492, -70.6640],
  C: [-33.4512, -70.6662],
  D: [-33.4468, -70.6722],
  E: [-33.4488, -70.6740],
  F: [-33.4510, -70.6718],
};

/* Incident positions relative to towers */
const INCIDENT_POSITIONS: Record<string, L.LatLngExpression> = {
  m1: [-33.4496, -70.6646],
  m2: [-33.4490, -70.6644],
  m3: [-33.4466, -70.6720],
  m4: [-33.4466, -70.6728],
  m5: [-33.4484, -70.6724],
  m6: [-33.4474, -70.6678],
  m7: [-33.4472, -70.6658],
  m8: [-33.4514, -70.6712],
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
        .bindPopup(`<strong>Torre ${id}</strong><br>Servicios Integrales CyJ`);
    });

    /* Condominium perimeter */
    const perimeter = [
      [-33.4455, -70.6630],
      [-33.4455, -70.6750],
      [-33.4525, -70.6750],
      [-33.4525, -70.6630],
    ];
    L.polygon(perimeter, {
      color: "#0f4c81",
      weight: 2,
      dashArray: "8, 6",
      fillColor: "#0f4c81",
      fillOpacity: 0.05,
    }).addTo(map);

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

    L.marker([-33.4489, -70.6693], { icon: userIcon })
      .addTo(map)
      .bindPopup("<strong>Tú estás aquí</strong>");

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
