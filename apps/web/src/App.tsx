import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { StaffRoute } from './auth/StaffRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegistroPage } from './pages/RegistroPage';
import { ArriendosListPage } from './pages/ArriendosListPage';
import { ArriendoDetailPage } from './pages/ArriendoDetailPage';
import { PagosPage } from './pages/PagosPage';
import { PropiedadesListPage } from './pages/PropiedadesListPage';
import { AutosListPage } from './pages/AutosListPage';
import { AutoDetailPage } from './pages/AutoDetailPage';
import { PersonasListPage } from './pages/PersonasListPage';
import { RequerimientosPage } from './pages/RequerimientosPage';
import { RequerimientoDetailPage } from './pages/RequerimientoDetailPage';
import { PropiedadesPublicasListPage } from './pages/PropiedadesPublicasListPage';
import { PropiedadPublicaDetailPage } from './pages/PropiedadPublicaDetailPage';
import { PerfilPage } from './pages/PerfilPage';
import { ConfiguracionPage } from './pages/ConfiguracionPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />
          <Route
            path="/publico/:organizacionId/propiedades"
            element={<PropiedadesPublicasListPage />}
          />
          <Route
            path="/publico/:organizacionId/propiedades/:id"
            element={<PropiedadPublicaDetailPage />}
          />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<ArriendosListPage />} />
              <Route path="/arriendos/:id" element={<ArriendoDetailPage />} />
              <Route path="/pagos" element={<PagosPage />} />
              <Route path="/requerimientos" element={<RequerimientosPage />} />
              <Route path="/requerimientos/:id" element={<RequerimientoDetailPage />} />
              <Route path="/perfil" element={<PerfilPage />} />
              <Route path="/configuracion" element={<ConfiguracionPage />} />
              <Route element={<StaffRoute />}>
                <Route path="/propiedades" element={<PropiedadesListPage />} />
                <Route path="/autos" element={<AutosListPage />} />
                <Route path="/autos/:id" element={<AutoDetailPage />} />
                <Route path="/personas" element={<PersonasListPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
