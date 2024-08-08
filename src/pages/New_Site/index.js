
import { Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useState, useEffect, useContext } from 'react';
import { FiMapPin } from 'react-icons/fi';
import { toast } from 'react-toastify';
import * as geofire from 'geofire-common';
import * as XLSX from 'xlsx'

import './new_site.css'

import firebase from '../../services/firebaseConnection';
import Header from '../../components/Header';
import Title from '../../components/Title';
import { format } from 'date-fns';
import ModalInfoSite from '../../components/Modal_InfoSite';
import { AuthContext } from '../../contexts/auth';

export default function New_Site() {

  const { user, logSistem } = useContext(AuthContext);

  const [file, setFile] = useState();
  const [sitesAprovacao, setSitesAprovacao] = useState([]);

  useEffect(() => {
    loadSitesAprovacao()
  }, [])

  async function loadSitesAprovacao() {
    await firebase.firestore().collection('sites-aprovacao')
      .get()
      .then((result) => {
        let sites = [];
        result.forEach(doc => {
          sites.push({
            id: doc.id,
            ...doc.data()
          })
        })
        setSitesAprovacao(sites)
      })
      .catch((error) => console.log(error))
  }

  async function submitAllXlsx() {
    onLoadXLSX()
      .then((file) => {
        console.log(file)
        file.forEach(async (item, index) => {
          if (index < 1) return;

          let hash = geofire.geohashForLocation([parseFloat(item[10]), parseFloat(item[11])]);

          let doc = [{
            Estado: item[0] === undefined ? '' : item[0],
            Nome: item[1] === undefined ? '' : item[1].toString(),
            Sigla: item[2] === undefined ? '' : item[2],
            Sigla_GVT: item[3] === undefined ? '' : item[3],
            Situacao: item[4] === undefined ? '' : item[4],
            Cidade: item[5] === undefined ? '' : item[5],
            Bairro: item[6] === undefined ? '' : item[6],
            Endereco: item[7] === undefined ? '' : item[7],
            Complemento: item[8] === undefined ? '' : item[8],
            CEP: item[9] === undefined ? '' : item[9],
            Latitude: parseFloat(item[10]) === undefined ? 0 : item[10].toString(),
            Longitude: parseFloat(item[11]) === undefined ? 0 : item[11].toString(),
            tipoContrato: item[12] === undefined ? '' : item[12],
            critical: item[13] === undefined ? '' : item[13],
            geohash: hash === undefined ? '' : hash,
            tipoSite: item[14] === undefined ? '' : item[14],
            Detentora: item[15] === undefined ? '' : item[15],
          }]

          await firebase.firestore().collection('sites')
            .add(doc[0])
            .then(() => {
              console.log('Site cadastrado com sucesso ! - ' + index + "/" + file.length);
            })
        })
      })
      .catch(err => {
        console.log('Erro ao carregar dados.')
      })
  }

  async function removeAllXlsx() {
    onLoadXLSX()
      .then((file) => {
        console.log(file)
        file.forEach(async (item, index) => {
          if (index < 1) return;

          console.log(item[0])

          await firebase.firestore().collection('sites')
            .doc(item[0])
            .delete()
            .then(() => {
              console.log('Site removido com sucesso ! - ' + index + "/" + file.length - 1);
            })

        })
      })
  }

  async function updateAllXlsx() {
    onLoadXLSX()
      .then((file) => {
        console.log(file)
        file.forEach(async (item, index) => {
          if (index < 1) return;

          let hash = geofire.geohashForLocation([parseFloat(item[6]), parseFloat(item[7])])
          console.log(hash)
          let doc = [{
            CEP: item[1],
            Cidade: item[2],
            Complemento: item[3],
            Endereco: item[4],
            Estado: item[5],
            Latitude: item[6].toString(),
            Longitude: item[7].toString(),
            Sigla: item[9],
            Sigla_GVT: item[10],
            Situacao: item[11],
            Nome: item[8].toString(),
            tipoSite: item[12],
            critical: item[13],
            geohash: geofire.geohashForLocation([parseFloat(item[6]), parseFloat(item[7])]),
            tipoContrato: item[15],
            Detentora: item[16],
            NonStop: item[17],
            CtCritica: item[18],
            ErbCritica: item[19],
            MapaCalor: item[21],
            lastUpdate: new Date(),
            userLastUpdate: user.nome
          }]

          await firebase.firestore().collection('sites')
            .doc(item[0])
            .update(doc[0])
            .then(() => {
              console.log('Site atualizado com sucesso ! - ' + index + "/" + file.length);
            })
            .catch(err => {
              console.log('Site não atualizado ! - ' + index + "/" + file.length);
            })
        })
      })
  }

  function handleFileSelect(evt) {
    let filesArr = Array.prototype.slice.call(evt.target.files);
    let not_xlsx = false;

    filesArr.forEach(file => {
      if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        not_xlsx = true
      }
    })

    if (not_xlsx === true) {
      toast.error("Selecione apenas arquivos XLSX")
      document.getElementById("inputXLSX").value = "";
      return;
    } else if (not_xlsx === false) {
      setFile(evt.target.files);
      document.getElementById("arquive").innerHTML = evt.target.files[0].name;
    }
  }

  function onLoadXLSX() {
    let i, f;
    let sheet_data
    //Loop through files
    return new Promise((resolve, reject) => {
      for (i = 0, f = file[i]; i != file.length; ++i) {
        let reader = new FileReader();
        let name = f.name;

        reader.onload = function (evt) {
          let data = evt.target.result;
          let workbook = XLSX.read(data);

          sheet_data = XLSX.utils.sheet_to_json(
            workbook.Sheets['sites'], {
            header: 1
          }
          );
          setFile(sheet_data)
          resolve(sheet_data)
        };
        reader.readAsArrayBuffer(f);
      }
    })
  }

  async function downloadExcel() {
    await firebase.firestore().collection('sites')
      .get()
      .then((snapshot) => {
        updateState(snapshot)
      })
      .catch((err) => {
        console.log('Deu algum erro: ', err);
      })
  }

  async function downloadModelo() {
    let relatorioApr = []
    relatorioApr.push({
      UF: '',
      NOME: '',
      SIGLA: '',
      SIGLA_GVT: '',
      SITUACAO: '',
      MUNICIPIO: '',
      BAIRRO: '',
      ENDERECO: '',
      COMPLEMENTO: '',
      CEP: '',
      LATITUDE: '-0,00000',
      LONGITUDE: '-0,00000',
      TIPO_CONTRATO: '',
      CRITICIDADE: '',
      TIPO_SITE: '',
      DETENTORA: '',
    })
    exportExcel(relatorioApr);
  }

  //faz busca do banco de chamados
  async function updateState(snapshot) {
    let relatorioApr = [];
    snapshot.forEach((doc) => {
      relatorioApr.push({
        id: doc.id,
        CEP: doc.data().CEP,
        Cidade: doc.data().Cidade,
        Complemento: doc.data().Complemento,
        Endereço: doc.data().Endereco,
        UF: doc.data().Estado,
        Latitude: doc.data().Latitude,
        Longitude: doc.data().Longitude,
        Nome: doc.data().Nome,
        Sigla_Site: doc.data().Sigla,
        Sigla_GVT: doc.data().Sigla_GVT,
        Situacao: doc.data().Situacao,
        Tipo_de_Site: doc.data().tipoSite,
        Criticidade: doc.data().critical,
        Geohash: doc.data().geohash,
        Tipo_Contrato: doc.data().tipoContrato,
        Detentora: doc.data().Detentora,
        NonStop: doc.data().NonStop,
        CtCritica: doc.data().CtCritica,
        ErbCritica: doc.data().ErbCritica,
      })
    })
    exportExcel(relatorioApr);
  }

  function exportExcel(data) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "sites");
    //let buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    //XLSX.write(workbook, { bookType: "xlsx", type: "binary" });
    XLSX.writeFile(workbook, "sites.xlsx");
  };

  return (
    <div>
      <Header />

      <div className="content">
        <Title name="Aprovação de Novos Sites">
          <FiMapPin size={25} onClick={() => console.log(sitesAprovacao)} />
        </Title>

        {user.uid === 'wQzKfmkPgsV8PULa9t5JLg9Ta6j2' && (
          <div className='container inputfile'>
            <label id='arquive'>Selecionar arquivo
              <input id='inputXLSX' type='file' accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => handleFileSelect(e)} />
            </label>
            <a onClick={() => submitAllXlsx()} >Enviar</a>
            <a onClick={() => removeAllXlsx()} >Remover</a>
            <a onClick={() => updateAllXlsx()} >Update</a>
            <a onClick={() => downloadModelo()} >Baixar Modelo</a>
            <a onClick={() => downloadExcel()} >Baixar Todos Sites</a>
          </div>
        )}

        <Grid container className='container'>
          <TableContainer component={Paper}>
            <Table size="small" aria-label="a dense table">
              <TableHead>
                <TableRow style={{ color: '#FFF' }}>
                  <TableCell align="center">Sigla</TableCell>
                  <TableCell align="center">UF</TableCell>
                  <TableCell align="center">Municipio</TableCell>
                  <TableCell align="center">Lat</TableCell>
                  <TableCell align="center">Lng</TableCell>
                  <TableCell align="center">Data</TableCell>
                  <TableCell align="center"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sitesAprovacao.map((row) => (
                  <TableRow
                    key={row.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell align="center">{row.Sigla}</TableCell>
                    <TableCell align="center">{row.Estado}</TableCell>
                    <TableCell align="center">{row.Cidade}</TableCell>
                    <TableCell align="center">{row.Latitude}</TableCell>
                    <TableCell align="center">{row.Longitude}</TableCell>
                    <TableCell align="center">{format(row.created.toDate(), "dd/MM/yyyy HH:mm")}</TableCell>
                    <TableCell align="center">
                      <ModalInfoSite
                        site={row}
                        loadSites={loadSitesAprovacao}
                        logSistem={logSistem}
                        user={user}
                      >
                      </ModalInfoSite>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </div>
    </div>
  )
}