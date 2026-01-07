export const TIME_OF_DAY_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Night'] as const;
export type TimeOfDay = (typeof TIME_OF_DAY_OPTIONS)[number];
