import * as React from "react";
import PropTypes from "prop-types";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";
import ModalLog from "../../components/Modal_Logs";
import { Link } from "react-router-dom";
import { Close, Search } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import "./dashboard.scss";

// Função para salvar a página e número de linhas no localStorage
const savePageStateToLocalStorage = (page, rowsPerPage) => {
  localStorage.setItem("tablePageState", JSON.stringify({ page, rowsPerPage }));
};

// Função para carregar a página e número de linhas do localStorage
const loadPageStateFromLocalStorage = () => {
  const savedState = localStorage.getItem("tablePageState");
  return savedState ? JSON.parse(savedState) : { page: 0, rowsPerPage: 25 };
};

function TablePaginationActions(props) {
  const theme = useTheme();
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (event) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="primeira pagina"
      >
        {theme.direction === "rtl" ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="pagina anterior"
      >
        {theme.direction === "rtl" ? (
          <KeyboardArrowRight />
        ) : (
          <KeyboardArrowLeft />
        )}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="proxima pagina"
      >
        {theme.direction === "rtl" ? (
          <KeyboardArrowLeft />
        ) : (
          <KeyboardArrowRight />
        )}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="ultima pagina"
      >
        {theme.direction === "rtl" ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </Box>
  );
}

TablePaginationActions.propTypes = {
  count: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
};

export default function CustomPaginationActionsTable(props) {
  const { chamados, user, updateStatus } = props;

  const savedState = loadPageStateFromLocalStorage();
  const [page, setPage] = React.useState(savedState.page);
  const [rowsPerPage, setRowsPerPage] = React.useState(savedState.rowsPerPage);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    savePageStateToLocalStorage(newPage, rowsPerPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    savePageStateToLocalStorage(0, newRowsPerPage);
  };

  const columns = [
    {
      field: "apr_id",
      headerName: "APR ID",
      flex: 1,
      minWidth: 100,
      maxWidth: 100,
    },
    {
      field: "motivo_apr",
      headerName: "MOTIVO",
      flex: 1,
      minWidth: 140,
      maxWidth: 140,
    },
    {
      field: "sigla_uf",
      headerName: "Sigla-UF",
      flex: 1,
      minWidth: 140,
      maxWidth: 140,
      valueGetter: (params) =>
        `${params.row.site_id.Sigla} - ${params.row.site_id.Estado}`,
    },
    {
      field: "nome",
      headerName: "Nome",
      flex: 1,
      minWidth: 140,
      maxWidth: 140,
      valueGetter: (params) => params.row.site_id.Nome,
    },
    {
      field: "tipo_site",
      headerName: "Tipo Site",
      flex: 1,
      minWidth: 140,
      maxWidth: 140,
      valueGetter: (params) => params.row.site_id.tipoSite,
    },
    {
      field: "municipio",
      headerName: "Municipio",
      flex: 1,
      minWidth: 140,
      maxWidth: 140,
      valueGetter: (params) => params.row.site_id.Cidade,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      minWidth: 120,
      maxWidth: 120,
    },
    {
      field: "created",
      headerName: "Data",
      flex: 1,
      minWidth: 140,
      maxWidth: 140,
    },
    {
      field: "porcentagem_resp_area",
      headerName: "%",
      flex: 1,
      minWidth: 70,
      maxWidth: 70,
    },
    {
      field: "actions",
      headerName: "",
      sortable: false,
      flex: 1,
      minWidth: 140,
      maxWidth: 140,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" justifyContent="center">
          <Link to={`/open/${params.row.id}`}>
            <IconButton color="info">
              <Search />
            </IconButton>
          </Link>
          {(user.nivel === "administrador" || user.nivel === "revisor") && (
            <>
              <IconButton
                onClick={() => updateStatus(params.row.id, params.row.index)}
                color="error"
                aria-label="add an alarm"
              >
                <Close />
              </IconButton>
              <ModalLog chamadoId={params.row.id} />
            </>
          )}
        </Box>
      ),
    },
  ];

  const rows = chamados.map((row, index) => ({
    id: row.id,
    apr_id: row.apr_id,
    motivo_apr: row.motivo_apr,
    site_id: row.site_id,
    status: row.status,
    created: row.created,
    porcentagem_resp_area: row.porcentagem_resp_area,
    index,
  }));

  return (
    <Paper style={{ height: 500, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={rowsPerPage}
        rowsPerPageOptions={[25, 50, { label: "Todos", value: -1 }]}
        pagination
        paginationMode="client"
        onPageChange={(newPage) => handleChangePage(null, newPage)}
        onPageSizeChange={handleChangeRowsPerPage}
        page={page}
        sx={{
          "& .MuiDataGrid-cell": {
            display: "flex",
            alignItems: "center",
            justifyContent: "start",
            maxWidth: 140,
          },
        }}
      />
    </Paper>
  );
}
