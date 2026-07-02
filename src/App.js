
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useEffect } from 'react';
import AuthProvider from './contexts/auth';
import PasswordGuard from './components/PasswordGuard';
import Routes from './routes';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer autoClose={3000} />
        <PasswordGuard />
        <Routes/>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
