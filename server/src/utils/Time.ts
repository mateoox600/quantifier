
export function getMonthStartAndEnd(offset: number) {
    // Gets the start date by moving a new date to the first day of the month at 00:00:00
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    // Then adds the offset to the date
    start.setUTCMonth(start.getUTCMonth() + offset);
    const startDateTime = start.getTime();
    
    // Gets the end date by setting it to the first day of the next month from the start date at 00:00:00
    const end = new Date();
    end.setUTCFullYear(start.getUTCFullYear(), start.getUTCMonth() + 1, 1);
    end.setUTCHours(0, 0, 0, 0);
    const endDateTime = end.getTime();

    // then returns the time of start and end
    return {
        start: startDateTime,
        end: endDateTime
    };
}