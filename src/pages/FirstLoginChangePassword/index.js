import { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { AuthContext } from "../../contexts/auth";
import ModalChangePassword from "../../components/Modal_ChangePassword";
import "./firstLoginChangePassword.scss";

export default function FirstLoginChangePassword() {
  const history = useHistory();
  const { user } = useContext(AuthContext);
  const [modalType, setModalType] = useState("first_login");

  useEffect(() => {
    // Se o usuário não está logado ou não precisa mudar senha, redirecionar
    if (!user || (!user.first_login && !user.password_expired)) {
      history.push("/aprs");
    } else if (user.password_expired) {
      setModalType("password_expired");
    }
  }, [user, history]);

  const handleCloseModal = () => {
    // Não permite fechar modal no primeiro login
    if (modalType === "first_login") {
      return;
    }
    history.push("/aprs");
  };

  return (
    <div className="first-login-page">
      <ModalChangePassword
        isOpen={true}
        type={modalType}
        onClose={handleCloseModal}
      />
    </div>
  );
}
