import { MouseEvent, createRef, useEffect, useState } from 'react';
import styles from './AmountPopUp.module.scss';
import { Category } from '../../utils/Category';
import { Amount } from '../../utils/Amount';

export interface CategoryPopUpProps {
    currentCategory: Category,
    amount?: string,
    close: () => void,
    refresh: () => void,
    back: () => void
}

function formatDate(date: Date) {
    return `${date.getUTCFullYear()}-${( '0' + (date.getUTCMonth()+1) ).slice(-2)}-${( '0' + date.getUTCDate() ).slice(-2)}`;
}

export default function AmountPopUp({
    currentCategory,
    amount,
    close,
    refresh,
    back
}: CategoryPopUpProps) {

    // The data of the current edited amount (not used if creating an amount)
    const [ amountData, setAmountData ] = useState<Amount>({ amount: 0, dateTime: 0, description: '', gain: false, planned: 'no', uuid: '' });

    // If the amount prop is set, we fetch the amount that needs editing and we set the amountData state to the response from the server
    useEffect(() => {
        if(!amount) return;
        fetch(`/api/amount/${amount}`).then((res) => res.json())
            .then((amountData) => setAmountData(amountData))
            .catch((err) => console.error(err));
    }, []);

    const amountFormRef = createRef<HTMLFormElement>();

    // When the component is in editing mode this function is called when the form is submited
    const editAmount = (e: MouseEvent) => {
        e.preventDefault();

        const formData = {
            ...amountData,
            uuid: amount,
            gain: amountData.gain ? 'true' : 'false'
        };
        
        // It fetches the api to edit this amount, and when the editing is done, it refreshes the page, and closes the pop up
        fetch('/api/amount/edit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        }).then((res) => res.json())
            .then((res) => {
                refresh();
                close();
            })
            .catch((err) => console.error(err));
    };

    const createAmount = (e: MouseEvent) => {
        e.preventDefault();
        if(!amountFormRef.current) return;
        const form = new FormData(amountFormRef.current);
        
        const formData = {
            amount: Number(form.get('amount')),
            gain: form.get('gain') === 'on' ? 'true' : 'false',
            planned: form.get('planned') === 'on' ? 'monthly' : 'no',
            dateTime: Date.parse((form.get('date') || '').toString()) || -1,
            description: form.get('description'),
            category: currentCategory?.uuid || null
        };
        
        fetch('/api/amount', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        }).then((res) => res.json())
            .then((res) => {
                refresh();
                close();
            })
            .catch((err) => console.error(err));
    };

    const deleteCurrentAmount = () => {
        fetch(`/api/amount/${amount}/`, {
            method: 'DELETE'
        }).then(() => {
            refresh();
            close();
        }).catch((err) => console.error(err));
    }

    return (
        <div id='popup-back' className={ styles['creation-pop-up'] } onClick={ (e) => {
            if((e.target as HTMLElement).id !== 'popup-back') return;
            close();
        } }>
            <form className={ styles['creation-form'] } ref={ amountFormRef }>
                <p>{ amount ? 'Edit' : 'Create new' } Amount</p>
                <div>
                    { JSON.stringify(amountData) }
                    <div>
                        <label htmlFor="amount">Amount</label>
                        <input type="number" name="amount" id="amount" value={ amountData.amount } onChange={ (e) => setAmountData((data) => { return { ...data, amount: Number(e.target.value) }; }) } />
                    </div>
                    <div>
                        <label htmlFor="gain">Is it a gain</label>
                        <input type="checkbox" name="gain" id="gain" checked={ amountData.gain } onChange={ (e) => setAmountData((data) => { return { ...data, gain: e.target.checked }; }) } />
                    </div>
                    <div>
                        <label htmlFor="planned">Is it planned</label>
                        <input type="checkbox" name="planned" id="planned" checked={ amountData.planned === 'monthly' } onChange={ (e) => setAmountData((data) => { return { ...data, planned: e.target.checked ? 'monthly' : 'no' }; }) } />
                    </div>
                    <div>
                        <label htmlFor="date">Date</label>
                        <input type="date" name="date" id="date" value={ formatDate(new Date(amountData.dateTime)) } onChange={ (e) => setAmountData((data) => { return { ...data, dateTime: Date.parse(e.target.value) }; }) } />
                    </div>
                    <div>
                        <label htmlFor="description">Description</label>
                        <input type="text" name="description" id="description" value={ amountData.description } onChange={ (e) => setAmountData((data) => { return { ...data, description: e.target.value }; }) } />
                    </div>
                </div>
                {
                    // If in editing mode, show the Delete button
                    amount && <button onClick={ deleteCurrentAmount }>Delete</button>
                }
                <button type="submit" onClick={ amount ? editAmount : createAmount }>{ amount ? 'Apply' : 'Add' }</button>
            </form>
        </div>
    );
}