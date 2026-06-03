import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiRefreshCw,
  FiTrash2,
  FiWifiOff,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { AuthContext } from "../../contexts/auth";
import {
  buildOfflineAprEditUrl,
  clearOfflineAprEditSession,
  getUserOfflineAprs,
  removeOfflineAprRecord,
  setOfflineAprEditSession,
} from "../../services/offlineAprStorage";

const panelStyles = {
  wrapper: {
    margin: "0 0 20px",
    padding: "18px 18px 16px",
    borderRadius: "18px",
    border: "1px solid rgba(148, 163, 184, 0.22)",
    background: "#ffffff",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
  },
  bannerOffline: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px",
    padding: "12px 14px",
    borderRadius: "10px",
    background: "#fff7ed",
    color: "#9a3412",
    border: "1px solid #fdba74",
  },
  bannerPending: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px",
    padding: "12px 14px",
    borderRadius: "10px",
    background: "linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)",
    color: "#1d4ed8",
    border: "1px solid #a8c9ff",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },
  titleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  button: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#334155",
    borderRadius: "10px",
    padding: "9px 14px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.9rem",
    fontWeight: 600,
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
  },
  syncButton: {
    borderColor: "#8bb8ff",
    color: "#1d4ed8",
  },
  deleteButton: {
    borderColor: "#fecaca",
    color: "#b91c1c",
  },
  list: {
    display: "grid",
    gap: "10px",
  },
  item: {
    border: "1px solid #dde7f3",
    borderRadius: "14px",
    padding: "16px 14px",
    background: "linear-gradient(180deg, #fbfdff 0%, #f6f9fc 100%)",
  },
  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "10px",
  },
  itemMeta: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    color: "#64748b",
    fontSize: "0.85rem",
  },
  itemActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "10px",
  },
};

export default function OfflineAPRsPanel() {
  const { user } = useContext(AuthContext);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineAPRs, setOfflineAPRs] = useState([]);

  const refreshOfflineAprs = () => {
    setOfflineAPRs(getUserOfflineAprs(user?.uid));
  };

  useEffect(() => {
    refreshOfflineAprs();

    const handleOnline = () => {
      setIsOffline(false);
      refreshOfflineAprs();
    };

    const handleOffline = () => {
      setIsOffline(true);
      refreshOfflineAprs();
    };

    const handleStorage = () => refreshOfflineAprs();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("storage", handleStorage);
    };
  }, [user?.uid]);

  const hasPendingAprs = offlineAPRs.length > 0;

  const summaryText = useMemo(() => {
    if (!hasPendingAprs) {
      return "Nenhuma APR offline pendente.";
    }

    return `${offlineAPRs.length} APR${offlineAPRs.length > 1 ? "s" : ""} aguardando sincronização.`;
  }, [hasPendingAprs, offlineAPRs.length]);

  const openOfflineApr = (aprData, autoSync = false) => {
    setOfflineAprEditSession(aprData);
    const editUrl = buildOfflineAprEditUrl(aprData, { autoSync });
    window.location.href = editUrl;
  };

  const handleSync = (aprData) => {
    if (isOffline) {
      toast.warning("Sem conexão. A sincronização será liberada quando a internet voltar.");
      return;
    }

    clearOfflineAprEditSession();
    toast.info("Abrindo APR offline para sincronização.");
    openOfflineApr(aprData, true);
  };

  const handleEdit = (aprData) => {
    toast.info("Abrindo APR offline para edição.");
    openOfflineApr(aprData, false);
  };

  const handleDelete = (aprData) => {
    const confirmed = window.confirm(
      `Remover a APR offline "${aprData.motivoAPR || aprData.siteInfo?.Sigla || aprData.id}"?`
    );

    if (!confirmed) {
      return;
    }

    removeOfflineAprRecord(aprData.id);
    refreshOfflineAprs();
    toast.success("APR offline removida.");
  };

  if (!isOffline && !hasPendingAprs) {
    return null;
  }

  return (
    <div style={panelStyles.wrapper}>
      {isOffline ? (
        <div style={panelStyles.bannerOffline}>
          <FiWifiOff size={18} />
          <span>Modo offline ativo. Novas APRs serão guardadas localmente.</span>
        </div>
      ) : hasPendingAprs ? (
        <div style={panelStyles.bannerPending}>
          <FiCheckCircle size={18} />
          <span>{summaryText}</span>
        </div>
      ) : null}

      <div style={panelStyles.header}>
        <div style={panelStyles.titleGroup}>
          <FiAlertCircle size={18} color="#1e293b" />
          <div>
            <strong style={{ display: "block", color: "#0f172a" }}>APRs Offline</strong>
            <span style={{ color: "#64748b", fontSize: "0.9rem" }}>{summaryText}</span>
          </div>
        </div>
        {hasPendingAprs && (
          <div style={panelStyles.actions}>
            <button
              type="button"
              style={{ ...panelStyles.button, ...panelStyles.syncButton }}
              onClick={() => {
                if (offlineAPRs.length > 0) {
                  handleSync(offlineAPRs[0]);
                }
              }}
            >
              <FiRefreshCw size={15} />
              Sincronizar
            </button>
          </div>
        )}
      </div>

      {hasPendingAprs && (
        <div style={panelStyles.list}>
          {offlineAPRs.map((aprData) => (
            <div key={aprData.id} style={panelStyles.item}>
              <div style={panelStyles.itemTop}>
                <div>
                  <strong style={{ display: "block", color: "#0f172a" }}>
                    {aprData.siteInfo?.Sigla || aprData.siteInfo?.Nome || "Site não identificado"}
                  </strong>
                  <span style={{ color: "#334155" }}>
                    {aprData.motivoAPR || "APR sem motivo informado"}
                  </span>
                </div>
                <div style={panelStyles.itemMeta}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <FiClock size={14} />
                    {new Date(aprData.timestamp || Date.now()).toLocaleString("pt-BR")}
                  </span>
                  <span>{isOffline ? "Offline" : "Pendente"}</span>
                </div>
              </div>

              <div style={panelStyles.itemActions}>
                <button type="button" style={panelStyles.button} onClick={() => handleEdit(aprData)}>
                  <FiEdit2 size={15} />
                  Editar
                </button>
                <button
                  type="button"
                  style={{ ...panelStyles.button, ...panelStyles.syncButton }}
                  onClick={() => handleSync(aprData)}
                  disabled={isOffline}
                >
                  <FiRefreshCw size={15} />
                  Sincronizar
                </button>
                <button
                  type="button"
                  style={{ ...panelStyles.button, ...panelStyles.deleteButton }}
                  onClick={() => handleDelete(aprData)}
                >
                  <FiTrash2 size={15} />
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
