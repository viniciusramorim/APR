import React, { useEffect, useState, useContext } from "react";
import Header from "../../components/Header";
import Title from "../../components/Title";
import { FiClipboard } from "react-icons/fi";
import { AuthContext } from "../../contexts/auth";
import firebase from "../../services/firebaseConnection";
import { FormControl, Select } from "@mui/material";

const listRef = firebase.firestore().collection("users");

export default function ManagerUsers() {
  const { user, logSistem } = useContext(AuthContext);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    let query = listRef;

    query = query.orderBy("nome", "asc");
    query = user.area === "cabos" ? query.where("area", "==", user.area) : query;

    try {
      const snapshot = await query.get();
      const usuarios = [];
      snapshot.forEach((doc) => {
        usuarios.push({
          id_user: doc.id,
          nome: doc.data().nome,
          nivel: doc.data().nivel,
          status: doc.data().status,
          area: doc.data().area,
          email: doc.data().email,
          regional: doc.data().regional,
        });
      });
      setUsers(usuarios);
    } catch (err) {
      console.log("Deu algum erro: ", err);
    }
  }

  return (
    <div>
      <Header />

      <div className="content">
        <Title name="Gerenciamento de Permissões para Usuários">
          <FiClipboard size={25} />
        </Title>
        <div className="container">
          <select>
            {users.map((user, index) => (
              <option key={index} value={user.id_user}>
                {user.nome}
              </option>
            ))};
          </select>
        </div>
      </div>
    </div>
  );
}
