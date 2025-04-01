import { useState, createContext, useEffect } from "react";
import firebase from "../services/firebaseConnection";
import { toast } from "react-toastify";

export const AuthContext = createContext({});

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function loadStorage() {
      const storageUser = sessionStorage.getItem("SistemaUser");

      if (storageUser) {
        setUser(JSON.parse(storageUser));
        setLoading(false);
      }

      setLoading(false);
    }

    loadStorage();
  }, []);

  async function authStateChanged() {
    await firebase.auth().onAuthStateChanged(async (user, index) => {
      if (user) {
      } else {
        signOut();
      }
    });
  }
  //Fazendo login do usuario
  async function signIn(email, password) {
    setLoadingAuth(true);

    // efetua login
    await firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(async (value) => {
        let uid = value.user.uid;
        let userProfile = await firebase
          .firestore()
          .collection("users")
          .doc(uid)
          .get();
        // if (value.user.emailVerified === false) {
        //   let text = "Para entrar você precisa verificar seu e-mail!\nClique em  OK para reenviar seu e-mail.";
        //   if (window.confirm(text) == true) {
        //     value.user.sendEmailVerification().catch(err => console.log(err));
        //     toast.success("Email de verificação enviado!");
        //     logSistem(`e-mail de verificação enviado para ${email}`);
        //   }
        //   setLoadingAuth(false);
        // } else
        if (userProfile.data().status === false) {
          toast.info("Ops... Você precisa ter permissão para acessar!");
          setLoadingAuth(false);
        } else {
          let data = {
            uid: uid,
            nome: userProfile.data().nome,
            email: value.user.email,
            area: userProfile.data().area,
            nivel: userProfile.data().nivel,
            uf: userProfile.data().uf,
            status: userProfile.data().status,
            regional:
              userProfile.data().regional === undefined
                ? ""
                : userProfile.data().regional,
          };
          setUser(data);
          storageUser(data);
          setLoadingAuth(false);
          toast.success("Bem vindo de volta!");
        }
      })
      .catch((error) => {
        console.log(error);
        setLoadingAuth(false);
        switch (error.code) {
          case "ERROR_EMAIL_ALREADY_IN_USE":
          case "account-exists-with-different-credential":
          case "auth/email-already-in-use":
            return toast.error(
              "E-mail já utilizado. Vá para a página de login."
            );
          case "ERROR_WRONG_PASSWORD":
          case "auth/wrong-password":
            return toast.error("E-mail / Senha incorretos !");
          case "ERROR_USER_NOT_FOUND":
          case "auth/user-not-found":
            return toast.error("E-mail inserido não cadastrado !");
          case "auth/invalid-email":
            return toast.error("E-mail invalido !");
          case "ERROR_USER_DISABLED":
          case "auth/user-disabled":
            return toast.error("Usuario desabilitado !");
          default:
            return toast.error(error.code);
        }
      });
  }
  //Obter E-mail por UID
  function obterUidEmail(email) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        method: "POST",
        redirect: "follow",
      };

      fetch(
        `https://us-central1-seguranca-patrimonial-385514.cloudfunctions.net/obterUidPorEmail?email=${email}`,
        requestOptions
      )
        .then((response) => response.text())
        .then((result) => {
          resolve(JSON.parse(result));
        })
        .catch((error) => {
          console.error(error);
          reject(error);
        });
    });
  }
  //Cadastrando um novo usuario
  async function signUp(email, password, nome, area, nivel, estado, status) {
    setLoadingAuth(true);

    let caps = (password.match(/[A-Z]/g) || []).length;
    let small = (password.match(/[a-z]/g) || []).length;
    let num = (password.match(/[0-9]/g) || []).length;
    let specialSymbol = (password.match(/\W/g) || []).length;
    let lengthMin = password.length;

    if (caps < 1) {
      toast.error("Senha deve conter pelo menos uma letra MAIUSCULA");
      setLoadingAuth(false);
      return;
    } else if (small < 1) {
      toast.error("Senha deve conter pelo menos uma letra MINUSCULA");
      setLoadingAuth(false);
      return;
    } else if (num < 1) {
      toast.error("Senha deve conter pelo menos um NUMERO");
      setLoadingAuth(false);
      return;
    } else if (specialSymbol < 1) {
      toast.error(
        "Senha deve conter pelo menos um CARACTER ESPECIAL: @$! % * ? &"
      );
      setLoadingAuth(false);
      return;
    } else if (lengthMin < 10) {
      toast.error("Senha deve conter no minimo 10 CARACTER");
      setLoadingAuth(false);
      return;
    }

    await firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(async (value) => {
        let uid = value.user.uid;

        if (value.user != null) {
          await firebase
            .firestore()
            .collection("users")
            .doc(uid)
            .set({
              nome: nome,
              email: value.user.email,
              area: area,
              nivel: nivel,
              uf: estado,
              status: status,
            })
            .then(() => {
              console.log(
                "Usuario cadastrado com sucesso!" + email + " - " + password
              );
              setLoadingAuth(false);
            });
        }
      })
      .catch((error) => {
        console.log(error);
        if (error.code === "auth/email-already-in-use") {
          obterUidEmail(email).then(async (result) => {
            await firebase
              .firestore()
              .collection("users")
              .doc(result.uid)
              .set({
                nome: nome,
                email: email,
                area: area,
                nivel: nivel,
                uf: estado,
                status: status,
              })
              .then(() => {
                console.log(
                  "Usuario cadastrado com sucesso!" + email + " - " + password
                );
              });
          });
        }
        setLoadingAuth(false);
      });
  }

  function storageUser(data) {
    sessionStorage.setItem("SistemaUser", JSON.stringify(data));
  }

  const clearSessionStorage = () => {
    sessionStorage.removeItem("filters");
    sessionStorage.removeItem("tablePage");
    sessionStorage.removeItem("lastButtonClicked");
  };
  //Logout do usuario
  async function signOut() {
    await firebase
      .auth()
      .signOut()
      .then(async () => {
        sessionStorage.removeItem("SistemaUser");
        clearSessionStorage();
        setUser(null);
      });
  }

  async function resetPassword(email) {
    await firebase
      .auth()
      .sendPasswordResetEmail(email)
      .then(() => {
        toast.success("Foi enviado um e-mail para redefinir sua senha !");
      })
      .catch((err) => {
        toast.error(err.code);
      });
  }

  async function redefinirPassword() {
    let password = prompt("Digite sua nova senha.");
    if (password === null) return;

    let user = firebase.auth().currentUser;
    let newPassword = password.replaceAll(" ", "");

    let caps = (password.match(/[A-Z]/g) || []).length;
    let small = (password.match(/[a-z]/g) || []).length;
    let num = (password.match(/[0-9]/g) || []).length;
    let specialSymbol = (password.match(/\W/g) || []).length;
    let lengthMin = password.length;

    if (caps < 1) {
      toast.error("Senha deve conter pelo menos uma letra MAIUSCULA");
      return;
    } else if (small < 1) {
      toast.error("Senha deve conter pelo menos uma letra MINUSCULA");
      return;
    } else if (num < 1) {
      toast.error("Senha deve conter pelo menos um NUMERO");
      return;
    } else if (specialSymbol < 1) {
      toast.error(
        "Senha deve conter pelo menos um CARACTER ESPECIAL: @$! % * ? &"
      );
      return;
    } else if (lengthMin < 10) {
      toast.error("Senha deve conter no minimo 10 CARACTER");
      return;
    }

    user
      .updatePassword(newPassword)
      .then(() => {
        toast.success("Senha alterada com sucesso!");
        console.log(newPassword);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  async function redefinirEmail() {
    let email = prompt("Digite seu novo e-mail.");
    if (email === null) return;
    let user = firebase.auth().currentUser;

    user
      .updateEmail(email)
      .then(async () => {
        await firebase
          .firestore()
          .collection("users")
          .doc(user.uid)
          .update({
            email: user.email,
          })
          .then(() => {
            toast.success(
              "email atualizado com sucesso! Entre no seu e-mail e confirme a troca."
            );
            signOut();
          });
      })
      .catch((error) => {
        console.log(error);
        switch (error.code) {
          case "ERROR_EMAIL_ALREADY_IN_USE":
          case "account-exists-with-different-credential":
          case "auth/email-already-in-use":
            return toast.error(
              "E-mail já utilizado. Vá para a página de login."
            );
          case "ERROR_WRONG_PASSWORD":
          case "auth/wrong-password":
            return toast.error("E-mail / Senha incorretos !");
          case "ERROR_USER_NOT_FOUND":
          case "auth/user-not-found":
            return toast.error("E-mail inserido não cadastrado !");
          case "auth/invalid-email":
            return toast.error("E-mail invalido !");
          case "ERROR_USER_DISABLED":
          case "auth/user-disabled":
            return toast.error("Usuario desabilitado !");
          case "auth/requires-recent-login":
            return toast.error("Renove seu login e tente novamente.");
          default:
            return toast.error(error.code);
        }
      });
  }

  async function currentUsers() {
    let curentUsers = firebase.auth().currentUser;
    console.log(curentUsers);
  }

  async function logSistem(evento, chamado) {
    var ip = "null";
    let nome = "null";
    const currentURL = window.location.href;

    try {
      nome = user.nome;
    } catch {}
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      ip = data.ip;
    } catch (error) {
      console.error("Erro ao capturar o IP:", error);
    }

    await firebase
      .firestore()
      .collection("log")
      .add({
        event: evento,
        user: nome,
        chamado: chamado ? chamado : "",
        ip: ip,
        data: new Date(),
        rota: currentURL,
      })
      .then(() => {
        console.log("log salvo");
      });
  }

  async function getUser(id) {
    let userProfile = await firebase
      .firestore()
      .collection("users")
      .doc(id)
      .get();

    return userProfile;
  }

  function trocaSenha(id) {
    const requestOptions = {
      method: "POST",
      redirect: "follow",
    };

    fetch(
      `https://us-central1-seguranca-patrimonial-385514.cloudfunctions.net/alterarSenhaUsuario?userId=${id}`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        console.log(result);
        alert(result);
        return result;
      })
      .catch((error) => console.error(error));
  }

  return (
    <AuthContext.Provider
      value={{
        signed: !!user,
        user,
        loading,
        loadingAuth,
        signUp,
        signOut,
        signIn,
        setUser,
        storageUser,
        resetPassword,
        redefinirPassword,
        currentUsers,
        authStateChanged,
        redefinirEmail,
        logSistem,
        getUser,
        trocaSenha,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
