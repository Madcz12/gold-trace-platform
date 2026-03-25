import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function LotDetailPage() { // Función para obtener los detalles de un lote
  const { id } = useParams(); // Obtiene el id del lote de los parámetros de la ruta
  const navigate = useNavigate(); // Navega a la página de lotes
  const [lot, setLot] = useState(null); // Estado para almacenar el lote
  const [loading, setLoading] = useState(true); // Estado para indicar si se está cargando el lote
  const [showSampleModal, setShowSampleModal] = useState(false); // Estado para mostrar el modal de muestras
  const [sampleForm, setSampleForm] = useState({ // Estado para almacenar el formulario de muestras
    dryWeightGrams: '', moisturePercent: '', gradeGramsPerTon: '', observations: '',
  });

  useEffect(() => { // Hook para obtener los detalles del lote  
    api.get(`/lots/${id}`) // Obtiene los detalles del lote
      .then(res => setLot(res.data)) // Almacena los detalles del lote
      .catch(() => navigate('/lots')) // Navega a la página de lotes si hay un error
      .finally(() => setLoading(false)); // Establece el estado de carga a false
  }, [id]);

  const handleAddSample = async (e) => { // Función para agregar una muestra
    e.preventDefault(); // Previene el comportamiento por defecto del formulario
    try {
      await api.post(`/lots/${id}/samples`, { // Envía la solicitud para agregar una muestra
        dryWeightGrams: parseFloat(sampleForm.dryWeightGrams), // Peso seco en gramos
        moisturePercent: sampleForm.moisturePercent ? parseFloat(sampleForm.moisturePercent) : null, // Porcentaje de humedad
        gradeGramsPerTon: parseFloat(sampleForm.gradeGramsPerTon), // Ley en gramos por tonelada
        observations: sampleForm.observations || null, // Observaciones
      });
      setShowSampleModal(false); // Cierra el modal de muestras
      setSampleForm({ dryWeightGrams: '', moisturePercent: '', gradeGramsPerTon: '', observations: '' }); // Limpia el formulario de muestras
      // Refresh
      const res = await api.get(`/lots/${id}`); // Obtiene los detalles del lote
      setLot(res.data); // Almacena los detalles del lote
    } catch (err) {
      alert(err.response?.data?.error || 'Error al registrar muestra');
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!lot) return null;

  const statusBadge = (status) => {   
    const map = { 
      registrado: { cls: 'badge-info', label: 'Registrado' },
      muestreado: { cls: 'badge-gold', label: 'Muestreado' },
      fundido: { cls: 'badge-warning', label: 'Fundido' },
      en_transito: { cls: 'badge-info', label: 'En Tránsito' },
      entregado: { cls: 'badge-success', label: 'Entregado' },
      vendido: { cls: 'badge-neutral', label: 'Vendido' },
    };
    const s = map[status] || { cls: 'badge-neutral', label: status }; // Obtiene el badge correspondiente al estado
    return <span className={`badge ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/lots')}>← Volver</button>
          <h2>Lote {lot.code}</h2>
        </div>
        <p>{lot.mineName} • {statusBadge(lot.status)}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Info Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Información del Lote</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <div className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Código</div>
              <div className="code" style={{ fontSize: '1rem' }}>{lot.code}</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Peso Bruto</div>
              <div>{parseFloat(lot.grossWeightGrams).toLocaleString('es-CO')} g</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Oro Fino Estimado</div>
              <div className="text-gold" style={{ fontWeight: 700 }}>{parseFloat(lot.estimatedFineGold || 0).toFixed(4)} g</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Fecha Extracción</div>
              <div>{new Date(lot.extractionDate).toLocaleString('es-CO')}</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Operador</div>
              <div>{lot.operator?.fullName || '-'}</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Custodio Actual</div>
              <div>{lot.currentCustodian?.fullName || '-'}</div>
            </div>
            {lot.latitude && (
              <div>
                <div className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>GPS</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{lot.latitude}, {lot.longitude}</div>
              </div>
            )}
            {lot.observations && (
              <div style={{ gridColumn: '1/-1' }}>
                <div className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Observaciones</div>
                <div>{lot.observations}</div>
              </div>
            )}
          </div>
        </div>

        {/* QR Code Card */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="card-header">
            <h3 className="card-title">Código QR</h3>
          </div>
          {lot.qrCode && (
            <div className="qr-container">
              <img src={lot.qrCode} alt={`QR ${lot.code}`} style={{ width: 180, height: 180 }} />
            </div>
          )}
          <p className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>{lot.code}</p>
        </div>
      </div>

      {/* Samples Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">🧪 Muestras y Análisis</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowSampleModal(true)}>
            + Agregar Muestra
          </button>
        </div>
        {lot.samples?.length > 0 ? ( // Si hay muestras, muestra la tabla
          <table className="data-table">
            <thead>
              <tr>
                <th>Peso Seco (g)</th>
                <th>Humedad (%)</th>
                <th>Ley (g/t)</th>
                <th>Oro Fino (g)</th>
                <th>Técnico</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {lot.samples.map(s => ( // Mapea cada muestra a una fila de la tabla
                <tr key={s.id}>
                  <td>{parseFloat(s.dryWeightGrams).toLocaleString('es-CO')}</td>
                  <td>{s.moisturePercent ? `${s.moisturePercent}%` : '-'}</td>
                  <td>{parseFloat(s.gradeGramsPerTon).toFixed(4)}</td>
                  <td className="text-gold" style={{ fontWeight: 600 }}>{parseFloat(s.fineGoldGrams).toFixed(6)}</td>
                  <td>{s.technician?.fullName || '-'}</td>
                  <td>{new Date(s.createdAt).toLocaleDateString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state"><p>No hay muestras registradas</p></div>
        )}
      </div>

      {/* Custody History */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">🔗 Cadena de Custodia</h3>
        </div>
        {lot.transfers?.length > 0 ? (
          <div className="timeline">
            {lot.transfers.map(t => (
              <div key={t.id} className="timeline-item">
                <div className="timeline-item-date">
                  {new Date(t.createdAt).toLocaleString('es-CO')}
                </div>
                <div className="timeline-item-content">
                  <strong>{t.sender?.fullName}</strong> → <strong>{t.receiver?.fullName}</strong>
                  <br />
                  <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                    {t.weightGrams}g •{' '}
                    <span className={`badge badge-${t.status === 'completado' ? 'success' : 'warning'}`}>
                      {t.status === 'completado' ? 'Completado' : 'Pendiente'}
                    </span>
                    {t.hasWeightAlert && <span className="badge badge-danger ml-1">⚠️ Alerta de peso</span>}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><p>Sin traspasos registrados</p></div>
        )}
      </div>

      {/* Bars */}
      {lot.bars?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🪙 Barras Producidas</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Peso (g)</th>
                <th>Pureza (%)</th>
                <th>Fecha Fundición</th>
              </tr>
            </thead>
            <tbody>
              {lot.bars.map(b => (
                <tr key={b.id}>
                  <td className="code">{b.barCode}</td>
                  <td>{parseFloat(b.weightGrams).toLocaleString('es-CO')}</td>
                  <td>{b.purityPercent}%</td>
                  <td>{new Date(b.smeltDate).toLocaleDateString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Sample Modal */}
      {showSampleModal && ( // Muestra el modal de muestras
        <div className="modal-backdrop" onClick={() => setShowSampleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Agregar Muestra — {lot.code}</h3>
              <button className="modal-close" onClick={() => setShowSampleModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddSample}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Peso Seco (g) *</label>
                    <input type="number" step="0.001" className="form-input" value={sampleForm.dryWeightGrams} onChange={e => setSampleForm({...sampleForm, dryWeightGrams: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Humedad (%)</label>
                    <input type="number" step="0.01" className="form-input" value={sampleForm.moisturePercent} onChange={e => setSampleForm({...sampleForm, moisturePercent: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Ley del Mineral (g/t) *</label>
                  <input type="number" step="0.0001" className="form-input" value={sampleForm.gradeGramsPerTon} onChange={e => setSampleForm({...sampleForm, gradeGramsPerTon: e.target.value})} required />
                  <small className="text-muted">Gramos de oro por tonelada de mineral</small>
                </div>
                <div className="form-group">
                  <label className="form-label">Observaciones</label>
                  <textarea className="form-textarea" value={sampleForm.observations} onChange={e => setSampleForm({...sampleForm, observations: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSampleModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Muestra</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
