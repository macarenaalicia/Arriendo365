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
import { PersonasListPage } from './pages/PersonasListPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<ArriendosListPage />} />
              <Route path="/arriendos/:id" element={<ArriendoDetailPage />} />
              <Route path="/pagos" element={<PagosPage />} />
              <Route element={<StaffRoute />}>
                <Route path="/propiedades" element={<PropiedadesListPage />} />
                <Route path="/autos" element={<AutosListPage />} />
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
