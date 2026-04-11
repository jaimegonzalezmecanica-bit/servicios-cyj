"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MAP_CENTER: L.LatLngExpression = [-33.3273, -70.7628];
const MAP_ZOOM = 17;

const DEFAULT_ENTRANCE: L.LatLngExpression = [-33.3298, -70.7630];

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

const BARRIO_COLORS: Record<string, string> = {
  flamencos:  "#e11d48",
  faisanes:   "#d97706",
  garzas:     "#0d9488",
  gaviotas:   "#0891b2",
  becacinas:  "#65a30d",
  bandurrias: "#7c3aed",
  albatros:   "#475569",
  canquen:    "#1d4ed8",
};

export interface CondominioMapData {
  id: string;
  name: string;
  type: string;
  lat?: number;
  lng?: number;
}

export interface PerimeterPoint {
  lat: number;
  lng: number;
}

interface MapViewProps {
  condominios?: CondominioMapData[];
  editMode?: boolean;
  onPositionChange?: (id: string, lat: number, lng: number) => void;
  entrance?: { lat: number; lng: number };
  onEntranceChange?: (lat: number, lng: number) => void;
  perimeter?: PerimeterPoint[];
  onPerimeterChange?: (points: PerimeterPoint[]) => void;
}

export default function MapView({
  condominios = [],
  editMode = false,
  onPositionChange,
  entrance,
  onEntranceChange,
  perimeter,
  onPerimeterChange,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const condominioMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const entranceMarkerRef = useRef<L.Marker | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const vertexMarkersRef = useRef<Map<number, L.Marker>>(new Map());

  /* Default perimeter */
  const DEFAULT_PERIMETER: PerimeterPoint[] = [
    { lat: -33.3250, lng: -70.7610 },
    { lat: -33.3250, lng: -70.7650 },
    { lat: -33.3298, lng: -70.7650 },
    { lat: -33.3298, lng: -70.7610 },
  ];

  const currentPerimeter = perimeter || DEFAULT_PERIMETER;

  /* Init map */
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

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* Render polygon + vertex markers */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    /* Remove old polygon */
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }
    vertexMarkersRef.current.forEach((m) => map.removeLayer(m));
    vertexMarkersRef.current.clear();

    const latLngs = currentPerimeter.map((p) => [p.lat, p.lng] as L.LatLngExpression);

    /* Draw polygon */
    polygonRef.current = L.polygon(latLngs, {
      color: editMode ? "#dc2626" : "#0f4c81",
      weight: editMode ? 3 : 2,
      dashArray: editMode ? undefined : "8, 6",
      fillColor: editMode ? "#dc2626" : "#0f4c81",
      fillOpacity: editMode ? 0.06 : 0.04,
    }).addTo(map);

    /* In edit mode: add vertex markers */
    if (editMode && onPerimeterChange) {
      currentPerimeter.forEach((pt, idx) => {
        const vIcon = L.divIcon({
          className: "",
          html: `<div style="
            width:16px;height:16px;
            background:#dc2626;
            border:2px solid white;
            border-radius:50%;
            box-shadow:0 1px 4px rgba(0,0,0,0.4);
            cursor:grab;
          "></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const vMarker = L.marker([pt.lat, pt.lng], {
          icon: vIcon,
          draggable: true,
          autoPan: true,
          zIndexOffset: 2000,
        });

        vMarker.on("drag", () => {
          const pos = vMarker.getLatLng();
          const updated = [...currentPerimeter];
          updated[idx] = { lat: pos.lat, lng: pos.lng };
          onPerimeterChange(updated);
        });

        /* Double-click to remove vertex (min 3) */
        if (currentPerimeter.length > 3) {
          vMarker.on("dblclick", () => {
            L.DomEvent.stopPropagation(vMarker);
            const updated = currentPerimeter.filter((_, i) => i !== idx);
            onPerimeterChange(updated);
          });
        }

        vMarker.addTo(map);
        vertexMarkersRef.current.set(idx, vMarker);
      });

      /* Click on polygon edge to add vertex */
      polygonRef.current.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;

        /* Find closest edge */
        let bestIdx = 0;
        let bestDist = Infinity;
        for (let i = 0; i < currentPerimeter.length; i++) {
          const j = (i + 1) % currentPerimeter.length;
          const mx = (currentPerimeter[i].lat + currentPerimeter[j].lat) / 2;
          const my = (currentPerimeter[i].lng + currentPerimeter[j].lng) / 2;
          const d = Math.hypot(lat - mx, lng - my);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = j;
          }
        }

        const updated = [...currentPerimeter];
        updated.splice(bestIdx, 0, { lat, lng });
        onPerimeterChange(updated);
      });
    }

    return () => {
      if (polygonRef.current) {
        map.removeLayer(polygonRef.current);
        polygonRef.current = null;
      }
      vertexMarkersRef.current.forEach((m) => map.removeLayer(m));
      vertexMarkersRef.current.clear();
    };
  }, [currentPerimeter, editMode, onPerimeterChange]);

  /* Render entrance marker */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

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
      ">&#x1F6AA; ENTRADA</div>`,
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

    return () => {
      if (entranceMarkerRef.current) {
        map.removeLayer(entranceMarkerRef.current);
        entranceMarkerRef.current = null;
      }
    };
  }, [entrance, editMode, onEntranceChange]);

  /* Render condominio markers */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

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

    return () => {
      condominioMarkersRef.current.forEach((m) => map.removeLayer(m));
      condominioMarkersRef.current.clear();
    };
  }, [condominios, editMode, onPositionChange]);

  return <div ref={containerRef} className="w-full h-full rounded-2xl" />;
}
