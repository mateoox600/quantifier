import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Total } from '../../utils/Amount';
import { Category, CategoryWithAmounts } from '../../utils/Category';
import { MonthMap } from '../../utils/Date';
import { Project } from '../../utils/Project';

import styles from './Home.module.scss';

import CategoryList from '../../components/CategoryList/CategoryList';
import CategoryPopUp from '../../components/CategoryPopUp/CategoryPopUp';
import AmountPopUp from '../../components/AmountPopUp/AmountPopUp';
import InfoGauge from '../../components/InfoGauge/InfoGauge';

import ChevronLeft from '../../assets/chevron_left.svg';
import ChevronRight from '../../assets/chevron_right.svg';
import Add from '../../assets/add.svg';
import Setting from '../../assets/settings.svg';
import Sort from '../../assets/sort.svg';

export default function Home() {

    const navigate = useNavigate();

    useEffect(() => {
        fetch('/api/user/check').then((res) => {
            if(res.status !== 200) navigate('/login');
        }).catch((err) => console.error(err));
    }, [ ]);

    const { uuid: projectUuid } = useParams();

    const [ project, setProject ] = useState<Project>({ uuid: '', name: '', unit: '' });

    // States to handle openned pop up, and editing category pop up
    const [ creationAmountPopUp, setCreationAmountPopUp ] = useState(false);
    const [ creationCategoryPopUp, setCreationCategoryPopUp ] = useState(false);
    const [ editedCategory, setEditedCategory ] = useState<string | undefined>();

    // The month offset and the current text date
    const [ offset, setOffset ] = useState(0);
    const [ date, setDate ] = useState('');

    // Stores the total amounts and the widths required by the info gauge
    const [ total, setTotal ] = useState<Total>({ gain: 0, used: 0, plannedGain: 0, plannedUsed: 0, left: 0 });
    const [ gaugeUsedWidth, setGaugeUsedWidth ] = useState(0);
    const [ gaugeGainWidth, setGaugeGainWidth ] = useState(0);

    // Stores the current category with it's total amounts, stores every child categories, and the category tree
    const [ currentCategory, setCurrentCategory ] = useState<CategoryWithAmounts>({ name: 'Main', uuid: 'main', gain: 0, used: 0, plannedGain: 0, plannedUsed: 0, left: 0 });
    const [ categories, setCategories ] = useState<CategoryWithAmounts[]>([]);
    const [ currentCategoryTree, setCurrentCategoryTree ] = useState<Category[]>([]);

    useEffect(() => {
        fetch(`/api/project/${projectUuid}`)
            .then((res) => res.json())
            .then((project) => setProject(project))
            .catch((err) => console.error(err));
    }, []);

    // Fetches the total, when the offset changes
    useEffect(() => {
        fetch(`/api/total/monthly?project=${projectUuid}&offset=${offset}`)
            .then((res) => res.json())
            .then((total) => setTotal(total))
            .catch((err) => console.error(err))
    }, [ offset ]);

    // Caculates the width for the info gauge when total changes
    useEffect(() => {
        if(total.left <= 0) setGaugeUsedWidth(100);
        else setGaugeUsedWidth((total.plannedUsed + total.used) / (total.plannedGain + total.gain) * 100);

        if(total.left > 0) setGaugeGainWidth(100);
        else setGaugeGainWidth((total.plannedGain + total.gain) / (total.plannedUsed + total.used) * 100);
    }, [ total ]);

    // Creates the date string from the month offset
    useEffect(() => {
        const date = new Date();
        date.setUTCDate(1);
        date.setUTCHours(0, 0, 0, 0);
        date.setUTCMonth(date.getUTCMonth() + (offset ?? 0));
        setDate(`${MonthMap[date.getUTCMonth()]} ${date.getUTCFullYear()}`);

        if(offset != 0) navigate(`./?offset=${offset}`);
        else navigate('./');
    }, [ offset ]);

    // When the category tree changes, refetch the new category, and it's childs
    useEffect(() => {
        fetch(`/api/category/${(currentCategoryTree[currentCategoryTree.length - 1] ?? { uuid: 'main' }).uuid}/tree?project=${projectUuid}&offset=${offset}`)
            .then((res) => res.json())
            .then((data) => {
                setCurrentCategory(data);
                setCategories(data.subCategories);
            })
            .catch((err) => console.error(err));
    }, [ currentCategoryTree, offset ]);

    // Sets the edited category to the current category, and opens the creation category pop up
    const editCurrentCategory = () => {
        setEditedCategory(currentCategory.uuid);
        setCreationCategoryPopUp(true);
    };

    return (
        <div className={ styles.home }>
            { /* Popup to create amounts */ }
            { creationAmountPopUp && <AmountPopUp
                currentCategory={ currentCategoryTree[currentCategoryTree.length - 1] } // Current category
                project={ projectUuid || '' }
                offset={ offset }
                close={ () => setCreationAmountPopUp(false) }
                refresh={ () => { // Refresh the total and the current category
                    fetch(`/api/total/monthly?project=${projectUuid}&offset=${offset}`)
                        .then((res) => res.json())
                        .then((total) => setTotal(total))
                        .catch((err) => console.error(err))
                    setCurrentCategoryTree((c) => [ ...c ]);
                } }
                back={ // Goes back one category in the category tree
                    () => setCurrentCategoryTree((categoryTree) => categoryTree.slice(0, categoryTree.length - 1))
                }
            /> }

            { /* Popup to create and edit categories */ }
            { creationCategoryPopUp && <CategoryPopUp
                currentCategory={ currentCategoryTree[currentCategoryTree.length - 1] } // Current category
                project={ projectUuid || '' }
                category={ editedCategory } // Uuid of the currently edited category
                close={ () => setCreationCategoryPopUp(false) }
                refresh={ () => { // Refresh the total and the current category
                    fetch(`/api/total/monthly?project=${projectUuid}&offset=${offset}`)
                        .then((res) => res.json())
                        .then((total) => setTotal(total))
                        .catch((err) => console.error(err))
                    setCurrentCategoryTree((c) => [ ...c ]);
                } }
                back={ // Goes back one category in the category tree
                    () => setCurrentCategoryTree((categoryTree) => categoryTree.slice(0, categoryTree.length - 1))
                }
            /> }

            <h1>{ project.name }</h1>

            { /* Displays the button to go back and go forward one month, and dispalys the current date */ }
            <div className={ styles['offset-container'] }>
                <img onClick={ () => setOffset((offset) => offset - 1) } src={ ChevronLeft } alt="<" />
                <p className={ styles['offset-date'] }>{ date }</p>
                <img onClick={ () => setOffset((offset) => offset + 1) } src={ ChevronRight } alt=">" />
            </div>

            { /* Label used to display total used in current category, and button to add new amount to that category */ }
            <div className={ styles['used-label'] }>
                <p className={ styles['used-label-content'] }>{ (currentCategory.used + currentCategory.plannedUsed) || 0 }{ project.unit }</p>
                <img className={ styles['add-amount'] } onClick={ () => setCreationAmountPopUp(true) } src={ Add } alt='+' />
            </div>

            { /* Styled info gauge to display used, and gain taking into account planned amounts */ }
            <InfoGauge
                total={ total }
                gaugeUsedWidth={ gaugeUsedWidth }
                gaugeGainWidth={ gaugeGainWidth }
                unit={ project.unit }
            />

            { /* Displays current category name, with optional back and edit button */ }
            <p className={ styles['current-category'] }>
                { currentCategory.uuid !== 'main' && <img className={ styles['category-back'] } onClick={ () => setCurrentCategoryTree((categoryTree) => categoryTree.slice(0, categoryTree.length - 1)) } src={ ChevronLeft } alt='<' /> }
                {
                    currentCategoryTree.slice(0, -1).map((category) => category.name).join(' / ')
                } / { currentCategory.uuid !== 'main' ? currentCategory.name : '' }
                { currentCategory.uuid !== 'main' && <img className={ styles['category-delete'] } onClick={ () => editCurrentCategory() } src={ Setting } alt='Edit' /> }
            </p>

            { /* If we are not in the "Main" category, we display the used and gains of that specific category */ }
            {
                currentCategory.uuid !== 'main' && <div className={ styles['current-category-total'] }>
                    {
                        currentCategory.gain + currentCategory.plannedGain != 0 && <p className={ styles['category-gain'] }>{ currentCategory.gain + currentCategory.plannedGain }{ project.unit } Gain ({ currentCategory.plannedGain }{ project.unit } (planned) + {currentCategory.gain}{ project.unit })</p>
                    }
                    {
                        currentCategory.used + currentCategory.plannedUsed != 0 && <p className={ styles['category-used'] }>{ currentCategory.used + currentCategory.plannedUsed }{ project.unit } Used ({ currentCategory.plannedUsed }{ project.unit } (planned) + {currentCategory.used}{ project.unit })</p>
                    }
                    {
                        currentCategory.gain + currentCategory.plannedGain == 0 && currentCategory.used + currentCategory.plannedUsed == 0 && <p className={ styles['category-nothing'] }>Nothing</p>
                    }
                </div>
            }

            { /* Displays a list of all the sub categories of the current category */ }
            <CategoryList
                categories={ categories }
                unit={ project.unit }
                categoryClick={ (category) => setCurrentCategoryTree((categoryTree) => [ ...categoryTree, category ]) }
                createCategoryClick={ () => {
                    setEditedCategory(undefined);
                    setCreationCategoryPopUp(true)
                } }
            />

            { /* Link used to go to the amount list page */ }
            <Link to={ `/${projectUuid}/list` } className={ styles['to-list'] }>
                <img src={ Sort } alt="..." />
            </Link>
        </div>
    );
}