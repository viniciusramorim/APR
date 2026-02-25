import { useState, useContext } from "react";
import { useHistory } from "react-router-dom";
import { AuthContext } from "../../contexts/auth";
import { BsEye, BsX } from "react-icons/bs";
import { toast } from "react-toastify";
import "./modal.scss";

export default function ModalChangePassword({ isOpen, type = "first_login", onClose }) {
  const history = useHistory();
  const { user, forceChangePasswordFirstLogin } = useContext(AuthContext);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!isOpen) return null;

  async function handleChangePassword(e) {
    e.preventDefault();
    setLoading(true);

    const success = await forceChangePasswordFirstLogin(newPassword, confirmPassword);

    if (success) {
      setNewPassword("");
      setConfirmPassword("");
      setLoading(false);
      onClose();
      // Redireciona para APRs após alteração bem-sucedida
      setTimeout(() => {
        history.push("/aprs");
      }, 500);
    } else {
      setLoading(false);
    }
  }

  function handleClose() {
    // Não permite fechar modal no primeiro login
    if (type === "first_login") {
      toast.warning("Você precisa alterar sua senha para continuar!");
      return;
    }
    onClose();
  }

  const isFirstLogin = type === "first_login";
  const isPasswordExpired = type === "password_expired";

  return (
    <div className="modal-overlay-password">
      <div className="modal-content-password">
        <div className="modal-header-password">
          <div>
            <h2>
              {isFirstLogin ? "🔐 Primeiro Acesso" : "⚠️ Renovação de Senha"}
            </h2>
            <p>
              {isFirstLogin
                ? "Altere sua senha para continuar"
                : "Sua senha expirou. Por favor, defina uma nova senha."}
            </p>
          </div>
          {isPasswordExpired && (
            <button className="close-btn" onClick={handleClose}>
              <BsX size={24} />
            </button>
          )}
        </div>

        {isPasswordExpired && (
          <div className="alert-expired-modal">
            ⚠️ Sua senha expirou e precisa ser alterada imediatamente.
          </div>
        )}

        <form className="form-change-password-modal" onSubmit={handleChangePassword}>
          <div className="form-group-modal">
            <label>Nova Senha:</label>
            <div className="password-input-group-modal">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="*******"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
              <BsEye
                size={18}
                onClick={() => setShowPassword(!showPassword)}
                className="eye-icon-modal"
              />
            </div>
          </div>

          <div className="form-group-modal">
            <label>Confirme a Senha:</label>
            <div className="password-input-group-modal">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="*******"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
              <BsEye
                size={18}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="eye-icon-modal"
              />
            </div>
          </div>

          <div className="password-requirements-modal">
            <p>A senha deve conter:</p>
            <ul>
              <li>✓ Mínimo de 10 caracteres</li>
              <li>✓ Pelo menos uma letra MAIÚSCULA</li>
              <li>✓ Pelo menos uma letra minúscula</li>
              <li>✓ Pelo menos um número</li>
              <li>✓ Pelo menos um caractere especial (@$!%*?&)</li>
              <li>✓ Diferente de senhas anteriores</li>
            </ul>
          </div>

          <div className="modal-actions-password">
            <button type="submit" className="btn-confirm-modal" disabled={loading}>
              {loading ? "Alterando..." : "Alterar Senha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
