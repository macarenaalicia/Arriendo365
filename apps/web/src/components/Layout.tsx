import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { IconLogoRayo } from './icons';

export function Layout() {
  const { logout, rol, nombreCompleto } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const esArrendatario = rol === 'ARRENDATARIO';
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [bienesAbierto, setBienesAbierto] = useState(false);
  const bienesActivo =
    location.pathname.startsWith('/propiedades') || location.pathname.startsWith('/autos');

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
          <NavLink to="/pagos">Pagos</NavLink>
          <NavLink to="/requerimientos">Requerimientos</NavLink>
          {!esArrendatario && (
            <div
              className={`nav-dropdown${bienesAbierto ? ' nav-dropdown--open' : ''}`}
              onMouseEnter={() => setBienesAbierto(true)}
            >
              <button
                type="button"
                className={`nav-dropdown__trigger${bienesActivo ? ' active' : ''}`}
                onClick={() => setBienesAbierto((v) => !v)}
              >
                Administrar bienes
                <span className="nav-dropdown__arrow">▾</span>
              </button>
              {bienesAbierto && (
                <>
                  <div
                    className="nav-dropdown__backdrop"
                    onClick={() => setBienesAbierto(false)}
                  />
                  <div className="nav-dropdown__panel">
                    <NavLink to="/propiedades" onClick={() => setBienesAbierto(false)}>
                      Propiedades
                    </NavLink>
                    <NavLink to="/autos" onClick={() => setBienesAbierto(false)}>
                      Autos
                    </NavLink>
                  </div>
                </>
              )}
            </div>
          )}
          {!esArrendatario && <NavLink to="/personas">Personas</NavLink>}
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
