import { useState } from "react";
import { FiClipboard, FiEdit, FiSave } from "react-icons/fi";
import firebase from "../../services/firebaseConnection";
import Header from "../../components/Header";
import Title from "../../components/Title";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Pagination from "@mui/material/Pagination";
import CircularProgress from "@mui/material/CircularProgress";
import "./index.scss";

export default function Sites() {
  const [sites, setSites] = useState([]);
  const [filteredSites, setFilteredSites] = useState([]);
  const [filters, setFilters] = useState({ name: "", sigla: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});
  const itemsPerPage = 25;

  async function loadSites() {
    if (!filters.name && !filters.sigla) {
      setSites([]);
      setFilteredSites([]);
      return;
    }

    setIsLoading(true);
    try {
      const collection = firebase.firestore().collection("sites");
      let query = collection;

      // Aplica os filtros de busca
      if (filters.name) {
        query = query
          .where("Nome", ">=", filters.name)
          .where("Nome", "<=", filters.name + "\uf8ff");
      }
      if (filters.sigla) {
        query = query
          .where("Sigla", ">=", filters.sigla)
          .where("Sigla", "<=", filters.sigla + "\uf8ff");
      }

      const snapshot = await query.get();
      const sitesArray = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        if (data.lastUpdate && data.lastUpdate.toDate) {
          data.lastUpdate = data.lastUpdate.toDate().toLocaleString();
        }
        sitesArray.push({
          id: doc.id,
          ...data,
        });
      });

      setSites(sitesArray);

      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedSites = sitesArray.slice(
        startIndex,
        startIndex + itemsPerPage
      );
      setFilteredSites(paginatedSites);
    } catch (error) {
      console.error("Erro ao carregar sites:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value.toUpperCase(),
    }));
  }

  function handleSearch() {
    setCurrentPage(1);
    loadSites();
  }

  function handleClearFilters() {
    setFilters({ name: "", sigla: "" });
    setSites([]);
    setFilteredSites([]);
  }

  function handlePageChange(event, value) {
    setCurrentPage(value);

    const startIndex = (value - 1) * itemsPerPage;
    const paginatedSites = sites.slice(startIndex, startIndex + itemsPerPage);
    setFilteredSites(paginatedSites);
  }

  function handleEditClick(field, value) {
    setEditingField(field);
    setEditValues({ ...editValues, [field]: value });
  }

  function handleEditChange(event) {
    const { name, value } = event.target;
    setEditValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  }

  async function handleSaveEdit(siteId, field) {
    try {
      await firebase
        .firestore()
        .collection("sites")
        .doc(siteId)
        .update({
          [field]: editValues[field],
        });
      alert("Campo atualizado com sucesso!");
      setEditingField(null);
      loadSites();
    } catch (error) {
      console.error("Erro ao salvar edição:", error);
    }
  }

  // campos que serão exibidos
  const fieldsToShow = [
    "Nome",
    "Endereco",
    "Bairro",
    "Cidade",
    "CEP",
    "Situacao",
    "Latitude",
    "Longitude",
    "Sigla",
    "Tipo Contrato",
  ];

  return (
    <div>
      <Header />

      <div className="content">
        <Title name="Sites">
          <FiClipboard size={25} />
        </Title>

        <div className="filters">
          <TextField
            size="small"
            fullWidth
            label="Nome"
            name="name"
            value={filters.name}
            onChange={handleFilterChange}
            style={{ textTransform: "uppercase" }}
          />
          <TextField
            size="small"
            fullWidth
            label="Sigla"
            name="sigla"
            value={filters.sigla}
            onChange={handleFilterChange}
            style={{ textTransform: "uppercase" }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            style={{ background: "#7b1fa2" }}
            fullWidth
          >
            Buscar
          </Button>
          <Button
            variant="outlined"
            onClick={handleClearFilters}
            style={{
              marginLeft: "10px",
              borderColor: "#7b1fa2",
              color: "#7b1fa2",
            }}
            fullWidth
          >
            Limpar Filtros
          </Button>
        </div>

        {isLoading ? (
          <div
            className="loading-indicator"
            style={{ textAlign: "center", marginTop: "20px" }}
          >
            <CircularProgress />
            <p>Carregando...</p>
          </div>
        ) : (
          <div className="accordion-container">
            {filteredSites.map((site) => (
              <Accordion key={site.id}>
                <AccordionSummary>
                  {site.Sigla} - {site.Nome} - {site.Estado} - {site.Cidade}
                </AccordionSummary>
                <AccordionDetails>
                  <div className="site-details">
                    <ul>
                      {fieldsToShow.map((field) => (
                        <li key={field}>
                          {editingField === field ? (
                            <>
                              <TextField
                                name={field}
                                value={editValues[field] || site[field]}
                                onChange={handleEditChange}
                                size="small"
                                style={{ width: "90%" }}
                              />
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleSaveEdit(site.id, field)}
                                startIcon={<FiSave />}
                                style={{
                                  marginLeft: "10px",
                                  background: "#43057e",
                                }}
                              >
                                Salvar
                              </Button>
                            </>
                          ) : (
                            <>
                              {field}: {site[field]}
                              <FiEdit
                                style={{
                                  marginLeft: "10px",
                                  cursor: "pointer",
                                }}
                                onClick={() =>
                                  handleEditClick(field, site[field])
                                }
                              />
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </AccordionDetails>
              </Accordion>
            ))}
          </div>
        )}

        {sites.length > 0 && (
          <Pagination
            count={Math.ceil(sites.length / itemsPerPage)}
            page={currentPage}
            onChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
