import { useState, useContext, useEffect } from "react";
import { BsEye } from "react-icons/bs";
import { addBodyClass } from "../../components/BodyClassInsert/bodyClassInserter.js";
import { AuthContext } from "../../contexts/auth";
import firebase from "../../services/firebaseConnection";
import "./signin.scss";
import logo from "../../assets/logoaprdigital-removebg.png";
import { toast } from "react-toastify";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, loadingAuth } = useContext(AuthContext);

  useEffect(() => {
    addBodyClass("page-apply-apr");
  }, []);

  function handleSubmit(e) {
    e.preventDefault();

    if (email !== "" && password !== "") {
      signIn(email.replaceAll(" ", ""), password.replaceAll(" ", ""));
    }
  }

  function toggleVisible() {
    var x = document.getElementById("password");
    if (x.type === "password") {
      x.type = "text";
    } else {
      x.type = "password";
    }
  }

  function handleResetPassword() {
    if (email !== "") {
      firebase
        .auth()
        .fetchSignInMethodsForEmail(email)
        .then((signInMethods) => {
          if (signInMethods.length > 0) {
            firebase
              .auth()
              .sendPasswordResetEmail(email)
              .then(() => {
                alert(
                  "Por favor, verifique seu e-mail para redefinir sua senha."
                );
              })
              .catch((error) => {
                toast.error(
                  "Erro ao enviar e-mail de redefinição de senha. Por favor, tente novamente."
                );
                console.error(error);
              });
          } else {
            toast.error("E-mail não existente");
          }
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      toast.error(
        "Por favor, insira seu e-mail antes de tentar redefinir a senha."
      );
    }
  }

  return (
    <div className="container-center">
      <div className="login">
        <div className="login-area">
          <img src={logo} alt="Sistema Logo" />
        </div>
        <form className="form-signin" onSubmit={handleSubmit}>
          <label className="label-login">E-mail:</label>
          <input
            type="text"
            placeholder="email@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="label-login">Senha:</label>
          <label className="password-visibily">
            <input
              id="password"
              type="password"
              placeholder="*******"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <BsEye size={15} onClick={() => toggleVisible()} />
          </label>
          <button type="submit">
            {loadingAuth ? "Carregando..." : "Acessar"}
          </button>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              color: "white",
              cursor: "pointer",
            }}
          >
            <span className="btn-reset" onClick={handleResetPassword}>
              Esqueci minha senha
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
