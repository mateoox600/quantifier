import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MonthMap } from '../../utils/Date';
import { AmountWithParent } from '../../utils/Amount';

import styles from './List.module.scss';

import AmountPopUp from '../../components/AmountPopUp/AmountPopUp';

import ChevronLeft from '../../assets/chevron_left.svg';
import ChevronRight from '../../assets/chevron_right.svg';

export default function List() {

    const [ amounts, setAmounts ] = useState<AmountWithParent[]>([]);

    const [ editing, setEditing ] = useState('');

    const [ offset, setOffset ] = useState(0);
    const [ date, setDate ] = useState('');

    useEffect(() => {
        fetch(`/api/amount/monthly?offset=${offset}`)
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
            <div className={ styles['offset-container'] }>
                <img onClick={ () => setOffset((offset) => offset - 1) } src={ ChevronLeft } alt='<' />
                <p className={ styles['offset-date'] }>{ date }</p>
                <img onClick={ () => setOffset((offset) => offset + 1) } src={ ChevronRight } alt='>' />
            </div>
            <table className={ styles.table }>
                <tbody>
                    <tr>
                        <th>Amount</th>
                        <th>Gain or Used</th>
                        <th>Planned ?</th>
                        <th>Date</th>
                        <th>Parent Category</th>
                        <th>Description</th>
                        <th></th>
                    </tr>
                    {
                        amounts.map((amount) => (
                            <tr key={ amount.uuid }>
                                <td>{ amount.amount }€</td>
                                <td>{ amount.gain ? 'Gain' : 'Used' }</td>
                                <td>{ amount.planned ? 'Yes' : 'No' }</td>
                                <td>{ new Date(amount.dateTime).toUTCString() }</td>
                                <td>{ amount.parent.name }</td>
                                <td>{ amount.description }</td>
                                <td><button onClick={ () => setEditing(amount.uuid) }>Edit...</button></td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
            <Link to={ '/' } className={ styles['to-home'] }>...</Link>
        </div>
    );
}