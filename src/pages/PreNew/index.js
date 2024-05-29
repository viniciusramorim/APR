import { useEffect, useState, useContext } from 'react';
import * as geofire from 'geofire-common';
import { FiClipboard } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { createRoot } from 'react-dom/client';
import { useHistory } from 'react-router-dom';

import { AuthContext } from '../../contexts/auth';
import firebase from '../../services/firebaseConnection';
import Header from '../../components/Header';
import Title from '../../components/Title';
import ModalLoading from '../../components/Modal_Loading';

import './prenew.css'
import ModalNovoSite from '../../components/Modal_NovoSite';
import { Button, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { format } from 'date-fns';

export default function PreNew() {

    const { user, logSistem } = useContext(AuthContext);
    const history = useHistory()

    const [site, setSite] = useState([]);
    const [siteSelect, setSiteSelect] = useState([]);
    const [aplicador, setAplicador] = useState([]);
    const [selectedAplicador, setSelectedAplicador] = useState("0");

    //alterar informações do site
    const [newLat, setNewLat] = useState('')
    const [newLng, setNewLng] = useState('')
    const [newDetentora, setNewDetentora] = useState('')

    //Busca
    const [sigla, setSigla] = useState('');
    const [uf, setUf] = useState('Todos');

    const [showPostModal, setShowPostModal] = useState(false);

    let query = firebase.firestore().collection('sites')

    useEffect(() => {
        async function loadUsers() {
            await firebase.firestore().collection('users')
                .where('nivel', '==', 'aplicador')
                .where('status', '==', true)
                .get()
                .then((users) => {
                    let user = []
                    users.forEach(doc => {
                        user.push({
                            uid: doc.id,
                            email: doc.data().email,
                            nome: doc.data().nome,
                            area: doc.data().area,
                            uf: doc.data().uf,
                        })
                    })
                    setAplicador(user)
                })
                .catch((error) => {
                    console.log('DEU ALGUM ERRO!', error);
                })
        }

        loadUsers();
    }, [])

    function selectAplicador(e) {
        setSelectedAplicador(e.target.value)
    }

    async function atribuir() {
        if (selectedAplicador !== "0") {

            let aplicadorEmailAndName = [];
            aplicador.filter(user => user.uid === selectedAplicador).map(filtered => (
                aplicadorEmailAndName = {
                    email: filtered.email,
                    nome: filtered.nome
                }
            ))

            await firebase.firestore().collection('atribuicoes')
                .add({
                    solicitante: user.uid,
                    atribuido_id: selectedAplicador,
                    created: new Date(),
                    link: '/new/' + siteSelect[0].id,
                    status: 'Solicitado'
                })
                .then(() => {
                    toast.success('APR Atribuida')
                })
                .catch(err => {
                    console.log("ops deu um erro: " + err)
                })
        } else {
            toast.error("Voce precisa selecionar um Aplicador e(ou) APR")
        }
    }

    function togglePostModal() {
        setShowPostModal(!showPostModal) //trocando de true pra false
    }

    async function handleSearch() {
        if (sigla === '') {
            return toast.error('Digite uma sigla de site ou endereço para buscar...')
        }

        query = sigla !== '' && query.where("Sigla", ">=", sigla.toUpperCase())
            .where("Sigla", "<=", sigla.toUpperCase() + "\uf8ff")
        query = uf !== 'Todos' ? query.where("Estado", "==", uf.toUpperCase()) : query

        let filteredData = []
        await query
            .get()
            .then((snapshot) => {
                snapshot.forEach((doc) => {
                    let exist = filteredData.some(item => doc.data().nome === item.nome);
                    if (exist === false) {
                        filteredData.push({
                            id: doc.id,
                            nome: doc.data().Nome,
                            cidade: doc.data().Cidade,
                            cep: doc.data().CEP,
                            complemento: doc.data().Complemento,
                            estado: doc.data().Estado,
                            endereco: doc.data().Endereco,
                            numero: doc.data().Numero,
                            latitude: doc.data().Latitude,
                            longitude: doc.data().Longitude,
                            tipoSite: doc.data().tipoSite,
                            critical: doc.data().critical,
                            geohash: doc.data().geohash,
                            sigla: doc.data().Sigla,
                            tipo_contrato: doc.data().tipoContrato,
                            detentora: doc.data().Detentora,
                            userLastUpdate: doc.data().userLastUpdate ? doc.data().userLastUpdate : '-',
                            lastUpdate: doc.data().lastUpdate ? format(doc.data().lastUpdate.toDate(), 'dd/MM/yyyy HH:mm') : '-',
                        })
                    }
                })
                setSite(filteredData);
            })
            .catch((err) => {
                console.log('Deu algum erro: ', err);
            })


        var container = document.getElementById('list-sites');
        document.getElementById('list-sites').style.display = 'flex'
        var root = createRoot(container);

        return root.render(
            <ul>
                {filteredData.map((sites, index) => {
                    return (
                        <li onClick={() => handleList(filteredData, sites.nome, sites.uf)} key={index}>{sites.sigla} - {sites.nome} - {sites.estado} - {sites.cidade}</li>
                    )
                })}
            </ul>
        );
    }

    function handleList(arr, site) {
        let filteredData = arr.filter(value => {
            let searchStr = site.toLowerCase();
            let nameMatches = value.nome.toLowerCase() === searchStr;

            return nameMatches
        });

        setSiteSelect(filteredData)
        setNewLat(filteredData[0].latitude)
        setNewLng(filteredData[0].longitude)
        setNewDetentora(filteredData[0].detentora !== undefined ? filteredData[0].detentora : '')
        document.getElementById("info-site").style.display = "flex";
    }

    async function getPerimetro() {
        let lat = siteSelect[0].latitude
        let lng = siteSelect[0].longitude
        const center = [parseFloat(lat), parseFloat(lng)];

        try {
            let latitude = parseFloat(lat.replace(',', '.'));
            let longitude = parseFloat(lng.replace(',', '.'));
            const distanceInKm = geofire.distanceBetween([latitude, longitude], center);
            history.push("/new/" + siteSelect[0].id)
        } catch (err) {
            alert("Erro na localização do site, informe um Administrador.")
        }
    }

    async function salvarAlterSite() {
        await query
            .doc(siteSelect[0].id)
            .update({
                Latitude: newLat.toString(),
                Longitude: newLng.toString(),
                Detentora: newDetentora ? newDetentora : ''
            })
            .then(() => {
                handleSearch()
                toast.success('Site Atualizado. Recarregue os sites para ver alteração')
            })
            .catch(err => {
                console.log("ops deu um erro: " + err)
            })
    }

    return (
        <div>
            <Header />

            <div className="content">
                <Title name="Aplicar APR">
                    <FiClipboard size={25} onClick={() => console.log(site)} />
                </Title>

                <div className='container'>
                    <Grid container spacing={2} maxWidth={600}>
                        <Grid item xs={12} md={4.5}>
                            <TextField
                                size='small'
                                color="secondary"
                                id="outlined-basic"
                                label="Sigla Movel do Site..."
                                variant="outlined"
                                value={sigla}
                                onChange={(e) => setSigla(e.target.value)}
                                fullWidth />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl size='small' color="secondary" fullWidth>
                                <InputLabel id="demo-simple-select-label">UF</InputLabel>
                                <Select
                                    labelId="demo-simple-select-label"
                                    id="demo-simple-select"
                                    label="UF"
                                    value={uf}
                                    onChange={(e) => setUf(e.target.value)}
                                >
                                    <MenuItem value='Todos'>Todos</MenuItem>
                                    <MenuItem value='AC'>AC</MenuItem>
                                    <MenuItem value='AL'>AL</MenuItem>
                                    <MenuItem value='AM'>AM</MenuItem>
                                    <MenuItem value='AP'>AP</MenuItem>
                                    <MenuItem value='BA'>BA</MenuItem>
                                    <MenuItem value='CE'>CE</MenuItem>
                                    <MenuItem value='DF'>DF</MenuItem>
                                    <MenuItem value='ES'>ES</MenuItem>
                                    <MenuItem value='GO'>GO</MenuItem>
                                    <MenuItem value='MA'>MA</MenuItem>
                                    <MenuItem value='MG'>MG</MenuItem>
                                    <MenuItem value='MS'>MS</MenuItem>
                                    <MenuItem value='MT'>MT</MenuItem>
                                    <MenuItem value='PA'>PA</MenuItem>
                                    <MenuItem value='PB'>PB</MenuItem>
                                    <MenuItem value='PE'>PE</MenuItem>
                                    <MenuItem value='PI'>PI</MenuItem>
                                    <MenuItem value='PR'>PR</MenuItem>
                                    <MenuItem value='RJ'>RJ</MenuItem>
                                    <MenuItem value='RN'>RN</MenuItem>
                                    <MenuItem value='RO'>RO</MenuItem>
                                    <MenuItem value='RR'>RR</MenuItem>
                                    <MenuItem value='RS'>RS</MenuItem>
                                    <MenuItem value='SC'>SC</MenuItem>
                                    <MenuItem value='SE'>SE</MenuItem>
                                    <MenuItem value='SP'>SP</MenuItem>
                                    <MenuItem value='TO'>TO</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6} md={2} textAlign={'right'}>
                            <Button sx={{width: "100%"}} color="secondary" variant="outlined" onClick={() => handleSearch()}>Buscar</Button>
                        </Grid>
                        <Grid item xs={6} md={2.5} textAlign={'right'}>
                            <ModalNovoSite user={user}/>
                        </Grid>
                    </Grid>
                </div>

                <div id='list-sites' className='container listsites' style={{ display: 'none' }}>
                </div>

                <div id='info-site' className='container info-site'>
                    {siteSelect.length > 0 && (
                        <>
                            <table id='chamado-status' className='content-items' style={{ display: 'table' }}>
                                <tbody>
                                    <tr>
                                        <td data-label="ID">{siteSelect[0].id}</td>
                                        <td data-label="UF">{siteSelect[0].estado ? siteSelect[0].estado : '-'}</td>
                                        <td data-label="Tipo Site">{siteSelect[0].tipoSite ? siteSelect[0].tipoSite : '-'}</td>
                                        <td data-label="Tipo Contrato">{siteSelect[0].tipo_contrato ? siteSelect[0].tipo_contrato : '-'}</td>
                                        <td data-label="Criticidade">{siteSelect[0].critical ? siteSelect[0].critical : '-'}</td>
                                        <td data-label="Municipio">{siteSelect[0].cidade ? siteSelect[0].cidade : '-'}</td>
                                        <td data-label="CEP">{siteSelect[0].cep ? siteSelect[0].cep : '-'}</td>
                                        <td data-label="Endereço">{siteSelect[0].endereco ? siteSelect[0].endereco : '-'}</td>
                                        <td data-label="Data Update">{siteSelect[0].lastUpdate}</td>
                                        <td data-label="Ultimo Update">{siteSelect[0].userLastUpdate}</td>
                                        {user.nivel === 'administrador' ? (
                                            <>
                                                <td data-label="Detentora">
                                                    <input value={newDetentora} onChange={(e) => setNewDetentora(e.target.value.toUpperCase())}></input>
                                                </td>
                                                <td data-label="Latitude">
                                                    <input value={newLat} onChange={(e) => setNewLat(e.target.value)}></input>
                                                </td>
                                                <td data-label="Longitude">
                                                    <input value={newLng} onChange={(e) => setNewLng(e.target.value)}></input>
                                                </td>
                                                <td data-label=""><button onClick={() => salvarAlterSite()}>Salvar Alteração</button></td>
                                            </>
                                        ) : (
                                            <>
                                                <td data-label="Detentora">{siteSelect[0].detentora ? siteSelect[0].detentora : '-'}</td>
                                                <td data-label="Latitude">{siteSelect[0].latitude}</td>
                                                <td data-label="Longitude">{siteSelect[0].longitude}</td>
                                            </>
                                        )}
                                    </tr>
                                </tbody>
                            </table>

                            <a onClick={() => { getPerimetro() }}>
                                Avançar
                            </a>
                        </>
                    )}
                </div>

                {user.nivel === 'administrador' && siteSelect.length > 0 && (
                    <div className='container-atribuir'>

                        <label>Atribuir APR</label>

                        <select value={selectedAplicador} onChange={selectAplicador}>
                            <option disabled value="0">Selecione um Aplicador...</option>
                            {aplicador.map((item, index) => {
                                return (
                                    <option key={index} value={item.uid}>{item.nome} - {item.uf}</option>
                                )
                            })}
                        </select>

                        <a onClick={() => atribuir()}>Atribuir</a>
                    </div>
                )}

                {showPostModal && (
                    <ModalLoading
                        close={togglePostModal}
                    />
                )}

            </div>
        </div>
    )
}