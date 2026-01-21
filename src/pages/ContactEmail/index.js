import { useEffect, useState, useContext } from "react";
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
  Checkbox,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Header from "../../components/Header";
import { FiMessageSquare } from "react-icons/fi";
import { read, utils } from "xlsx";
import { toast } from "react-toastify";
import { AuthContext } from "../../contexts/auth";

export default function ContactEmail() {
  const { user, logSistem } = useContext(AuthContext);
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
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [selectedEstados, setSelectedEstados] = useState({});
  const [selectedMunicipios, setSelectedMunicipios] = useState({});
  const [emailToAdd, setEmailToAdd] = useState("");
  const [areaToAdd, setAreaToAdd] = useState("");
  const [editMunicipioOpen, setEditMunicipioOpen] = useState(false);
  const [currentMunicipio, setCurrentMunicipio] = useState("");
  const [newMunicipioName, setNewMunicipioName] = useState("");
  const [docToEdit, setDocToEdit] = useState(null);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateMunicipioName, setDuplicateMunicipioName] = useState("");
  const pageSize = 10;

  const mapaRegioes = {
    RJ_ES_MG: ['RJ', 'ES', 'MG'],
    SP: ['SP'],
    CO_N: ['DF', 'GO', 'MT', 'MS', 'TO', 'PA', 'AM', 'RO', 'RR', 'AC', 'AP'],
    SUL: ['RS', 'SC', 'PR'],
    NE: ['BA', 'SE', 'AL', 'PE', 'PB', 'RN', 'CE', 'PI', 'MA']
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

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectEstado = (estado) => {
    setSelectedEstados((prev) => ({
      ...prev,
      [estado]: !prev[estado],
    }));
  };

  const handleSelectMunicipio = (estado, municipio) => {
    setSelectedMunicipios((prev) => ({
      ...prev,
      [estado]: {
        ...prev[estado],
        [municipio]: !prev[estado]?.[municipio],
      },
    }));
  };

  const handleEdit = (docId, email, tipo, estado, municipio) => {
    setEditDocId(docId);
    setEditEmail(email);
    setEditTipo(tipo);
    setEditEstado(estado);
    setEditMunicipio(municipio);
    setOpen(true);
  };

  const handleEditMunicipio = (doc) => {
    setDocToEdit(doc);
    setCurrentMunicipio(doc.municipio);
    setNewMunicipioName(doc.municipio);
    setEditMunicipioOpen(true);
  };

  const handleDuplicateMunicipio = (doc) => {
    setDocToEdit(doc);
    setDuplicateMunicipioName(`${doc.municipio} - Cópia`);
    setDuplicateOpen(true);
  };

  const handleSaveMunicipioEdit = async () => {
    if (!docToEdit || !newMunicipioName) return;

    try {
      const newDocId = `${docToEdit.estado}-${newMunicipioName}`;
      await firebase.firestore().collection("contact_email").doc(newDocId).set({
        estado: docToEdit.estado,
        municipio: newMunicipioName,
        email_oem: docToEdit.email_oem || [],
        email_patrimonial: docToEdit.email_patrimonial || [],
        email_predial: docToEdit.email_predial || [],
      });
      await firebase.firestore().collection("contact_email").doc(docToEdit.id).delete();
      await logSistem("Nome do município alterado", newDocId);

      setEditMunicipioOpen(false);
      loadData();
      toast.success("Município atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar município:", error);
      toast.error("Erro ao atualizar município.");
    }
  };

  const handleSaveDuplicateMunicipio = async () => {
    if (!docToEdit || !duplicateMunicipioName) return;

    try {
      const newDocId = `${docToEdit.estado}-${duplicateMunicipioName}`;
      await firebase.firestore().collection("contact_email").doc(newDocId).set({
        estado: docToEdit.estado,
        municipio: duplicateMunicipioName,
        email_oem: [...(docToEdit.email_oem || [])],
        email_patrimonial: [...(docToEdit.email_patrimonial || [])],
        email_predial: [...(docToEdit.email_predial || [])],
      });
      await logSistem("Município duplicado", newDocId);

      setDuplicateOpen(false);
      loadData();
      toast.success("Município duplicado com sucesso!");
    } catch (error) {
      console.error("Erro ao duplicar município:", error);
      toast.error("Erro ao duplicar município.");
    }
  };

  const handleAddEmailToAll = async () => {
    if (!emailToAdd || !areaToAdd) {
      toast.error("Por favor, insira um e-mail e selecione uma área.");
      return;
    }

    const batch = firebase.firestore().batch();
    const areaKey = `email_${areaToAdd.toLowerCase()}`;

    docs.forEach((doc) => {
      const docRef = firebase.firestore().collection("contact_email").doc(doc.id);
      const updatedEmails = Array.from(new Set([...(doc[areaKey] || []), emailToAdd]));
      batch.update(docRef, { [areaKey]: updatedEmails });
      logSistem(`E-mail adicionado a todos (${emailToAdd}) na área ${areaToAdd}`, doc.id);
    });

    await batch.commit();
    loadData();
    toast.success(`E-mail adicionado a todos os municípios na área ${areaToAdd} com sucesso!`);
  };

  const loadData = async () => {
    const isAdmin = user?.nivel === "administrador";
    const estadosPermitidos = mapaRegioes[user.regional] || [];
    const snapshot = await firebase.firestore().collection("contact_email").get();

    const list = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((doc) => isAdmin || estadosPermitidos.includes(doc.estado));

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

  const handleDeleteEmail = async (docId, email, tipo) => {
    const key = `email_${tipo.toLowerCase()}`;
    const ref = firebase.firestore().collection("contact_email").doc(docId);
    const snap = await ref.get();
    if (!snap.exists) return;
    const data = snap.data();
    data[key] = (data[key] || []).filter((e) => e !== email);
    await ref.set(data);
    const [uf, municipio] = docId.split("-");
    await logSistem(`E-mail removido (${email}) da área ${tipo} - UF: ${uf}, Município: ${municipio}`, docId);
    loadData();
  };

  const handleSave = async () => {
    if (!editDocId || !editTipo || !editEmail) return;
    const docRef = firebase.firestore().collection("contact_email").doc(editDocId);
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
    await logSistem(`E-mail editado (${editEmail}) na área ${editTipo} - UF: ${editEstado}, Município: ${editMunicipio}`, editDocId);
    setOpen(false);
    loadData();
  };

  const handleCreate = async () => {
    const docId = `${newEstado}-${newMunicipio}`;
    const docRef = firebase.firestore().collection("contact_email").doc(docId);
    const docSnap = await docRef.get();
    const targetKey = `email_${newTipo.toLowerCase()}`;
    const emails = newEmails.split(",").map((e) => e.trim()).filter((e) => e);

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

    await logSistem(`Novo e-mail criado/atualizado (${emails.join(", ")}) na área ${newTipo} - UF: ${newEstado}, Município: ${newMunicipio}`, docId);
    setCreateOpen(false);
    loadData();
  };

  const handleDeleteSelected = async () => {
    const batch = firebase.firestore().batch();

    docs.forEach((doc) => {
      if (selectedEstados[doc.estado] || selectedMunicipios[doc.estado]?.[doc.municipio]) {
        const docRef = firebase.firestore().collection("contact_email").doc(doc.id);
        batch.delete(docRef);
        logSistem(`Documento deletado - UF: ${doc.estado}, Município: ${doc.municipio}`, doc.id);
      }
    });

    await batch.commit();
    loadData();
  };

  const handleUploadXLSX = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoadingUpload(true);

      const data = await file.arrayBuffer();
      const workbook = read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = utils.sheet_to_json(sheet);

      for (const row of json) {
        const { email, area, estado, municipio, novo_municipio } = row;

        if (novo_municipio && municipio) {
          const originalDocId = `${estado}-${municipio}`;
          const originalDocRef = firebase.firestore().collection("contact_email").doc(originalDocId);
          const originalDocSnap = await originalDocRef.get();

          if (originalDocSnap.exists) {
            const originalData = originalDocSnap.data();
            const newDocId = `${estado}-${novo_municipio}`;
            await firebase.firestore().collection("contact_email").doc(newDocId).set(originalData);
            await originalDocRef.delete();
            await logSistem(`Importação XLSX: município renomeado de ${municipio} para ${novo_municipio} - UF: ${estado}`, newDocId);
          }
          continue;
        }

        if (!email || !area || !estado || !municipio) continue;

        const areaKey = `email_${area.toLowerCase()}`;
        const docId = `${estado}-${municipio}`;
        const docRef = firebase.firestore().collection("contact_email").doc(docId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
          const docData = docSnap.data();
          const currentEmails = docData[areaKey] || [];
          const updatedEmails = Array.from(new Set([...currentEmails, email.trim()]));
          await docRef.update({ [areaKey]: updatedEmails });
        } else {
          await docRef.set({
            estado,
            municipio,
            email_oem: [],
            email_patrimonial: [],
            email_predial: [],
            [areaKey]: [email.trim()],
          });
        }

        await logSistem(`Importação XLSX: e-mail ${email} adicionado à área ${area} - UF: ${estado}, Município: ${municipio}`, docId);
      }

      toast.success("Upload concluído com sucesso!");
      loadData();
    } catch (error) {
      console.error("Erro ao importar XLSX:", error);
      toast.error("Erro no upload. Verifique o arquivo.");
    } finally {
      setLoadingUpload(false);
      e.target.value = null;
    }
  };

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
      <Header name="Contato">
      </Header>
      <div className="content">

        <Box display="flex" gap={2} mb={2} sx={{ backgroundColor: "rgba(248, 248, 248, 0.64)", padding: 2, borderRadius: 1, margin: "20px 15px" }}>
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
          <input
            type="file"
            accept=".xlsx, .xls"
            id="upload-xlsx"
            style={{ display: "none" }}
            onChange={handleUploadXLSX}
          />

          <label htmlFor="upload-xlsx">
            <Button
              variant="outlined"
              component="span"
              startIcon={<AddIcon />}
              disabled={loadingUpload}
            >
              {loadingUpload ? "Carregando..." : "Upload XLSX"}
            </Button>
          </label>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteSelected}
          >
            Remover Selecionados
          </Button>
        </Box>

        {paginatedEstados.map((estado) => (
          <Accordion key={estado} sx={{margin: "0px 15px"}}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Checkbox
                checked={!!selectedEstados[estado]}
                onChange={() => handleSelectEstado(estado)}
              />
              <Typography>{estado}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {getMunicipiosPaginados(estado).map((item) => (
                <Accordion key={item.id}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Checkbox
                      checked={!!selectedMunicipios[estado]?.[item.municipio]}
                      onChange={() => handleSelectMunicipio(estado, item.municipio)}
                    />
                    <Typography>{item.municipio}</Typography>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditMunicipio(item);
                      }}
                      size="small"
                      sx={{ ml: 1 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateMunicipio(item);
                      }}
                      size="small"
                      sx={{ ml: 1 }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </AccordionSummary>
                  <AccordionDetails>
                    {["OEM", "Patrimonial", "Predial", "Logistica"].map((tipo) => {
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
          open={editMunicipioOpen}
          onClose={() => setEditMunicipioOpen(false)}
        >
          <DialogTitle>Editar Nome do Município</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              margin="dense"
              label="Nome Atual"
              value={currentMunicipio}
              disabled
            />
            <TextField
              fullWidth
              margin="dense"
              label="Novo Nome"
              value={newMunicipioName}
              onChange={(e) => setNewMunicipioName(e.target.value)}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditMunicipioOpen(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleSaveMunicipioEdit}>
              Salvar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={duplicateOpen}
          onClose={() => setDuplicateOpen(false)}
        >
          <DialogTitle>Duplicar Município</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              margin="dense"
              label="Município Original"
              value={docToEdit?.municipio || ''}
              disabled
            />
            <TextField
              fullWidth
              margin="dense"
              label="Novo Nome para Cópia"
              value={duplicateMunicipioName}
              onChange={(e) => setDuplicateMunicipioName(e.target.value)}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDuplicateOpen(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleSaveDuplicateMunicipio}>
              Duplicar
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
              onInputChange={(event, newInputValue) => setNewMunicipio(newInputValue)}
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