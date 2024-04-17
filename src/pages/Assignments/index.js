import { useEffect, useState, useContext } from 'react';
import { MdOutlineAssignmentLate, MdDoubleArrow, MdCheck } from "react-icons/md";
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

import { AuthContext } from '../../contexts/auth';
import firebase from '../../services/firebaseConnection';
import Header from '../../components/Header';
import Title from '../../components/Title';

import './assignments.css'

export default function PreNew() {

    const { user } = useContext(AuthContext);

    const [atribuicoes, setAtribuicoes] = useState([]);
    const [users, setUsers] = useState([]);

    useEffect(() => {

        async function loadAprs() {

            let ref = firebase.firestore().collection('atribuicoes')

            if (user.nivel !== 'administrador') {
                ref = firebase.firestore().collection('atribuicoes').where('atribuido_id', '==', user.uid)
            }

            await ref.get()
                .then((snapshot) => {
                    let list = []
                    snapshot.forEach( item => {
                        list.push({
                            id: item.id,
                            ...item.data()
                        })
                    })
                    setAtribuicoes(list)
                })
                .catch((error) => {
                    console.log('DEU ALGUM ERRO!', error);
                })
        }

        loadAprs();
    }, [])

    return (
        <div>
            <Header />

            <div className="content">
                <Title name="Aplicar APR">
                    <MdOutlineAssignmentLate size={25} />
                </Title>

                <div className='container'>
                    <table>
                        <thead>
                            <tr>
                                <th scope="col">Status</th>
                                <th scope="col">Data Atribuição</th>
                                <th scope="col"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {atribuicoes.map((item, index) => {
                                return (
                                    <tr key={index}>
                                        <td data-label="Sigla">{item.status}</td>
                                        <td data-label="Data Atribuição">{format(item.created.toDate(), 'dd/MM/yyyy HH:mma')}</td>
                                        <td data-label="">
                                            {item.status !== 'Solicitado' ? (
                                                <Link className="action" style={{ backgroundColor: '#41d916' }} to={'#'} >
                                                    <MdCheck color="#FFF" size={17} />
                                                </Link>
                                            ) : (
                                                <Link className="action" style={{ backgroundColor: '#3586f6' }} to={`${item.link}/${item.id}`} >
                                                    <MdDoubleArrow color="#FFF" size={17} />
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}