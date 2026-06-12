import { Route, Routes, Navigate } from 'react-router-dom';
import Home from './Home';
import AuthPage from './components/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from "@/components/ui/toaster"

// Simple App structure
function App() {
  return (
    <>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
