import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MonthMap } from '../../utils/Date';
import { AmountWithParent } from '../../utils/Amount';
import { Project } from '../../utils/Project';

import styles from './List.module.scss';

import AmountPopUp from '../../components/AmountPopUp/AmountPopUp';

import ChevronLeft from '../../assets/chevron_left.svg';
import ChevronRight from '../../assets/chevron_right.svg';
import Sort from '../../assets/sort.svg';
import OffsetDisplay from '../../components/OffsetDisplay/OffsetDisplay';

export default function List() {

    const navigate = useNavigate();

    useEffect(() => {
        fetch('/api/user/check').then((res) => {
            if(res.status !== 200) navigate('/login');
        }).catch((err) => console.error(err));
    }, [ ]);

    const location = useLocation();
    const [ searchParams ] = useSearchParams();

    const [ offset, setOffset ] = useState(Number(searchParams.get('offset')) || 0);

    useEffect(() => {
        setOffset(Number(searchParams.get('offset')) || 0);
    }, [ location ]);

    const navigateList = (newOffset: number) => {
        navigate(`./?offset=${newOffset}`);
    };

    const moveOffset = (n?: number) => {
        if(!n) navigateList(0);
        else navigateList(offset + n);
    };

    const { uuid: projectUuid } = useParams();

    const [ project, setProject ] = useState<Project>({ uuid: '', name: '', unit: '' });

    const [ amounts, setAmounts ] = useState<AmountWithParent[]>([]);

    const [ editing, setEditing ] = useState('');

    const [ date, setDate ] = useState('');

    useEffect(() => {
        fetch(`/api/project/${projectUuid}`)
            .then((res) => res.json())
            .then((project) => setProject(project))
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        fetch(`/api/amount/monthly?project=${projectUuid}&offset=${offset}`)
            .then((res) => res.json())
            .then((amounts) => setAmounts(amounts))
            .catch((err) => console.error(err));
    }, [ offset ]);

    useEffect(() => {
        const date = new Date();
        date.setUTCDate(1);
        date.setUTCHours(0, 0, 0, 0);
        date.setUTCMonth(date.getUTCMonth() + (offset ?? 0));
        setDate(`${MonthMap[date.getUTCMonth()]} ${date.getUTCFullYear()}`);
    }, [ offset ]);

    return (
        <div className={ styles.list }>
            { editing !== '' && <AmountPopUp
                currentCategory={ { name: 'Main', uuid: 'main' } }
                project={ projectUuid || '' }
                amount={ editing }
                offset={ offset }
                close={ () => setEditing('') }
                refresh={ () => navigateList(offset) }
            /> }

            <OffsetDisplay
                moveOffset={ moveOffset }
                date={ date }
            />

            <table className={ styles.table }>
                <tbody>
                    <tr>
                        <th>Amount</th>
                        <th>Gain or Used</th>
                        <th>Planned ?</th>
                        <th>Date</th>
                        <th>End Date</th>
                        <th>Parent Category</th>
                        <th>Description</th>
                        <th></th>
                    </tr>
                    {
                        amounts.map((amount) => (
                            <tr key={ amount.uuid }>
                                <td>{ amount.amount }{ project.unit }</td>
                                <td>{ amount.gain ? 'Gain' : 'Used' }</td>
                                <td>{ amount.planned ? 'Yes' : 'No' }</td>
                                <td>{ new Date(amount.dateTime).toUTCString() }</td>
                                <td>{ amount.endDateTime && amount.endDateTime != -1 ? new Date(amount.endDateTime).toUTCString() : null }</td>
                                <td>{ amount.parent.name }</td>
                                <td>{ amount.description }</td>
                                <td><button onClick={ () => setEditing(amount.uuid) }>Edit...</button></td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
            <Link to={ `/${projectUuid}/?offset=${offset}` } className={ styles['to-home'] }>
                <img src={ Sort } alt="..." />
            </Link>
        </div>
    );
}