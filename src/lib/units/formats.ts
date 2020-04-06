import PrimeError from '../../error/prime-error';
import { FormattingOption, FormattingOptions } from '../types';
import * as Day from './formats/day';
import * as Hour from './formats/hour';
import * as Minute from './formats/minute';
import * as Millisecond from './formats/millisecond';
import * as Month from './formats/month';
import * as Second from './formats/second';
import * as Year from './formats/year';
import * as Timezone from './formats/timezone'

const localised : FormattingOptions = {
    ...Year.options,
    ...Month.options,
    ...Day.options,
    ...Hour.options,
    ...Minute.options,
    ...Second.options,
    ...Millisecond.options,
    ...Timezone.options
};

export function find (key : string) : FormattingOption {
    const search = key.trim();
    if (search in localised) {
        return localised[search];
    }

    throw new PrimeError('Format: "' + search + '" not found');
}

export function options (formats : string[]) : FormattingOption {
    return formats.map(item => item.trim()).reduce(
        (options : FormattingOption, item : string) => (
            { ...options, ...find(item) }
        ), {}
    );
}

export function timespan (key : string) : string {
    return Object.keys(find(key))[0];
}
