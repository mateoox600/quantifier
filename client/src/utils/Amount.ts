
export interface Amount {
    uuid: string,
    amount: number,
    gain: boolean,
    planned: string,
    dateTime: number,
    description: string
}

export interface Total {
    gain: number,
    used: number,
    plannedGain: number,
    plannedUsed: number,
    left: number
}