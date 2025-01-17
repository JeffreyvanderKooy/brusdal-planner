'use strict';

import cloneDeep from 'lodash/cloneDeep';
import { cleanAddress, capitalizeWords } from './helper.js';
import { restoreProtoTypeAddress, Address } from './state_classes/address.js';
import {
  restoreProtoTypeCustomer,
  Customer,
} from './state_classes/customer.js';
import { restoreProtoTypeRoute } from './state_classes/userRoute.js';

import { API_WAIT, API_KEY, API_URL } from './config.js';
import { getJSON, wait } from './helper.js';

let Place;

export async function importPlace() {
  const { Place: importPlace } = await window.google.maps.importLibrary(
    'places'
  );
  Place = importPlace;
}

// # STATE TO USE ACROSS ALL MODULES, SHOULDN ONLY BE MODIFIED IN THIS FILE # //
export const state = {
  addresses: [],
  customers: [],
  userRoutes: [],
};

// # CREATES NEW CUSTOMERS OUT OF GIVEN ARRAY INPUT  # //
export async function processCustomers(userInput) {
  const newAddresses = [];

  // iterates over the loop aslong as there is userInput to parse
  while (userInput.length !== 0) {
    const data = userInput.splice(0, 8).map(data => data.trim()); // take the first 8 values in the array
    const newCustomer = new Customer(...data);

    if (newCustomer.route === 'KB05') continue;

    // check if this customer already exists in the current database
    const customer = state.customers.find(
      cust =>
        cust.id === newCustomer.id ||
        (cust.name.toLowerCase() === newCustomer.name.toLowerCase() &&
          cust.streetAddress.toLowerCase() ===
            newCustomer.streetAddress.toLowerCase())
    );

    if (customer) continue;

    state.customers.push(newCustomer);

    const adress = state.addresses.find(
      a =>
        a.streetAddress.toLowerCase() ===
        newCustomer.streetAddress.toLowerCase()
    );

    if (adress) adress.deliveries.push(newCustomer);

    if (!adress) {
      // if it doesnt exists add a new address object
      const newAddress = new Address(
        capitalizeWords(newCustomer.streetAddress)
      );
      newAddress.addCustomers([newCustomer]);
      state.addresses.push(newAddress);
      newAddresses.push(newAddress);
    }
  }

  return newAddresses;
}

// # ADDS AVERAGENUM ORDERS FOR EACH CUSTOMER THAT MATCHES USERINPUT # //
export function processNumOrders(userInput) {
  const result = [];

  // iterates over the loop aslong as there is userInput to parse
  while (userInput.length !== 0) {
    const data = userInput.splice(0, 13); // take the first 13 values in the array
    const numOrders = data[10];

    // there is a numOrders to process
    if (isFinite(numOrders) && numOrders.length <= 3) {
      const custID = data[0];
      const address = cleanAddress(data[2]);
      const isKommune = data[4] === 'B16' ? true : false;
      const name = data[8];

      // find the customer with the same customer id in the this.customers array
      // and if there is a result process the results
      const customer = state.customers.find(
        cust =>
          cust.id === custID ||
          (cust.streetAddress === address && cust.name === name)
      );

      if (customer) {
        result.push(customer);
        customer.setKommune(isKommune).setNumOrders(numOrders);
      }
    }
  }

  updateLocalStorage();
  return result;
}

// # TRY FETCHING ADDRESSES BY PLACE # //
export async function tryFetchPlace(addresses) {
  for (const query of addresses) {
    if (query.coords) continue;

    const request = {
      textQuery: query.deliveries[0].name,
      fields: ['location'],
      region: 'no',
    };

    const { places } = await Place.searchByText(request);

    if (places.length === 0) continue; // no result

    const result = await new Place({ id: places[0].id });
    await result.fetchFields({
      fields: ['location'],
    });

    const coords = {
      lat: result.location.lat(),
      lng: result.location.lng(),
    };

    query.coords = coords;
  }

  return addresses.reduce(
    (acc, address) => {
      acc[address.coords ? 'succes' : 'error'].push(address);
      return acc;
    },
    { error: [], succes: [] }
  );
}

// # TRY FETCHING ADDRESSES COORDS BY ADDRESS # //
export async function tryFetchAddress(addresses) {
  for (const query of addresses) {
    try {
      const address = `${query.streetAddress}, ${query.postcode}, ${query.area}`;

      const url = `${API_URL}/json?address=${encodeURIComponent(
        address
      )}&region=no&key=${API_KEY}`;

      const data = await getJSON(url); // get API response using getJSON helper function
      await wait(API_WAIT); // delay to avoid overloading API server

      if (data.status !== 'OK') throw new Error(`No results found!`);

      const { results } = data;

      query.handleGeoData(results);
    } catch (error) {
      console.error(
        `⚠️ An error occured fetch data for ${query.streetAddress}:\n${error.message} `
      );
    }
  }

  return addresses.reduce(
    (acc, address) => {
      acc[address.coords ? 'succes' : 'error'].push(address);
      return acc;
    },
    { error: [], succes: [] }
  );
}

// # FILTERS OUT ALL ADDRESSES THAT DO NOT HAVE COORDS # //
export function setAddresses() {
  state.addresses = state.addresses.filter(
    add => add.coords && add.deliveries.length >= 1
  );
  state.customers = state.addresses.map(add => add.deliveries).flat();
}

// # SETS LOCALSTORAGE TO CURRENT STATE # //
export function updateLocalStorage() {
  // make a deepclone to store
  const tempState = cloneDeep(state);

  // removing markers
  tempState.addresses = tempState.addresses.map(
    ({ marker, card, ...rest }) => ({
      ...rest,
    })
  );

  // removing html cards
  tempState.userRoutes.forEach(
    route =>
      (route.plannedAddresses = route.plannedAddresses.map(
        ({ marker, card, ...rest }) => ({ ...rest })
      ))
  );

  // removing html tables
  tempState.userRoutes = tempState.userRoutes.map(
    ({ table, rowContainer, ...rest }) => ({
      ...rest,
    })
  );

  localStorage.setItem('storedState', JSON.stringify(tempState));
}

// # RETRIEVES LOCALSTORAGES AND RESTORES PROTOTYPES # //
export async function getLocalStorage() {
  const tempStateStr = localStorage.getItem('storedState');
  const tempState = await JSON.parse(tempStateStr);

  if (!tempState) return;

  // declare state as fetched data
  state.customers = tempState.customers.map(c => restoreProtoTypeCustomer(c));
  state.addresses = tempState.addresses.map(a =>
    restoreProtoTypeAddress(a, state.customers)
  );
  state.userRoutes = tempState.userRoutes.map(r =>
    restoreProtoTypeRoute(r, state.addresses)
  );
}

// # PUSH THE GIVEN ROUTE TO THE CURRENT STATE.USERROUTES ARRAY # //
export function pushRoute(route) {
  state.userRoutes.push(route);
  updateLocalStorage();
}
// # POP THE GIVEN ROUTE FROM THE STATE.USERROUTES ARRAY # //
export function popRoute(route) {
  const index = state.userRoutes.findIndex(stateRoute => stateRoute === route);

  if (index !== undefined) state.userRoutes.splice(index, 1);

  updateLocalStorage();
}
