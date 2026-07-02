import React, { useEffect, useState, useContext } from "react";
import {
  FiEdit,
  FiMapPin,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import firebase from "../../services/firebaseConnection";
import Header from "../../components/Header";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Pagination from "@mui/material/Pagination";
import CircularProgress from "@mui/material/CircularProgress";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import * as geofire from "geofire-common";
import { AuthContext } from "../../contexts/auth";
import ModalSiteLogs from "../../components/Modal_Log_Sites";
import "../Sites/index.scss";
import { addBodyClass } from "../../components/BodyClassInsert/bodyClassInserter";

export default function Sites() {
  const { logSistem } = useContext(AuthContext);
  const [sites, setSites] = useState([]);
  const [filteredSites, setFilteredSites] = useState([]);
  const [filters, setFilters] = useState({ name: "", sigla: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});
  const itemsPerPage = 25;

  useEffect(() => {
    addBodyClass("page-sites");
  }, []);

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
      setFilteredSites(sitesArray.slice(startIndex, startIndex + itemsPerPage));
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
    setFilteredSites(sites.slice(startIndex, startIndex + itemsPerPage));
  }

  function handleEditClick(field, value) {
    setEditingField(field);
    setEditValues({ ...editValues, [field]: value });
  }

  function handleCancelEdit() {
    setEditingField(null);
    setEditValues({});
  }

  function handleEditChange(event) {
    const { name, value } = event.target;

    if (name === "Latitude" || name === "Longitude") {
      const numericValue = value.replace(/[^0-9.-]/g, "");

      if (numericValue.length > 10) return;

      const numberValue = parseFloat(numericValue);
      if (
        (name === "Latitude" && (numberValue < -90 || numberValue > 90)) ||
        (name === "Longitude" && (numberValue < -180 || numberValue > 180))
      ) {
        return;
      }

      setEditValues((prevValues) => ({
        ...prevValues,
        [name]: numericValue,
      }));
      return;
    }

    setEditValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  }

  async function handleSaveEdit(siteId) {
    try {
      const siteDoc = await firebase
        .firestore()
        .collection("sites")
        .doc(siteId)
        .get();
      const oldData = siteDoc.data();

      const updatedData = { ...editValues };
      const latitude = parseFloat(editValues.Latitude);
      const longitude = parseFloat(editValues.Longitude);

      if (!isNaN(latitude) && !isNaN(longitude)) {
        updatedData.geohash = geofire.geohashForLocation([latitude, longitude]);
      }

      await firebase
        .firestore()
        .collection("sites")
        .doc(siteId)
        .update(updatedData);

      for (const field in updatedData) {
        if (oldData[field] !== updatedData[field]) {
          await logSistem(
            `O site ${siteDoc.data().Nome} teve ${field} alterado de "${oldData[field]}" para "${updatedData[field]}"`,
            siteId
          );
        }
      }

      alert("Campo atualizado com sucesso!");
      setEditingField(null);
      loadSites();
    } catch (error) {
      console.error("Erro ao salvar edicao:", error);
      alert("Erro ao salvar as alteracoes. Tente novamente.");
    }
  }

  async function handleDeleteSite(siteId) {
    try {
      if (!siteId) {
        console.error("ID do site nao pode estar vazio.");
        alert("Erro: ID do site nao pode estar vazio.");
        return;
      }

      const confirmDelete = window.confirm(
        "Tem certeza de que deseja deletar este site? Esta acao nao pode ser desfeita."
      );

      if (confirmDelete) {
        await firebase.firestore().collection("sites").doc(siteId).delete();

        alert("Site deletado com sucesso!");

        setSites((prevSites) => prevSites.filter((site) => site.id !== siteId));
        setFilteredSites((prevFilteredSites) =>
          prevFilteredSites.filter((site) => site.id !== siteId)
        );
      }
    } catch (error) {
      console.error("Erro ao deletar o site:", error);
      alert("Erro ao deletar o site. Por favor, tente novamente.");
    }
  }

  const fieldLabels = {
    Nome: "Nome",
    Endereco: "Endereco",
    Complemento: "Complemento",
    Bairro: "Bairro",
    Cidade: "Cidade",
    Estado: "Estado",
    CEP: "CEP",
    Situacao: "Situacao",
    Latitude: "Latitude",
    Longitude: "Longitude",
    Sigla: "Sigla",
    TipoContrato: "Tipo de Contrato",
    CtCritica: "CT Critica",
    Detentora: "Detentora",
    ErbCritica: "ERB Critica",
    MapaCalor: "Mapa Calor",
    NonStop: "NonStop",
    Sigla_GVT: "Sigla GVT",
    critical: "Critical",
    tipoSite: "Tipo de Site",
    Operador_logistico: "Operador Logistico",
    Cobertura_Seguro: "Cobertura Seguro",
  };

  const fieldsToShow = Object.keys(fieldLabels);
  const hasFilters = Boolean(filters.name || filters.sigla);

  return (
    <div className="page-sites">
      <Header
        name="Gerenciamento de Sites"
        subtitle="Cadastro e edicao de sites"
      />

      <main className="content sites-page-content">
        <section className="sites-toolbar">
          <div className="sites-toolbar-header">
            <div>
              <span className="sites-kicker">Consulta de cadastro</span>
              <h2>Sites</h2>
            </div>

            <div className="sites-result-pill">
              <strong>{sites.length}</strong>
              <span>{sites.length === 1 ? "resultado" : "resultados"}</span>
            </div>
          </div>

          <div className="filters">
            <TextField
              size="small"
              fullWidth
              label="Sigla"
              name="sigla"
              value={filters.sigla}
              onChange={handleFilterChange}
              className="sites-filter-field"
            />
            <TextField
              size="small"
              fullWidth
              label="Nome"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              className="sites-filter-field"
            />

            <Button
              variant="contained"
              onClick={handleSearch}
              fullWidth
              className="sites-search-button"
              startIcon={<FiSearch />}
            >
              Buscar
            </Button>
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              fullWidth
              className="sites-clear-button"
              startIcon={<FiX />}
            >
              Limpar
            </Button>
          </div>
        </section>

        {isLoading ? (
          <section className="sites-state">
            <CircularProgress />
            <p>Carregando...</p>
          </section>
        ) : !hasFilters ? (
          <section className="sites-state sites-state--empty">
            <FiSearch />
            <h3>Busque um site</h3>
            <p>Use a sigla ou o nome para consultar o cadastro.</p>
          </section>
        ) : filteredSites.length === 0 ? (
          <section className="sites-state sites-state--empty">
            <FiMapPin />
            <h3>Nenhum site encontrado</h3>
            <p>Revise os filtros e tente novamente.</p>
          </section>
        ) : (
          <section className="accordion-container">
            {filteredSites.map((site) => (
              <Accordion key={site.id} className="site-card">
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <div className="site-summary">
                    <div className="site-summary-main">
                      <span className="site-sigla">
                        {site.Sigla || "Sem sigla"}
                      </span>
                      <div>
                        <h3>{site.Nome || "Site sem nome"}</h3>
                        <p>
                          <FiMapPin />
                          {[site.Cidade, site.Estado]
                            .filter(Boolean)
                            .join(" / ") || "Localizacao nao informada"}
                        </p>
                      </div>
                    </div>

                    <div className="site-summary-meta">
                      {site.tipoSite && <span>{site.tipoSite}</span>}
                      {site.Situacao && <span>{site.Situacao}</span>}
                    </div>

                    <div
                      className="site-actions"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <ModalSiteLogs siteId={site.id} />
                      <Button
                        variant="outlined"
                        size="small"
                        className="btn-delete"
                        onClick={() => handleDeleteSite(site.id)}
                        startIcon={<FiTrash2 />}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </AccordionSummary>

                <AccordionDetails>
                  <div className="site-details">
                    {fieldsToShow.map((field) => (
                      <div className="site-detail-item" key={field}>
                        <span className="site-detail-label">
                          {fieldLabels[field]}
                        </span>

                        {editingField === field ? (
                          <div className="site-edit-row">
                            <TextField
                              name={field}
                              value={editValues[field] || site[field] || ""}
                              onChange={handleEditChange}
                              size="small"
                              fullWidth
                            />
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleSaveEdit(site.id)}
                              className="site-save-button"
                            >
                              Salvar
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={handleCancelEdit}
                              className="site-cancel-button"
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div className="site-detail-value">
                            <span>{site[field] || "-"}</span>
                            <FiEdit
                              onClick={() =>
                                handleEditClick(field, site[field])
                              }
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionDetails>
              </Accordion>
            ))}
          </section>
        )}

        {sites.length > 0 && (
          <div className="sites-pagination">
            <Pagination
              count={Math.ceil(sites.length / itemsPerPage)}
              page={currentPage}
              onChange={handlePageChange}
            />
          </div>
        )}
      </main>
    </div>
  );
}
