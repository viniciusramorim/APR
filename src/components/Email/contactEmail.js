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
  CircularProgress,
  Pagination,
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
  const [editId, setEditId] = useState(null);
  const [formEstado, setFormEstado] = useState("");
  const [formMunicipios, setFormMunicipios] = useState([""]);
  const [formEmails, setFormEmails] = useState("");
  const [allEstados, setAllEstados] = useState([]);
  const [municipiosPorEstado, setMunicipiosPorEstado] = useState({});
  const [formTipo, setFormTipo] = useState("");
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

  const handleEdit = (record) => {
    setEditId(record.id);
    setFormEstado(record.estado);
    setFormMunicipios([record.municipio]);
    setFormEmails(record.emails.join(", "));
    setOpen(true);
  };

  const handleCreate = () => {
    setEditId(null);
    setFormEstado("");
    setFormMunicipios([""]);
    setFormEmails("");
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este município?")) {
      await firebase.firestore().collection("contact_email").doc(id).delete();
      loadData();
    }
  };

  const handleSave = async () => {
    const emails = formEmails
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e !== "");

    for (const municipio of formMunicipios) {
      const newDoc = {
        estado: formEstado,
        municipio,
        emails,
        area_responsavel:formTipo,
      };
      if (editId && formMunicipios.length === 1) {
        await firebase
          .firestore()
          .collection("contact_email")
          .doc(editId)
          .set(newDoc);
      } else {
        await firebase.firestore().collection("contact_email").add(newDoc);
      }
    }
    setOpen(false);
    loadData();
  };

  const filteredData = docs.filter((item) => {
    const estadoMatch =
      filterEstado === "" ||
      item.estado.toLowerCase().includes(filterEstado.toLowerCase());
    const municipioMatch =
      filterMunicipio === "" ||
      item.municipio.toLowerCase().includes(filterMunicipio.toLowerCase());
    return estadoMatch && municipioMatch;
  });

  const groupedByEstado = filteredData.reduce((acc, item) => {
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

  const handleChangeMunicipio = (index, value) => {
    const updated = [...formMunicipios];
    updated[index] = value;
    setFormMunicipios(updated);
  };

  return (
    <div className="apr-contact-email">
      <Header />
      <div className="content">
        <Title name="Contato">
          {" "}
          <FiMessageSquare size={25} onClick={() => console.log("")} />
        </Title>
        <Box>
          <Box display="flex" gap={2} mb={2}>
            <TextField
              label="Filtrar por Estado"
              value={filterEstado}
              size="small"
              onChange={(e) => setFilterEstado(e.target.value)}
            />
            <TextField
              label="Filtrar por Município"
              value={filterMunicipio}
              size="small"
              onChange={(e) => setFilterMunicipio(e.target.value)}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
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
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        width="100%"
                      >
                        <Typography>{item.municipio}</Typography>
                        <Box>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(item)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(item.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        <Typography sx={{fontWeight:'bold'}}>Equipe OEM</Typography>
                        {item.emails.map((email, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={email} />
                          </ListItem>
                        ))}
                      </List>
                      <List dense>
                      <Typography sx={{fontWeight:'bold'}}>Equipe Patrimonial</Typography>
                      </List>
                      <List dense>
                      <Typography sx={{fontWeight:'bold'}}>Equipe Predial</Typography>
                      </List>
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
            <DialogTitle>
              {editId ? "Editar Registro" : "Novo Registro"}
            </DialogTitle>
            <DialogContent>
              <Select
                fullWidth
                value={formEstado}
                style={{ marginBottom: "20px" }}
                onChange={(e) => {
                  setFormEstado(e.target.value);
                  setFormMunicipios([""]);
                }}
                displayEmpty
                margin="normal"
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
              {formMunicipios.map((municipio, index) => (
                <Select
                  key={index}
                  fullWidth
                  value={municipio}
                  onChange={(e) => handleChangeMunicipio(index, e.target.value)}
                  displayEmpty
                  margin="dense"
                  sx={{ mb: 1 }}
                >
                  <MenuItem disabled value="">
                    Selecione um Município
                  </MenuItem>
                  {(municipiosPorEstado[formEstado] || []).sort().map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
              ))}
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Select
                  value={formTipo || ''}
                  onChange={(e) => setFormTipo(e.target.value)}
                  displayEmpty
                  fullWidth
                  sx={{mt: 1.5}}
                >
                  <MenuItem disabled value="">Selecione o tipo</MenuItem>
                  <MenuItem value="OEM">OEM</MenuItem>
                  <MenuItem value="Patrimonial">Patrimonial</MenuItem> 
                  <MenuItem value="Predial">Predial</MenuItem>
                </Select>
              </Box>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="E-mails (separados por vírgula)"
                value={formEmails}
                onChange={(e) => setFormEmails(e.target.value)}
                margin="normal"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancelar</Button>
              <Button variant="contained" onClick={handleSave}>
                Salvar
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </div>
    </div>
  );
}
