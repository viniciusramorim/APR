import { useState, useContext } from "react";
import { toast } from "react-toastify";
import { BsEye } from "react-icons/bs";
import {
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { AuthContext } from "../../contexts/auth";
import './style.scss';

function SignUpModal({ open, onClose }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [area, setArea] = useState("0");
  const [estado, setEstado] = useState("0");
  const [showPassword, setShowPassword] = useState(false);

  const { user, signUp, loadingAuth } = useContext(AuthContext);

  const listPermissionCad = [
    "wQzKfmkPgsV8PULa9t5JLg9Ta6j2",
    "5WBRPLgGmzUSLzrthSs9e9qnSnb2",
    "zbLnqdRrhIQSf7a3Wg4fMe32EFJ2",
  ];

  function handleSubmit(e) {
    e.preventDefault();

    if (!nome) toast.info("Voce precisa preencher seu nome.");
    if (!email) toast.info("Voce precisa preencher seu e-mail.");
    if (!password) toast.info("Voce precisa preencher sua senha.");
    if (area === "0") toast.info("Voce precisa preencher sua area.");
    if (estado === "0") toast.info("Voce precisa preencher sua UF.");

    if (nome && email && password && area !== "0" && estado !== "0") {
      signUp(
        email,
        password,
        nome.toUpperCase(),
        area,
        "aplicador",
        estado,
        false
      );
    }
  }

  function handleChangeSelectArea(e) {
    setArea(e.target.value);
  }

  function handleChangeSelectEstado(e) {
    setEstado(e.target.value);
  }

  function toggleVisible() {
    setShowPassword(!showPassword);
  }

  return (
    <Dialog className="modal-new-user" open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="modal-new-user-dialog">
        <span>Cadastrar Usuário</span>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers className="form-register">
        {listPermissionCad.includes(user.uid) ? (
          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <TextField
              fullWidth
              label="Nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              margin="normal"
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              margin="normal"
              variant="outlined"
            />

            <FormControl fullWidth margin="normal" variant="outlined">
              <InputLabel>Área</InputLabel>
              <Select
                value={area}
                onChange={handleChangeSelectArea}
                label="Área"
              >
                <MenuItem value="0" disabled>
                  Selecione uma área...
                </MenuItem>
                <MenuItem value="patrimonial">Segurança Patrimonial</MenuItem>
                <MenuItem value="oem">O&M</MenuItem>
                <MenuItem value="pci">PCI</MenuItem>
                <MenuItem value="patrimonio">Patrimonio</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal" variant="outlined">
              <InputLabel>UF</InputLabel>
              <Select
                value={estado}
                onChange={handleChangeSelectEstado}
                label="UF"
              >
                <MenuItem value="0" disabled>
                  Selecione sua UF...
                </MenuItem>
                {[
                  "AC",
                  "AL",
                  "AM",
                  "AP",
                  "BA",
                  "CE",
                  "DF",
                  "ES",
                  "GO",
                  "MA",
                  "MG",
                  "MS",
                  "MT",
                  "PA",
                  "PB",
                  "PE",
                  "PI",
                  "PR",
                  "RJ",
                  "RN",
                  "RO",
                  "RR",
                  "RS",
                  "SC",
                  "SE",
                  "SP",
                  "TO",
                ].map((uf) => (
                  <MenuItem key={uf} value={uf}>
                    {uf}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box display="flex" alignItems="center" mb={2}>
              <TextField
                fullWidth
                label="Senha"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="outlined"
              />
              <Button
                onClick={toggleVisible}
                size="small"
                style={{ marginLeft: 10 }}
              >
                <BsEye size={20} />
              </Button>
            </Box>

            <Typography variant="body2" color="textSecondary" gutterBottom>
              Requisitos senha:
            </Typography>
            <ul
              style={{ listStyleType: "disc", paddingLeft: 20, color: "gray" }}
            >
              <li>Conter no minimo 1 letra MAIUSCULA</li>
              <li>Conter no minimo 1 letra MINISCULA</li>
              <li>Conter no minimo 1 CARACTER ESPECIAL</li>
              <li>Conter no minimo 1 NUMERO</li>
              <li>Conter no minimo 10 CARACTERES</li>
            </ul>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              style={{ marginTop: 20 }}
              disabled={loadingAuth}
            >
              {loadingAuth ? <CircularProgress size={24} /> : "Cadastrar"}
            </Button>
          </form>
        ) : (
          <Typography variant="h6" color="error" style={{ marginTop: 20 }}>
            Você não tem acesso ao cadastramento.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default SignUpModal;
