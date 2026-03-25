import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function BarsPage() {
  const [bars, setBars] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [lots, setLots] = useState([]);
  const [form, setForm] = useState({
    lotIds: [], weightGrams: '', purityPercent: '', barNumber: '', smeltDate: new Date().toISOString().slice(0, 16), observations: ''
  });

  const fetchBars = () => {
    setLoading(true);
    api.get('/bars', { params: { page, limit: 15 } })
      .then(res => { setBars(res.data.bars); setTotalPages(res.data.totalPages); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBars(); }, [page]);

  const openModal = () => {
    api.get('/lots', { params: { limit: 100 } })
      .then(res => setLots(res.data.lots))
      .catch(console.error);
    setShowModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/bars', {
        ...form,
        weightGrams: parseFloat(form.weightGrams),
        purityPercent: parseFloat(form.purityPercent),
        barNumber: parseInt(form.barNumber),
      });
      setShowModal(false);
      setForm({ lotIds: [], weightGrams: '', purityPercent: '', barNumber: '', smeltDate: new Date().toISOString().slice(0, 16), observations: '' });
      toast.success('Barra registrada exitosamente');
      fetchBars();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al registrar barra');
    }
  };

  const toggleLot = (lotId) => {
    setForm(prev => ({
      ...prev,
      lotIds: prev.lotIds.includes(lotId)
        ? prev.lotIds.filter(id => id !== lotId)
        : [...prev.lotIds, lotId]
    }));
  };

  return (
    <div>
      <div className="page-header">
        <h2>Barras de Oro</h2>
        <p>Registro de barras producidas en fundición</p>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openModal}>+ Nueva Barra</button>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : bars.length === 0 ? (
        <div className="empty-state"><div className="icon">🪙</div><p>No hay barras registradas</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th># Barra</th>
                <th>Peso (g)</th>
                <th>Pureza (%)</th>
                <th>Fundidor</th>
                <th>Lotes Origen</th>
                <th>Fecha</th>
                <th>Alerta</th>
              </tr>
            </thead>
            <tbody>
              {bars.map(b => (
                <tr key={b.id}>
                  <td className="code">{b.barCode}</td>
                  <td>{b.barNumber}</td>
                  <td>{parseFloat(b.weightGrams).toLocaleString('es-CO')}</td>
                  <td>{b.purityPercent}%</td>
                  <td>{b.smelter?.fullName || '-'}</td>
                  <td>{b.sourceLots?.map(l => l.code).join(', ') || '-'}</td>
                  <td>{new Date(b.smeltDate).toLocaleDateString('es-CO')}</td>
                  <td>
                    {b.hasWeightAlert
                      ? <span className="badge badge-danger">⚠️ Alerta</span>
                      : <span className="badge badge-success">✓ OK</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>Página {page} de {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Siguiente →</button>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Registrar Nueva Barra</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Lotes de Origen *</label>
                  <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
                    {lots.map(l => (
                      <label key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <input type="checkbox" checked={form.lotIds.includes(l.id)} onChange={() => toggleLot(l.id)} />
                        <span className="code">{l.code}</span> — {l.mineName} ({l.grossWeightGrams}g)
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Peso de la Barra (g) *</label>
                    <input type="number" step="0.001" className="form-input" value={form.weightGrams} onChange={e => setForm({...form, weightGrams: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pureza (%) *</label>
                    <input type="number" step="0.001" className="form-input" value={form.purityPercent} onChange={e => setForm({...form, purityPercent: e.target.value})} required placeholder="Ej: 99.5" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Número de Barra *</label>
                    <input type="number" className="form-input" value={form.barNumber} onChange={e => setForm({...form, barNumber: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha de Fundición *</label>
                    <input type="datetime-local" className="form-input" value={form.smeltDate} onChange={e => setForm({...form, smeltDate: e.target.value})} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Observaciones</label>
                  <textarea className="form-textarea" value={form.observations} onChange={e => setForm({...form, observations: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Barra</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
