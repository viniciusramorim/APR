import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  format,
  formatDistanceToNowStrict,
  startOfDay,
  subDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import RadarRoundedIcon from "@mui/icons-material/RadarRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import Header from "../../components/Header";
import firebase from "../../services/firebaseConnection";
import { AuthContext } from "../../contexts/auth";
import "./analyticsMap.scss";

const BASE_COLLECTION = "aprs-producao";
const AUTO_REFRESH_MS = 60000;
const QUERY_BATCH_SIZE = 800;
const MAP_CENTER = [-14.235, -51.9253];
const MAP_BOUNDS = [
  [-33.9, -73.99],
  [5.5, -28.84],
];

const REGION_MAP = {
  CO_N: ["DF", "GO", "TO", "AC", "MS", "MT", "RO", "AM", "AP", "MA", "PA", "RR"],
  NE: ["PE", "CE", "PB", "RN", "AL", "PI", "BA", "SE"],
  RJ_ES_MG: ["RJ", "ES", "MG"],
  SP: ["SP"],
  SUL: ["RS", "PR", "SC"],
};

const PERIOD_OPTIONS = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "7 dias" },
  { value: "month", label: "Mês" },
  { value: "year", label: "Ano" },
  { value: "custom", label: "Personalizado" },
];

function parseCoordinate(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getCreatedDate(apr) {
  if (!apr?.created) return null;
  if (typeof apr.created.toDate === "function") return apr.created.toDate();

  const parsed = new Date(apr.created);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDateRange(period, customRange) {
  const now = new Date();

  switch (period) {
    case "today":
      return { start: startOfDay(now), end: now };
    case "week":
      return { start: startOfDay(subDays(now, 6)), end: now };
    case "month":
      return { start: startOfDay(subDays(now, 29)), end: now };
    case "year":
      return { start: startOfDay(subDays(now, 364)), end: now };
    case "custom":
      return {
        start: customRange.startDate
          ? new Date(`${customRange.startDate}T00:00:00`)
          : startOfDay(now),
        end: customRange.endDate
          ? new Date(`${customRange.endDate}T23:59:59`)
          : now,
      };
    default:
      return { start: startOfDay(now), end: now };
  }
}

function resolveRegion(uf) {
  const normalizedUf = String(uf || "").trim().toUpperCase();
  const matchedRegion = Object.entries(REGION_MAP).find(([, ufs]) =>
    ufs.includes(normalizedUf)
  );

  return matchedRegion ? matchedRegion[0] : "OUTROS";
}

function normalizePerimeterStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized.includes("fora")) return "outside";
  if (normalized.includes("dentro")) return "inside";
  if (normalized.includes("nao habilitada") || normalized.includes("não habilitada")) {
    return "disabled";
  }
  if (normalized.includes("erro")) return "error";

  return "unknown";
}

function getCoordinates(apr, useOpeningLocation) {
  const openingLatitude = parseCoordinate(apr?.locationCreated?.latitude);
  const openingLongitude = parseCoordinate(
    apr?.locationCreated?.longitude ?? apr?.locationCreated?.logitude
  );
  const siteLatitude = parseCoordinate(apr?.site_id?.Latitude ?? apr?.site_id?.latitude);
  const siteLongitude = parseCoordinate(apr?.site_id?.Longitude ?? apr?.site_id?.longitude);

  if (useOpeningLocation && openingLatitude !== null && openingLongitude !== null) {
    return [openingLatitude, openingLongitude];
  }

  if (siteLatitude !== null && siteLongitude !== null) {
    return [siteLatitude, siteLongitude];
  }

  if (openingLatitude !== null && openingLongitude !== null) {
    return [openingLatitude, openingLongitude];
  }

  return null;
}

function isRecentActivity(date) {
  if (!date) return false;
  return Date.now() - date.getTime() <= 2 * 60 * 60 * 1000;
}

function formatDateTime(value) {
  if (!value) return "-";
  return format(value, "dd/MM/yyyy HH:mm");
}

function formatRelativeTime(value) {
  if (!value) return "-";

  return formatDistanceToNowStrict(value, {
    addSuffix: true,
    locale: ptBR,
  });
}

function formatDayKey(value) {
  if (!value) return "";
  return format(value, "yyyy-MM-dd");
}

function formatWindowRangeLabel(start, end) {
  if (!start || !end) return "-";
  return `${format(start, "dd/MM/yyyy")} - ${format(end, "dd/MM/yyyy")}`;
}

function escapeCsvValue(value) {
  const normalized = String(value ?? "").replace(/"/g, '""');
  return `"${normalized}"`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function downloadSpreadsheetReport(filename, headers, rows) {
  const csvContent = [
    "sep=;",
    headers.map(escapeCsvValue).join(";"),
    ...rows.map((row) => row.map(escapeCsvValue).join(";")),
  ].join("\n");

  const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function matchesUserVisibility(apr, user) {
  if (!user) return false;

  const userRegionalStates = REGION_MAP[user.regional] || [];
  const aprState = String(apr?.site_id?.Estado || "").toUpperCase();

  if (user.nivel === "administrador") return true;
  if (user.nivel === "ponto_focal") {
    return apr.status === "Enviado para Área Responsável";
  }
  if (user.nivel === "auditor") {
    return ["AUDIT PGR FIXA", "AUDIT PGR MOVEL"].includes(apr?.site_id?.tipoSite);
  }
  if (
    user.nivel === "supervisor" ||
    user.nivel === "revisor" ||
    user.nivel === "revisor_logistica"
  ) {
    return userRegionalStates.length === 0 || userRegionalStates.includes(aprState);
  }
  if (user.nivel === "aplicador" && user.area !== "oem") {
    return apr?.user_id?.uid === user.uid;
  }
  if (user.area === "oem") {
    return ["Enviado", "Respondido pela Area", "Respondido pela Área"].includes(
      apr.status
    );
  }

  return true;
}

function createRankItems(items, getLabel) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;

  return items
    .sort((first, second) => second.value - first.value)
    .slice(0, 5)
    .map((item) => ({
      ...item,
      label: getLabel(item),
      share: Math.max(8, Math.round((item.value / total) * 100)),
    }));
}

function FitMapBounds({ markers }) {
  const map = useMap();

  useEffect(() => {
    if (!markers.length) {
      map.setView(MAP_CENTER, 4);
      return;
    }

    const bounds = L.latLngBounds(markers.map((marker) => marker.coordinates));
    map.fitBounds(bounds.pad(0.28), {
      animate: true,
      maxZoom: markers.length === 1 ? 10 : 7,
    });
  }, [map, markers]);

  return null;
}

function createMarkerIcon(hotspot) {
  const perimeterStatus =
    hotspot.outsideCount > 0
      ? "outside"
      : hotspot.insideCount > 0
        ? "inside"
        : "neutral";
  const freshnessClass = hotspot.isRecent ? "is-recent" : "is-stable";

  return L.divIcon({
    className: "analytics-map-marker-shell",
    html: `
      <div class="analytics-map-marker ${freshnessClass} ${perimeterStatus}">
        <span>${hotspot.count}</span>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 36],
    popupAnchor: [0, -30],
  });
}

export default function AnalyticsMap() {
  const { user } = useContext(AuthContext);
  const [period, setPeriod] = useState("today");
  const [customRange, setCustomRange] = useState({ startDate: "", endDate: "" });
  const [statusFilter, setStatusFilter] = useState("");
  const [motivoFilter, setMotivoFilter] = useState("");
  const [regionalFilter, setRegionalFilter] = useState("");
  const [supervisorFilter, setSupervisorFilter] = useState("");
  const [siteTypeFilter, setSiteTypeFilter] = useState("");
  const [useOpeningLocation, setUseOpeningLocation] = useState(false);
  const [aprs, setAprs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedRange = useMemo(() => getDateRange(period, customRange), [customRange, period]);

  const handleClearFilters = useCallback(() => {
    setStatusFilter("");
    setMotivoFilter("");
    setRegionalFilter("");
    setSupervisorFilter("");
    setSiteTypeFilter("");
    setUseOpeningLocation(false);
    setCustomRange({ startDate: "", endDate: "" });
    setPeriod("today");
  }, []);

  useEffect(() => {
    document.body.classList.add("page-analytics-map");

    return () => {
      document.body.classList.remove("page-analytics-map");
    };
  }, []);

  const loadAprs = useCallback(async () => {
    const { start, end } = getDateRange(period, customRange);

    if (start > end) {
      setErrorMessage("A data inicial não pode ser maior que a data final.");
      setAprs([]);
      return;
    }

    setLoading(true);
    setProgress(5);
    setErrorMessage("");

    try {
      const allAprs = [];
      const totalRangeMs = Math.max(end.getTime() - start.getTime(), 1);
      let currentStart = new Date(start);

      while (currentStart <= end) {
        const currentEnd = new Date(
          Math.min(currentStart.getTime() + 29 * 24 * 60 * 60 * 1000, end.getTime())
        );
        let lastVisible = null;

        while (true) {
          let query = firebase
            .firestore()
            .collection(BASE_COLLECTION)
            .where("created", ">=", currentStart)
            .where("created", "<=", currentEnd)
            .orderBy("created", "desc")
            .limit(QUERY_BATCH_SIZE);

          if (lastVisible) {
            query = query.startAfter(lastVisible);
          }

          const snapshot = await query.get();

          if (snapshot.empty) {
            break;
          }

          snapshot.docs.forEach((doc) => {
            allAprs.push({ id: doc.id, ...doc.data() });
          });

          if (snapshot.docs.length < QUERY_BATCH_SIZE) {
            break;
          }

          lastVisible = snapshot.docs[snapshot.docs.length - 1];
        }

        const elapsedRange = Math.min(
          currentEnd.getTime() - start.getTime(),
          totalRangeMs
        );
        setProgress(Math.max(12, Math.round((elapsedRange / totalRangeMs) * 100)));
        currentStart = new Date(currentEnd.getTime() + 1);
      }

      setAprs(allAprs.filter((apr) => matchesUserVisibility(apr, user)));
      setLastUpdatedAt(new Date());
      setProgress(100);
    } catch (error) {
      console.error("Erro ao carregar analytics territorial:", error);
      setErrorMessage(
        "Não foi possível carregar o mapa analítico. Verifique os índices do Firestore ou tente um período menor."
      );
      setAprs([]);
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 300);
    }
  }, [customRange, period, user]);

  useEffect(() => {
    loadAprs();
  }, [loadAprs]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadAprs();
    }, AUTO_REFRESH_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadAprs]);

  const filteredAprs = useMemo(() => {
    return aprs.filter((apr) => {
      const motivo = String(apr.motivo_apr || "");
      const status = String(apr.status || "");
      const regional = resolveRegion(apr?.site_id?.Estado);
      const supervisor = String(apr?.user_id?.nome || "").toLowerCase();
      const siteType = String(apr?.site_id?.tipoSite || "");

      if (statusFilter && status !== statusFilter) return false;
      if (motivoFilter && motivo !== motivoFilter) return false;
      if (regionalFilter && regional !== regionalFilter) return false;
      if (siteTypeFilter && siteType !== siteTypeFilter) return false;
      if (supervisorFilter && supervisor !== supervisorFilter.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [aprs, motivoFilter, regionalFilter, siteTypeFilter, statusFilter, supervisorFilter]);

  const filtersData = useMemo(() => {
    const motivos = Array.from(
      new Set(aprs.map((apr) => apr.motivo_apr).filter(Boolean))
    ).sort();
    const statuses = Array.from(
      new Set(aprs.map((apr) => apr.status).filter(Boolean))
    ).sort();
    const siteTypes = Array.from(
      new Set(aprs.map((apr) => apr?.site_id?.tipoSite).filter(Boolean))
    ).sort();
    const supervisors = Array.from(
      new Set(aprs.map((apr) => apr?.user_id?.nome).filter(Boolean))
    ).sort((first, second) => first.localeCompare(second, "pt-BR"));

    return { motivos, statuses, siteTypes, supervisors };
  }, [aprs]);

  const mapHotspots = useMemo(() => {
    const groups = new Map();

    filteredAprs.forEach((apr) => {
      const coordinates = getCoordinates(apr, useOpeningLocation);

      if (!coordinates) return;

      const createdAt = getCreatedDate(apr);
      const siteName = apr?.site_id?.Nome || "Site sem nome";
      const siteState = apr?.site_id?.Estado || "N/A";
      const siteCity = apr?.site_id?.Cidade || "N/A";
      const siteSigla = apr?.site_id?.Sigla || apr.id;
      const key = `${siteSigla}-${siteState}-${siteName}-${coordinates[0]}-${coordinates[1]}`;
      const perimeterStatus = normalizePerimeterStatus(apr?.locationCreated?.perimetro);

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          coordinates,
          siteName,
          siteState,
          siteCity,
          siteSigla,
          count: 0,
          latestCreatedAt: createdAt,
          reasons: new Set(),
          supervisors: new Set(),
          insideCount: 0,
          outsideCount: 0,
        });
      }

      const currentGroup = groups.get(key);
      currentGroup.count += 1;
      currentGroup.reasons.add(apr?.motivo_apr || "Não informado");
      currentGroup.supervisors.add(apr?.user_id?.nome || "Sem supervisor");

      if (!currentGroup.latestCreatedAt || (createdAt && createdAt > currentGroup.latestCreatedAt)) {
        currentGroup.latestCreatedAt = createdAt;
      }

      if (perimeterStatus === "inside") currentGroup.insideCount += 1;
      if (perimeterStatus === "outside") currentGroup.outsideCount += 1;
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        reasons: Array.from(group.reasons),
        supervisors: Array.from(group.supervisors),
        isRecent: isRecentActivity(group.latestCreatedAt),
      }))
      .sort((first, second) => {
        if (second.count !== first.count) return second.count - first.count;
        return (second.latestCreatedAt?.getTime() || 0) - (first.latestCreatedAt?.getTime() || 0);
      });
  }, [filteredAprs, useOpeningLocation]);

  const summary = useMemo(() => {
    const sites = new Set();
    const supervisors = new Set();
    let insideCount = 0;
    let outsideCount = 0;
    let liveCount = 0;

    filteredAprs.forEach((apr) => {
      const siteKey = `${apr?.site_id?.Sigla || apr?.site_id?.Nome}-${apr?.site_id?.Estado}`;
      sites.add(siteKey);
      supervisors.add(apr?.user_id?.nome || "Sem supervisor");

      const perimeterStatus = normalizePerimeterStatus(apr?.locationCreated?.perimetro);
      if (perimeterStatus === "inside") insideCount += 1;
      if (perimeterStatus === "outside") outsideCount += 1;

      if (isRecentActivity(getCreatedDate(apr))) {
        liveCount += 1;
      }
    });

    const trackedCount = insideCount + outsideCount;
    const insideRate = trackedCount > 0 ? Math.round((insideCount / trackedCount) * 100) : 0;
    const latestApr = [...filteredAprs].sort(
      (first, second) =>
        (getCreatedDate(second)?.getTime() || 0) -
        (getCreatedDate(first)?.getTime() || 0)
    )[0];

    return {
      totalAprs: filteredAprs.length,
      activeSites: sites.size,
      activeSupervisors: supervisors.size,
      insideRate,
      liveCount,
      latestApr,
    };
  }, [filteredAprs]);

  const rankings = useMemo(() => {
    const reasonMap = new Map();
    const regionMap = new Map();
    const supervisorMap = new Map();
    const activityFeed = [...filteredAprs]
      .sort(
        (first, second) =>
          (getCreatedDate(second)?.getTime() || 0) -
          (getCreatedDate(first)?.getTime() || 0)
      )
      .slice(0, 8)
      .map((apr) => ({
        id: apr.id,
        createdAt: getCreatedDate(apr),
        siteName: apr?.site_id?.Nome || "Site sem nome",
        supervisor: apr?.user_id?.nome || "Sem supervisor",
        motivo: apr?.motivo_apr || "Não informado",
        status: apr?.status || "N/A",
        regional: resolveRegion(apr?.site_id?.Estado),
        perimeterStatus: normalizePerimeterStatus(apr?.locationCreated?.perimetro),
      }));

    filteredAprs.forEach((apr) => {
      const reason = apr?.motivo_apr || "Não informado";
      const region = resolveRegion(apr?.site_id?.Estado);
      const supervisor = apr?.user_id?.nome || "Sem supervisor";

      reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
      regionMap.set(region, (regionMap.get(region) || 0) + 1);
      supervisorMap.set(supervisor, (supervisorMap.get(supervisor) || 0) + 1);
    });

    return {
      motivos: createRankItems(
        Array.from(reasonMap.entries()).map(([key, value]) => ({ key, value })),
        (item) => item.key
      ),
      regionais: createRankItems(
        Array.from(regionMap.entries()).map(([key, value]) => ({ key, value })),
        (item) => item.key
      ),
      supervisores: createRankItems(
        Array.from(supervisorMap.entries()).map(([key, value]) => ({ key, value })),
        (item) => item.key
      ),
      activityFeed,
    };
  }, [filteredAprs]);

  const operationalInsights = useMemo(() => {
    const siteMap = new Map();
    const dailyCountMap = new Map();
    const start = startOfDay(selectedRange.start);
    const end = startOfDay(selectedRange.end);

    filteredAprs.forEach((apr) => {
      const createdAt = getCreatedDate(apr);
      const siteName = apr?.site_id?.Nome || "Site sem nome";
      const siteSigla = apr?.site_id?.Sigla || siteName;
      const siteState = apr?.site_id?.Estado || "N/A";
      const siteCity = apr?.site_id?.Cidade || "N/A";
      const siteKey = `${siteSigla}-${siteState}-${siteCity}`;

      if (!siteMap.has(siteKey)) {
        siteMap.set(siteKey, {
          key: siteKey,
          siteName,
          siteSigla,
          siteState,
          siteCity,
          regional: resolveRegion(siteState),
          value: 0,
        });
      }

      siteMap.get(siteKey).value += 1;

      if (createdAt) {
        const dayKey = formatDayKey(createdAt);
        dailyCountMap.set(dayKey, (dailyCountMap.get(dayKey) || 0) + 1);
      }
    });

    const dailySeriesFull = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      const dayKey = formatDayKey(cursor);

      dailySeriesFull.push({
        key: dayKey,
        date: new Date(cursor),
        value: dailyCountMap.get(dayKey) || 0,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    const dailySeries = dailySeriesFull.length > 14
      ? dailySeriesFull.slice(-14)
      : dailySeriesFull;

    const maxDailyVolume = dailySeries.reduce(
      (highest, item) => Math.max(highest, item.value),
      0
    );

    const peakDay = [...dailySeriesFull].sort((first, second) => {
      if (second.value !== first.value) {
        return second.value - first.value;
      }

      return second.date.getTime() - first.date.getTime();
    })[0] || null;

    const rawTopSites = Array.from(siteMap.values()).sort(
      (first, second) => second.value - first.value
    );
    const topSiteBase = rawTopSites[0]?.value || 1;
    const topSites = rawTopSites.slice(0, 6).map((site) => ({
      ...site,
      share: Math.max(10, Math.round((site.value / topSiteBase) * 100)),
    }));

    const dailyAverageValue = dailySeriesFull.length
      ? filteredAprs.length / dailySeriesFull.length
      : 0;

    return {
      dailySeries,
      dailyAverageValue,
      dailyAverageLabel: dailyAverageValue.toFixed(1),
      maxDailyVolume,
      peakDay,
      topSites,
      topSite: topSites[0] || null,
    };
  }, [filteredAprs, selectedRange]);

  const selectedWindowLabel = useMemo(() => {
    if (period === "week") return "7 dias";
    if (period === "month") return "30 dias";
    if (period === "year") return "365 dias";

    const selectedOption = PERIOD_OPTIONS.find((option) => option.value === period);
    return selectedOption ? selectedOption.label : "Hoje";
  }, [period]);

  const selectedWindowRangeLabel = useMemo(() => {
    return formatWindowRangeLabel(selectedRange.start, selectedRange.end);
  }, [selectedRange.end, selectedRange.start]);

  const summaryHighlights = useMemo(() => {
    return {
      topMotivo: rankings.motivos[0] || null,
      topRegional: rankings.regionais[0] || null,
      topSupervisor: rankings.supervisores[0] || null,
      topSite: operationalInsights.topSite || null,
    };
  }, [operationalInsights.topSite, rankings]);

  const activeFilterPills = useMemo(() => {
    const pills = [];

    if (statusFilter) pills.push(`Status: ${statusFilter}`);
    if (motivoFilter) pills.push(`Motivo: ${motivoFilter}`);
    if (regionalFilter) pills.push(`Regional: ${regionalFilter}`);
    if (siteTypeFilter) pills.push(`Tipo: ${siteTypeFilter}`);
    if (supervisorFilter) pills.push(`Supervisor: ${supervisorFilter}`);
    if (useOpeningLocation) pills.push("Mapa pelo ponto de abertura");

    return pills;
  }, [motivoFilter, regionalFilter, siteTypeFilter, statusFilter, supervisorFilter, useOpeningLocation]);

  const handleExportSpreadsheet = useCallback(() => {
    const headers = [
      "Data",
      "APR ID",
      "Supervisor",
      "Motivo",
      "Status",
      "Regional",
      "Site",
      "Sigla",
      "Cidade",
      "Estado",
      "Tipo de site",
      "Perimetro",
      "Latitude usada",
      "Longitude usada",
    ];

    const rows = filteredAprs
      .slice()
      .sort(
        (first, second) =>
          (getCreatedDate(second)?.getTime() || 0) - (getCreatedDate(first)?.getTime() || 0)
      )
      .map((apr) => {
        const coordinates = getCoordinates(apr, useOpeningLocation) || ["", ""];

        return [
          formatDateTime(getCreatedDate(apr)),
          apr.id,
          apr?.user_id?.nome || "Sem supervisor",
          apr?.motivo_apr || "Nao informado",
          apr?.status || "N/A",
          resolveRegion(apr?.site_id?.Estado),
          apr?.site_id?.Nome || "Site sem nome",
          apr?.site_id?.Sigla || "",
          apr?.site_id?.Cidade || "",
          apr?.site_id?.Estado || "",
          apr?.site_id?.tipoSite || "",
          apr?.locationCreated?.perimetro || "",
          coordinates[0],
          coordinates[1],
        ];
      });

    const reportDate = format(new Date(), "yyyyMMdd-HHmm");
    const filename = `apr-analytics-${period}-${reportDate}.csv`;

    downloadSpreadsheetReport(filename, headers, rows);
  }, [filteredAprs, period, useOpeningLocation]);

  const handleOpenExecutiveReport = useCallback(() => {
    const reportWindow = window.open("", "_blank", "width=1320,height=900");

    if (!reportWindow) {
      return;
    }

    const filterTags = activeFilterPills.length
      ? activeFilterPills
      : ["Sem filtros adicionais"];

    const topSitesMarkup = operationalInsights.topSites.length
      ? operationalInsights.topSites
          .map(
            (site, index) => `
              <div class="site-row">
                <div class="site-rank">#${index + 1}</div>
                <div class="site-copy">
                  <strong>${escapeHtml(site.siteName)}</strong>
                  <span>${escapeHtml(`${site.siteCity} / ${site.siteState} - ${site.regional}`)}</span>
                </div>
                <div class="site-bar"><i style="width:${site.share}%"></i></div>
              </div>
            `
          )
          .join("")
      : `<div class="empty">Sem sites no recorte atual.</div>`;

    const chartMarkup = operationalInsights.dailySeries.length
      ? operationalInsights.dailySeries
          .map((item) => {
            const height = operationalInsights.maxDailyVolume
              ? Math.max(12, Math.round((item.value / operationalInsights.maxDailyVolume) * 100))
              : 0;

            return `
              <div class="chart-col">
                <span>${item.value}</span>
                <div class="chart-track"><i style="height:${height}%"></i></div>
                <small>${escapeHtml(format(item.date, "dd/MM"))}</small>
              </div>
            `;
          })
          .join("")
      : `<div class="empty">Sem volume para montar o grafico.</div>`;

    const rankingColumns = [
      { title: "Motivos", items: rankings.motivos, className: "cool" },
      { title: "Regionais", items: rankings.regionais, className: "teal" },
      { title: "Supervisores", items: rankings.supervisores, className: "warm" },
    ]
      .map(
        (group) => `
          <section class="rank-card">
            <h3>${group.title}</h3>
            ${
              group.items.length
                ? group.items
                    .map(
                      (item) => `
                        <div class="rank-row">
                          <div class="rank-copy">
                            <strong>${escapeHtml(item.label)}</strong>
                            <span>${item.value} APR(s)</span>
                          </div>
                          <div class="rank-bar ${group.className}"><i style="width:${item.share}%"></i></div>
                        </div>
                      `
                    )
                    .join("")
                : `<div class="empty">Sem dados.</div>`
            }
          </section>
        `
      )
      .join("");

    const latestRows = filteredAprs
      .slice()
      .sort(
        (first, second) =>
          (getCreatedDate(second)?.getTime() || 0) - (getCreatedDate(first)?.getTime() || 0)
      )
      .slice(0, 12)
      .map((apr) => {
        const createdAt = getCreatedDate(apr);

        return `
          <tr>
            <td>${escapeHtml(formatDateTime(createdAt))}</td>
            <td>${escapeHtml(apr?.user_id?.nome || "Sem supervisor")}</td>
            <td>${escapeHtml(apr?.motivo_apr || "Nao informado")}</td>
            <td>${escapeHtml(apr?.site_id?.Nome || "Site sem nome")}</td>
            <td>${escapeHtml(resolveRegion(apr?.site_id?.Estado))}</td>
            <td>${escapeHtml(apr?.status || "N/A")}</td>
          </tr>
        `;
      })
      .join("");

    reportWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Relatorio Executivo APR</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; color: #0f172a; background: linear-gradient(180deg, #f3f7fb 0%, #edf2f7 100%); }
            .page { padding: 32px; }
            .hero, .panel, .table-card { background: rgba(255,255,255,0.96); border: 1px solid rgba(15,23,42,0.08); border-radius: 24px; box-shadow: 0 18px 42px rgba(15,23,42,0.08); }
            .hero { padding: 28px; background: linear-gradient(135deg, rgba(8,145,178,0.08) 0%, rgba(37,99,235,0.04) 100%), rgba(255,255,255,0.98); }
            .hero-top, .section-head, .filters { display: flex; justify-content: space-between; gap: 16px; }
            .eyebrow { display: inline-flex; padding: 6px 12px; border-radius: 999px; background: rgba(8,145,178,0.1); color: #0f766e; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
            h1 { margin: 14px 0 8px; font-size: 34px; }
            .subtitle { max-width: 760px; color: #475569; line-height: 1.6; }
            .print-actions { display: flex; gap: 10px; }
            .print-actions button { border: 0; border-radius: 12px; padding: 12px 18px; font-weight: 700; cursor: pointer; }
            .print-actions .primary { background: linear-gradient(135deg, #0f766e 0%, #2563eb 100%); color: #fff; }
            .print-actions .secondary { background: #e2e8f0; color: #0f172a; }
            .snapshot-grid, .kpi-grid, .bottom-grid, .rank-grid { display: grid; gap: 14px; }
            .snapshot-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); margin-top: 18px; }
            .kpi-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); margin-top: 22px; }
            .bottom-grid { grid-template-columns: 1.2fr 0.8fr; margin-top: 22px; }
            .rank-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 22px; }
            .tile, .kpi, .chart-card, .site-card, .rank-card { border: 1px solid rgba(15,23,42,0.06); border-radius: 18px; background: rgba(248,250,252,0.86); padding: 16px; }
            .tile span, .kpi span, .mini-title, .filters span { display: block; font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
            .tile strong, .kpi strong { display: block; margin-top: 8px; font-size: 22px; }
            .tile small, .kpi small { display: block; margin-top: 6px; color: #64748b; }
            .filters { margin-top: 16px; flex-wrap: wrap; align-items: center; }
            .filters-list { display: flex; gap: 8px; flex-wrap: wrap; }
            .filter-tag { display: inline-flex; padding: 8px 12px; border-radius: 999px; border: 1px solid rgba(15,23,42,0.08); background: #fff; color: #334155; font-size: 12px; font-weight: 600; }
            .panel { padding: 22px; }
            .panel h2 { margin: 6px 0 0; font-size: 28px; }
            .chart-wrap { display: flex; align-items: flex-end; gap: 16px; min-height: 220px; margin-top: 18px; padding: 16px; border-radius: 18px; border: 1px solid rgba(15,23,42,0.06); background: linear-gradient(180deg, rgba(248,250,252,0.96) 0%, rgba(241,245,249,0.92) 100%); }
            .chart-col { flex: 0 0 72px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
            .chart-col span { font-size: 13px; font-weight: 800; }
            .chart-col small { color: #64748b; font-size: 12px; }
            .chart-track { width: 100%; height: 128px; display: flex; align-items: flex-end; padding: 4px; border-radius: 14px; background: #fff; border: 1px solid rgba(37,99,235,0.08); }
            .chart-track i { display: block; width: 100%; border-radius: 10px; background: linear-gradient(180deg, #0f766e 0%, #2563eb 100%); }
            .site-row, .rank-row { display: grid; grid-template-columns: auto minmax(0, 1fr) 140px; gap: 12px; align-items: center; padding: 12px 0; }
            .site-rank { width: 38px; height: 38px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; background: rgba(37,99,235,0.08); color: #2563eb; font-weight: 800; }
            .site-copy strong, .rank-copy strong { display: block; }
            .site-copy span, .rank-copy span { color: #64748b; font-size: 13px; }
            .site-bar, .rank-bar { height: 10px; border-radius: 999px; background: rgba(148,163,184,0.18); overflow: hidden; }
            .site-bar i, .rank-bar i { display: block; height: 100%; border-radius: inherit; }
            .site-bar i, .rank-bar.cool i { background: linear-gradient(135deg, #2563eb 0%, #0891b2 100%); }
            .rank-bar.teal i { background: linear-gradient(135deg, #0f766e 0%, #2563eb 100%); }
            .rank-bar.warm i { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
            .table-card { margin-top: 22px; padding: 22px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { text-align: left; padding: 12px 10px; border-bottom: 1px solid rgba(15,23,42,0.08); }
            th { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
            td { font-size: 13px; }
            .empty { color: #64748b; font-size: 14px; }
            @media print {
              body { background: #fff; }
              .page { padding: 0; }
              .print-actions { display: none; }
              .hero, .panel, .table-card { box-shadow: none; page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <section class="hero">
              <div class="hero-top">
                <div>
                  <span class="eyebrow">APR Intelligence</span>
                  <h1>Relatorio Executivo APR</h1>
                  <div class="subtitle">Leitura consolidada do recorte ativo da dashboard, com foco em volume, territorialidade, supervisao e motivos de abertura.</div>
                </div>
                <div class="print-actions">
                  <button class="secondary" onclick="window.close()">Fechar</button>
                  <button class="primary" onclick="window.print()">Imprimir / Salvar PDF</button>
                </div>
              </div>
              <div class="filters">
                <span>Recorte: ${escapeHtml(selectedWindowLabel)} | ${escapeHtml(selectedWindowRangeLabel)}</span>
                <div class="filters-list">${filterTags.map((item) => `<span class="filter-tag">${escapeHtml(item)}</span>`).join("")}</div>
              </div>
              <div class="snapshot-grid">
                <div class="tile"><span>APR(s) no periodo</span><strong>${summary.totalAprs}</strong><small>Base filtrada</small></div>
                <div class="tile"><span>Sites acionados</span><strong>${summary.activeSites}</strong><small>Locais com APR</small></div>
                <div class="tile"><span>Supervisores ativos</span><strong>${summary.activeSupervisors}</strong><small>Responsaveis no recorte</small></div>
                <div class="tile"><span>Dentro do perimetro</span><strong>${summary.insideRate}%</strong><small>Geolocalizacao valida</small></div>
                <div class="tile"><span>Site lider</span><strong>${escapeHtml(summaryHighlights.topSite?.siteSigla || summaryHighlights.topSite?.siteName || "-")}</strong><small>${summaryHighlights.topSite?.value || 0} APR(s)</small></div>
              </div>
            </section>
            <div class="bottom-grid">
              <section class="panel chart-card">
                <div class="section-head">
                  <div>
                    <span class="mini-title">Cadencia operacional</span>
                    <h2>APR(s) por dia</h2>
                  </div>
                </div>
                <div class="kpi-grid">
                  <div class="kpi"><span>Media diaria</span><strong>${operationalInsights.dailyAverageLabel}</strong></div>
                  <div class="kpi"><span>Pico diario</span><strong>${operationalInsights.peakDay?.value || 0}</strong></div>
                  <div class="kpi"><span>Data do pico</span><strong>${escapeHtml(operationalInsights.peakDay ? format(operationalInsights.peakDay.date, "dd/MM/yyyy") : "-")}</strong></div>
                  <div class="kpi"><span>Motivo lider</span><strong>${escapeHtml(summaryHighlights.topMotivo?.label || "-")}</strong></div>
                  <div class="kpi"><span>Supervisor destaque</span><strong>${escapeHtml(summaryHighlights.topSupervisor?.label || "-")}</strong></div>
                </div>
                <div class="chart-wrap">${chartMarkup}</div>
              </section>
              <section class="panel site-card">
                <div class="section-head">
                  <div>
                    <span class="mini-title">Locais lideres</span>
                    <h2>Sites com maior volume</h2>
                  </div>
                </div>
                <div style="margin-top:12px;">${topSitesMarkup}</div>
              </section>
            </div>
            <div class="rank-grid">${rankingColumns}</div>
            <section class="table-card">
              <div class="section-head">
                <div>
                  <span class="mini-title">Detalhamento</span>
                  <h2>Ultimos registros do recorte</h2>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Supervisor</th>
                    <th>Motivo</th>
                    <th>Site</th>
                    <th>Regional</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>${latestRows || `<tr><td colspan="6" class="empty">Sem registros.</td></tr>`}</tbody>
              </table>
            </section>
          </div>
        </body>
      </html>
    `);

    reportWindow.document.close();
  }, [
    activeFilterPills,
    filteredAprs,
    operationalInsights.dailyAverageLabel,
    operationalInsights.dailySeries,
    operationalInsights.maxDailyVolume,
    operationalInsights.peakDay,
    operationalInsights.topSites,
    rankings.motivos,
    rankings.regionais,
    rankings.supervisores,
    selectedWindowLabel,
    selectedWindowRangeLabel,
    summary.activeSites,
    summary.activeSupervisors,
    summary.insideRate,
    summary.totalAprs,
    summaryHighlights.topMotivo,
    summaryHighlights.topSite,
    summaryHighlights.topSupervisor,
  ]);

  return (
    <div className="page-analytics-map-shell">
      <Header
        name="Mapa Analytics"
        subtitle="Leitura territorial das APRs em mapa, com foco em periodo, motivo e supervisor"
      />

      <main className="content analytics-map-page-content">
        <Paper className="analytics-map-hero" elevation={0}>
          <div className="analytics-map-hero-top">
            <div className="analytics-map-hero-copy">
              <span className="analytics-map-eyebrow">APR Intelligence</span>
              <Typography variant="h4" className="analytics-map-title">
                Radar territorial das APRs
              </Typography>
              <Typography variant="body1" className="analytics-map-subtitle">
                Mapa executivo para entender onde, por quem e por qual motivo as APRs foram abertas.
              </Typography>
            </div>

            <div className="analytics-map-hero-aside">
              <Chip
                icon={<RadarRoundedIcon />}
                className="analytics-map-live-chip"
                label={`${summary.liveCount} recente(s) nas ultimas 2h`}
              />
              <Chip
                icon={<RefreshRoundedIcon />}
                variant="outlined"
                label={
                  lastUpdatedAt
                    ? `Atualizado ${formatRelativeTime(lastUpdatedAt)}`
                    : "Aguardando primeira carga"
                }
              />
            </div>
          </div>

          <div className="analytics-map-snapshot-row">
            <div className="analytics-map-snapshot-item">
              <span>Janela</span>
              <strong>{selectedWindowLabel}</strong>
              <small>{selectedWindowRangeLabel}</small>
            </div>
            <div className="analytics-map-snapshot-item">
              <span>Motivo lider</span>
              <strong>{summaryHighlights.topMotivo?.label || "-"}</strong>
            </div>
            <div className="analytics-map-snapshot-item">
              <span>Regional lider</span>
              <strong>{summaryHighlights.topRegional?.label || "-"}</strong>
            </div>
            <div className="analytics-map-snapshot-item">
              <span>Site lider</span>
              <strong>
                {summaryHighlights.topSite?.siteSigla || summaryHighlights.topSite?.siteName || "-"}
              </strong>
            </div>
            <div className="analytics-map-snapshot-item">
              <span>Supervisor em destaque</span>
              <strong>{summaryHighlights.topSupervisor?.label || "-"}</strong>
            </div>
          </div>
        </Paper>

        <Paper className="analytics-map-toolbar" elevation={0}>
          <div className="analytics-map-toolbar-top">
            <Box>
              <Typography variant="h6" className="analytics-map-section-title">
                Governanca do recorte
              </Typography>
              <Typography variant="body2" className="analytics-map-section-subtitle">
                Ajuste o recorte, isole supervisores e gere saidas a partir do intervalo {selectedWindowRangeLabel}.
              </Typography>
            </Box>

            <div className="analytics-map-toolbar-actions">
              <Button
                variant="outlined"
                className="analytics-map-secondary-button"
                startIcon={<RestartAltRoundedIcon />}
                onClick={handleClearFilters}
              >
                Limpar
              </Button>
              <Button
                variant="outlined"
                className="analytics-map-secondary-button"
                startIcon={<PrintRoundedIcon />}
                onClick={handleOpenExecutiveReport}
                disabled={filteredAprs.length === 0}
              >
                Relatorio executivo
              </Button>
              <Button
                variant="outlined"
                className="analytics-map-secondary-button"
                startIcon={<DownloadRoundedIcon />}
                onClick={handleExportSpreadsheet}
                disabled={filteredAprs.length === 0}
              >
                Exportar Excel
              </Button>
              <Button
                variant="contained"
                className="analytics-map-refresh-button"
                startIcon={<RefreshRoundedIcon />}
                onClick={loadAprs}
                disabled={loading}
              >
                {loading ? "Sincronizando..." : "Atualizar agora"}
              </Button>
            </div>
          </div>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" className="analytics-map-periods">
            {PERIOD_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={
                  option.value === "week"
                    ? "7 dias"
                    : option.value === "month"
                      ? "30 dias"
                      : option.value === "year"
                        ? "365 dias"
                        : option.label
                }
                clickable
                color={period === option.value ? "secondary" : "default"}
                variant={period === option.value ? "filled" : "outlined"}
                onClick={() => setPeriod(option.value)}
              />
            ))}
          </Stack>

          <Grid container spacing={2} className="analytics-map-filters-grid">
            {period === "custom" && (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Data inicial"
                    InputLabelProps={{ shrink: true }}
                    value={customRange.startDate}
                    onChange={(event) =>
                      setCustomRange((previous) => ({
                        ...previous,
                        startDate: event.target.value,
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Data final"
                    InputLabelProps={{ shrink: true }}
                    value={customRange.endDate}
                    onChange={(event) =>
                      setCustomRange((previous) => ({
                        ...previous,
                        endDate: event.target.value,
                      }))
                    }
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="analytics-status-label">Status</InputLabel>
                <Select
                  labelId="analytics-status-label"
                  label="Status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {filtersData.statuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="analytics-motivo-label">Motivo</InputLabel>
                <Select
                  labelId="analytics-motivo-label"
                  label="Motivo"
                  value={motivoFilter}
                  onChange={(event) => setMotivoFilter(event.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {filtersData.motivos.map((motivo) => (
                    <MenuItem key={motivo} value={motivo}>
                      {motivo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="analytics-region-label">Regional</InputLabel>
                <Select
                  labelId="analytics-region-label"
                  label="Regional"
                  value={regionalFilter}
                  onChange={(event) => setRegionalFilter(event.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {Object.keys(REGION_MAP).map((regional) => (
                    <MenuItem key={regional} value={regional}>
                      {regional}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="analytics-site-type-label">Tipo de site</InputLabel>
                <Select
                  labelId="analytics-site-type-label"
                  label="Tipo de site"
                  value={siteTypeFilter}
                  onChange={(event) => setSiteTypeFilter(event.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {filtersData.siteTypes.map((siteType) => (
                    <MenuItem key={siteType} value={siteType}>
                      {siteType}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="analytics-supervisor-label">Supervisor</InputLabel>
                <Select
                  labelId="analytics-supervisor-label"
                  label="Supervisor"
                  value={supervisorFilter}
                  onChange={(event) => setSupervisorFilter(event.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {filtersData.supervisors.map((supervisor) => (
                    <MenuItem key={supervisor} value={supervisor}>
                      {supervisor}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={8}>
              <div className="analytics-map-toggle-row">
                <Switch
                  checked={useOpeningLocation}
                  onChange={(event) => setUseOpeningLocation(event.target.checked)}
                />
                <div>
                  <strong>Usar ponto de abertura quando houver</strong>
                  <span>
                    {useOpeningLocation
                      ? "O mapa prioriza a coordenada capturada no momento da APR."
                      : "O mapa prioriza a coordenada oficial do site cadastrado."}
                  </span>
                </div>
              </div>
            </Grid>
          </Grid>

          <div className="analytics-map-report-strip">
            <div className="analytics-map-report-copy">
              <span className="analytics-map-card-kicker">Relatorio do recorte</span>
              <Typography variant="body2">
                {filteredAprs.length} APR(s) prontas para emissao no arquivo filtrado.
              </Typography>
            </div>

            <div className="analytics-map-filter-pills">
              <Chip size="small" label={`Janela: ${selectedWindowLabel}`} />
              {activeFilterPills.length === 0 && (
                <Chip size="small" variant="outlined" label="Sem filtros adicionais" />
              )}
              {activeFilterPills.map((item) => (
                <Chip key={item} size="small" variant="outlined" label={item} />
              ))}
            </div>
          </div>

          {loading && (
            <Box className="analytics-map-progress">
              <Typography variant="body2">
                Sincronizando janela {selectedWindowLabel.toLowerCase()}...
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          )}

          {errorMessage && <Alert severity="warning">{errorMessage}</Alert>}
        </Paper>

        <section className="analytics-map-kpis">
          <Paper className="analytics-map-kpi-card spotlight" elevation={0}>
            <span>APR(s) no período</span>
            <strong>{summary.totalAprs}</strong>
            <small>{selectedWindowLabel} filtrado no painel atual</small>
          </Paper>
          <Paper className="analytics-map-kpi-card" elevation={0}>
            <span>Sites acionados</span>
            <strong>{summary.activeSites}</strong>
            <small>Locais com registro no recorte</small>
          </Paper>
          <Paper className="analytics-map-kpi-card" elevation={0}>
            <span>Supervisores ativos</span>
            <strong>{summary.activeSupervisors}</strong>
            <small>Responsáveis com APR no período</small>
          </Paper>
          <Paper className="analytics-map-kpi-card" elevation={0}>
            <span>Dentro do perímetro</span>
            <strong>{summary.insideRate}%</strong>
            <small>Entre APRs com geolocalização válida</small>
          </Paper>
          <Paper className="analytics-map-kpi-card" elevation={0}>
            <span>Media diaria</span>
            <strong>{operationalInsights.dailyAverageLabel}</strong>
            <small>
              {operationalInsights.peakDay
                ? `Pico de ${operationalInsights.peakDay.value} APR(s) em ${format(
                    operationalInsights.peakDay.date,
                    "dd/MM"
                  )}`
                : "Aguardando base para comparar"}
            </small>
          </Paper>
        </section>

        <section className="analytics-map-main-grid">
          <Paper className="analytics-map-map-card" elevation={0}>
            <div className="analytics-map-card-header">
              <div>
                <span className="analytics-map-card-kicker">Mapa operacional</span>
                <Typography variant="h6">Pulso territorial das APRs</Typography>
              </div>

              <div className="analytics-map-card-meta">
                <Chip
                  size="small"
                  icon={<BoltRoundedIcon />}
                  label={`${mapHotspots.filter((hotspot) => hotspot.isRecent).length} hotspot(s) quentes`}
                />
                <Chip
                  size="small"
                  icon={<PlaceRoundedIcon />}
                  variant="outlined"
                  label={`${mapHotspots.length} marcador(es)`}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={
                    summary.latestApr
                      ? `Última ${formatRelativeTime(getCreatedDate(summary.latestApr))}`
                      : "Sem atividade"
                  }
                />
              </div>
            </div>

            <div className="analytics-map-stage">
              {loading && filteredAprs.length === 0 ? (
                <div className="analytics-map-loading-state">
                  <CircularProgress size={30} />
                  <span>Montando radar territorial...</span>
                </div>
              ) : mapHotspots.length === 0 ? (
                <div className="analytics-map-empty-state">
                  <PublicRoundedIcon />
                  <strong>Nenhum ponto disponível para o recorte atual</strong>
                  <span>Ajuste a janela de tempo ou limpe alguns filtros para voltar a ver o mapa.</span>
                </div>
              ) : (
                <MapContainer
                  center={MAP_CENTER}
                  zoom={4}
                  minZoom={3}
                  scrollWheelZoom
                  className="analytics-map-canvas"
                  maxBounds={MAP_BOUNDS}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <FitMapBounds markers={mapHotspots} />

                  {mapHotspots.map((hotspot) => (
                    <Marker
                      key={hotspot.key}
                      position={hotspot.coordinates}
                      icon={createMarkerIcon(hotspot)}
                    >
                      <Tooltip direction="top" offset={[0, -18]} opacity={1}>
                        <div className="analytics-map-tooltip">
                          <strong>{hotspot.siteName}</strong>
                          <span>
                            {hotspot.count} APR(s) · {formatRelativeTime(hotspot.latestCreatedAt)}
                          </span>
                        </div>
                      </Tooltip>
                      <Popup>
                        <div className="analytics-map-popup">
                          <strong>{hotspot.siteName}</strong>
                          <span>
                            {hotspot.siteName} · {hotspot.siteCity} / {hotspot.siteState}
                          </span>
                          <small>Sigla: {hotspot.siteSigla}</small>
                          <div className="analytics-map-popup-stats">
                            <div>
                              <label>APR(s)</label>
                              <b>{hotspot.count}</b>
                            </div>
                            <div>
                              <label>Supervisores</label>
                              <b>{hotspot.supervisors.length}</b>
                            </div>
                            <div>
                              <label>Última</label>
                              <b>{formatDateTime(hotspot.latestCreatedAt)}</b>
                            </div>
                          </div>
                          <div className="analytics-map-popup-tags">
                            {hotspot.reasons.slice(0, 3).map((reason) => (
                              <span key={reason}>{reason}</span>
                            ))}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </div>
          </Paper>

          <div className="analytics-map-side-column">
            <Paper className="analytics-map-side-card" elevation={0}>
              <div className="analytics-map-card-header compact">
                <div>
                  <span className="analytics-map-card-kicker">Resumo operacional</span>
                  <Typography variant="h6">Leitura rápida</Typography>
                </div>
              </div>

              <div className="analytics-map-summary-stack">
                <div className="analytics-map-summary-callout">
                  <span>Última atividade</span>
                  <strong>
                    {summary.latestApr ? summary.latestApr?.site_id?.Nome || "Site" : "-"}
                  </strong>
                  <small>
                    {summary.latestApr
                      ? `${summary.latestApr?.user_id?.nome || "Sem supervisor"} · ${formatDateTime(
                          getCreatedDate(summary.latestApr)
                        )}`
                      : "Nenhuma APR carregada"}
                  </small>
                </div>

                <div className="analytics-map-summary-grid">
                  <div className="analytics-map-summary-mini">
                    <span>Motivo lider</span>
                    <strong>{summaryHighlights.topMotivo?.label || "-"}</strong>
                    <small>{summaryHighlights.topMotivo?.value || 0} APR(s)</small>
                  </div>
                  <div className="analytics-map-summary-mini">
                    <span>Regional lider</span>
                    <strong>{summaryHighlights.topRegional?.label || "-"}</strong>
                    <small>{summaryHighlights.topRegional?.value || 0} APR(s)</small>
                  </div>
                  <div className="analytics-map-summary-mini">
                    <span>Site lider</span>
                    <strong>
                      {summaryHighlights.topSite?.siteSigla || summaryHighlights.topSite?.siteName || "-"}
                    </strong>
                    <small>{summaryHighlights.topSite?.value || 0} APR(s)</small>
                  </div>
                </div>
              </div>
            </Paper>

            <Paper className="analytics-map-side-card" elevation={0}>
              <div className="analytics-map-card-header compact">
                <div>
                  <span className="analytics-map-card-kicker">Atividade recente</span>
                  <Typography variant="h6">Últimos registros</Typography>
                </div>
                <Chip size="small" label={`${rankings.activityFeed.length} eventos`} />
              </div>

              <div className="analytics-map-activity-feed">
                {rankings.activityFeed.length === 0 && (
                  <div className="analytics-map-list-empty">
                    Nenhuma APR encontrada para o recorte selecionado.
                  </div>
                )}

                {rankings.activityFeed.map((activity) => (
                  <article key={activity.id} className="analytics-map-activity-item">
                    <span className={`activity-dot ${activity.perimeterStatus}`} />
                    <div>
                      <strong>{activity.siteName}</strong>
                      <p>
                        {activity.supervisor} · {activity.motivo}
                      </p>
                      <small>
                        {activity.regional} · {activity.status} · {formatRelativeTime(activity.createdAt)}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
            </Paper>
          </div>
        </section>

        <section className="analytics-map-bottom-grid">
          <Paper className="analytics-map-ranking-card analytics-map-volume-card" elevation={0}>
            <div className="analytics-map-card-header compact">
              <div>
                <span className="analytics-map-card-kicker">Cadencia operacional</span>
                <Typography variant="h6">APR(s) por dia</Typography>
              </div>
              <Chip size="small" label={selectedWindowLabel} />
            </div>

            <div className="analytics-map-volume-summary">
              <div className="analytics-map-volume-stat">
                <span>Media/dia</span>
                <strong>{operationalInsights.dailyAverageLabel}</strong>
              </div>
              <div className="analytics-map-volume-stat">
                <span>Pico diario</span>
                <strong>{operationalInsights.peakDay ? operationalInsights.peakDay.value : 0}</strong>
              </div>
              <div className="analytics-map-volume-stat">
                <span>Data do pico</span>
                <strong>
                  {operationalInsights.peakDay
                    ? format(operationalInsights.peakDay.date, "dd/MM/yyyy")
                    : "-"}
                </strong>
              </div>
            </div>

            <div
              className={`analytics-map-volume-chart ${
                operationalInsights.dailySeries.length <= 3 ? "compact" : ""
              }`}
            >
              {operationalInsights.dailySeries.length === 0 && (
                <div className="analytics-map-list-empty">
                  Nenhuma APR encontrada para montar a cadencia diaria.
                </div>
              )}

              {operationalInsights.dailySeries.map((item) => {
                const barHeight = operationalInsights.maxDailyVolume
                  ? Math.max(10, Math.round((item.value / operationalInsights.maxDailyVolume) * 100))
                  : 0;

                return (
                  <div key={item.key} className="analytics-map-volume-bar-item">
                    <span className="analytics-map-volume-value">{item.value}</span>
                    <div className="analytics-map-volume-bar-track">
                      <div
                        className="analytics-map-volume-bar-fill"
                        style={{ height: `${barHeight}%` }}
                      />
                    </div>
                    <small>{format(item.date, "dd/MM")}</small>
                  </div>
                );
              })}
            </div>
          </Paper>

          <Paper className="analytics-map-ranking-card analytics-map-sites-card" elevation={0}>
            <div className="analytics-map-card-header compact">
              <div>
                <span className="analytics-map-card-kicker">Locais lideres</span>
                <Typography variant="h6">Sites que mais aplicam APR</Typography>
              </div>
              <Chip
                size="small"
                icon={<PlaceRoundedIcon />}
                label={`${operationalInsights.topSites.length} sites`}
              />
            </div>

            <div className="analytics-map-sites-list">
              {operationalInsights.topSites.length === 0 && (
                <div className="analytics-map-list-empty">
                  Nenhum site encontrado para o recorte selecionado.
                </div>
              )}

              {operationalInsights.topSites.map((site, index) => (
                <article key={site.key} className="analytics-map-site-item">
                  <span className="analytics-map-site-rank">#{index + 1}</span>
                  <div className="analytics-map-site-copy">
                    <strong>{site.siteName}</strong>
                    <p>
                      {site.siteCity} / {site.siteState} · {site.regional}
                    </p>
                    <small>{site.value} APR(s) no periodo</small>
                  </div>
                  <div className="analytics-map-site-bar">
                    <div className="analytics-map-site-bar-track">
                      <div
                        className="analytics-map-site-bar-fill"
                        style={{ width: `${site.share}%` }}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Paper>
        </section>

        <Paper className="analytics-map-ranking-card analytics-map-insights-card" elevation={0}>
          <div className="analytics-map-card-header compact">
            <div>
              <span className="analytics-map-card-kicker">Principais leituras</span>
              <Typography variant="h6">Motivo, regional e supervisor</Typography>
            </div>
            <TimelineRoundedIcon />
          </div>

          <section className="analytics-map-rankings-grid">
            <div className="analytics-map-ranking-column">
              <h3>Motivos</h3>
              <div className="analytics-map-ranking-list">
                {rankings.motivos.map((item) => (
                  <div key={item.key} className="analytics-map-ranking-item">
                    <div className="analytics-map-ranking-copy">
                      <strong>{item.label}</strong>
                      <span>{item.value} APR(s)</span>
                    </div>
                    <div className="analytics-map-bar-track">
                      <div className="analytics-map-bar-fill" style={{ width: `${item.share}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-map-ranking-column">
              <h3>Regionais</h3>
              <div className="analytics-map-ranking-list">
                {rankings.regionais.map((item) => (
                  <div key={item.key} className="analytics-map-ranking-item">
                    <div className="analytics-map-ranking-copy">
                      <strong>{item.label}</strong>
                      <span>{item.value} APR(s)</span>
                    </div>
                    <div className="analytics-map-bar-track">
                      <div className="analytics-map-bar-fill alt" style={{ width: `${item.share}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-map-ranking-column">
              <h3>Supervisores</h3>
              <div className="analytics-map-ranking-list">
                {rankings.supervisores.map((item) => (
                  <div key={item.key} className="analytics-map-ranking-item">
                    <div className="analytics-map-ranking-copy">
                      <strong>{item.label}</strong>
                      <span>{item.value} APR(s)</span>
                    </div>
                    <div className="analytics-map-bar-track">
                      <div className="analytics-map-bar-fill warm" style={{ width: `${item.share}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Paper>
      </main>
    </div>
  );
}

