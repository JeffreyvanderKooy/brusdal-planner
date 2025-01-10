'use strict';

import cloneDeep from 'lodash/cloneDeep';
import { cleanAddress } from './helper.js';
import { capitalizeWords } from './helper.js';
import { restoreProtoTypeAddress } from './state_classes/address.js';
import { restoreProtoTypeCustomer } from './state_classes/customer.js';
import { restoreProtoTypeRoute } from './state_classes/userRoute.js';

import { Customer } from './state_classes/customer.js';
import { Address } from './state_classes/address.js';

// # STATE TO USE ACROSS ALL MODULES, SHOULDN ONLY BE MODIFIED IN THIS FILE # //
export const state = {
  addresses: [],
  customers: [],
  userRoutes: [],
};

// # CREATES NEW CUSTOMERS OUT OF GIVEN ARRAY INPUT  # //
export async function addNewCustomers(userInput) {
  // iterates over the loop aslong as there is userInput to parse
  while (userInput.length !== 0) {
    const data = userInput.splice(0, 8).map(data => data.trim()); // take the first 8 values in the array
    const newCustomer = new Customer(...data);
    if (newCustomer.route !== 'KB05') {
      // check if this customer already exists in the current database
      const checkForDuplicate = state.customers.find(
        cust =>
          cust.id === newCustomer.id ||
          (cust.name.toLowerCase() === newCustomer.name.toLowerCase() &&
            cust.streetAddress.toLowerCase() ===
              newCustomer.streetAddress.toLowerCase())
      );

      if (!checkForDuplicate) state.customers.push(newCustomer);
    }
  }

  // get all unique addresses (eg. streetnames)
  const uniqueAddresses = new Set([
    ...state.customers.map(cust => cust.streetAddress.toLowerCase()),
  ]);

  // try if this address already exists
  uniqueAddresses.forEach(function (streetName) {
    const addressExists = state.addresses.find(
      address => address.streetAddress.toLowerCase() === streetName
    );

    if (!addressExists) {
      // if it doesnt exists add a new address object
      const newAddress = new Address(capitalizeWords(streetName));
      newAddress.addCustomers(
        state.customers.filter(
          cust => cust.streetAddress.toLowerCase() === streetName.toLowerCase()
        )
      );

      state.addresses.push(newAddress);
    }
  });

  updateLocalStorage();
}

// # ADDS AVERAGENUM ORDERS FOR EACH CUSTOMER THAT MATCHES USERINPUT # //
export function parseNumOrders(userInput) {
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
      state.customers
        .find(
          cust =>
            cust.id === custID ||
            (cust.streetAddress === address && cust.name === name)
        )
        ?.setKommune(isKommune)
        .setNumOrders(numOrders);
    }
  }

  updateLocalStorage();
}

// # FETCHES COORDS FOR ALL ADDRESSES THAT DO NOT HAVE THE PROPERTY COORDS # //
export async function FetchAllCoords() {
  for (const address of state.addresses.filter(add => !add.coords)) {
    try {
      await address.fetchCoord(); // Await each fetchCoord() call individually
    } catch (error) {
      console.error(`An error occured: `, error.message);
    }
  }

  state.addresses = state.addresses.filter(add => add.coords); // filter out all addresses where there could not be fetched coords

  updateLocalStorage();
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
  tempState.userRoutes = tempState.userRoutes.map(({ table, ...rest }) => ({
    ...rest,
  }));

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
  if (index) state.userRoutes.splice(index, 1);
  updateLocalStorage();
}
