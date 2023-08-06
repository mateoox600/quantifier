import { MouseEvent, createRef } from 'react';
import styles from './AmountPopUp.module.scss';
import { Category } from '../../utils/Category';

export interface CategoryPopUpProps {
    currentCategory: Category,
    amount?: string,
    close: () => void,
    refresh: () => void,
    back: () => void
}

export default function AmountPopUp({
    currentCategory,
    amount,
    close,
    refresh,
    back
}: CategoryPopUpProps) {

    const amountFormRef = createRef<HTMLFormElement>();

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

    return (
        <div id='popup-back' className={ styles['creation-pop-up'] } onClick={ (e) => {
            if((e.target as HTMLElement).id !== 'popup-back') return;
            close();
        } }>
            <form className={ styles['creation-form'] } ref={ amountFormRef }>
                <p>Create new Amount</p>
                <div>
                    <div>
                        <label htmlFor="amount">Amount</label>
                        <input type="number" name="amount" id="amount" />
                    </div>
                    <div>
                        <label htmlFor="gain">Is it a gain</label>
                        <input type="checkbox" name="gain" id="gain" />
                    </div>
                    <div>
                        <label htmlFor="planned">Is it planned</label>
                        <input type="checkbox" name="planned" id="planned" />
                    </div>
                    <div>
                        <label htmlFor="date">Date</label>
                        <input type="date" name="date" id="date" />
                    </div>
                    <div>
                        <label htmlFor="description">Description</label>
                        <input type="text" name="description" id="description" />
                    </div>
                </div>
                <button type="submit" onClick={ createAmount }>Add</button>
            </form>
        </div>
    );
}