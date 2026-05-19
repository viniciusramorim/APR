import * as React from "react";
import PropTypes from "prop-types";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableFooter from "@mui/material/TableFooter";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";
import ModalLog from "../../components/Modal_Logs";
import { Link } from "react-router-dom";
import { TableHead, TableSortLabel, Tooltip, Chip } from "@mui/material";
import { 
  FiEye, 
  FiTrash2, 
  FiRotateCcw 
} from "react-icons/fi";

// Função para salvar a página no localStorage
const savePageToLocalStorage = (page) => {
  localStorage.setItem("tablePage", page);
};

// Função para carregar a página do localStorage
const loadPageFromLocalStorage = () => {
  const savedPage = localStorage.getItem("tablePage");
  return savedPage ? parseInt(savedPage, 10) : 0; // Se não houver página salva, retorna 0
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

const getStatusStyles = (status) => {
  switch (status) {
    case "Em Aberto":
      return { bg: "rgba(33, 150, 243, 0.1)", color: "#2196f3", border: "1px solid rgba(33, 150, 243, 0.3)" };
    case "Cancelado":
      return { bg: "rgba(244, 67, 54, 0.1)", color: "#f44336", border: "1px solid rgba(244, 67, 54, 0.3)" };
    case "Revisado":
      return { bg: "rgba(76, 175, 80, 0.1)", color: "#4caf50", border: "1px solid rgba(76, 175, 80, 0.3)" };
    case "Enviado":
      return { bg: "rgba(0, 188, 212, 0.1)", color: "#00bcd4", border: "1px solid rgba(0, 188, 212, 0.3)" };
    case "Respondido pela Area":
      return { bg: "rgba(255, 152, 0, 0.1)", color: "#ff9800", border: "1px solid rgba(255, 152, 0, 0.3)" };
    case "Concluido":
      return { bg: "rgba(0, 0, 0, 0.1)", color: "#333", border: "1px solid rgba(0, 0, 0, 0.3)" };
    default:
      return { bg: "rgba(158, 158, 158, 0.1)", color: "#9e9e9e", border: "1px solid rgba(158, 158, 158, 0.3)" };
  }
};

export default function CustomPaginationActionsTable(props) {
  const { chamados, user, updateStatus, totalQuestion, updateStatusRollBack } = props;

  // Carregar a página inicial do localStorage
  const [page, setPage] = React.useState(loadPageFromLocalStorage());
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [order, setOrder] = React.useState("desc");
  const [orderBy, setOrderBy] = React.useState("apr_id");

  // Evitar saltos na última página quando houver registros vazios.
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - chamados.length) : 0;

  const pendenciaAtiva = (row) => {
    // Converte a string "17/05/2025 18:50PM" em uma data válida
    const [datePart, timePartWithPeriod] = row.created.split(' ');
    const [day, month, year] = datePart.split('/');

    // Monta uma string no formato ISO para garantir compatibilidade
    const formattedDateStr = `${year}-${month}-${day}`;
    const createdDate = new Date(formattedDateStr);

    const now = new Date();
    const diffMs = now - createdDate;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    return user.nivel === 'revisor' && row.status === "Em Aberto" && diffDays > 10;
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    savePageToLocalStorage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    savePageToLocalStorage(0);
  };

  const handleRequestSort = (property) => {
    const isAscending = orderBy === property && order === "asc";
    setOrder(isAscending ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedRows = React.useMemo(() => {
    return chamados.sort((a, b) => {
      if (orderBy in a && orderBy in b) {
        if (order === "asc") {
          return a[orderBy] < b[orderBy] ? -1 : 1;
        } else {
          return a[orderBy] > b[orderBy] ? -1 : 1;
        }
      }
      return 0;
    });
  }, [chamados, order, orderBy]);

  return (
    <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <Table
        className="table-dashbaord"
        size="small"
        aria-label="a dense table"
      >
        <TableHead sx={{ backgroundColor: "#f8f9fa" }}>
          <TableRow className="header-sort">
            <TableCell align="center" sx={{ fontWeight: 'bold', color: '#555' }}>
              <TableSortLabel
                active={orderBy === "apr_id"}
                direction={orderBy === "apr_id" ? order : "asc"}
                onClick={() => handleRequestSort("apr_id")}
              >
                ID
              </TableSortLabel>
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', color: '#555' }}>
              <TableSortLabel
                active={orderBy === "motivo_apr"}
                direction={orderBy === "motivo_apr" ? order : "asc"}
                onClick={() => handleRequestSort("motivo_apr")}
              >
                MOTIVO
              </TableSortLabel>
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', color: '#555' }}>
              <TableSortLabel
                active={orderBy === "site_id.Sigla"}
                direction={orderBy === "site_id.Sigla" ? order : "asc"}
                onClick={() => handleRequestSort("site_id.Sigla")}
              >
                SITE
              </TableSortLabel>
            </TableCell>
            <TableCell align="left" sx={{ fontWeight: 'bold', color: '#555' }}>
              <TableSortLabel
                active={orderBy === "site_id.Nome"}
                direction={orderBy === "site_id.Nome" ? order : "asc"}
                onClick={() => handleRequestSort("site_id.Nome")}
              >
                NOME DO SITE
              </TableSortLabel>
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', color: '#555' }}>
              <TableSortLabel
                active={orderBy === "site_id.tipoSite"}
                direction={orderBy === "site_id.tipoSite" ? order : "asc"}
                onClick={() => handleRequestSort("site_id.tipoSite")}
              >
                TIPO
              </TableSortLabel>
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', color: '#555' }}>
              <TableSortLabel
                active={orderBy === "site_id.Cidade"}
                direction={orderBy === "site_id.Cidade" ? order : "asc"}
                onClick={() => handleRequestSort("site_id.Cidade")}
              >
                MUNICÍPIO
              </TableSortLabel>
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', color: '#555' }}>
              <TableSortLabel
                active={orderBy === "status"}
                direction={orderBy === "status" ? order : "asc"}
                onClick={() => handleRequestSort("status")}
              >
                STATUS
              </TableSortLabel>
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', color: '#555' }}>
              <TableSortLabel
                active={orderBy === "created"}
                direction={orderBy === "created" ? order : "asc"}
                onClick={() => handleRequestSort("created")}
              >
                DATA
              </TableSortLabel>
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', color: '#555' }}>
              Questões
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', color: '#555' }}>
              %
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', color: '#555' }}>AÇÕES</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(rowsPerPage > 0
            ? sortedRows.slice(
              page * rowsPerPage,
              page * rowsPerPage + rowsPerPage
            )
            : sortedRows
          ).map((row, index) => (
            <TableRow 
              key={row.id} 
              onClick={() => pendenciaAtiva(row)}
              sx={{ 
                "&:hover": { backgroundColor: "#f1f3f4" },
                cursor: "pointer",
                transition: "background-color 0.2s"
              }}
            >
              <TableCell className={pendenciaAtiva(row) && "pendencias"} data-label="ID" align="center" sx={{ fontWeight: '500' }}>
                {row.apr_id}
              </TableCell>
              <TableCell data-label="Motivo APR" align="center" sx={{ fontSize: '0.85rem' }}>
                {row.motivo_apr}
              </TableCell>
              <TableCell data-label="Sigla-UF" align="center" sx={{ fontWeight: 'bold', color: '#1a73e8' }}>
                {row.site_id.Sigla}-{row.site_id.Estado}
              </TableCell>
              <TableCell data-label="Nome" align="left" sx={{ fontSize: '0.85rem' }}>
                {row.site_id.Nome}
              </TableCell>
              <TableCell data-label="Tipo Checklist" align="center" sx={{ fontSize: '0.8rem' }}>
                <Chip label={row.site_id.tipoSite} size="small" variant="outlined" sx={{ borderRadius: '4px' }} />
              </TableCell>
              <TableCell data-label="Municipio" align="center" sx={{ fontSize: '0.85rem' }}>
                {row.site_id.Cidade}
              </TableCell>
              <TableCell data-label="Status" align="center">
                {(() => {
                  const styles = getStatusStyles(row.status);
                  return (
                    <Chip 
                      label={row.status} 
                      size="small" 
                      sx={{ 
                        backgroundColor: styles.bg, 
                        color: styles.color, 
                        border: styles.border,
                        fontWeight: '600',
                        fontSize: '0.75rem',
                        borderRadius: '6px'
                      }} 
                    />
                  );
                })()}
              </TableCell>
              <TableCell data-label="Data" align="center" sx={{ fontSize: '0.85rem', color: '#666' }}>
                {row.created}
              </TableCell>
              <TableCell data-label="Inconformidades" align="center">
                <Box sx={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  backgroundColor: '#f1f3f4',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '500'
                }}>
                  <span style={{ color: row.totalRespondidas > 0 ? '#f44336' : '#4caf50' }}>{row.totalRespondidas}</span>
                  <span>/</span>
                  <span>{row.totalQuestions}</span>
                </Box>
              </TableCell>
              <TableCell data-label="%" align="center" sx={{ fontWeight: 'bold' }}>
                {row.porcentagem_resp_area}
              </TableCell>
              <TableCell align="center" style={{ minWidth: 150 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
                  <Tooltip title="Exibir Detalhes">
                    <Link 
                      to={`/open/${row.id}`}
                      style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                    >
                      <IconButton 
                        size="small"
                        sx={{ 
                          color: "#2196f3",
                          backgroundColor: "rgba(33, 150, 243, 0.1)",
                          "&:hover": { backgroundColor: "rgba(33, 150, 243, 0.2)" }
                        }}
                      >
                        <FiEye />
                      </IconButton>
                    </Link>
                  </Tooltip>

                  {(user.nivel === "administrador" ||
                    user.nivel === "revisor" ||
                    user.nivel === "revisor_logistica") && (
                    <Tooltip title="Cancelar APR">
                      <IconButton
                        size="small"
                        onClick={() => updateStatus(row.id, index)}
                        sx={{ 
                          color: "#f44336",
                          backgroundColor: "rgba(244, 67, 54, 0.1)",
                          "&:hover": { backgroundColor: "rgba(244, 67, 54, 0.2)" }
                        }}
                      >
                        <FiTrash2 />
                      </IconButton>
                    </Tooltip>
                  )}

                  {user.nivel === "administrador" && (
                    <Tooltip title="Voltar Status (Rollback)">
                      <IconButton
                        size="small"
                        onClick={() => updateStatusRollBack(row.id, index)}
                        sx={{ 
                          color: "#9c27b0",
                          backgroundColor: "rgba(156, 39, 176, 0.1)",
                          "&:hover": { backgroundColor: "rgba(156, 39, 176, 0.2)" }
                        }}
                      >
                        <FiRotateCcw />
                      </IconButton>
                    </Tooltip>
                  )}

                  {(user.nivel === "administrador" ||
                    user.nivel === "revisor" ||
                    user.nivel === "revisor_logistica") && (
                    <Tooltip title="Ver Histórico/Logs">
                      <Box sx={{ display: 'inline-block' }}>
                        <ModalLog chamadoId={row.id} />
                      </Box>
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
          {emptyRows > 0 && (
            <TableRow style={{ height: 53 * emptyRows }}>
              <TableCell colSpan={10} />
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, { label: "Todos", value: -1 }]}
              colSpan={10}
              count={chamados.length}
              rowsPerPage={rowsPerPage}
              page={page}
              slotProps={{
                select: {
                  inputProps: {
                    "aria-label": "chamados per page",
                  },
                  native: true,
                },
              }}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              ActionsComponent={TablePaginationActions}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}
