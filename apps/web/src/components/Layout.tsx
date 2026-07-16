import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { IconLogoRayo } from './icons';

export function Layout() {
  const { logout, rol, nombreCompleto } = useAuth();
  const navigate = useNavigate();
  const esArrendatario = rol === 'ARRENDATARIO';
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleLogout = () => {
    setMenuAbierto(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="layout__header">
        <span className="layout__brand">
          <span className="layout__logo">
            <IconLogoRayo />
          </span>
          Arriendo365
        </span>
        <nav className="layout__nav">
          <NavLink to="/" end>
            Arriendos
          </NavLink>
          {!esArrendatario && <NavLink to="/propiedades">Propiedades</NavLink>}
          {!esArrendatario && <NavLink to="/autos">Autos</NavLink>}
          {!esArrendatario && <NavLink to="/personas">Personas</NavLink>}
          <NavLink to="/pagos">Pagos</NavLink>
          <NavLink to="/requerimientos">Requerimientos</NavLink>
        </nav>

        <div className="user-menu">
          <button
            type="button"
            className="user-menu__trigger"
            onClick={() => setMenuAbierto((v) => !v)}
          >
            <span className="user-menu__nombre">{nombreCompleto ?? 'Mi cuenta'}</span>
            <span className="user-menu__arrow">▾</span>
          </button>

          {menuAbierto && (
            <>
              <div className="user-menu__backdrop" onClick={() => setMenuAbierto(false)} />
              <div className="user-menu__panel">
                <Link to="/perfil" onClick={() => setMenuAbierto(false)}>
                  Perfil
                </Link>
                <Link to="/configuracion" onClick={() => setMenuAbierto(false)}>
                  Configuración
                </Link>
                <button type="button" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </header>
      <main className="layout__content">
        <Outlet />
      </main>
    </div>
  );
}
