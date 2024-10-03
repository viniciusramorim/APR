import * as React from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Button from "@mui/material/Button";
import { useState, useContext } from "react";

import { AuthContext } from "../../contexts/auth";
import firebase from "../../services/firebaseConnection";

import "./drawerMyAccount.scss";
import { toast } from "react-toastify";

export default function AnchorTemporaryDrawer() {
  const [state, setState] = React.useState({
    top: false,
    right: false,
  });

  const { user, signOut, redefinirPassword, redefinirEmail } =
    useContext(AuthContext);

  const [nome, setNome] = useState(user && user.nome);
  const [email, setEmail] = useState(user && user.email);

  async function updateNivel(e) {
    e.preventDefault();
    if (nome !== "" && nome !== undefined) {
      await firebase
        .firestore()
        .collection("users")
        .doc(user.uid)
        .update({
          nome: nome,
        })
        .then(() => {
          alert("Nome aterado com sucesso!");
          signOut();
        })
        .catch((err) => {
          console.log("Deu algum erro: ", err);
        });
    } else {
      toast.error("Nome não pode ser nulo!");
    }
  }

  const toggleDrawer = (anchor, open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    setState({ ...state, [anchor]: open });
  };

  const list = (anchor) => (
    <Box
      sx={{ width: anchor === "top" || anchor === "bottom" ? "auto" : 350 }}
      role="presentation"
      onClick={toggleDrawer(anchor, false)}
      onKeyDown={toggleDrawer(anchor, false)}
    >
      <div className="container-drawer">
        <form className="form-profile" onSubmit={updateNivel}>
          <label>Nome</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value.toUpperCase())}
          />

          <label>Email</label>
          <input type="text" value={email} disabled={true} />
        </form>
      </div>
      <div className="container-button">
        <button className="logout-btn" onClick={() => signOut()}>
          Sair
        </button>
        <button className="logout-btn" onClick={() => redefinirPassword()}>
          Trocar Senha
        </button>
        <button className="logout-btn" onClick={() => redefinirEmail()}>
          Alterar E-mail
        </button>
      </div>
    </Box>
  );

  return (
    <div>
      {["right"].map((anchor) => (
        <React.Fragment key={anchor}>
          <Button onClick={toggleDrawer(anchor, true)}>Meu Perfil</Button>
          <Drawer
            anchor={anchor}
            open={state[anchor]}
            onClose={toggleDrawer(anchor, false)}
          >
            {list(anchor)}
          </Drawer>
        </React.Fragment>
      ))}
    </div>
  );
}
