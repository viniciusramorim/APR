import { useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../../contexts/auth";
import ModalChangePassword from "../Modal_ChangePassword";

export default function PasswordGuard() {
  const { user } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("first_login");
  const location = useLocation();

  useEffect(() => {
    // Não mostrar modal na página de login
    const isLoginPage = location.pathname === "/";
    
    if (isLoginPage || !user) {
      setShowModal(false);
      return;
    }

    // Se é primeiro login, mostra modal
    if (user.first_login) {
      setModalType("first_login");
      setShowModal(true);
    }
    // Se a senha expirou, mostra modal
    else if (user.password_expired) {
      setModalType("password_expired");
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [user, location.pathname]);

  const handleCloseModal = () => {
    // Não permite fechar modal no primeiro login
    if (modalType === "first_login") {
      return;
    }
    setShowModal(false);
  };

  return (
    <ModalChangePassword
      isOpen={showModal}
      type={modalType}
      onClose={handleCloseModal}
    />
  );
}
