import { useEffect, useState } from 'react';
import styles from './List.module.scss';
import { Link } from 'react-router-dom';

export interface Amount {
    uuid: string,
    amount: number,
    gain: boolean,
    planned: string,
    dateTime: number,
    description: string
}

export default function List() {

    const [ refresh, setRefresh ] = useState(true);
    const [ amounts, setAmounts ] = useState<Amount[]>([]);

    useEffect(() => {
        if(!refresh) return;
        setRefresh(false);
        fetch('/api/amount/monthly/all')
            .then((res) => res.json())
            .then((amounts) => setAmounts(amounts))
            .catch((err) => console.error(err));
    }, [ refresh ]);

    const deleteAmount = (uuid: string) => {
        fetch(`/api/amount/${uuid}/`, {
            method: 'DELETE'
        }).then(() => {
            setRefresh(true);
        }).catch((err) => console.error(err));
    }

    return (
        <div className={ styles.list }>
            <table className={ styles.table } border={ 1 }>
                <tr>
                    <th>Amount</th>
                    <th>Gain or Used</th>
                    <th>Planned ?</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th></th>
                </tr>
                {
                    amounts.map((amount) => (
                        <tr>
                            <td>{ amount.amount }€</td>
                            <td>{ amount.gain ? 'Gain' : 'Used' }</td>
                            <td>{ amount.planned === 'monthly' ? 'Yes' : 'No' }</td>
                            <td>{ new Date(amount.dateTime).toUTCString() }</td>
                            <td>{ amount.description }</td>
                            <td><button onClick={ () => deleteAmount(amount.uuid) }>Delete...</button></td>
                        </tr>
                    ))
                }
            </table>
            <Link to={ '/' } className={ styles['to-home'] }>...</Link>
        </div>
    );
}