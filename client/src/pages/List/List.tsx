import { useEffect, useState } from 'react';
import styles from './List.module.scss';
import { Link } from 'react-router-dom';
import { MonthMap } from '../../utils/Date';
import AmountPopUp from '../../components/AmountPopUp/AmountPopUp';
import { Amount } from '../../utils/Amount';

export default function List() {

    const [ amounts, setAmounts ] = useState<Amount[]>([]);

    const [ editing, setEditing ] = useState('');

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

    return (
        <div className={ styles.list }>
            { editing !== '' && <AmountPopUp
                currentCategory={ { name: 'Main', uuid: 'main' } }
                amount={ editing }
                close={ () => setEditing('') }
                refresh={ () => setOffset((offset) => offset) }
                back={ () => {} }
            /> }
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
                            <td><button onClick={ () => setEditing(amount.uuid) }>Edit...</button></td>
                        </tr>
                    ))
                }
            </table>
            <Link to={ '/' } className={ styles['to-home'] }>...</Link>
        </div>
    );
}