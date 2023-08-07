import { useEffect, useState } from 'react';
import styles from './List.module.scss';
import { Link } from 'react-router-dom';
import { MonthMap } from '../../utils/Date';

export interface Amount {
    uuid: string,
    amount: number,
    gain: boolean,
    planned: string,
    dateTime: number,
    description: string
}

export default function List() {

    const [ amounts, setAmounts ] = useState<Amount[]>([]);

    const [ offset, setOffset ] = useState(0);
    const [ date, setDate ] = useState('');

    useEffect(() => {
        fetch(`/api/amount/monthly/all?offset=${offset}`)
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

    const deleteAmount = (uuid: string) => {
        fetch(`/api/amount/${uuid}/`, {
            method: 'DELETE'
        }).then(() => {
            setOffset((offset) => offset);
        }).catch((err) => console.error(err));
    }

    return (
        <div className={ styles.list }>
            <p onClick={ () => setOffset((offset) => offset - 1) }>&lt;</p>
            <p>{ date }</p>
            <p onClick={ () => setOffset((offset) => offset + 1) }>&gt;</p>
            <table className={ styles.table }>
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