"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/*
  Condominio Laguna Norte
  Av. La Montaña Norte 3650, Valle Grande, Lampa, Chile
*/
const MAP_CENTER: L.LatLngExpression = [-33.3273, -70.7628];
const MAP_ZOOM = 17;

const DEFAULT_ENTRANCE: L.LatLngExpression = [-33.3298, -70.7630];

/* Fallback positions */
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

/* Unique colors for each micro-condominio */
const BARRIO_COLORS: Record<string, string> = {
  flamencos:  "#e11d48",  // rose
  faisanes:   "#d97706",  // amber
  garzas:     "#0d9488",  // teal
  gaviotas:   "#0891b2",  // cyan
  becacinas:  "#65a30d",  // lime
  bandurrias: "#7c3aed",  // violet
  albatros:   "#475569",  // slate
  canquen:    "#1d4ed8",  // blue
};

export interface CondominioMapData {
  id: string;
  name: string;
  type: string;
  lat?: number;
  lng?: number;
}

interface MapViewProps {
  condominios?: CondominioMapData[];
  editMode?: boolean;
  onPositionChange?: (id: string, lat: number, lng: number) => void;
  entrance?: { lat: number; lng: number };
  onEntranceChange?: (lat: number, lng: number) => void;
}

export default function MapView({
  condominios = [],
  editMode = false,
  onPositionChange,
  entrance,
  onEntranceChange,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const condominioMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const entranceMarkerRef = useRef<L.Marker | null>(null);

  /* Init map (runs once) */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    /* Perimeter */
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
      fillOpacity: 0.04,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* Render entrance marker */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    /* Remove old entrance marker */
    if (entranceMarkerRef.current) {
      map.removeLayer(entranceMarkerRef.current);
      entranceMarkerRef.current = null;
    }

    const pos = entrance
      ? [entrance.lat, entrance.lng] as L.LatLngExpression
      : DEFAULT_ENTRANCE;

    const borderCol = editMode ? "#fca5a5" : "white";
    const bgCol = editMode ? "#dc2626" : "#16a34a";
    const eIcon = L.divIcon({
      className: "",
      html: `<div style="
        background:${bgCol};
        color:white;
        border-radius:8px;
        padding:4px 10px;
        font-size:11px;
        font-weight:800;
        border:2px solid ${borderCol};
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        white-space:nowrap;
        ${editMode ? "cursor:grab;" : ""}
      ">${editMode ? "&#x1F6AA; " : "&#x1F6AA; "}ENTRADA</div>`,
      iconSize: [editMode ? 110 : 80, 24],
      iconAnchor: [editMode ? 55 : 40, 12],
    });

    const marker = L.marker(pos, {
      icon: eIcon,
      draggable: editMode,
      autoPan: editMode,
      zIndexOffset: 1000,
    });

    if (editMode && onEntranceChange) {
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        onEntranceChange(p.lat, p.lng);
      });
    }

    marker.addTo(map).bindPopup("<strong>Acceso Principal</strong><br>Av. La Montaña Norte 3650");
    entranceMarkerRef.current = marker;
  }, [entrance, editMode, onEntranceChange]);

  /* Render condominio markers */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    /* Remove old markers */
    condominioMarkersRef.current.forEach((m) => map.removeLayer(m));
    condominioMarkersRef.current.clear();

    condominios.forEach((c) => {
      const pos = (c.lat && c.lng)
        ? [c.lat, c.lng] as L.LatLngExpression
        : (DEFAULT_POSITIONS[c.id] || MAP_CENTER);

      const color = BARRIO_COLORS[c.id] || "#64748b";
      const isDeptos = c.type === "torres" || c.type === "deptos";
      const label = isDeptos ? "Deptos" : "Casas";
      const borderCol = editMode ? "#fca5a5" : "white";

      const cIcon = L.divIcon({
        className: "",
        html: `<div style="
          background:${editMode ? "#dc2626" : color};
          color:white;
          border-radius:10px;
          padding:3px 10px;
          font-size:11px;
          font-weight:700;
          border:2px solid ${borderCol};
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          white-space:nowrap;
          display:flex;
          align-items:center;
          gap:4px;
          letter-spacing:0.3px;
          ${editMode ? "cursor:grab;" : ""}
        ">${editMode ? "&#x270B; " : ""}${c.name}</div>`,
        iconSize: [editMode ? 120 : 110, 24],
        iconAnchor: [editMode ? 60 : 55, 12],
      });

      const marker = L.marker(pos, {
        icon: cIcon,
        draggable: editMode,
        autoPan: editMode,
      });

      if (editMode && onPositionChange) {
        marker.on("dragend", () => {
          const p = marker.getLatLng();
          onPositionChange(c.id, p.lat, p.lng);
        });
      }

      marker.addTo(map).bindPopup(
        `<strong>${c.name}</strong><br>${label}<br>Condominio Laguna Norte`
      );

      condominioMarkersRef.current.set(c.id, marker);
    });
  }, [condominios, editMode, onPositionChange]);

  return <div ref={containerRef} className="w-full h-full rounded-2xl" />;
}
