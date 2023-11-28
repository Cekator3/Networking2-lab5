/**
 * @fileOverview Subsystem that contains and updates currency convertion multipliers.
 */

import {currencyConvertionGetName} from "~/Model/Currency/Convertion/getName";
import {currencyGetAllCodes} from "~/Model/Currency/getAllCodes";

const CONVERTION_BASE = 'eur';     //euro
const convertionMultipliers = new Map();
let multipliersLastUpdateDate;

function setConvertion(from, to, multiplier)
{
    convertionMultipliers.set(currencyConvertionGetName(from, to), multiplier);
}

async function fetchConvertionMultipliersFromApi()
{
    let response = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/${CONVERTION_BASE}.json`);
    if (!response.ok)
    {
        if (response.status === 404)
            return 2;
        return 1;
    }
    return await response.json();
}

function isMultipliersUpToDate(jsonDate)
{
    return (multipliersLastUpdateDate !== undefined) &&
           (multipliersLastUpdateDate.getTime() === jsonDate.getTime());
}

function setNewConvertationMultipliers(newMultipliers)
{
    let currencyCodes = currencyGetAllCodes();
    for (let code of currencyCodes)
    {
        let multiplier = newMultipliers[code];
        setConvertion(CONVERTION_BASE, code, multiplier);
        setConvertion(code, CONVERTION_BASE, 1 / multiplier);
    }
}

/**
 * Updates the currency convertion multipliers.
 *
 * @return {number} Returns completion status code.
 *
 * 0 - Success
 *
 * 2 - Internet connection error
 *
 * 1 - Other errors
 */
export async function currencyConvertionUpdateMultipliers()
{
    let json = await fetchConvertionMultipliersFromApi();
    if (Number.isInteger(json))  //if error occurred
        return json;
    let jsonDate = new Date(json.date);
    if (isMultipliersUpToDate(jsonDate))
        return 0;
    multipliersLastUpdateDate = jsonDate;
    setNewConvertationMultipliers(json[CONVERTION_BASE]);
    console.log(...convertionMultipliers);
    return 0;
}

/**
 * Returns multiplier for convertion from base currency to target currency.
 * @param {string} from
 * @param {string} to
 * @return {number | undefined} If base or target currency doesn't exist, returns undefined.
 */
export function currencyConvertionGetMultiplier(from, to)
{
    let convertionName = currencyConvertionGetName(from, to);
    return convertionMultipliers.get(convertionName);
}

/**
 * Returns the date that indicates the relevance of the currency convertion multipliers.
 * @return {Date | undefined} If multipliers have never been updated, returns undefined.
 */
export function currencyConvertionGetDateOfLastMultipliersUpdate()
{
    return multipliersLastUpdateDate;
}
