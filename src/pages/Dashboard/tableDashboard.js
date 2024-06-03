import * as React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';
import ModalLog from '../../components/Modal_Logs';
import { Link } from 'react-router-dom';
import { Close, Search } from '@mui/icons-material';
import { TableHead } from '@mui/material';

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
                {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
            </IconButton>
            <IconButton
                onClick={handleBackButtonClick}
                disabled={page === 0}
                aria-label="pagina anterior"
            >
                {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
            </IconButton>
            <IconButton
                onClick={handleNextButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="proxima pagina"
            >
                {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
            </IconButton>
            <IconButton
                onClick={handleLastPageButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="ultima pagina"
            >
                {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
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

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    // Avoid a layout jump when reaching the last page with empty chamados.
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - chamados.length) : 0;

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <TableContainer component={Paper}>
            <Table className='table-dashbaord' size="small" aria-label="a dense table">
                <TableHead>
                    <TableRow>
                        <TableCell align='center'>APR ID</TableCell>
                        <TableCell align='center'>MOTIVO</TableCell>
                        <TableCell align='center'>Sigla-UF</TableCell>
                        <TableCell align='center'>Nome</TableCell>
                        <TableCell align='center'>Tipo Site</TableCell>
                        <TableCell align='center'>Municipio</TableCell>
                        <TableCell align='center'>Status</TableCell>
                        <TableCell align='center'>Data</TableCell>
                        <TableCell align='center'>%</TableCell>
                        <TableCell align='center'></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {(rowsPerPage > 0
                        ? chamados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        : chamados
                    ).map((row, index) => (
                        <TableRow key={row.id}>
                            <TableCell data-label="ID" align="center">
                                {row.apr_id}
                            </TableCell>
                            <TableCell data-label="Motivo APR" align="center">
                                {row.motivo_apr}
                            </TableCell>
                            <TableCell data-label="Sigla-UF" align="center">
                                {row.site_id.Sigla} - {row.site_id.Estado}
                            </TableCell>
                            <TableCell data-label="Nome" align="left">
                                {row.site_id.Nome}
                            </TableCell>
                            <TableCell data-label="Tipo Site" align="center">
                                {row.site_id.tipoSite}
                            </TableCell>
                            <TableCell data-label="Municipio" align="center">
                                {row.site_id.Cidade}
                            </TableCell>
                            <TableCell data-label="Status" align="center">
                                {row.status}
                            </TableCell>
                            <TableCell data-label="Data" align="center">
                                {row.created}
                            </TableCell>
                            <TableCell data-label="%" align="center">
                                {row.porcentagem_resp_area}
                            </TableCell>
                            <TableCell style={{ width: 160 }} align="center">
                                <Link to={`/open/${row.id}`}>
                                    <IconButton color='info'>
                                        <Search />
                                    </IconButton>
                                </Link>
                                {(user.nivel === 'administrador' || user.nivel === 'revisor') && (
                                    <IconButton onClick={() => updateStatus(row.id, index)} color="error" aria-label="add an alarm">
                                        <Close />
                                    </IconButton>
                                )}
                                {(user.nivel === 'administrador' || user.nivel === 'revisor') && (
                                    <ModalLog chamadoId={row.id} />
                                )}
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
                            rowsPerPageOptions={[10, 25, 50, { label: 'Todos', value: -1 }]}
                            colSpan={10}
                            count={chamados.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            slotProps={{
                                select: {
                                    inputProps: {
                                        'aria-label': 'chamados per page',
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