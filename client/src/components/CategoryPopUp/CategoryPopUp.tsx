import { MouseEvent, createRef, useEffect, useState } from 'react';
import styles from './CategoryPopUp.module.scss';
import { Category } from '../../utils/Category';

export interface CategoryPopUpProps {
    currentCategory: Category,
    category?: string,
    close: () => void,
    refresh: () => void,
    back: () => void
}

export default function CategoryPopUp({
    currentCategory, // The current category (used to determine if the created category has a parent or not)
    category, // Optional, the category that needs editing
    close, // A function called when the pop up needs to close itself
    refresh, // A function called when the pop up changed some things on the server, and the page probably needs a refresh
    back // A function called when the pop up needs to go back one category in the category tree
}: CategoryPopUpProps) {

    // The data of the current edited category (not used if creating a category)
    const [ categoryData, setCategoryData ] = useState<Category>({ name: '', uuid: '' });

    // If the category prop is set, we fetch the category that needs editing and we set the categoryData state to the response from the server
    useEffect(() => {
        if(!category) return;
        fetch(`/api/category/${category}`).then((res) => res.json())
            .then((categoryData) => setCategoryData(categoryData))
            .catch((err) => console.error(err));
    }, []);

    // A ref to the form, used to get back values from it
    const categoryFormRef = createRef<HTMLFormElement>();

    // When the component is in editing mode this function is called when the form is submited
    const editCategory = (e: MouseEvent) => {
        e.preventDefault();
        if(!categoryFormRef.current) return;
        // It gets the form data, and extracts the needed values from it
        const form = new FormData(categoryFormRef.current);

        const formData = {
            uuid: category,
            name: form.get('name')
        };
        
        // It fetches the api to edit this category, and when the editing is done, it refreshes the page, and closes the pop up
        fetch('/api/category/edit', {
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
    const createCategory = (e: MouseEvent) => {
        e.preventDefault();
        if(!categoryFormRef.current) return;
        // It gets the form data, extracts the needed values from it and adds the parent category if one is present
        const form = new FormData(categoryFormRef.current);

        const formData = {
            name: form.get('name'),
            parent: currentCategory?.uuid || null
        };
        
        // It fetches the api to create this category, and when the creation is done, it refreshes the page, and closes the pop up
        fetch('/api/category', {
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

    // Function used to delete the currently edited category
    const deleteCurrentCategory = () => {
        // Asks for confirmation
        if(!confirm(`Are you sure you want to delete "${categoryData.name}"\nThis action is irreversible`)) return;
        // Gets the category to delete, goes back one category in the tree, deletes the current category and refreshes the page
        const toDelete = categoryData.uuid;
        back();
        fetch(`/api/category/${toDelete}`, {
            method: 'DELETE'
        }).then(() => {
            alert('Category deleted');
            refresh();
        })
        .catch((err) => console.error(err));
    }

    return (
        <div id='popup-back' className={ styles['pop-up'] } onClick={ (e) => {
            // If the background of the pop up is clicked, close the pop up, else do nothing
            if((e.target as HTMLElement).id !== 'popup-back') return;
            close();
        } }>
            <form className={ styles['form'] } ref={ categoryFormRef }>
                <p>{ category ? 'Edit' : 'Create new' } Category</p>
                <div>
                    <div> { /* The name of the new category, or the new name of the edited category */ }
                        <label htmlFor="name">Name</label>
                        <input type="text" name="name" id="name" defaultValue={ categoryData.name } />
                    </div>
                </div>
                {
                    // If in editing mode, show the Delete button
                    category && <button onClick={ deleteCurrentCategory }>Delete</button>
                }
                <button type="submit" onClick={ category ? editCategory : createCategory }>{ category ? 'Apply' : 'Create' }</button>
            </form>
        </div>
    )
}