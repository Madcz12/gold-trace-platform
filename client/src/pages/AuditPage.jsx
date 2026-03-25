import { useState } from 'react';
import api from '../services/api';

export default function AuditPage() {
  const [verifyResult, setVerifyResult] = useState(null); // Estado para almacenar el resultado de la verificación
  const [verifying, setVerifying] = useState(false); // Estado para indicar si se está verificando
  const [logs, setLogs] = useState([]); // Estado para almacenar los logs de auditoría
  const [logsPage, setLogsPage] = useState(1); // Estado para almacenar la página actual de los logs
  const [logsTotalPages, setLogsTotalPages] = useState(1); // Estado para almacenar el número total de páginas de los logs
  const [logsLoading, setLogsLoading] = useState(false); // Estado para indicar si se están cargando los logs
  const [hashRecords, setHashRecords] = useState([]); // Estado para almacenar los registros de la cadena de hashes
  const [tab, setTab] = useState('verify'); // Estado para almacenar la pestaña activa

  const runVerification = async () => { // Función para ejecutar la verificación
    setVerifying(true); // Establece el estado de verificación a true
    try {
      const res = await api.get('/audit/verify'); // Obtiene el resultado de la verificación
      setVerifyResult(res.data); // Almacena el resultado de la verificación
    } catch (err) {
      alert('Error al verificar cadena de integridad'); // Muestra un mensaje de error
    } finally {
      setVerifying(false); // Establece el estado de verificación a false
    }
  };

  const fetchLogs = async (p = 1) => { // Función para obtener los logs de auditoría
    setLogsLoading(true); // Establece el estado de carga de los logs a true
    try {
      const res = await api.get('/audit/logs', { params: { page: p, limit: 30 } }); // Obtiene los logs de auditoría
      setLogs(res.data.logs); // Almacena los logs de auditoría
      setLogsPage(res.data.page); // Almacena la página actual de los logs
      setLogsTotalPages(res.data.totalPages); // Almacena el número total de páginas de los logs
    } catch (err) {
      console.error(err); // Muestra un mensaje de error
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchHashRecords = async () => { // Función para obtener los registros de la cadena de hashes
    try {
      const res = await api.get('/audit/hash-records', { params: { limit: 30 } }); // Obtiene los registros de la cadena de hashes
      setHashRecords(res.data.records); // Almacena los registros de la cadena de hashes
    } catch (err) {
      console.error(err); // Muestra un mensaje de error
    }
  };

  const handleTabChange = (newTab) => { // Función para cambiar de pestaña
    setTab(newTab); // Establece la pestaña activa
    if (newTab === 'logs' && logs.length === 0) fetchLogs(); // Si la pestaña es logs y no hay logs, obtiene los logs
    if (newTab === 'chain' && hashRecords.length === 0) fetchHashRecords(); // Si la pestaña es chain y no hay registros, obtiene los registros
  };

  return (
    <div>
      <div className="page-header">
        <h2>Auditoría e Integridad</h2>
        <p>Verificación de la cadena de hashes y logs de auditoría</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}> 
        {[
          { key: 'verify', label: '🔒 Verificación' },
          { key: 'logs', label: '📋 Audit Logs' },
          { key: 'chain', label: '🔗 Hash Chain' },
        ].map(t => (
          <button key={t.key} className={`btn ${tab === t.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleTabChange(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Verify Tab */}
      {tab === 'verify' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Verificación de Integridad de la Cadena</h3>
            <button className="btn btn-primary" onClick={runVerification} disabled={verifying}>
              {verifying ? 'Verificando...' : '🔍 Ejecutar Verificación'}
            </button>
          </div>

          {verifyResult && (
            <div style={{ marginTop: '1rem' }}>
              <div className={`integrity-badge ${verifyResult.valid ? 'integrity-valid' : 'integrity-invalid'}`} style={{ fontSize: '1rem', padding: '0.75rem 1.5rem', marginBottom: '1rem' }}>
                {verifyResult.valid ? '✅ Cadena íntegra' : '❌ Cadena comprometida'}
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Registros verificados: <strong>{verifyResult.records}</strong>
              </p>
              {verifyResult.errors?.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Errores encontrados:</h4>
                  {verifyResult.errors.map((err, i) => (
                    <div key={i} className="alert alert-danger">{err.message}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!verifyResult && !verifying && (
            <div className="empty-state">
              <div className="icon">🔒</div>
              <p>Haga clic en &quot;Ejecutar Verificación&quot; para validar la integridad de todos los registros</p>
            </div>
          )}
        </div>
      )}

      {/* Audit Logs Tab */}
      {tab === 'logs' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {logsLoading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td>{new Date(l.createdAt).toLocaleString('es-CO')}</td> {/* Fecha y hora de la acción */}
                    <td>{l.user?.fullName || '-'}</td> {/* Nombre del usuario que realizó la acción */}
                    <td><span className="badge badge-gold">{l.action}</span></td> {/* Acción realizada */}
                    <td className="text-muted">{l.entityType || '-'}</td> {/* Entidad afectada */}
                    <td className="text-muted" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{l.ipAddress || '-'}</td> {/* Dirección IP del usuario */}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {logsTotalPages > 1 && ( /* Paginación */
            <div className="pagination" style={{ padding: '1rem' }}>
              <button disabled={logsPage === 1} onClick={() => fetchLogs(logsPage - 1)}>← Anterior</button>
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>Página {logsPage} de {logsTotalPages}</span>
              <button disabled={logsPage === logsTotalPages} onClick={() => fetchLogs(logsPage + 1)}>Siguiente →</button>
            </div>
          )}
        </div>
      )}

      {/* Hash Chain Tab */}
      {tab === 'chain' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Entidad</th>
                <th>Acción</th>
                <th>Data Hash</th>
                <th>Combined Hash</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {hashRecords.map(r => ( /* Registros de la cadena de hashes */
                <tr key={r.id}>
                  <td>{r.sequenceNumber}</td> 
                  <td><span className="badge badge-info">{r.entityType}</span></td>
                  <td>{r.action}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.dataHash?.slice(0, 16)}...</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--gold-400)' }}>{r.combinedHash?.slice(0, 16)}...</td>
                  <td>{new Date(r.createdAt).toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
