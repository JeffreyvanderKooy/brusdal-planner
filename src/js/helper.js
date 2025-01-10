import { state } from './model';
import { API_WAIT } from './config';

// # RETURNS DATA FROM GIVEN API URL # //
export async function getJSON(url) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`Could not fetch data for: ${url}`);
    throw new Error(error);
  }
}

// # REMOVES e.g "- 3.etg" or ".3etg" from address string # //
export function cleanAddress(address) {
  // remove - 7 etc etc. from addresses
  if (address.includes('-')) {
    const i = address.indexOf('-');

    // check if the character behind the "-"" is a empty space or not
    if (address[i - 1] === ' ') address = address.slice(0, i).trim();
    // remove all double or more "  "
  } else if (address.includes('.')) {
    const i = address.indexOf('.');
    // the ltr behind the "." is not a number
    if (isFinite(address[i - 1])) address = address.slice(0, i).trim();
  }

  return address.replace(/\s+/g, ' ');
}

// # CHECKS IF ADDRESS CONTAINS A HOUSE NUMBER # //
export function filterValidAddresses(cust) {
  return cust.streetAddress
    .split('')
    .filter(ltr => ltr !== ' ')
    .every(ltr => !isFinite(ltr))
    ? true
    : false;
}

// # CHECKS IF GIVEN CUSTOMERS HAS ORDERED IN THE LAST # MONTHS # //
export function filterByMonth(cust, months) {
  const timePassed = 1000 * 60 * 60 * 24 * 30 * months; // calculate amount of miliseconds passed since given "months"
  const checkDate = new Date('11.14.2024'); // date to check by (date i recieved the data)

  return checkDate.getTime() - cust.lastOrderDate.getTime() <= timePassed
    ? true
    : false;
}

// # TURNS INPUT STRING COPIED FROM EXCEL SHEET INTO A ARRAY # //
export function parseArr(str) {
  return str
    .trim()
    .replaceAll('\n', '\t')
    .split('\t')
    .filter(str => str !== '');
}

// # ASYNC DELAY TO AVOID OVERLOADING THE GOOGLE MAPS API SERVER # //
export async function wait(s) {
  return new Promise(resolve => setTimeout(resolve, 1000 * s));
}

// # RETURNS A STRING LETTING THE USER KNOW HOW MANY ADDESSES LEFT TO PARSE # //
export function updateTimeLeft() {
  const addressesLeftToFetch = state.addresses.filter(add => !add.coords);
  return `Geoparsing: ${addressesLeftToFetch.length} addresses left...`;
}

// # CAPILIZED FIRST WORD OF EVERY GIVEN STRING # //
export function capitalizeWords(str) {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// # RETURNS AN ARRAY CONTAINING ALL ADDRESSES THAT ARE CURRENTLY PLANNED BY THE USER IN A ROUTE # //
export function addressesInPlannedRoutes() {
  const addressesInRoutes = [];

  state.userRoutes.forEach(route =>
    addressesInRoutes.push(...route.getAddresses())
  );

  return addressesInRoutes;
}

// # GOES OVER GIVEN ARRAY AND CHECKS IF THE PARAMS OF THIS ARRAY CONTAIN THE SEARCHFOR STRING # //
export function search(addressArr, searchFor) {
  const params = ['postcode', 'streetAddress', 'route', 'area'];
  return addressArr.filter(address =>
    params.some(param => address[param].toLowerCase().includes(searchFor))
  );
}
