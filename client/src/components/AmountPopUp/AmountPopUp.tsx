import { FormEvent, createRef, useEffect, useState } from 'react';
import styles from './AmountPopUp.module.scss';
import { Category } from '../../utils/Category';
import { Amount } from '../../utils/Amount';

export interface CategoryPopUpProps {
    currentCategory: Category,
    project: string,
    amount?: string,
    offset: number,
    close: () => void,
    refresh: () => void,
    back: () => void
}

// Formats the date to be compatible with the date input type
function formatDate(date: Date) {
    return `${date.getUTCFullYear()}-${( '0' + (date.getUTCMonth()+1) ).slice(-2)}-${( '0' + date.getUTCDate() ).slice(-2)}`;
}

export default function AmountPopUp({
    currentCategory, // The current category (used to determine if the created amount has a parent or not)
    project,
    amount, // Optional, the amount that needs editing
    offset, // Offset for the dateTime
    close, // A function called when the pop up needs to close itself
    refresh, // A function called when the pop up changed some things on the server, and the page probably needs a refresh
    back // A function called when the pop up needs to go back one category in the category tree
}: CategoryPopUpProps) {

    // The data of the current edited amount (not used if creating an amount)
    const [ amountData, setAmountData ] = useState<Amount>({ amount: 0, dateTime: -1, endDateTime: -1, description: '', gain: false, planned: false, uuid: '' });

    // If the amount prop is set, we fetch the amount that needs editing and we set the amountData state to the response from the server
    useEffect(() => {
        if(!amount) return;
        fetch(`/api/amount/${amount}`).then((res) => res.json())
            .then((amountData) => setAmountData(amountData))
            .catch((err) => console.error(err));
    }, []);

    // A ref to the form, used to get back values from it
    const amountFormRef = createRef<HTMLFormElement>();

    // When the component is in editing mode this function is called when the form is submited
    const editAmount = (e: FormEvent) => {
        e.preventDefault();

        const formData = {
            ...amountData,
            uuid: amount,
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

    // When the component is in creating mode this function is called when the form is submited
    const createAmount = (e: FormEvent) => {
        e.preventDefault();
        if(!amountFormRef.current) return;
        // It gets the form data, extracts the needed values from it and adds the parent category if one is present
        const form = new FormData(amountFormRef.current);
        
        const formData = {
            amount: Number(form.get('amount')),
            gain: form.get('gain') === 'on',
            planned: form.get('planned') === 'on',
            dateTime: Date.parse((form.get('date') || '').toString()) || -1,
            description: form.get('description'),
            project,
            category: currentCategory?.uuid || null
        };
        
        // It fetches the api to create this amount, and when the creation is done, it refreshes the page, and closes the pop up
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

    // Function used to delete the currently edited amount
    const deleteCurrentAmount = () => {
        // Asks for confirmation
        if(!confirm(`Are you sure you want to delete this amount\nThis action is irreversible`)) return;
        // Deletes the current amount and refreshes the page
        fetch(`/api/amount/${amount}/`, {
            method: 'DELETE'
        }).then(() => {
            alert('Amount deleted');
            refresh();
            close();
        }).catch((err) => console.error(err));
    }

    return (
        <div id='popup-back' className={ styles['creation-pop-up'] } onClick={ (e) => {
            // If the background of the pop up is clicked, close the pop up, else do nothing
            if((e.target as HTMLElement).id !== 'popup-back') return;
            close();
        } }>
            <form className={ styles['creation-form'] } ref={ amountFormRef } onSubmit={ amount ? editAmount : createAmount }>
                <p>{ amount ? 'Edit' : 'Create new' } Amount</p>
                <div>
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
                        <input type="checkbox" name="planned" id="planned" checked={ amountData.planned } onChange={ (e) => setAmountData((data) => { return { ...data, planned: e.target.checked }; }) } />
                    </div>
                    <div> { /* The date of the new amount or the new date of the edited amount, date is formated into a DD-MM-YYYY format to be compatible with the date input type */ }
                        <label htmlFor="date">{ amount && amountData.planned ? 'Start Date' : 'Date' }</label>
                        <input type="date" name="date" id="date" value={ formatDate(new Date(amountData.dateTime)) } onChange={ (e) => setAmountData((data) => { return { ...data, dateTime: Date.parse(e.target.value) }; }) } />
                    </div>
                    {
                        (amount && amountData.planned) && (
                            <div>
                                <label htmlFor="end">End Date</label>
                                <input type="date" name='end' id='end' value={ formatDate(new Date(amountData.endDateTime || -1)) } onChange={ (e) => setAmountData((data) => { return { ...data, endDateTime: Date.parse(e.target.value) }; }) } />
                            </div>
                        )
                    }
                    <div>
                        <label htmlFor="description">Description</label>
                        <input type="text" name="description" id="description" value={ amountData.description } onChange={ (e) => setAmountData((data) => { return { ...data, description: e.target.value }; }) } />
                    </div>
                </div>
                {
                    // If in editing mode, show the Delete button
                    amount && <button onClick={ deleteCurrentAmount }>Delete</button>
                }
                <button type="submit">{ amount ? 'Apply' : 'Add' }</button>
            </form>
        </div>
    );
}