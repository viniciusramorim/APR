import { useEffect, useState } from 'react';
import firebase from '../../services/firebaseConnection';
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
  Pagination
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function ContactEmailAccordionView() {
  const [data, setData] = useState([]);
  const [filterEstado, setFilterEstado] = useState('');
  const [filterMunicipio, setFilterMunicipio] = useState('');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formEstado, setFormEstado] = useState('');
  const [formMunicipio, setFormMunicipio] = useState('');
  const [formEmails, setFormEmails] = useState('');
  const [allEstados, setAllEstados] = useState([]);
  const [allMunicipios, setAllMunicipios] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const snapshot = await firebase.firestore().collection('contact_email').get();
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setData(list);

    const estadosSet = new Set();
    const municipiosSet = new Set();
    list.forEach(item => {
      estadosSet.add(item.estado);
      municipiosSet.add(item.municipio);
    });
    setAllEstados(Array.from(estadosSet).sort());
    setAllMunicipios(Array.from(municipiosSet).sort());
  };

  const handleEdit = (record) => {
    setEditId(record.id);
    setFormEstado(record.estado);
    setFormMunicipio(record.municipio);
    setFormEmails(record.emails.join(', '));
    setOpen(true);
  };

  const handleCreate = () => {
    setEditId(null);
    setFormEstado('');
    setFormMunicipio('');
    setFormEmails('');
    setOpen(true);
  };

  const handleSave = async () => {
    const emails = formEmails.split(',').map(e => e.trim()).filter(e => e !== '');
    const docId = `${formEstado}-${formMunicipio}`;
    await firebase.firestore().collection('contact_email').doc(docId).set({
      estado: formEstado,
      municipio: formMunicipio,
      emails
    });
    setOpen(false);
    fetchData();
  };

  const filteredData = data.filter(item => {
    const estadoMatch = filterEstado === '' || item.estado.toLowerCase().includes(filterEstado.toLowerCase());
    const municipioMatch = filterMunicipio === '' || item.municipio.toLowerCase().includes(filterMunicipio.toLowerCase());
    return estadoMatch && municipioMatch;
  });

  const groupedByEstado = filteredData.reduce((acc, item) => {
    if (!acc[item.estado]) acc[item.estado] = [];
    acc[item.estado].push(item);
    return acc;
  }, {});

  const estadosUnicosPaginados = Object.keys(groupedByEstado).sort().slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.ceil(Object.keys(groupedByEstado).length / itemsPerPage);

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h5" gutterBottom>Gerenciar E-mails por Estado e Município</Typography>

      <Box display="flex" gap={2} mb={2}>
        <TextField
          label="Filtrar por Estado"
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
        />
        <TextField
          label="Filtrar por Município"
          value={filterMunicipio}
          onChange={(e) => setFilterMunicipio(e.target.value)}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Novo Registro
        </Button>
      </Box>

      {estadosUnicosPaginados.map((estado) => (
        <Accordion key={estado}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{estado}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {groupedByEstado[estado].map((item) => (
              <Accordion key={item.id}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" justifyContent="space-between" width="100%">
                    <Typography>{item.municipio}</Typography>
                    <IconButton size="small" onClick={() => handleEdit(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {item.emails.map((email, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={email} />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}

      <Box display="flex" justifyContent="center" mt={4}>
        <Pagination count={totalPages} page={currentPage} onChange={(e, value) => setCurrentPage(value)} />
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>{editId ? 'Editar Registro' : 'Novo Registro'}</DialogTitle>
        <DialogContent>
          <Select
            fullWidth
            value={formEstado}
            onChange={(e) => setFormEstado(e.target.value)}
            displayEmpty
            margin="normal"
          >
            <MenuItem disabled value="">
              Selecione um Estado
            </MenuItem>
            {allEstados.map((estado) => (
              <MenuItem key={estado} value={estado}>{estado}</MenuItem>
            ))}
          </Select>

          <Select
            fullWidth
            value={formMunicipio}
            onChange={(e) => setFormMunicipio(e.target.value)}
            displayEmpty
            margin="normal"
          >
            <MenuItem disabled value="">
              Selecione um Município
            </MenuItem>
            {allMunicipios.map((municipio) => (
              <MenuItem key={municipio} value={municipio}>{municipio}</MenuItem>
            ))}
          </Select>

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
          <Button variant="contained" onClick={handleSave}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
