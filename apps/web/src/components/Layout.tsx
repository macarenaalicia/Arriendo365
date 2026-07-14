import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="layout__header">
        <span className="layout__brand">Arriendo365</span>
        <nav className="layout__nav">
          <NavLink to="/" end>
            Arriendos
          </NavLink>
          <NavLink to="/propiedades">Propiedades</NavLink>
          <NavLink to="/autos">Autos</NavLink>
          <NavLink to="/pagos">Pagos</NavLink>
        </nav>
        <button type="button" onClick={handleLogout} className="layout__logout">
          Cerrar sesión
        </button>
      </header>
      <main className="layout__content">
        <Outlet />
      </main>
    </div>
  );
}
