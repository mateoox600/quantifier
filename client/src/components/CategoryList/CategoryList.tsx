import { Category, CategoryWithAmounts } from '../../utils/Category';
import styles from './CategoryList.module.scss';

export interface CategoryListProps {
    categories: CategoryWithAmounts[],
    unit: string,
    categoryClick: (category: Category) => void,
    createCategoryClick: () => void
}

export default function CategoryList({
    categories, // The list of categories, also containing in each there amounts
    unit,
    categoryClick, // A callback for the case that a category is clicked
    createCategoryClick // A callback for when the create category button is pressed
}: CategoryListProps) {
    return (
        <div className={ styles.categories }>
            {
                // For each category we display it's name, and it's used or gain amounts
                categories.map((category) => {
                    return <div key={ category.uuid } className={ styles.category } onClick={ () => categoryClick(category) }>
                        <p className={ styles['category-name'] }>{ category.name }</p>
                        {
                            category.gain + category.plannedGain != 0 && <p className={ styles['category-gain'] }>{ category.gain + category.plannedGain }{ unit } Gain</p>
                        }
                        {
                            category.used + category.plannedUsed != 0 && <p className={ styles['category-used'] }>{ category.used + category.plannedUsed }{ unit } Used</p>
                        }
                        {
                            category.gain + category.plannedGain == 0 && category.used + category.plannedUsed == 0 && <p className={ styles['category-nothing'] }>Nothing</p>
                        }
                    </div>;
                })
            }
            { /* This dummy category serves as a button to create new categories */ }
            <div className={ `${styles.category} ${styles['add-category']}` } onClick={ createCategoryClick }>
                <p className={ styles['category-name'] }>Add a category</p>
            </div>
        </div>
    );
}