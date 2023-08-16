
import styles from './OffsetDisplay.module.scss';

import ChevronLeft from '../../assets/chevron_left.svg';
import ChevronRight from '../../assets/chevron_right.svg';

export interface OffsetDisplayProps {
    moveOffset: (offset?: number) => void,
    date: string
}

export default function OffsetDisplay({
    moveOffset,
    date
}: OffsetDisplayProps) {
    return (
        <div className={ styles['offset-container'] }>
            <a onClick={ () => moveOffset(-1) }>
                <img src={ ChevronLeft } alt="<" />
            </a>
            <a onClick={ () => moveOffset() } className={ styles['offset-date'] }>{ date }</a>
            <a onClick={ () => moveOffset(1) }>
                <img src={ ChevronRight } alt=">" />
            </a>
        </div>
    )
}