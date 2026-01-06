
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useEffect } from 'react';
import AuthProvider from './contexts/auth';
import Routes from './routes';
import { startSLAMonitoring } from './utils/slaChecker';

function App() {
  useEffect(() => {
    // Iniciar monitoramento de SLA quando a aplicação carregar
    startSLAMonitoring();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer autoClose={3000} />
        <Routes/>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
