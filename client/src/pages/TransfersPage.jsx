import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

export default function TransfersPage() {
  // Función para obtener los traspasos
  const [transfers, setTransfers] = useState([]); // Estado para almacenar los traspasos
  const [page, setPage] = useState(1); // Estado para almacenar la página actual
  const [totalPages, setTotalPages] = useState(1); // Estado para almacenar el total de páginas
  const [loading, setLoading] = useState(true); // Estado para indicar si se está cargando
  const [showModal, setShowModal] = useState(false); // Estado para mostrar el modal
  const [users, setUsers] = useState([]); // Estado para almacenar los usuarios
  const [lots, setLots] = useState([]); // Estado para almacenar los lotes
  const [form, setForm] = useState({
    // Estado para almacenar el formulario de traspasos
    lotId: "",
    barId: "",
    receiverId: "",
    weightGrams: "", // Peso en gramos
    latitude: "",
    longitude: "",
    observations: "",
  });

  const fetchTransfers = () => {
    // Función para obtener los traspasos
    setLoading(true); // Establece el estado de carga a true
    api
      .get("/transfers", { params: { page, limit: 15 } }) // Obtiene los traspasos
      .then((res) => {
        setTransfers(res.data.transfers);
        setTotalPages(res.data.totalPages);
      }) // Almacena los traspasos y el total de páginas
      .catch(console.error) // Maneja los errores
      .finally(() => setLoading(false)); // Establece el estado de carga a false
  };

  useEffect(() => {
    fetchTransfers();
  }, [page]); // Hook para obtener los traspasos

  const openModal = () => {
    // Función para abrir el modal
    Promise.all([
      api.get("/users").catch(() => ({ data: [] })),
      api.get("/lots", { params: { limit: 100 } }),
    ]).then(([usersRes, lotsRes]) => {
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setLots(lotsRes.data.lots || []);
    });
    setShowModal(true);
  };

  const handleCreate = async (e) => {
    // Función para crear un traspaso
    e.preventDefault(); // Previene el comportamiento por defecto del formulario
    try {
      await api.post("/transfers", {
        // Envía la solicitud para crear un traspaso
        lotId: form.lotId || null, // Id del lote
        barId: form.barId || null, // Id de la barra
        receiverId: form.receiverId, // Id del receptor
        weightGrams: parseFloat(form.weightGrams), // Peso en gramos
        latitude: form.latitude ? parseFloat(form.latitude) : null, // Latitud
        longitude: form.longitude ? parseFloat(form.longitude) : null, // Longitud
        observations: form.observations || null, // Observaciones
      });
      setShowModal(false); // Cierra el modal
      setForm({
        lotId: "",
        barId: "",
        receiverId: "",
        weightGrams: "",
        latitude: "",
        longitude: "",
        observations: "",
      }); // Limpia el formulario
      toast.success("Traspaso registrado exitosamente"); // Muestra un mensaje de éxito
      fetchTransfers(); // Obtiene los traspasos
    } catch (err) {
      alert(err.response?.data?.error || "Error al registrar traspaso"); // Maneja los errores
    }
  };

  const signTransfer = async (id) => {
    // Función para firmar un traspaso
    try {
      await api.patch(`/transfers/${id}/sign`); // Envía la solicitud para firmar un traspaso
      fetchTransfers(); // Obtiene los traspasos
    } catch (err) {
      alert(err.response?.data?.error || "Error al firmar traspaso"); // Maneja los errores
    }
  };

  const downloadPdf = async (id) => {
    try {
      const response = await api.get(`/transfers/${id}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `guia-traspaso-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Error al descargar el PDF");
      console.error(error);
    }
  };

  const statusBadge = (status) => {
    // Función para obtener el badge correspondiente al estado
    const map = {
      // Mapa de estados
      pendiente: { cls: "badge-warning", label: "Pendiente" }, // Estado pendiente
      firmado: { cls: "badge-info", label: "Firmado" }, // Estado firmado
      completado: { cls: "badge-success", label: "Completado" }, // Estado completado
    };
    const s = map[status] || { cls: "badge-neutral", label: status }; // Obtiene el badge correspondiente al estado
    return <span className={`badge ${s.cls}`}>{s.label}</span>; // Retorna el badge
  };

  return (
    <div>
      <div className="page-header">
        <h2>Traspasos de Custodia</h2>
        <p>Cadena de custodia y guías de movilización</p>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openModal}>
            + Nuevo Traspaso
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : transfers.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🔄</div>
          <p>No hay traspasos registrados</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Lote/Barra</th>
                <th>Entrega</th>
                <th>Recibe</th>
                <th>Peso (g)</th>
                <th>Estado</th>
                <th>Alerta</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map(
                (
                  t, // Mapea los traspasos
                ) => (
                  <tr key={t.id}>
                    <td className="code">
                      {t.lot?.code || t.bar?.barCode || "-"}
                    </td>
                    <td>{t.sender?.fullName || "-"}</td>
                    <td>{t.receiver?.fullName || "-"}</td>
                    <td>{parseFloat(t.weightGrams).toLocaleString("es-CO")}</td>
                    <td>{statusBadge(t.status)}</td>
                    <td>
                      {t.hasWeightAlert ? (
                        <span
                          className="badge badge-danger"
                          title={t.alertMessage}
                        >
                          ⚠️
                        </span>
                      ) : (
                        <span className="badge badge-success">✓</span>
                      )}
                    </td>
                    <td>{new Date(t.createdAt).toLocaleDateString("es-CO")}</td>
                    <td>
                      <div className="flex gap-1">
                        {t.status === "pendiente" && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => signTransfer(t.id)}
                          >
                            ✍️ Firmar
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => downloadPdf(t.id)}
                        >
                          📄 PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ← Anterior
          </button>
          <span className="text-muted" style={{ fontSize: "0.85rem" }}>
            Página {page} de {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Registrar Traspaso de Custodia</h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Lote</label>
                  <select
                    className="form-select"
                    value={form.lotId}
                    onChange={(e) =>
                      setForm({ ...form, lotId: e.target.value })
                    }
                  >
                    <option value="">Seleccionar lote...</option>
                    {lots.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.code} — {l.mineName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Receptor *</label>
                  <select
                    className="form-select"
                    value={form.receiverId}
                    onChange={(e) =>
                      setForm({ ...form, receiverId: e.target.value })
                    }
                    required
                  >
                    <option value="">Seleccionar receptor...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Peso Registrado (g) *</label>
                  <input
                    type="number"
                    step="0.001"
                    className="form-input"
                    value={form.weightGrams}
                    onChange={(e) =>
                      setForm({ ...form, weightGrams: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Latitud GPS</label>
                    <input
                      type="number"
                      step="0.0000001"
                      className="form-input"
                      value={form.latitude}
                      onChange={(e) =>
                        setForm({ ...form, latitude: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitud GPS</label>
                    <input
                      type="number"
                      step="0.0000001"
                      className="form-input"
                      value={form.longitude}
                      onChange={(e) =>
                        setForm({ ...form, longitude: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Observaciones</label>
                  <textarea
                    className="form-textarea"
                    value={form.observations}
                    onChange={(e) =>
                      setForm({ ...form, observations: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar Traspaso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
