import { useState, useEffect } from "react";
import api from "../services/api";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );

  const statusLabels = {
    pendiente: "Pendiente",
    firmado: "Firmado",
    completado: "Completado",
  };

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Vista general de las operaciones de trazabilidad</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">⛏️</div>
          <div className="stat-value">{data?.activeLots || 0}</div>
          <div className="stat-label">Lotes activos</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚖️</div>
          <div className="stat-value">
            {((data?.goldInTransitGrams || 0) / 1000).toFixed(2)}
          </div>
          <div className="stat-label">Kg de oro en tránsito</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🪙</div>
          <div className="stat-value">{data?.totalBars || 0}</div>
          <div className="stat-label">Barras producidas</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value">{data?.pendingAlerts || 0}</div>
          <div className="stat-label">Alertas pendientes</div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.25rem",
        }}
      >
        {/* Monthly Production */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📈 Producción del Mes</h3>
          </div>
          <div style={{ display: "flex", gap: "2rem" }}>
            <div>
              <div className="stat-value" style={{ fontSize: "1.5rem" }}>
                {data?.monthly?.lots || 0}
              </div>
              <div className="stat-label">Lotes registrados</div>
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: "1.5rem" }}>
                {((data?.monthly?.grossWeightGrams || 0) / 1000).toFixed(2)}
              </div>
              <div className="stat-label">Kg peso bruto</div>
            </div>
          </div>
        </div>

        {/* Recent Transfers */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🔄 Últimos Traspasos</h3>
          </div>
          {data?.recentTransfers?.length > 0 ? (
            <div className="timeline">
              {data.recentTransfers.map((t) => (
                <div key={t.id} className="timeline-item">
                  <div className="timeline-item-date">
                    {new Date(t.createdAt).toLocaleString("es-CO")}
                  </div>
                  <div className="timeline-item-content">
                    <strong>{t.sender?.fullName}</strong>
                    {" → "}
                    <strong>{t.receiver?.fullName}</strong>
                    <br />
                    <span
                      className="text-muted"
                      style={{ fontSize: "0.78rem" }}
                    >
                      {t.lot?.code || "Barra"} • {t.weightGrams}g •{" "}
                      <span
                        className={`badge badge-${t.status === "completado" ? "success" : "warning"}`}
                      >
                        {statusLabels[t.status] || t.status}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No hay traspasos registrados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
