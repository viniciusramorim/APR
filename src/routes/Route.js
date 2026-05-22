import { useContext, useEffect, useState } from 'react';
import { Route, Redirect, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/auth';

export default function RouteWrapper({
  component: Component,
  isPrivate,
  isAdm,
  ...rest
}) {

  const { user, signed, loading, authStateChanged } = useContext(AuthContext);
  const [previousLocation, setPreviousLocation] = useState(null);
  const location = useLocation();

  function pageTo() {
    if (user.area === 'patrimonial' || user.area === 'empresarial' || user.area === 'oem' || user.area === 'pci' || user.area === 'logistica') return previousLocation !== null ? previousLocation : '/aprs';
    else if (user.area === 'patrimonio') return previousLocation !== null ? previousLocation : '/patrimonio';
  }

  useEffect(() => {
    authStateChanged();
    if (isPrivate && !signed) {
      // Guardar a penúltima URL antes do redirecionamento
      setPreviousLocation(location.pathname);
    }
  }, [signed, isPrivate, authStateChanged, location.pathname]);

  if (loading) {
    return <div></div>;
  }

  // Se o usuário está logado e é seu primeiro login, redirecionar para mudar senha (como fallback)
  if (signed && user.first_login && location.pathname !== "/validation") {
    return <Redirect to="/validation" />;
  }

  // Se a senha expirou, redirecionar para mudar senha (como fallback)
  if (signed && user.password_expired && location.pathname !== "/validation") {
    return <Redirect to="/validation" />;
  }

  // Se está tentando acessar a página de mudança de senha mas não é primeira vez nem senha expirada, redirecionar
  if (signed && !user.first_login && !user.password_expired && location.pathname === "/validation") {
    return <Redirect to={pageTo()} />;
  }

  if (signed && !isPrivate) {
    return <Redirect to={pageTo()} />;
  }

  if (!signed) {
    if (!signed && isPrivate) {
      return <Redirect to="/" />;
    }
  } else if (user.nivel !== 'administrador') {
    if ((!isPrivate || isAdm)) {
      return <Redirect to={pageTo()} />;
    }
  }

  return (
    <Route
      {...rest}
      render={(props) => {
        return <Component {...props} />;
      }}
    />
  );
}
