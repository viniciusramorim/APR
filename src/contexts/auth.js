import { useState, createContext, useEffect } from "react";
import firebase from "../services/firebaseConnection";
import { toast } from "react-toastify";
import CryptoJS from "crypto-js";

export const AuthContext = createContext({});

/**
 * FLUXO DE PRIMEIRO LOGIN:
 * 1. Quando um novo usuário é criado (signUp), o campo 'first_login' é definido como true
 * 2. No primeiro login (signIn), o campo 'first_login' é incluído nos dados do usuário
 * 3. A rota prote em Route.js detecta que first_login é true e redireciona para '/validation'
 * 4. O usuário é forçado a alterar sua senha
 * 5. Após alterar, o campo 'first_login' é definido como false
 * 6. O usuário é redirecionado para o dashboard (/aprs)
 */

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [captchaToken, setCaptchaToken] = useState(null); // <- token salvo aqui

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

  // =========== FUNÇÕES AUXILIARES PARA GERENCIAMENTO DE SENHAS ===========

  /**
   * Encripta uma senha usando SHA256
   */
  function encryptPassword(password) {
    return CryptoJS.SHA256(password).toString();
  }

  /**
   * Calcula a data de expiração da senha (30 dias a partir de hoje)
   */
  function calculatePasswordExpiry() {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    return expiryDate;
  }

  /**
   * Adiciona a senha ao histórico criptografado
   * Desabilitado - não há armazenamento em histórico, apenas last_password_hash
   */
  async function addPasswordHistory(uid, password) {
    // Função desabilitada
    return true;
  }

  /**
   * Verifica se a nova senha já foi utilizada antes
   */
  async function checkPasswordHistory(uid, newPassword) {
    try {
      const userDoc = await firebase.firestore().collection("users").doc(uid).get();
      const lastPasswordHash = userDoc.data().last_password_hash;
      
      if (!lastPasswordHash) {
        // Sem histórico, permite qualquer senha
        return false;
      }

      const encryptedNewPassword = encryptPassword(newPassword);
      
      // Se o hash da nova senha for igual ao último hash, rejeita
      if (encryptedNewPassword === lastPasswordHash) {
        return true; // Senha já foi usada
      }
      
      return false; // Senha é nova
    } catch (error) {
      console.error("Erro ao verificar histórico de senha:", error);
      return false;
    }
  }

  /**
   * Verifica se a senha expirou
   */
  function isPasswordExpired(passwordExpiryDate) {
    if (!passwordExpiryDate) return false;
    
    // Converter Timestamp do Firebase para Date se necessário
    let expiry = passwordExpiryDate;
    if (passwordExpiryDate.toDate) {
      expiry = passwordExpiryDate.toDate();
    } else {
      expiry = new Date(passwordExpiryDate);
    }
    
    const today = new Date();
    return today > expiry;
  }

  /**
   * Calcula quantos dias faltam para expiração
   */
  function getDaysUntilPasswordExpiry(passwordExpiryDate) {
    if (!passwordExpiryDate) return null;
    
    // Converter Timestamp do Firebase para Date se necessário
    let expiry = passwordExpiryDate;
    if (passwordExpiryDate.toDate) {
      expiry = passwordExpiryDate.toDate();
    } else {
      expiry = new Date(passwordExpiryDate);
    }
    
    const today = new Date();
    const diffTime = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diffTime > 0 ? diffTime : 0;
  }

  // =======================================================================

  //Fazendo login do usuario com reCAPTCHA
  const signIn = async (email, password) => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        size: 'normal', // ou 'compact'
        callback: (response) => {
          console.log("reCAPTCHA resolvido:", response);
          setCaptchaToken(response); // <- salva o token quando resolver
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA expirado.');
          setCaptchaToken(null); // invalida o token
        }
      });

      window.recaptchaVerifier.render();
    }

    if (!captchaToken) {
      return toast.error("Por favor, resolva o reCAPTCHA.");
    }

    setLoadingAuth(true);

    try {
      const value = await firebase.auth().signInWithEmailAndPassword(email, password);
      const uid = value.user.uid;
      const userProfile = await firebase.firestore().collection("users").doc(uid).get();

      if (!userProfile.exists || userProfile.data().status === false) {
        toast.info("Ops... Você precisa ter permissão para acessar!");
        setLoadingAuth(false);
        return;
      }

      if (!userProfile.exists || userProfile.data().ultimo_login) {
        const ultimoLogin = userProfile.data().ultimo_login.toDate();
        const hoje = new Date();
        const diffTime = Math.abs(hoje - ultimoLogin);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 30) {
          toast.error('Você foi inativado por ficar mais de 30 dias sem acessar, contate um administrador!');
          await firebase.firestore().collection("users").doc(uid).update({
            status: false
          });
          setLoadingAuth(false);
          return;
        }
      }


      // Verificar se a senha expirou
      if (userProfile.data().password_expiry_date) {
        const daysUntilExpiry = getDaysUntilPasswordExpiry(userProfile.data().password_expiry_date);
        
        if (daysUntilExpiry <= 0) {
          // Senha expirou - forçar mudança
          const tempUser = {
            uid,
            nome: userProfile.data().nome,
            email: value.user.email,
            area: userProfile.data().area,
            nivel: userProfile.data().nivel,
            uf: userProfile.data().uf,
            status: userProfile.data().status,
            regional: userProfile.data().regional || "",
            first_login: true, // Forçar como se fosse primeiro login
            password_expired: true
          };
          setUser(tempUser);
          storageUser(tempUser);
          
          toast.error("Sua senha expirou! Por favor, altere-a para continuar.");
          setLoadingAuth(false);
          return;
        } else if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
          // Avisar que a senha vai expirar em breve
          toast.warning(`⚠️ Sua senha expirará em ${daysUntilExpiry} dias. Recomendamos alterá-la em breve!`);
        }
      }

      const data = {
        uid,
        nome: userProfile.data().nome,
        email: value.user.email,
        area: userProfile.data().area,
        nivel: userProfile.data().nivel,
        uf: userProfile.data().uf,
        status: userProfile.data().status,
        regional: userProfile.data().regional || "",
        first_login: userProfile.data().first_login || false,
        password_expiry_date: userProfile.data().password_expiry_date || null,
      };

      await firebase.firestore().collection("users").doc(uid).update({
        ultimo_login: new Date()
      });

      setUser(data);
      storageUser(data);
      toast.success("Bem-vindo de volta!");
    } catch (error) {
      console.log(error);
      switch (error.code) {
        case "auth/email-already-in-use":
          toast.error("E-mail já utilizado.");
          break;
        case "auth/wrong-password":
          toast.error("E-mail / Senha incorretos!");
          break;
        case "auth/user-not-found":
          toast.error("E-mail não cadastrado!");
          break;
        case "auth/invalid-email":
          toast.error("E-mail inválido!");
          break;
        case "auth/user-disabled":
          toast.error("Usuário desabilitado!");
          break;
        default:
          toast.error(error.code);
          break;
      }
    }

    setLoadingAuth(false);
  };

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
              first_login: true,
              data_criacao: new Date()
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
            const expiryDate = calculatePasswordExpiry();

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
                first_login: true,
                data_criacao: new Date()
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

    try {
      await user.updatePassword(newPassword);
      
      // Recalcular expiração de senha (30 dias a partir de agora)
      const newExpiryDate = calculatePasswordExpiry();
      
      await firebase
        .firestore()
        .collection("users")
        .doc(user.uid)
        .update({
          password_expiry_date: newExpiryDate,
          password_expired: false,
          last_password_change: new Date(),
          last_password_hash: encryptPassword(newPassword)
        });

      // Recarregar os dados do usuário do Firestore para manter o contexto atualizado
      const userDoc = await firebase
        .firestore()
        .collection("users")
        .doc(user.uid)
        .get();

      if (userDoc.exists) {
        const completeUserData = userDoc.data();
        const updatedUser = {
          uid: user.uid,
          nome: completeUserData.nome,
          email: completeUserData.email,
          area: completeUserData.area,
          nivel: completeUserData.nivel,
          uf: completeUserData.uf,
          status: completeUserData.status,
          regional: completeUserData.regional || "",
          first_login: completeUserData.first_login || false,
          password_expiry_date: newExpiryDate,
        };
        setUser(updatedUser);
        storageUser(updatedUser);
      }
      
      toast.success("Senha alterada com sucesso!");
    } catch (error) {
      console.log(error);
      toast.error("Erro ao alterar a senha");
    }
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

  async function logSistem(evento, chamado, destinatario) {
    var ip = "null";
    let nome = "null";
    const currentURL = window.location.href;

    try {
      nome = user.nome;
    } catch { }
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
        destinatario: destinatario ? destinatario : "",
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

  // Função para forçar mudança de senha no primeiro login
  async function forceChangePasswordFirstLogin(newPassword, confirmPassword) {
    if (!user || !user.first_login) {
      toast.error("Acesso não autorizado a esta operação");
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não conferem!");
      return false;
    }

    // Validar força da senha
    let caps = (newPassword.match(/[A-Z]/g) || []).length;
    let small = (newPassword.match(/[a-z]/g) || []).length;
    let num = (newPassword.match(/[0-9]/g) || []).length;
    let specialSymbol = (newPassword.match(/\W/g) || []).length;
    let lengthMin = newPassword.length;

    if (caps < 1) {
      toast.error("Senha deve conter pelo menos uma letra MAIUSCULA");
      return false;
    } else if (small < 1) {
      toast.error("Senha deve conter pelo menos uma letra MINUSCULA");
      return false;
    } else if (num < 1) {
      toast.error("Senha deve conter pelo menos um NUMERO");
      return false;
    } else if (specialSymbol < 1) {
      toast.error("Senha deve conter pelo menos um CARACTER ESPECIAL: @$! % * ? &");
      return false;
    } else if (lengthMin < 10) {
      toast.error("Senha deve conter no minimo 10 CARACTERES");
      return false;
    }

    // Verificar se a nova senha é igual à anterior
    const passwordAlreadyUsed = await checkPasswordHistory(user.uid, newPassword);
    if (passwordAlreadyUsed) {
      toast.error("Você não pode usar a mesma senha que foi utilizada antes!");
      return false;
    }

    try {
      // Atualizar a senha no Firebase Auth
      const currentUser = firebase.auth().currentUser;
      await currentUser.updatePassword(newPassword);

      // Calcular nova data de expiração
      const newExpiryDate = calculatePasswordExpiry();

      // Atualizar o status first_login para false e expiração no Firestore
      await firebase
        .firestore()
        .collection("users")
        .doc(user.uid)
        .update({
          first_login: false,
          password_expired: false,
          password_expiry_date: newExpiryDate,
          last_password_change: new Date(),
          last_password_hash: encryptPassword(newPassword)
        });

      // Recarregar os dados completos do usuário do Firestore (incluindo nivel, area, etc)
      const userDoc = await firebase
        .firestore()
        .collection("users")
        .doc(user.uid)
        .get();

      if (userDoc.exists) {
        const completeUserData = userDoc.data();
        const updatedUser = { 
          uid: user.uid,
          nome: completeUserData.nome,
          email: completeUserData.email,
          area: completeUserData.area,
          nivel: completeUserData.nivel,
          uf: completeUserData.uf,
          status: completeUserData.status,
          regional: completeUserData.regional || "",
          first_login: false,
          password_expired: false,
          password_expiry_date: newExpiryDate,
        };
        setUser(updatedUser);
        storageUser(updatedUser);
      }

      toast.success("Senha alterada com sucesso! Bem-vindo!");
      return true;
    } catch (error) {
      console.log(error);
      if (error.code === "auth/weak-password") {
        toast.error("Senha muito fraca!");
      } else if (error.code === "auth/requires-recent-login") {
        toast.error("Sessão expirada. Faça login novamente.");
      } else {
        toast.error("Erro ao alterar a senha. Tente novamente.");
      }
      return false;
    }
  }

  /**
   * Reset de senha por Admin - recalcula a expiração para 30 dias após reset
   */
  async function resetPasswordByAdmin(uid) {
    try {
      // Enviar email de reset de senha
      const userData = (await firebase.firestore().collection("users").doc(uid).get()).data();
      if (!userData) {
        toast.error("Usuário não encontrado.");
        return false;
      }

      await firebase.auth().sendPasswordResetEmail(userData.email);

      // Recalcular expiration para quando o usuário completar o reset
      const newExpiryDate = calculatePasswordExpiry();
      
      await firebase
        .firestore()
        .collection("users")
        .doc(uid)
        .update({
          password_expiry_date: newExpiryDate,
          password_expired: false,
          last_password_change: new Date(),
          last_password_hash: "" // Limpar hash para permitir qualquer nova senha
        });

      toast.success("Email de reset enviado! A contagem de 30 dias foi reiniciada.");
      return true;
    } catch (error) {
      console.error("Erro ao resetar senha por admin:", error);
      toast.error("Erro ao resetar senha. Tente novamente.");
      return false;
    }
  }

  /**
   * Atualiza TODOS os usuários com password_expiry_date (+30 dias)
   * Execute uma única vez para aplicar a regra a todos os usuários existentes
   */
  async function updateAllUsersPasswordExpiry() {
    try {
      setLoadingAuth(true);
      const usersRef = firebase.firestore().collection("users");
      const snapshot = await usersRef.get();

      if (snapshot.empty) {
        toast.error("Nenhum usuário encontrado.");
        setLoadingAuth(false);
        return false;
      }

      const newExpiryDate = calculatePasswordExpiry();
      let updateCount = 0;

      // Usar batch para atualizar múltiplos documentos
      const batch = firebase.firestore().batch();

      snapshot.forEach((doc) => {
        batch.update(doc.ref, {
          password_expiry_date: newExpiryDate,
          password_expired: false
        });
        updateCount++;
      });

      await batch.commit();
      toast.success(`✅ ${updateCount} usuários atualizados com expiração de 30 dias!`);
      setLoadingAuth(false);
      return true;
    } catch (error) {
      console.error("Erro ao atualizar usuários:", error);
      toast.error("Erro ao atualizar usuários. Tente novamente.");
      setLoadingAuth(false);
      return false;
    }
  }

  /**
   * Força TODOS os usuários a trocar senha no próximo login
   * Seta first_login: true para todos os usuários
   */
  async function forceAllUsersChangePassword() {
    try {
      setLoadingAuth(true);
      const usersRef = firebase.firestore().collection("users");
      const snapshot = await usersRef.get();

      if (snapshot.empty) {
        toast.error("Nenhum usuário encontrado.");
        setLoadingAuth(false);
        return false;
      }

      let updateCount = 0;
      const batch = firebase.firestore().batch();

      snapshot.forEach((doc) => {
        batch.update(doc.ref, {
          first_login: true,
          password_expired: false
        });
        updateCount++;
      });

      await batch.commit();
      toast.success(`✅ ${updateCount} usuários serão obrigados a trocar senha no próximo login!`);
      setLoadingAuth(false);
      return true;
    } catch (error) {
      console.error("Erro ao forçar mudança de senha:", error);
      toast.error("Erro ao forçar mudança de senha. Tente novamente.");
      setLoadingAuth(false);
      return false;
    }
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
        forceChangePasswordFirstLogin,
        resetPasswordByAdmin,
        updateAllUsersPasswordExpiry,
        forceAllUsersChangePassword,
        getDaysUntilPasswordExpiry,
        isPasswordExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
