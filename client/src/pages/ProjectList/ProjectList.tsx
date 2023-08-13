
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../../utils/Project';
import ProjectPopUp from '../../components/ProjectPopUp/ProjectPopUp';

import styles from './ProjectList.module.scss';

import Setting from '../../assets/settings.svg';

export default function ProjectList() {

    const [ refresh, setRefresh ] = useState(true);

    const [ projectPopUp, setProjectPopUp ] = useState(false);
    const [ editedProject, setEditedProject ] = useState<string | undefined>(undefined);

    const [ projects, setProjects ] = useState<Project[]>([]);

    useEffect(() => {
        if(!refresh) return;
        fetch('/api/project/')
            .then((res) => res.json())
            .then((projects) => {
                setProjects(projects)
                setRefresh(false);
            })
            .catch((err) => console.error(err));
    }, [ refresh ]);

    return (
        <div className={ styles['project-list'] }>
            { /* Popup to create and edit projects */ }
            { projectPopUp && <ProjectPopUp
                project={ editedProject } // Uuid of the currently edited project
                close={ () => setProjectPopUp(false) }
                refresh={ () => { // Refresh the project list
                    setRefresh(true);
                } }
            /> }
            <div className={ styles['projects'] }>
                {
                    projects.map((project) => (
                        <Link to={ `/${project.uuid}` } className={ styles.project } key={ project.uuid }>
                            <div>
                                <p className={ styles['project-name'] }>{ project.name }</p>
                                <p>{ project.unit }</p>
                            </div>
                            <img className={ styles['project-edit'] } onClick={ (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditedProject(project.uuid);
                                setProjectPopUp(true);
                            } } src={ Setting } alt='Edit' />
                        </Link>
                    ))
                }
                <div className={ styles.project } onClick={ () => setProjectPopUp(true) }>
                    <p className={ styles['project-name'] }>Create new Project</p>
                </div>
            </div>
        </div>
    );
}