import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  {
    section: 'Principal',
    items: [
      { to: '/', icon: '📊', label: 'Dashboard' },
    ],
  },
  {
    section: 'Operaciones',
    items: [
      { to: '/lots', icon: '⛏️', label: 'Lotes' },
      { to: '/bars', icon: '🪙', label: 'Barras' },
      { to: '/transfers', icon: '🔄', label: 'Traspasos' },
    ],
  },
  {
    section: 'Auditoría',
    items: [
      { to: '/audit', icon: '🔒', label: 'Integridad' },
    ],
    roles: ['admin', 'auditor'],
  },
  {
    section: 'Administración',
    items: [
      { to: '/users', icon: '👥', label: 'Usuarios' },
    ],
    roles: ['admin'],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'GT';

  const roleLabels = {
    admin: 'Administrador',
    operador_mina: 'Operador de Mina',
    tecnico_laboratorio: 'Técnico Laboratorio',
    fundidor: 'Fundidor',
    transportador: 'Transportador',
    comercializador: 'Comercializador',
    exportador: 'Exportador',
    auditor: 'Auditor',
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>GOLD TRACE</h1>
        <span>Plataforma de Trazabilidad</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(section => {
          if (section.roles && !section.roles.includes(user?.role)) return null;
          return (
            <div key={section.section} className="sidebar-section">
              <div className="sidebar-section-title">{section.section}</div>
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.fullName}</div>
            <div className="sidebar-user-role">{roleLabels[user?.role] || user?.role}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="btn btn-secondary btn-sm w-full mt-2"
          style={{ justifyContent: 'center' }}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
