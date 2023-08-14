import { FormEvent, MouseEvent, createRef, useEffect, useState } from 'react';
import styles from './ProjectPopUp.module.scss';
import { Project } from '../../utils/Project';

export interface ProjectPopUpProps {
    project?: string,
    close: () => void,
    refresh: () => void
}

export default function ProjectPopUp({
    project, // Optional, the project that needs editing
    close, // A function called when the pop up needs to close itself
    refresh // A function called when the pop up changed some things on the server, and the page probably needs a refresh
}: ProjectPopUpProps) {

    // The data of the current edited project (not used if creating a project)
    const [ projectData, setProjectData ] = useState<Project>({ name: '', unit: '', uuid: '' });

    // If the project prop is set, we fetch the project that needs editing and we set the projectData state to the response from the server
    useEffect(() => {
        if(!project) return;
        fetch(`/api/project/${project}`).then((res) => res.json())
            .then((projectData) => setProjectData(projectData))
            .catch((err) => console.error(err));
    }, []);

    // A ref to the form, used to get back values from it
    const projectFormRef = createRef<HTMLFormElement>();

    // When the component is in editing mode this function is called when the form is submited
    const editProject = (e: FormEvent) => {
        e.preventDefault();
        if(!projectFormRef.current) return;
        // It gets the form data, and extracts the needed values from it
        const form = new FormData(projectFormRef.current);

        const formData = {
            uuid: project,
            name: form.get('name'),
            unit: form.get('unit')
        };
        
        // It fetches the api to edit this project, and when the editing is done, it refreshes the page, and closes the pop up
        fetch('/api/project/edit', {
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
    const createProject = (e: FormEvent) => {
        e.preventDefault();
        if(!projectFormRef.current) return;
        // It gets the form data, extracts the needed values from it and adds the parent category if one is present
        const form = new FormData(projectFormRef.current);

        const formData = {
            name: form.get('name'),
            unit: form.get('unit')
        };
        
        // It fetches the api to create this project, and when the creation is done, it refreshes the page, and closes the pop up
        fetch('/api/project', {
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

    // Function used to delete the currently edited project
    const deleteCurrentProject = (e: MouseEvent) => {
        e.preventDefault();
        // Asks for confirmation
        if(!confirm(`Are you sure you want to delete "${projectData.name}"\nThis action is irreversible`)) return;
        // deletes the project and refreshes the page
        fetch(`/api/project/${projectData.uuid}`, {
            method: 'DELETE'
        }).then(() => {
            alert('Project deleted');
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
            <form className={ styles['form'] } ref={ projectFormRef } onSubmit={ project ? editProject : createProject }>
                <p>{ project ? 'Edit' : 'Create new' } Project</p>
                <div>
                    <div> { /* The name of the new project, or the new name of the edited project */ }
                        <label htmlFor="name">Name</label>
                        <input type="text" name="name" id="name" defaultValue={ projectData.name } />
                    </div>
                    <div>
                        <label htmlFor="unit">Unit</label>
                        <input type="text" name="unit" id="unit" defaultValue={ projectData.unit } />
                    </div>
                </div>
                <button type="submit">{ project ? 'Apply' : 'Create' }</button>
                {
                    // If in editing mode, show the Delete button
                    project && <button onClick={ deleteCurrentProject }>Delete</button>
                }
            </form>
        </div>
    )
}