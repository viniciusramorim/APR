import { useEffect, useState, useContext, useCallback } from "react";
import firebase from "../../services/firebaseConnection";
import {
  Box,
  TextField,
  Button,
  Container,
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
  Chip,
  Paper,
  Stack,
  Divider,
  InputAdornment,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import DeleteSweepRoundedIcon from "@mui/icons-material/DeleteSweepRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import Header from "../../components/Header";
import { read, utils } from "xlsx";
import { toast } from "react-toastify";
import { AuthContext } from "../../contexts/auth";
import { addBodyClass } from "../../components/BodyClassInsert/bodyClassInserter";
import "./contactEmail.scss";

const mapaRegioes = {
  RJ_ES_MG: ["RJ", "ES", "MG"],
  SP: ["SP"],
  CO_N: ["DF", "GO", "MT", "MS", "TO", "PA", "AM", "RO", "RR", "AC", "AP"],
  SUL: ["RS", "SC", "PR"],
  NE: ["BA", "SE", "AL", "PE", "PB", "RN", "CE", "PI", "MA"],
};

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
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const pageSize = 10;
  const firestoreBatchLimit = 400;
  const areaOptions = [
    "OEM",
    "Patrimonial",
    "Predial",
    "Logistica",
    "Armazenamento",
    "Transporte",
  ];

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
  const bulkTargetDocs = filteredDocs;

  const estadoKeys = Object.keys(groupedByEstado).sort();

  const paginatedEstados = estadoKeys.slice(
    (estadoPage - 1) * pageSize,
    estadoPage * pageSize
  );
  const totalMunicipios = docs.length;
  const totalEstados = estadoKeys.length;
  const totalEmails = docs.reduce((acc, item) => {
    return (
      acc +
      (item.email_oem?.length || 0) +
      (item.email_patrimonial?.length || 0) +
      (item.email_predial?.length || 0) +
      (item.email_logistica?.length || 0) +
      (item.email_armazenamento?.length || 0) +
      (item.email_transporte?.length || 0)
    );
  }, 0);

  const parseEmails = (value) =>
    Array.from(
      new Set(
        value
          .split(",")
          .map((email) => email.trim())
          .filter((email) => email)
      )
    );

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
    setDuplicateMunicipioName(`${doc.municipio} - Copia`);
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
        email_logistica: docToEdit.email_logistica || [],
        email_armazenamento: docToEdit.email_armazenamento || [],
        email_transporte: docToEdit.email_transporte || [],
      });
      await firebase.firestore().collection("contact_email").doc(docToEdit.id).delete();
      await logSistem("Nome do municipio alterado", newDocId);

      setEditMunicipioOpen(false);
      loadData();
      toast.success("Municipio atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar municipio:", error);
      toast.error("Erro ao atualizar municipio.");
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
        email_logistica: [...(docToEdit.email_logistica || [])],
        email_armazenamento: [...(docToEdit.email_armazenamento || [])],
        email_transporte: [...(docToEdit.email_transporte || [])],
      });
      await logSistem("Municipio duplicado", newDocId);

      setDuplicateOpen(false);
      loadData();
      toast.success("Municipio duplicado com sucesso!");
    } catch (error) {
      console.error("Erro ao duplicar municipio:", error);
      toast.error("Erro ao duplicar municipio.");
    }
  };

  const handleAddEmailToAll = async () => {
    const emails = parseEmails(emailToAdd);

    if (!emails.length || !areaToAdd) {
      toast.error("Por favor, insira ao menos um e-mail e selecione uma area.");
      return;
    }

    if (!bulkTargetDocs.length) {
      toast.error("Nenhum municipio encontrado para aplicar esta acao.");
      return;
    }

    const areaKey = `email_${areaToAdd.toLowerCase()}`;
    let updatedCount = 0;

    for (let i = 0; i < bulkTargetDocs.length; i += firestoreBatchLimit) {
      const batch = firebase.firestore().batch();
      const chunk = bulkTargetDocs.slice(i, i + firestoreBatchLimit);
      let chunkUpdatedCount = 0;

      for (const doc of chunk) {
        const docRef = firebase.firestore().collection("contact_email").doc(doc.id);
        const updatedEmails = Array.from(new Set([...(doc[areaKey] || []), ...emails]));

        if (updatedEmails.length !== (doc[areaKey] || []).length) {
          batch.update(docRef, { [areaKey]: updatedEmails });
          updatedCount += 1;
          chunkUpdatedCount += 1;
        }
      }

      if (chunkUpdatedCount > 0) {
        await batch.commit();
      }
    }

    await logSistem(
      `E-mails adicionados em massa (${emails.join(", ")}) na area ${areaToAdd} para ${bulkTargetDocs.length} municipio(s)`,
      `bulk-${areaKey}`
    );

    setBulkAddOpen(false);
    setEmailToAdd("");
    setAreaToAdd("");
    await loadData();

    if (updatedCount === 0) {
      toast.info("Os municipios selecionados ja possuem este(s) e-mail(s) nesta area.");
      return;
    }

    toast.success(
      `${updatedCount} municipio(s) atualizado(s) com sucesso na area ${areaToAdd}!`
    );
  };

  const loadData = useCallback(async () => {
    const isAdmin = user?.nivel === "administrador";
    const estadosPermitidos = mapaRegioes[user?.regional] || [];
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
  }, [user?.nivel, user?.regional]);

  useEffect(() => {
    addBodyClass("page-contact-email");
    loadData();
  }, [loadData]);

  const handleDeleteEmail = async (docId, email, tipo) => {
    const key = `email_${tipo.toLowerCase()}`;
    const ref = firebase.firestore().collection("contact_email").doc(docId);
    const snap = await ref.get();
    if (!snap.exists) return;
    const data = snap.data();
    data[key] = (data[key] || []).filter((e) => e !== email);
    await ref.set(data);
    const [uf, municipio] = docId.split("-");
    await logSistem(`E-mail removido (${email}) da area ${tipo} - UF: ${uf}, Municipio: ${municipio}`, docId);
    loadData();
  };

  const handleSave = async () => {
    if (!editDocId || !editTipo || !editEmail) return;
    const docRef = firebase.firestore().collection("contact_email").doc(editDocId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return;
    const data = docSnap.data();
    const tipos = [
      "email_oem",
      "email_patrimonial",
      "email_predial",
      "email_logistica",
      "email_armazenamento",
      "email_transporte",
    ];

    tipos.forEach((key) => {
      data[key] = (data[key] || []).filter((e) => e !== editEmail);
    });

    const targetKey = `email_${editTipo.toLowerCase()}`;
    if (!data[targetKey]) data[targetKey] = [];
    if (!data[targetKey].includes(editEmail)) {
      data[targetKey].push(editEmail);
    }

    await docRef.set(data);
    await logSistem(
      `E-mail editado (${editEmail}) na area ${editTipo} - UF: ${editEstado}, Municipio: ${editMunicipio}`,
      editDocId
    );
    setOpen(false);
    loadData();
  };

  const handleCreate = async () => {
    const docId = `${newEstado}-${newMunicipio}`;
    const docRef = firebase.firestore().collection("contact_email").doc(docId);
    const docSnap = await docRef.get();
    const targetKey = `email_${newTipo.toLowerCase()}`;
    const emails = parseEmails(newEmails);

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
        email_logistica: [],
        email_armazenamento: [],
        email_transporte: [],
        [targetKey]: emails,
      };
      await docRef.set(newData);
    }

    await logSistem(
      `Novo e-mail criado/atualizado (${emails.join(", ")}) na area ${newTipo} - UF: ${newEstado}, Municipio: ${newMunicipio}`,
      docId
    );
    setCreateOpen(false);
    loadData();
  };

  const handleDeleteSelected = async () => {
    const batch = firebase.firestore().batch();

    docs.forEach((doc) => {
      if (selectedEstados[doc.estado] || selectedMunicipios[doc.estado]?.[doc.municipio]) {
        const docRef = firebase.firestore().collection("contact_email").doc(doc.id);
        batch.delete(docRef);
        logSistem(`Documento deletado - UF: ${doc.estado}, Municipio: ${doc.municipio}`, doc.id);
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
            await logSistem(
              `Importacao XLSX: municipio renomeado de ${municipio} para ${novo_municipio} - UF: ${estado}`,
              newDocId
            );
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
            email_logistica: [],
            email_armazenamento: [],
            email_transporte: [],
            [areaKey]: [email.trim()],
          });
        }

        await logSistem(
          `Importacao XLSX: e-mail ${email} adicionado a area ${area} - UF: ${estado}, Municipio: ${municipio}`,
          docId
        );
      }

      toast.success("Upload concluido com sucesso!");
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
      <Header name="Contato" subtitle="Gestao de e-mails por estado, municipio e equipe"></Header>
      <div className="content">
        <Container maxWidth={false} disableGutters className="contact-email-shell">
          <Paper className="contact-email-hero" elevation={0}>
            <Box className="contact-email-hero-copy">
              <span className="contact-email-eyebrow">APR Digital</span>
              <Typography variant="h4" className="contact-email-title">
                Central de contatos por regiao
              </Typography>
              <Typography variant="body1" className="contact-email-subtitle">
                Organize os destinatarios por estado, municipio e area responsavel
                com uma visao mais clara para manutencao e auditoria.
              </Typography>
            </Box>

            <Box className="contact-email-summary-grid">
              <Paper className="contact-email-summary-card" variant="outlined">
                <span>Estados</span>
                <strong>{totalEstados}</strong>
                <small>agrupamentos ativos</small>
              </Paper>
              <Paper className="contact-email-summary-card" variant="outlined">
                <span>Municipios</span>
                <strong>{totalMunicipios}</strong>
                <small>registros carregados</small>
              </Paper>
              <Paper className="contact-email-summary-card" variant="outlined">
                <span>E-mails</span>
                <strong>{totalEmails}</strong>
                <small>contatos vinculados</small>
              </Paper>
            </Box>
          </Paper>

          <Paper className="contact-email-toolbar" elevation={0}>
            <Box className="contact-email-toolbar-top">
              <Box>
                <Typography variant="h6" className="contact-email-section-title">
                  Filtros e acoes
                </Typography>
                <Typography variant="body2" className="contact-email-section-subtitle">
                  Busque registros especificos e mantenha a base atualizada com menos cliques.
                </Typography>
              </Box>

              <Chip
                icon={<MailOutlineRoundedIcon />}
                label={`${filteredDocs.length} resultado(s)`}
                color="secondary"
                variant="outlined"
              />
            </Box>

            <Box className="contact-email-toolbar-grid">
              <TextField
                label="Filtrar por Estado"
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Filtrar por Municipio"
                value={filterMunicipio}
                onChange={(e) => setFilterMunicipio(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PlaceOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateOpen(true)}
                className="contact-email-primary-btn"
              >
                Novo registro
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
                  startIcon={<UploadFileRoundedIcon />}
                  disabled={loadingUpload}
                  className="contact-email-secondary-btn"
                >
                  {loadingUpload ? "Carregando..." : "Upload XLSX"}
                </Button>
              </label>

              <Button
                variant="outlined"
                startIcon={<MailOutlineRoundedIcon />}
                onClick={() => setBulkAddOpen(true)}
                className="contact-email-secondary-btn"
              >
                Adicionar em massa
              </Button>

              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteSweepRoundedIcon />}
                onClick={handleDeleteSelected}
                className="contact-email-danger-btn"
              >
                Remover selecionados
              </Button>
            </Box>
          </Paper>

          <Box className="contact-email-list">
            {paginatedEstados.map((estado) => (
              <Accordion key={estado} className="contact-email-estado-card" disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box className="contact-email-estado-summary">
                    <Checkbox
                      checked={!!selectedEstados[estado]}
                      onChange={() => handleSelectEstado(estado)}
                    />
                    <Box className="contact-email-estado-copy">
                      <Typography className="contact-email-estado-title">{estado}</Typography>
                      <Typography variant="body2" className="contact-email-estado-subtitle">
                        {groupedByEstado[estado]?.length || 0} municipio(s)
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1.5}>
                    {getMunicipiosPaginados(estado).map((item) => (
                      <Accordion key={item.id} className="contact-email-municipio-card" disableGutters>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box className="contact-email-municipio-summary">
                            <Checkbox
                              checked={!!selectedMunicipios[estado]?.[item.municipio]}
                              onChange={() => handleSelectMunicipio(estado, item.municipio)}
                            />
                            <Box className="contact-email-municipio-copy">
                              <Typography className="contact-email-municipio-title">
                                {item.municipio}
                              </Typography>
                              <Typography variant="body2" className="contact-email-municipio-subtitle">
                                {areaOptions.reduce(
                                  (acc, tipo) => acc + (item[`email_${tipo.toLowerCase()}`]?.length || 0),
                                  0
                                )} e-mail(s)
                              </Typography>
                            </Box>
                            <Box className="contact-email-inline-actions">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditMunicipio(item);
                                }}
                                size="small"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateMunicipio(item);
                                }}
                                size="small"
                              >
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box className="contact-email-area-grid">
                            {areaOptions.map((tipo) => {
                              const key = `email_${tipo.toLowerCase()}`;
                              return (
                                <Paper key={tipo} className="contact-email-area-card" variant="outlined">
                                  <Box className="contact-email-area-header">
                                    <Typography fontWeight="bold">Equipe {tipo}</Typography>
                                    <Chip
                                      size="small"
                                      label={`${(item[key] || []).length} e-mail(s)`}
                                      variant="outlined"
                                    />
                                  </Box>
                                  <Divider sx={{ mb: 1.5 }} />
                                  <List dense disablePadding>
                                    {(item[key] || []).length === 0 && (
                                      <ListItem disablePadding sx={{ py: 1 }}>
                                        <ListItemText primary="Nenhum e-mail cadastrado." />
                                      </ListItem>
                                    )}
                                    {(item[key] || []).map((email, index) => (
                                      <ListItem
                                        key={index}
                                        className="contact-email-email-item"
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
                                </Paper>
                              );
                            })}
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    ))}

                    {groupedByEstado[estado].length >
                      (municipioPages[estado] || 1) * pageSize && (
                        <Box textAlign="center" mt={1}>
                          <Button onClick={() => loadMoreMunicipios(estado)}>
                            Carregar mais municipios
                          </Button>
                        </Box>
                      )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>

          <Box display="flex" justifyContent="center" mt={3} mb={4}>
            <Pagination
              count={Math.ceil(estadoKeys.length / pageSize)}
              page={estadoPage}
              onChange={(e, value) => setEstadoPage(value)}
            />
          </Box>
        </Container>

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
              value={editTipo}
              onChange={(e) => setEditTipo(e.target.value)}
              displayEmpty
              sx={{ mt: 2 }}
            >
              <MenuItem disabled value="">
                Selecione a area responsavel
              </MenuItem>
              {areaOptions.map((tipo) => (
                <MenuItem key={tipo} value={tipo}>
                  {tipo}
                </MenuItem>
              ))}
            </Select>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleSave}>
              Salvar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={editMunicipioOpen} onClose={() => setEditMunicipioOpen(false)}>
          <DialogTitle>Editar nome do municipio</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              margin="dense"
              label="Nome atual"
              value={currentMunicipio}
              disabled
            />
            <TextField
              fullWidth
              margin="dense"
              label="Novo nome"
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

        <Dialog open={duplicateOpen} onClose={() => setDuplicateOpen(false)}>
          <DialogTitle>Duplicar municipio</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              margin="dense"
              label="Municipio original"
              value={docToEdit?.municipio || ""}
              disabled
            />
            <TextField
              fullWidth
              margin="dense"
              label="Novo nome para copia"
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

        <Dialog open={bulkAddOpen} onClose={() => setBulkAddOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Adicionar e-mail para varios municipios</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              O e-mail sera aplicado aos {bulkTargetDocs.length} municipio(s) do filtro atual.
            </Typography>
            <Select
              fullWidth
              value={areaToAdd}
              onChange={(e) => setAreaToAdd(e.target.value)}
              displayEmpty
            >
              <MenuItem disabled value="">
                Selecione a area responsavel
              </MenuItem>
              {areaOptions.map((tipo) => (
                <MenuItem key={tipo} value={tipo}>
                  {tipo}
                </MenuItem>
              ))}
            </Select>
            <TextField
              fullWidth
              margin="dense"
              label="E-mail(s)"
              helperText="Voce pode informar mais de um e-mail separado por virgula."
              value={emailToAdd}
              onChange={(e) => setEmailToAdd(e.target.value)}
              multiline
              minRows={3}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkAddOpen(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleAddEmailToAll}>
              Aplicar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth>
          <DialogTitle>Novo registro</DialogTitle>
          <DialogContent>
            <Select
              fullWidth
              value={newEstado}
              onChange={(e) => {
                setNewEstado(e.target.value);
                setNewMunicipio("");
              }}
              displayEmpty
            >
              <MenuItem disabled value="">
                Selecione um estado
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
                  label="Municipio (existente ou novo)"
                  fullWidth
                />
              )}
              sx={{ mt: 2 }}
            />
            <Select
              fullWidth
              value={newTipo}
              onChange={(e) => setNewTipo(e.target.value)}
              displayEmpty
              sx={{ mt: 2 }}
            >
              <MenuItem disabled value="">
                Selecione a area responsavel
              </MenuItem>
              {areaOptions.map((tipo) => (
                <MenuItem key={tipo} value={tipo}>
                  {tipo}
                </MenuItem>
              ))}
            </Select>
            <TextField
              fullWidth
              margin="dense"
              label="E-mails (separados por virgula)"
              value={newEmails}
              onChange={(e) => setNewEmails(e.target.value)}
              multiline
              minRows={3}
              sx={{ mt: 2 }}
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
