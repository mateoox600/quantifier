import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Total } from '../../utils/Amount';
import { Category, CategoryWithAmounts } from '../../utils/Category';

import styles from './Home.module.scss';

import CategoryList from '../../components/CategoryList/CategoryList';
import CategoryPopUp from '../../components/CategoryPopUp/CategoryPopUp';
import AmountPopUp from '../../components/AmountPopUp/AmountPopUp';
import InfoGauge from '../../components/InfoGauge/InfoGauge';

export default function Home() {

    // States to handle openned pop up, and editing category pop up
    const [ creationAmountPopUp, setCreationAmountPopUp ] = useState(false);
    const [ creationCategoryPopUp, setCreationCategoryPopUp ] = useState(false);
    const [ editedCategory, setEditedCategory ] = useState<string | undefined>();

    // State to refresh the total state
    const [ refresh, setRefresh ] = useState(true);

    // Stores the total amounts and the widths required by the info gauge
    const [ total, setTotal ] = useState<Total>({ gain: 0, used: 0, plannedGain: 0, plannedUsed: 0, left: 0 });
    const [ gaugeUsedWidth, setGaugeUsedWidth ] = useState(0);
    const [ gaugeGainWidth, setGaugeGainWidth ] = useState(0);

    // Stores the current category with it's total amounts, stores every child categories, and the category tree
    const [ currentCategory, setCurrentCategory ] = useState<CategoryWithAmounts>({ name: 'Main', uuid: 'main', gain: 0, used: 0, plannedGain: 0, plannedUsed: 0, left: 0 });
    const [ categories, setCategories ] = useState<CategoryWithAmounts[]>([]);
    const [ currentCategoryTree, setCurrentCategoryTree ] = useState<Category[]>([]);

    // Fetches the total, when refresh is true
    useEffect(() => {
        if(!refresh) return;
        setRefresh(false);
        fetch('/api/total/monthly')
            .then((res) => res.json())
            .then((total) => setTotal(total))
            .catch((err) => console.error(err))
    }, [ refresh ]);

    // Caculates the width for the info gauge when total changes
    useEffect(() => {
        if(total.left <= 0) setGaugeUsedWidth(100);
        else setGaugeUsedWidth((total.plannedUsed + total.used) / (total.plannedGain + total.gain) * 100);

        if(total.left > 0) setGaugeGainWidth(100);
        else setGaugeGainWidth((total.plannedGain + total.gain) / (total.plannedUsed + total.used) * 100);
    }, [ total ]);

    // When the category tree changes, refetch the new category, and it's childs
    useEffect(() => {
        fetch(`/api/category/${(currentCategoryTree[currentCategoryTree.length - 1] ?? { uuid: 'main' }).uuid}/tree`)
            .then((res) => res.json())
            .then((data) => {
                setCurrentCategory(data);
                setCategories(data.subCategories);
            })
            .catch((err) => console.error(err));
    }, [ currentCategoryTree ]);

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
                close={ () => setCreationAmountPopUp(false) }
                refresh={ () => { // Refresh the total and the current category
                    setRefresh(true);
                    setCurrentCategoryTree((c) => [ ...c ]);
                } }
                back={ // Goes back one category in the category tree
                    () => setCurrentCategoryTree((categoryTree) => categoryTree.slice(0, categoryTree.length - 1))
                }
            /> }

            { /* Popup to create and edit categories */ }
            { creationCategoryPopUp && <CategoryPopUp
                currentCategory={ currentCategoryTree[currentCategoryTree.length - 1] } // Current category
                category={ editedCategory } // Uuid of the currently edited category
                close={ () => setCreationCategoryPopUp(false) }
                refresh={ () => { // Refresh the total and the current category
                    setRefresh(true);
                    setCurrentCategoryTree((c) => [ ...c ]);
                } }
                back={ // Goes back one category in the category tree
                    () => setCurrentCategoryTree((categoryTree) => categoryTree.slice(0, categoryTree.length - 1))
                }
            /> }

            { /* Label used to display total used in current category, and button to add new amount to that category */ }
            <div className={ styles['used-label'] }>
                <p className={ styles['used-label-content'] }>{ (currentCategory.used + currentCategory.plannedUsed) || 0 }€</p>
                <button className={ styles['add-amount'] } onClick={ () => setCreationAmountPopUp(true) }>+</button>
            </div>

            { /* Styled info gauge to display used, and gain taking into account planned amounts */ }
            <InfoGauge
                total={ total }
                gaugeUsedWidth={ gaugeUsedWidth }
                gaugeGainWidth={ gaugeGainWidth }
            />

            { /* Displays current category name, with optional back and edit button */ }
            <p className={ styles['current-category'] }>
                { currentCategory.uuid !== 'main' && <button className={ styles['category-back'] } onClick={ () => setCurrentCategoryTree((categoryTree) => categoryTree.slice(0, categoryTree.length - 1)) }>&lt;</button> }
                {
                    currentCategoryTree.slice(0, -1).map((category) => category.name).join(' / ')
                } / { currentCategory.uuid !== 'main' ? currentCategory.name : '' }
                { currentCategory.uuid !== 'main' && <button className={ styles['category-delete'] } onClick={ () => editCurrentCategory() }>Edit</button> }
            </p>

            { /* If we are not in the "Main" category, we display the used and gains of that specific category */ }
            {
                currentCategory.uuid !== 'main' && <div className={ styles['current-category-total'] }>
                    {
                        currentCategory.gain + currentCategory.plannedGain != 0 && <p className={ styles['category-gain'] }>{ currentCategory.gain + currentCategory.plannedGain }€ Gain ({ currentCategory.plannedGain }€ (planned) + {currentCategory.gain}€)</p>
                    }
                    {
                        currentCategory.used + currentCategory.plannedUsed != 0 && <p className={ styles['category-used'] }>{ currentCategory.used + currentCategory.plannedUsed }€ Used ({ currentCategory.plannedUsed }€ (planned) + {currentCategory.used}€)</p>
                    }
                    {
                        currentCategory.gain + currentCategory.plannedGain == 0 && currentCategory.used + currentCategory.plannedUsed == 0 && <p className={ styles['category-nothing'] }>Nothing</p>
                    }
                </div>
            }

            { /* Displays a list of all the sub categories of the current category */ }
            <CategoryList
                categories={ categories }
                categoryClick={ (category) => setCurrentCategoryTree((categoryTree) => [ ...categoryTree, category ]) }
                createCategoryClick={ () => {
                    setEditedCategory(undefined);
                    setCreationCategoryPopUp(true)
                } }
            />

            { /* Link used to go to the amount list page */ }
            <Link to={ '/list' } className={ styles['to-list'] }>...</Link>
        </div>
    );
}