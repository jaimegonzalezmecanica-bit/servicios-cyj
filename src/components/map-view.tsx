"use client";

import React, { useEffect, useRef, useCallback } from "react";
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

/* Edit sub-modes for the perimeter */
export type PerimeterEditMode = "none" | "move" | "draw" | "vertices";

interface MapViewProps {
  condominios?: CondominioMapData[];
  editMode?: boolean;
  onPositionChange?: (id: string, lat: number, lng: number) => void;
  entrance?: { lat: number; lng: number };
  onEntranceChange?: (lat: number, lng: number) => void;
  perimeter?: PerimeterPoint[];
  onPerimeterChange?: (points: PerimeterPoint[]) => void;
  perimeterEditMode?: PerimeterEditMode;
}

export default function MapView({
  condominios = [],
  editMode = false,
  onPositionChange,
  entrance,
  onEntranceChange,
  perimeter,
  onPerimeterChange,
  perimeterEditMode = "none",
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const condominioMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const entranceMarkerRef = useRef<L.Marker | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const vertexMarkersRef = useRef<Map<number, L.Marker>>(new Map());
  const drawPointsRef = useRef<PerimeterPoint[]>([]);
  const drawPolylineRef = useRef<L.Polyline | null>(null);
  const drawTempMarkersRef = useRef<L.Marker[]>([]);
  const mapClickHandlerRef = useRef<((e: L.LeafletMouseEvent) => void) | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ lat: number; lng: number } | null>(null);
  const origPerimeterRef = useRef<PerimeterPoint[] | null>(null);

  const DEFAULT_PERIMETER: PerimeterPoint[] = [
    { lat: -33.3250, lng: -70.7610 },
    { lat: -33.3250, lng: -70.7650 },
    { lat: -33.3298, lng: -70.7650 },
    { lat: -33.3298, lng: -70.7610 },
  ];

  const currentPerimeter = perimeter && perimeter.length >= 3 ? perimeter : DEFAULT_PERIMETER;

  /* Clean up draw mode artifacts */
  const cleanupDraw = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    drawPointsRef.current = [];
    if (drawPolylineRef.current) {
      map.removeLayer(drawPolylineRef.current);
      drawPolylineRef.current = null;
    }
    drawTempMarkersRef.current.forEach((m) => map.removeLayer(m));
    drawTempMarkersRef.current = [];
    if (mapClickHandlerRef.current) {
      map.off("click", mapClickHandlerRef.current);
      mapClickHandlerRef.current = null;
    }
  }, []);

  /* Init map */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      zoomControl: true,
      attributionControl: false,
      zoomSnap: 0.0001,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      cleanupDraw();
      map.remove();
      mapRef.current = null;
    };
  }, [cleanupDraw]);

  /* When switching away from draw mode, clean up */
  useEffect(() => {
    if (perimeterEditMode !== "draw") {
      cleanupDraw();
    }
  }, [perimeterEditMode, cleanupDraw]);

  /* ─── DRAW MODE: click to place points ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || perimeterEditMode !== "draw" || !onPerimeterChange) return;

    cleanupDraw();

    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const pt = { lat, lng };
      drawPointsRef.current.push(pt);

      /* Add temporary marker */
      const dot = L.circleMarker([lat, lng], {
        radius: 6,
        color: "#dc2626",
        fillColor: "#dc2626",
        fillOpacity: 1,
        weight: 2,
      }).addTo(map);
      drawTempMarkersRef.current.push(dot);

      /* Update preview polyline */
      if (drawPolylineRef.current) map.removeLayer(drawPolylineRef.current);
      if (drawPointsRef.current.length >= 2) {
        drawPolylineRef.current = L.polyline(
          drawPointsRef.current.map((p) => [p.lat, p.lng] as L.LatLngExpression),
          { color: "#dc2626", weight: 3, dashArray: "6, 4" }
        ).addTo(map);
      }

      /* If 3+ points, show live polygon preview */
      if (drawPointsRef.current.length >= 3) {
        onPerimeterChange([...drawPointsRef.current]);
      }
    };

    mapClickHandlerRef.current = handleClick;
    map.on("click", handleClick);

    return () => {
      if (mapClickHandlerRef.current) {
        map.off("click", mapClickHandlerRef.current);
        mapClickHandlerRef.current = null;
      }
    };
  }, [perimeterEditMode, onPerimeterChange, cleanupDraw]);

  /* ─── POLYGON + VERTEX / MOVE rendering ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || perimeterEditMode === "draw") return;

    /* Remove old */
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }
    vertexMarkersRef.current.forEach((m) => map.removeLayer(m));
    vertexMarkersRef.current.clear();
    isDraggingRef.current = false;
    dragStartRef.current = null;
    origPerimeterRef.current = null;

    /* Remove any existing map click handlers for move mode */
    if (mapClickHandlerRef.current) {
      map.off("click", mapClickHandlerRef.current);
      mapClickHandlerRef.current = null;
    }

    if (currentPerimeter.length < 3) return;

    const latLngs = currentPerimeter.map((p) => [p.lat, p.lng] as L.LatLngExpression);

    /* Draw polygon */
    const isEditing = editMode && onPerimeterChange;
    const isMoveMode = perimeterEditMode === "move";
    const isVertexMode = perimeterEditMode === "vertices";

    polygonRef.current = L.polygon(latLngs, {
      color: isMoveMode ? "#2563eb" : isVertexMode ? "#dc2626" : (isEditing ? "#dc2626" : "#0f4c81"),
      weight: isMoveMode || isVertexMode ? 3 : 2,
      dashArray: isMoveMode || isVertexMode ? undefined : "8, 6",
      fillColor: isMoveMode ? "#2563eb" : isVertexMode ? "#dc2626" : (isEditing ? "#dc2626" : "#0f4c81"),
      fillOpacity: isMoveMode ? 0.12 : isVertexMode ? 0.08 : (isEditing ? 0.06 : 0.04),
      cursor: isMoveMode ? "move" : undefined,
    }).addTo(map);

    /* ── MOVE MODE: drag whole polygon ── */
    if (isMoveMode && onPerimeterChange) {
      polygonRef.current.on("mousedown", (e: L.LeafletMouseEvent) => {
        isDraggingRef.current = true;
        dragStartRef.current = { lat: e.latlng.lat, lng: e.latlng.lng };
        origPerimeterRef.current = currentPerimeter.map((p) => ({ ...p }));
        map.dragging.disable();
      });

      map.on("mousemove", (e: L.LeafletMouseEvent) => {
        if (!isDraggingRef.current || !dragStartRef.current || !origPerimeterRef.current) return;
        const dLat = e.latlng.lat - dragStartRef.current.lat;
        const dLng = e.latlng.lng - dragStartRef.current.lng;
        const moved = origPerimeterRef.current.map((p) => ({
          lat: p.lat + dLat,
          lng: p.lng + dLng,
        }));
        onPerimeterChange(moved);
      });

      map.on("mouseup", () => {
        if (isDraggingRef.current) {
          isDraggingRef.current = false;
          dragStartRef.current = null;
          origPerimeterRef.current = null;
          map.dragging.enable();
        }
      });
    }

    /* ── VERTEX MODE: individual vertex markers ── */
    if (isVertexMode && onPerimeterChange) {
      currentPerimeter.forEach((pt, idx) => {
        const vIcon = L.divIcon({
          className: "",
          html: `<div style="
            width:18px;height:18px;
            background:#dc2626;
            border:3px solid white;
            border-radius:50%;
            box-shadow:0 1px 6px rgba(0,0,0,0.5);
            cursor:grab;
          "></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
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
          vMarker.on("dblclick", (e: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(e);
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
      map.off("mousemove");
      map.off("mouseup");
    };
  }, [currentPerimeter, editMode, onPerimeterChange, perimeterEditMode]);

  /* ─── ENTRANCE MARKER ─── */
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

  /* ─── CONDOMINIO MARKERS ─── */
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
