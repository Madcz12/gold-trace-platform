import { useState, useEffect } from 'react';
import api from '../services/api';

const ROLE_LABELS = {
  admin: 'Administrador',
  operador_mina: 'Operador de Mina',
  tecnico_laboratorio: 'Técnico Laboratorio',
  fundidor: 'Fundidor',
  transportador: 'Transportador',
  comercializador: 'Comercializador',
  exportador: 'Exportador',
  auditor: 'Auditor',
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    username: '', email: '', password: '', fullName: '', role: 'operador_mina',
  });

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users')
      .then(res => setUsers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', form);
      setShowModal(false);
      setForm({ username: '', email: '', password: '', fullName: '', role: 'operador_mina' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al crear usuario');
    }
  };

  const toggleStatus = async (user) => {
    try {
      await api.patch(`/users/${user.id}/status`, { isActive: !user.isActive });
      fetchUsers();
    } catch (err) {
      alert('Error al cambiar estado');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Gestión de Usuarios</h2>
        <p>Administración de cuentas y permisos del sistema</p>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nuevo Usuario</button>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="code">{u.username}</td>
                  <td>{u.fullName}</td>
                  <td className="text-muted">{u.email}</td>
                  <td><span className="badge badge-gold">{ROLE_LABELS[u.role] || u.role}</span></td>
                  <td>
                    {u.isActive
                      ? <span className="badge badge-success">Activo</span>
                      : <span className="badge badge-danger">Inactivo</span>
                    }
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString('es-CO')}</td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-primary'}`}
                      onClick={() => toggleStatus(u)}
                    >
                      {u.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Crear Nuevo Usuario</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre Completo *</label>
                  <input className="form-input" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Usuario *</label>
                    <input className="form-input" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input type="email" className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Contraseña *</label>
                    <input type="password" className="form-input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rol *</label>
                    <select className="form-select" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                      {Object.entries(ROLE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
