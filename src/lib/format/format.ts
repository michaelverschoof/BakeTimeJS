import PrimeError from '../../error/prime-error';
import { FormattingOption } from '../types';
import { Units } from '../units';
import * as Millisecond from '../units/formats/millisecond';
import DateTimeFormatPart = Intl.DateTimeFormatPart;

const Formatter = Intl.DateTimeFormat;
const regex = /{.*?}/g;
const whitespaces = /\s+/g;

function format (timestamp : number, format ?: string, locale ?: string, timezone ?: string) : string {
    if (format && regex.test(format)) {
        return customisedFormat(timestamp, format, locale, timezone);
    }

    return localisedFormat(timestamp, format, locale, timezone);
}

function localisedFormat (timestamp : number, format ?: string, locale ?: string, timezone ?: string) : string {
    const locales = getLocales(locale);
    const options = getOptions(format?.split(','), timezone);

    // TODO: Remove this once fractionalDigits is more widely used
    if (options.fractionalSecondDigits) {
        delete options.fractionalSecondDigits;

        if (!options.second) {
            console.warn('Tried to add milliseconds to localised format without seconds present. This is currently not possible.')
            return Formatter(locales, options).format(timestamp);
        }

        return Formatter(locales, options).formatToParts(timestamp).reduce(
            (formatted : string, item : DateTimeFormatPart) => (
                formatted += (item.value + (item.type === 'second' ? '.' + getMilliseconds(timestamp) : ''))
            ), ''
        );
    }

    return Formatter(locales, options).format(timestamp);
}

function customisedFormat (timestamp : number, format : string, locale ?: string, timezone ?: string) : string {
    const matches = format.match(regex)?.map(item => item.slice(1, -1));
    if (!matches) {
        throw new PrimeError('Format "' + format + '" could not be parsed');
    }

    const locales = getLocales(locale);
    const options = getOptions(matches, timezone);
    const formatted = Formatter(locales, options).formatToParts(timestamp).filter((item) => item.type !== 'literal');

    // TODO: Remove this once fractionalDigits is more widely used
    format = formatMilliseconds(timestamp, format);

    return format.replace(regex, (match) => getFormattedValue(match, formatted)).replace(whitespaces, ' ');
}

function getFormattedValue (key : string, formatted : DateTimeFormatPart[]) : string {
    const optionType = Units.Formats.type(key.slice(1, -1));
    const type = optionType === 'hour12' ? 'dayPeriod' : optionType;

    // @ts-ignore
    return formatted.find(item => item.type.toLowerCase() === type.toLowerCase()).value;
}

function getOptions (formats ?: string[], timezone ?: string) : FormattingOption {
    const options = formats && formats.length > 0
        ? Units.Formats.options(formats)
        : {};
    options.timeZone = timezone || 'UTC';

    return options;
}

function getLocales (locale ?: string) : string[] {
    if (!locale || locale === 'local') {
        locale = navigator.language;
    }

    return Formatter.supportedLocalesOf(locale);
}

// TODO: Remove this once fractionalDigits is more widely used
function formatMilliseconds (timestamp : number, format : string) : string {
    const regex = new RegExp('{(' + Object.keys(Millisecond.options).join('|') + ')}', 'g');
    const milliseconds = getMilliseconds(timestamp);

    return format.replace(regex, milliseconds);
}

function getMilliseconds (timestamp : number) : string {
    return timestamp.toString().slice(-3);
}

export const Format = {
    format,
    localise : localisedFormat,
    customise : customisedFormat
};
