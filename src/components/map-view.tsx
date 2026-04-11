"use client";

import React, { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MAP_CENTER: L.LatLngExpression = [-33.3273, -70.7628];
const MAP_ZOOM = 17;

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
  sosAlert?: { lat: number; lng: number; userName: string; conjunto: string; time: string } | null;
}

/* localStorage helpers */
const PERIMETER_KEY = "cyj-perimeter";
const ENTRANCE_KEY = "cyj-entrance";
const DEFAULT_PERIMETER: PerimeterPoint[] = [
  { lat: -33.3250, lng: -70.7610 },
  { lat: -33.3250, lng: -70.7650 },
  { lat: -33.3298, lng: -70.7650 },
  { lat: -33.3298, lng: -70.7610 },
];

function loadFromLS<T>(key: string, fallback: T, validate: (v: unknown) => v is T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) { const p = JSON.parse(raw); if (validate(p)) return p; }
  } catch { /* ignore */ }
  return fallback;
}

function saveToLS(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

const isPerimeter = (v: unknown): v is PerimeterPoint[] =>
  Array.isArray(v) && v.length >= 3 && v.every((p: any) => typeof p.lat === "number" && typeof p.lng === "number");

const isEntrance = (v: unknown): v is { lat: number; lng: number } =>
  typeof (v as any)?.lat === "number" && typeof (v as any)?.lng === "number";

/* Point-in-polygon ray casting (pure math, no DOM) */
function pointInPolygon(pt: L.LatLng, poly: L.LatLngExpression[]): boolean {
  let inside = false;
  const x = pt.lng, y = pt.lat;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = (poly[i] as L.LatLng).lng, yi = (poly[i] as L.LatLng).lat;
    const xj = (poly[j] as L.LatLng).lng, yj = (poly[j] as L.LatLng).lat;
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

export default function MapView({
  condominios = [],
  editMode = false,
  onPositionChange,
  entrance: entranceProp,
  onEntranceChange,
  perimeter: perimeterProp,
  onPerimeterChange,
  perimeterEditMode = "none",
  sosAlert,
}: MapViewProps) {
  /* ─── Leaflet layer refs ─── */
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const condominioMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const entranceMarkerRef = useRef<L.Marker | null>(null);
  const sosMarkerRef = useRef<L.Marker | null>(null);
  const sosPulseRef = useRef<L.CircleMarker | null>(null);
  const sosPulse2Ref = useRef<L.CircleMarker | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const vertexMarkersRef = useRef<Map<number, L.Marker>>(new Map());

  /* ─── Draw mode refs ─── */
  const drawPointsRef = useRef<PerimeterPoint[]>([]);
  const drawPolylineRef = useRef<L.Polyline | null>(null);
  const drawTempMarkersRef = useRef<L.Marker[]>([]);
  const mapClickHandlerRef = useRef<((e: L.LeafletMouseEvent) => void) | null>(null);

  /* ─── Move mode refs ─── */
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<L.LatLng | null>(null);
  const origPerimeterRef = useRef<PerimeterPoint[] | null>(null);

  /* ─── Dynamic refs (to read latest values from init-time closures) ─── */
  const perimeterModeRef = useRef<PerimeterEditMode>(perimeterEditMode);
  const perimeterChangeRef = useRef(onPerimeterChange);
  const perimeterDataRef = useRef<PerimeterPoint[] | null>(null);

  /* ─── Derived state ─── */
  const currentPerimeter = (perimeterProp && perimeterProp.length >= 3)
    ? perimeterProp
    : loadFromLS<PerimeterPoint[]>(PERIMETER_KEY, DEFAULT_PERIMETER, isPerimeter);

  const currentEntrance = entranceProp
    ? entranceProp
    : loadFromLS<{ lat: number; lng: number }>(ENTRANCE_KEY, { lat: -33.3298, lng: -70.7630 }, isEntrance);

  /* Keep dynamic refs in sync */
  useEffect(() => { perimeterModeRef.current = perimeterEditMode; }, [perimeterEditMode]);
  useEffect(() => { perimeterChangeRef.current = onPerimeterChange; }, [onPerimeterChange]);
  useEffect(() => { perimeterDataRef.current = currentPerimeter; }, [currentPerimeter]);

  /* Persist changes */
  useEffect(() => { if (currentPerimeter.length >= 3) saveToLS(PERIMETER_KEY, currentPerimeter); }, [currentPerimeter]);
  useEffect(() => { saveToLS(ENTRANCE_KEY, currentEntrance); }, [currentEntrance]);

  /* ─── Cleanup helpers ─── */
  const cleanupDraw = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    drawPointsRef.current = [];
    if (drawPolylineRef.current) { map.removeLayer(drawPolylineRef.current); drawPolylineRef.current = null; }
    drawTempMarkersRef.current.forEach((m) => map.removeLayer(m));
    drawTempMarkersRef.current = [];
    if (mapClickHandlerRef.current) { map.off("click", mapClickHandlerRef.current); mapClickHandlerRef.current = null; }
  }, []);

  const cleanupVertices = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    vertexMarkersRef.current.forEach((m) => map.removeLayer(m));
    vertexMarkersRef.current.clear();
  }, []);

  const cleanupPolygon = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (polygonRef.current) { map.removeLayer(polygonRef.current); polygonRef.current = null; }
  }, []);

  /* ─── Init map (runs once) ─── */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      zoomControl: true,
      attributionControl: false,
      zoomSnap: 0.0001,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    mapRef.current = map;

    /*
     * MOVE MODE: Raw DOM mousedown/mousemove/mouseup on mapPane.
     * This completely bypasses Leaflet's SVG event system to avoid
     * the "Cannot read properties of null (reading '_leaflet_pos')" error.
     * Uses ray-casting to detect if the click is inside the polygon.
     */
    const mapPane = map.getPane("mapPane");

    const onDomMouseDown = (domEvent: MouseEvent) => {
      if (perimeterModeRef.current !== "move") return;
      const handler = perimeterChangeRef.current;
      if (!handler) return;

      const container = map.getContainer() as HTMLElement;
      const rect = container.getBoundingClientRect();
      const cx = domEvent.clientX - rect.left;
      const cy = domEvent.clientY - rect.top;

      /* Ignore if click originated on a marker/icon (divIcon element) */
      const target = domEvent.target as HTMLElement;
      if (target.closest(".leaflet-marker-icon")) return;

      const latlng = map.containerPointToLatLng([cx, cy]);
      const poly = polygonRef.current;
      if (!poly) return;

      /* Check if click is inside polygon */
      const polyLatLngs = poly.getLatLngs()[0] as L.LatLng[];
      if (!pointInPolygon(latlng, polyLatLngs)) return;

      /* Start drag */
      domEvent.stopPropagation();
      domEvent.preventDefault();
      isDraggingRef.current = true;
      dragStartRef.current = latlng;
      origPerimeterRef.current = (perimeterDataRef.current || DEFAULT_PERIMETER).map((p) => ({ ...p }));
      map.dragging.disable();
    };

    const onDomMouseMove = (domEvent: MouseEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current || !origPerimeterRef.current) return;
      const handler = perimeterChangeRef.current;
      if (!handler) return;

      const container = map.getContainer() as HTMLElement;
      const rect = container.getBoundingClientRect();
      const cx = domEvent.clientX - rect.left;
      const cy = domEvent.clientY - rect.top;
      const latlng = map.containerPointToLatLng([cx, cy]);
      const dLat = latlng.lat - dragStartRef.current.lat;
      const dLng = latlng.lng - dragStartRef.current.lng;
      handler(origPerimeterRef.current.map((p) => ({ lat: p.lat + dLat, lng: p.lng + dLng })));
    };

    const onDomMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      dragStartRef.current = null;
      origPerimeterRef.current = null;
      map.dragging.enable();
    };

    mapPane.addEventListener("mousedown", onDomMouseDown, true);
    document.addEventListener("mousemove", onDomMouseMove, true);
    document.addEventListener("mouseup", onDomMouseUp, true);

    return () => {
      cleanupDraw();
      cleanupVertices();
      cleanupPolygon();
      mapPane.removeEventListener("mousedown", onDomMouseDown, true);
      document.removeEventListener("mousemove", onDomMouseMove, true);
      document.removeEventListener("mouseup", onDomMouseUp, true);
      map.remove();
      mapRef.current = null;
    };
  }, [cleanupDraw, cleanupVertices, cleanupPolygon]);

  /* ─── Switch mode: clean up artifacts ─── */
  useEffect(() => {
    if (perimeterEditMode !== "draw") cleanupDraw();
    if (perimeterEditMode !== "vertices") cleanupVertices();
  }, [perimeterEditMode, cleanupDraw, cleanupVertices]);

  /* ─── DRAW MODE: click to place points ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || perimeterEditMode !== "draw" || !onPerimeterChange) return;
    cleanupDraw();

    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      drawPointsRef.current.push({ lat, lng });
      const dot = L.circleMarker([lat, lng], { radius: 6, color: "#dc2626", fillColor: "#dc2626", fillOpacity: 1, weight: 2 }).addTo(map);
      drawTempMarkersRef.current.push(dot);
      if (drawPolylineRef.current) map.removeLayer(drawPolylineRef.current);
      if (drawPointsRef.current.length >= 2) {
        drawPolylineRef.current = L.polyline(
          drawPointsRef.current.map((p) => [p.lat, p.lng] as L.LatLngExpression),
          { color: "#dc2626", weight: 3, dashArray: "6, 4" }
        ).addTo(map);
      }
      if (drawPointsRef.current.length >= 3) onPerimeterChange([...drawPointsRef.current]);
    };

    mapClickHandlerRef.current = handleClick;
    map.on("click", handleClick);
    return () => { if (mapClickHandlerRef.current) { map.off("click", mapClickHandlerRef.current); mapClickHandlerRef.current = null; } };
  }, [perimeterEditMode, onPerimeterChange, cleanupDraw]);

  /* ─── SINGLE POLYGON USEFFECT (visual only, always interactive:false) ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    cleanupPolygon();
    if (currentPerimeter.length < 3) return;

    const latLngs = currentPerimeter.map((p) => [p.lat, p.lng] as L.LatLngExpression);
    const isMove = perimeterEditMode === "move";
    const isVertex = perimeterEditMode === "vertices";
    const isDraw = perimeterEditMode === "draw";
    const isEditing = editMode && onPerimeterChange;

    polygonRef.current = L.polygon(latLngs, {
      color: isMove ? "#2563eb" : isVertex ? "#dc2626" : isDraw ? "#f97316" : (isEditing ? "#0f4c81" : "#0f4c81"),
      weight: isMove || isVertex ? 3 : 2,
      dashArray: isMove || isVertex || isDraw ? undefined : "8, 6",
      fillColor: isMove ? "#2563eb" : isVertex ? "#dc2626" : isDraw ? "#f97316" : "#0f4c81",
      fillOpacity: isMove ? 0.12 : isVertex ? 0.08 : isDraw ? 0.05 : (isEditing ? 0.06 : 0.04),
      interactive: false,
    }).addTo(map);

    return () => { cleanupPolygon(); };
  }, [currentPerimeter, editMode, onPerimeterChange, perimeterEditMode, cleanupPolygon]);

  /* ─── VERTEX MARKERS (only in vertex mode) ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || perimeterEditMode !== "vertices" || !onPerimeterChange) return;
    cleanupVertices();

    currentPerimeter.forEach((pt, idx) => {
      const vIcon = L.divIcon({
        className: "",
        html: `<div style="width:18px;height:18px;background:#dc2626;border:3px solid white;border-radius:50%;box-shadow:0 1px 6px rgba(0,0,0,0.5);cursor:grab;"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const vMarker = L.marker([pt.lat, pt.lng], { icon: vIcon, draggable: true, autoPan: true, zIndexOffset: 2000 });
      vMarker.on("drag", () => {
        const pos = vMarker.getLatLng();
        const updated = [...currentPerimeter];
        updated[idx] = { lat: pos.lat, lng: pos.lng };
        onPerimeterChange(updated);
      });
      if (currentPerimeter.length > 3) {
        vMarker.on("dblclick", (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          onPerimeterChange(currentPerimeter.filter((_, i) => i !== idx));
        });
      }
      vMarker.addTo(map);
      vertexMarkersRef.current.set(idx, vMarker);
    });

    return () => { cleanupVertices(); };
  }, [currentPerimeter, perimeterEditMode, onPerimeterChange, cleanupVertices]);

  /* ─── ENTRANCE MARKER ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (entranceMarkerRef.current) { map.removeLayer(entranceMarkerRef.current); entranceMarkerRef.current = null; }

    const pos = [currentEntrance.lat, currentEntrance.lng] as L.LatLngExpression;
    const borderCol = editMode ? "#fca5a5" : "white";
    const bgCol = editMode ? "#dc2626" : "#16a34a";
    const eIcon = L.divIcon({
      className: "",
      html: `<div style="background:${bgCol};color:white;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:800;border:2px solid ${borderCol};box-shadow:0 2px 8px rgba(0,0,0,0.3);white-space:nowrap;${editMode ? "cursor:grab;" : ""}">&#x1F6AA; ENTRADA</div>`,
      iconSize: [editMode ? 110 : 80, 24],
      iconAnchor: [editMode ? 55 : 40, 12],
    });
    const marker = L.marker(pos, { icon: eIcon, draggable: editMode, autoPan: editMode, zIndexOffset: 1000 });
    if (editMode && onEntranceChange) {
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        saveToLS(ENTRANCE_KEY, { lat: p.lat, lng: p.lng });
        onEntranceChange(p.lat, p.lng);
      });
    }
    marker.addTo(map).bindPopup("<strong>Acceso Principal</strong><br>Av. La Montaña Norte 3650");
    entranceMarkerRef.current = marker;
    return () => { if (entranceMarkerRef.current) { map.removeLayer(entranceMarkerRef.current); entranceMarkerRef.current = null; } };
  }, [currentEntrance, editMode, onEntranceChange]);

  /* ─── SOS ALERT MARKER ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    /* Cleanup previous SOS markers */
    if (sosMarkerRef.current) { map.removeLayer(sosMarkerRef.current); sosMarkerRef.current = null; }
    if (sosPulseRef.current) { map.removeLayer(sosPulseRef.current); sosPulseRef.current = null; }
    if (sosPulse2Ref.current) { map.removeLayer(sosPulse2Ref.current); sosPulse2Ref.current = null; }

    if (!sosAlert) return;

    const { lat, lng, userName, conjunto, time } = sosAlert;
    const pos: L.LatLngExpression = [lat, lng];

    /* Pulse ring 1 (outer, slower) */
    sosPulse2Ref.current = L.circleMarker(pos, {
      radius: 35,
      color: "#dc2626",
      weight: 3,
      opacity: 0.3,
      fillColor: "#dc2626",
      fillOpacity: 0.05,
      interactive: false,
    }).addTo(map);

    /* Pulse ring 2 (inner, faster) */
    sosPulseRef.current = L.circleMarker(pos, {
      radius: 20,
      color: "#dc2626",
      weight: 3,
      opacity: 0.5,
      fillColor: "#dc2626",
      fillOpacity: 0.1,
      interactive: false,
    }).addTo(map);

    /* SOS marker icon */
    const sosIcon = L.divIcon({
      className: "",
      html: `<div style="position:relative;text-align:center;">
        <div style="width:50px;height:50px;border-radius:50%;background:rgba(220,38,38,0.15);border:3px solid #dc2626;animation:sos-pulse-ring 1.5s ease-out infinite;"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:32px;height:32px;border-radius:50%;background:#dc2626;box-shadow:0 0 0 4px rgba(220,38,38,0.3),0 2px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <span style="color:white;font-size:12px;font-weight:900;letter-spacing:1px;">SOS</span>
        </div>
        <div style="margin-top:4px;background:#dc2626;color:white;border-radius:6px;padding:2px 8px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${userName}${conjunto ? ' - ' + conjunto : ''}</div>
        <div style="color:#dc2626;font-size:9px;font-weight:600;margin-top:1px;white-space:nowrap;">${time}</div>
        <style>@keyframes sos-pulse-ring{0%{transform:scale(0.8);opacity:1;}100%{transform:scale(2);opacity:0;}}</style>
      </div>`,
      iconSize: [120, 80],
      iconAnchor: [60, 25],
    });

    const marker = L.marker(pos, { icon: sosIcon, zIndexOffset: 3000, interactive: false });
    marker.addTo(map).bindPopup(
      `<div style="text-align:center;padding:4px;">
        <strong style="color:#dc2626;font-size:14px;">ALERTA SOS</strong><br>
        <b>${userName}</b>${conjunto ? ' - Conjunto ' + conjunto : ''}<br>
        <span style="color:#666;">Hora: ${time}</span><br>
        <span style="color:#666;font-size:11px;">Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}</span>
      </div>`
    );
    sosMarkerRef.current = marker;

    /* Auto-pan to SOS location */
    map.flyTo(pos, Math.max(map.getZoom(), 18), { duration: 1 });

    return () => {
      if (sosMarkerRef.current) { map.removeLayer(sosMarkerRef.current); sosMarkerRef.current = null; }
      if (sosPulseRef.current) { map.removeLayer(sosPulseRef.current); sosPulseRef.current = null; }
      if (sosPulse2Ref.current) { map.removeLayer(sosPulse2Ref.current); sosPulse2Ref.current = null; }
    };
  }, [sosAlert]);

  /* ─── CONDOMINIO MARKERS ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    condominioMarkersRef.current.forEach((m) => map.removeLayer(m));
    condominioMarkersRef.current.clear();

    condominios.forEach((c) => {
      const pos = (c.lat && c.lng) ? [c.lat, c.lng] as L.LatLngExpression : (DEFAULT_POSITIONS[c.id] || MAP_CENTER);
      const color = BARRIO_COLORS[c.id] || "#64748b";
      const borderCol = editMode ? "#fca5a5" : "white";
      const cIcon = L.divIcon({
        className: "",
        html: `<div style="background:${editMode ? "#dc2626" : color};color:white;border-radius:10px;padding:3px 10px;font-size:11px;font-weight:700;border:2px solid ${borderCol};box-shadow:0 2px 8px rgba(0,0,0,0.3);white-space:nowrap;display:flex;align-items:center;gap:4px;letter-spacing:0.3px;${editMode ? "cursor:grab;" : ""}">${editMode ? "&#x270B; " : ""}${c.name}</div>`,
        iconSize: [editMode ? 120 : 110, 24],
        iconAnchor: [editMode ? 60 : 55, 12],
      });
      const marker = L.marker(pos, { icon: cIcon, draggable: editMode, autoPan: editMode });
      if (editMode && onPositionChange) {
        marker.on("dragend", () => { const p = marker.getLatLng(); onPositionChange(c.id, p.lat, p.lng); });
      }
      const isDeptos = c.type === "torres" || c.type === "deptos";
      marker.addTo(map).bindPopup(`<strong>${c.name}</strong><br>${isDeptos ? "Deptos" : "Casas"}<br>Condominio Laguna Norte`);
      condominioMarkersRef.current.set(c.id, marker);
    });
    return () => { condominioMarkersRef.current.forEach((m) => map.removeLayer(m)); condominioMarkersRef.current.clear(); };
  }, [condominios, editMode, onPositionChange]);

  return <div ref={containerRef} className="w-full h-full rounded-2xl" />;
}
