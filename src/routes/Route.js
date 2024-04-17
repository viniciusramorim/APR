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
    if (user.area === 'ronda') return '/dashboardrondas';
    else if (user.area === 'patrimonial' || user.area === 'oem') return previousLocation !== null ? previousLocation : '/dashboard';
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
