import { useEffect, useState } from "react";
import firebase from "../../services/firebaseConnection";
import {
  Box,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Pagination,
  Autocomplete,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Header from "../Header";
import Title from "../Title";
import { FiMessageSquare } from "react-icons/fi";

export default function ContactEmailAccordionView() {
  const [docs, setDocs] = useState([]);
  const [estadoPage, setEstadoPage] = useState(1);
  const [municipioPages, setMunicipioPages] = useState({});
  const [filterEstado, setFilterEstado] = useState("");
  const [filterMunicipio, setFilterMunicipio] = useState("");
  const [open, setOpen] = useState(false);
  const [editDocId, setEditDocId] = useState(null);
  const [editEmail, setEditEmail] = useState("");
  const [editTipo, setEditTipo] = useState("");
  const [editEstado, setEditEstado] = useState("");
  const [editMunicipio, setEditMunicipio] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newEstado, setNewEstado] = useState("");
  const [newMunicipio, setNewMunicipio] = useState("");
  const [newTipo, setNewTipo] = useState("");
  const [newEmails, setNewEmails] = useState("");
  const [allEstados, setAllEstados] = useState([]);
  const [municipiosPorEstado, setMunicipiosPorEstado] = useState({});
  const pageSize = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const snapshot = await firebase
      .firestore()
      .collection("contact_email")
      .get();
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setDocs(list);

    const estadosSet = new Set();
    const grouped = {};
    list.forEach((item) => {
      estadosSet.add(item.estado);
      if (!grouped[item.estado]) grouped[item.estado] = [];
      if (!grouped[item.estado].includes(item.municipio)) {
        grouped[item.estado].push(item.municipio);
      }
    });
    setAllEstados(Array.from(estadosSet).sort());
    setMunicipiosPorEstado(grouped);
  };

  const handleEdit = (docId, email, tipo, estado, municipio) => {
    setEditDocId(docId);
    setEditEmail(email);
    setEditTipo(tipo);
    setEditEstado(estado);
    setEditMunicipio(municipio);
    setOpen(true);
  };

  const handleDeleteEmail = async (docId, email, tipo) => {
    const key = `email_${tipo.toLowerCase()}`;
    const ref = firebase.firestore().collection("contact_email").doc(docId);
    const snap = await ref.get();
    if (!snap.exists) return;
    const data = snap.data();
    data[key] = (data[key] || []).filter((e) => e !== email);
    await ref.set(data);
    loadData();
  };

  const handleSave = async () => {
    if (!editDocId || !editTipo || !editEmail) return;
    const docRef = firebase
      .firestore()
      .collection("contact_email")
      .doc(editDocId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return;
    const data = docSnap.data();
    const tipos = ["email_oem", "email_patrimonial", "email_predial"];
    tipos.forEach((key) => {
      data[key] = (data[key] || []).filter((e) => e !== editEmail);
    });
    const targetKey = `email_${editTipo.toLowerCase()}`;
    if (!data[targetKey]) data[targetKey] = [];
    if (!data[targetKey].includes(editEmail)) {
      data[targetKey].push(editEmail);
    }
    await docRef.set(data);
    setOpen(false);
    loadData();
  };

  const handleCreate = async () => {
    const docId = `${newEstado}-${newMunicipio}`;
    const docRef = firebase.firestore().collection("contact_email").doc(docId);
    const docSnap = await docRef.get();
    const targetKey = `email_${newTipo.toLowerCase()}`;
    const emails = newEmails
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e);

    if (docSnap.exists) {
      const data = docSnap.data();
      const currentEmails = data[targetKey] || [];
      const updatedEmails = Array.from(new Set([...currentEmails, ...emails]));
      await docRef.update({ [targetKey]: updatedEmails });
    } else {
      const newData = {
        estado: newEstado,
        municipio: newMunicipio,
        email_oem: [],
        email_patrimonial: [],
        email_predial: [],
        [targetKey]: emails,
      };
      await docRef.set(newData);
    }

    setCreateOpen(false);
    loadData();
  };

  const filteredDocs = docs.filter(
    (item) =>
      item.estado.toLowerCase().includes(filterEstado.toLowerCase()) &&
      item.municipio.toLowerCase().includes(filterMunicipio.toLowerCase())
  );

  const groupedByEstado = filteredDocs.reduce((acc, item) => {
    if (!acc[item.estado]) acc[item.estado] = [];
    acc[item.estado].push(item);
    return acc;
  }, {});

  const estadoKeys = Object.keys(groupedByEstado).sort();
  const paginatedEstados = estadoKeys.slice(
    (estadoPage - 1) * pageSize,
    estadoPage * pageSize
  );

  const getMunicipiosPaginados = (estado) => {
    const allMunicipios = groupedByEstado[estado] || [];
    const currentPage = municipioPages[estado] || 1;
    return allMunicipios.slice(0, currentPage * pageSize);
  };

  const loadMoreMunicipios = (estado) => {
    setMunicipioPages((prev) => ({
      ...prev,
      [estado]: (prev[estado] || 1) + 1,
    }));
  };

  return (
    <div className="apr-contact-email">
      <Header />
      <div className="content">
        <Title name="Contato">
          <FiMessageSquare size={25} />
        </Title>
        <Box display="flex" gap={2} mb={2}>
          <TextField
            label="Filtrar por Estado"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            size="small"
          />
          <TextField
            label="Filtrar por Município"
            value={filterMunicipio}
            onChange={(e) => setFilterMunicipio(e.target.value)}
            size="small"
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Novo Registro
          </Button>
        </Box>

        {paginatedEstados.map((estado) => (
          <Accordion key={estado}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>{estado}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {getMunicipiosPaginados(estado).map((item) => (
                <Accordion key={item.id}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{item.municipio}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {["OEM", "Patrimonial", "Predial"].map((tipo) => {
                      const key = `email_${tipo.toLowerCase()}`;
                      return (
                        <Box key={tipo} mb={2}>
                          <Typography fontWeight="bold">
                            Equipe {tipo}
                          </Typography>
                          <List dense>
                            {(item[key] || []).map((email, index) => (
                              <ListItem
                                key={index}
                                secondaryAction={
                                  <>
                                    <IconButton
                                      edge="end"
                                      onClick={() =>
                                        handleEdit(
                                          item.id,
                                          email,
                                          tipo,
                                          item.estado,
                                          item.municipio
                                        )
                                      }
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      edge="end"
                                      onClick={() =>
                                        handleDeleteEmail(item.id, email, tipo)
                                      }
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                }
                              >
                                <ListItemText primary={email} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      );
                    })}
                  </AccordionDetails>
                </Accordion>
              ))}
              {groupedByEstado[estado].length >
                (municipioPages[estado] || 1) * pageSize && (
                <Box textAlign="center" mt={1}>
                  <Button onClick={() => loadMoreMunicipios(estado)}>
                    Carregar mais municípios
                  </Button>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))}

        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={Math.ceil(estadoKeys.length / pageSize)}
            page={estadoPage}
            onChange={(e, value) => setEstadoPage(value)}
          />
        </Box>

        <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
          <DialogTitle>Editar E-mail</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              margin="dense"
              label="E-mail"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />
            <Select
              fullWidth
              margin="dense"
              value={editTipo}
              onChange={(e) => setEditTipo(e.target.value)}
              displayEmpty
              sx={{ mt: 2 }}
            >
              <MenuItem disabled value="">
                Selecione a área responsável
              </MenuItem>
              <MenuItem value="OEM">OEM</MenuItem>
              <MenuItem value="Patrimonial">Patrimonial</MenuItem>
              <MenuItem value="Predial">Predial</MenuItem>
            </Select>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleSave}>
              Salvar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          fullWidth
        >
          <DialogTitle>Novo Registro</DialogTitle>
          <DialogContent>
            <Select
              fullWidth
              margin="dense"
              value={newEstado}
              onChange={(e) => {
                setNewEstado(e.target.value);
                setNewMunicipio("");
              }}
              displayEmpty
            >
              <MenuItem disabled value="">
                Selecione um Estado
              </MenuItem>
              {allEstados.map((estado) => (
                <MenuItem key={estado} value={estado}>
                  {estado}
                </MenuItem>
              ))}
            </Select>
            <Autocomplete
              freeSolo
              options={(municipiosPorEstado[newEstado] || []).sort()}
              value={newMunicipio}
              onInputChange={(event, newInputValue) =>
                setNewMunicipio(newInputValue)
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  label="Município (existente ou novo)"
                  fullWidth
                />
              )}
            />
            <Select
              fullWidth
              margin="dense"
              value={newTipo}
              onChange={(e) => setNewTipo(e.target.value)}
              displayEmpty
              sx={{ mt: 2 }}
            >
              <MenuItem disabled value="">
                Selecione a área responsável
              </MenuItem>
              <MenuItem value="OEM">OEM</MenuItem>
              <MenuItem value="Patrimonial">Patrimonial</MenuItem>
              <MenuItem value="Predial">Predial</MenuItem>
            </Select>
            <TextField
              fullWidth
              margin="dense"
              label="E-mails (separados por vírgula)"
              value={newEmails}
              onChange={(e) => setNewEmails(e.target.value)}
              multiline
              minRows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleCreate}>
              Salvar
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
}
