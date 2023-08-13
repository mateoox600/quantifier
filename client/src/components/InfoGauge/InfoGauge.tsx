import { Total } from '../../utils/Amount';
import styles from './InfoGauge.module.scss';

export interface InfoGaugeProps {
    total: Total,
    gaugeUsedWidth: number,
    gaugeGainWidth: number,
    unit: string
}

export default function InfoGauge({
    total, // The total object containing used, gains, and left amounts
    gaugeUsedWidth, // The width of the used amount gauge
    gaugeGainWidth, // The width of the gain amount gauge
    unit
}: InfoGaugeProps) {
    return (
        <div className={ styles['gauge-container'] }>
            { /* Top description of the gauge, containing used and gains amount */ }
            <div className={ styles['gauge-description'] }>
                <p className={ styles['used'] }>{total.plannedUsed + total.used}{ unit } Used <span>({total.plannedUsed}{ unit } (planned) + {total.used}{ unit })</span></p>
                <p className={ styles['gain'] }><span>({total.plannedGain}{ unit } (planned) + {total.gain}{ unit })</span> {total.plannedGain + total.gain}{ unit } Gain</p>
            </div>
            { /*
                The gauge is in 3 parts
                  - The planned usage of the total amount in grey
                  - The "unplanned" usage of the total amount in blue ( red if above the total gains )
                  - The total gain in white
            */ }
            <div className={ styles['gauge-bar'] }>
                <div className={ styles['gauge-bar-total-used'] } style={{ width: `${gaugeUsedWidth}%` }}>
                    <span className={ styles['gauge-bar-planned-used'] } style={{ width: `${total.plannedUsed / (total.plannedUsed + total.used) * 100}%` }}></span>
                    <span className={ styles['gauge-bar-used'] } style={{ width: `${gaugeGainWidth - total.plannedUsed / (total.plannedUsed + total.used) * 100}%` }}></span>
                </div>
                <div className={ styles['gauge-bar-total-gain'] } style={{ width: `${gaugeGainWidth}%` }}>
                    <span className={ styles['gauge-bar-planned-gain'] } style={{ width: `${total.plannedGain / (total.plannedGain + total.used) * 100}%` }}></span>
                    <span className={ styles['gauge-bar-gain'] }></span>
                </div>
            </div>
            { /* Bottom description of the gauge, containing left amount */ }
            <p className={ styles['gauge-left'] }>{total.left}{ unit } Left</p>
        </div>
    );
}