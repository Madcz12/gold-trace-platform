import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function LotsPage() {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    extractionDate: new Date().toISOString().slice(0, 16),
    mineName: '',
    grossWeightGrams: '',
    latitude: '',
    longitude: '',
    workShift: 'morning',
    observations: '',
  });

  const fetchLots = () => {
    setLoading(true);
    api.get('/lots', { params: { page, search, limit: 15 } })
      .then(res => {
        setLots(res.data.lots);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLots(); }, [page, search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/lots', {
        ...form,
        grossWeightGrams: parseFloat(form.grossWeightGrams),
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      });
      setShowModal(false);
      setForm({ extractionDate: new Date().toISOString().slice(0, 16), mineName: '', grossWeightGrams: '', latitude: '', longitude: '', workShift: 'morning', observations: '' });
      toast.success('Lote registrado exitosamente');
      fetchLots();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al crear lote');
    }
  };

  const statusBadge = (status) => {
    const map = {
      registrado: { cls: 'badge-info', label: 'Registrado' },
      muestreado: { cls: 'badge-gold', label: 'Muestreado' },
      fundido: { cls: 'badge-warning', label: 'Fundido' },
      en_transito: { cls: 'badge-info', label: 'En Tránsito' },
      entregado: { cls: 'badge-success', label: 'Entregado' },
      vendido: { cls: 'badge-neutral', label: 'Vendido' },
    };
    const s = map[status] || { cls: 'badge-neutral', label: status };
    return <span className={`badge ${s.cls}`}>{s.label}</span>;
  };

  const shiftLabels = { morning: 'Mañana', afternoon: 'Tarde', night: 'Noche' };

  return (
    <div>
      <div className="page-header">
        <h2>Lotes de Mineral</h2>
        <p>Registro y seguimiento de lotes extraídos — {total} lotes en total</p>
        <div className="page-header-actions">
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por código o mina..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ maxWidth: 300 }}
          />
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Nuevo Lote
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : lots.length === 0 ? (
        <div className="empty-state">
          <div className="icon">⛏️</div>
          <p>No hay lotes registrados</p>
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Mina</th>
                  <th>Peso Bruto (g)</th>
                  <th>Operador</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lots.map(lot => (
                  <tr key={lot.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/lots/${lot.id}`)}>
                    <td className="code">{lot.code}</td>
                    <td>{lot.mineName}</td>
                    <td>{parseFloat(lot.grossWeightGrams).toLocaleString('es-CO')}</td>
                    <td>{lot.operator?.fullName || '-'}</td>
                    <td>{new Date(lot.extractionDate).toLocaleDateString('es-CO')}</td>
                    <td>{statusBadge(lot.status)}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/lots/${lot.id}`); }}>
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                Página {page} de {totalPages}
              </span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Siguiente →</button>
            </div>
          )}
        </>
      )}

      {/* Create Lot Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Registrar Nuevo Lote</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre de la Mina *</label>
                  <input className="form-input" value={form.mineName} onChange={e => setForm({...form, mineName: e.target.value})} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Peso Bruto (gramos) *</label>
                    <input type="number" step="0.001" className="form-input" value={form.grossWeightGrams} onChange={e => setForm({...form, grossWeightGrams: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Turno</label>
                    <select className="form-select" value={form.workShift} onChange={e => setForm({...form, workShift: e.target.value})}>
                      <option value="morning">Mañana</option>
                      <option value="afternoon">Tarde</option>
                      <option value="night">Noche</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha y Hora de Extracción *</label>
                  <input type="datetime-local" className="form-input" value={form.extractionDate} onChange={e => setForm({...form, extractionDate: e.target.value})} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Latitud GPS</label>
                    <input type="number" step="0.0000001" className="form-input" value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})} placeholder="Ej: 6.2518" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitud GPS</label>
                    <input type="number" step="0.0000001" className="form-input" value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})} placeholder="Ej: -75.5636" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Observaciones</label>
                  <textarea className="form-textarea" value={form.observations} onChange={e => setForm({...form, observations: e.target.value})} placeholder="Observaciones adicionales..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Lote</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
