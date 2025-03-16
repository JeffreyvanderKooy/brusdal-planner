'use strict';

// polyfilling
import 'core-js/stable';
import 'regenerator-runtime/runtime';

import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';

import { UPDATE_LOADBTN_MS } from './config.js';

import * as model from './model.js';
import {
  findDuplicateCoord,
  parseArr,
  compressDuplicates,
  updateTimeLeft,
} from './helper.js';

import mapView from './views/mapView.js';
import orderContainerView from './views/ordersContainerView.js';
import routesContainerView from './views/routesContainerView.js';
import loaderView from './views/loaderView.js';
import inputView from './views/inputView.js';
import modalView from './views/modalView.js';

// # FUNCTION CALLED WHEN PRESSED ENTER IN THE "New Route" INPUT # //
function controlNewRoute(e) {
  // get the new route object from the routes view
  const newRoute = routesContainerView.createNewRoute(e);

  // if no new route obj return
  if (!newRoute) return;

  // add this new route obj to state const
  model.pushRoute(newRoute);
}

// # FUNCTION CALLED WHEN USER CLICKS THE DELETE BIN ICON ON A ACTIVE userRoute # //
async function controlDeleteRoute(e) {
  const route = await routesContainerView.deleteRoute(e);

  if (!route) return modalView.error();

  model.popRoute(route);

  orderContainerView.update(model.state.addresses);
}

// # FUNCTION CALLED WHEN USER SHIFTS CLICKS A ADDRESS CARD IN THE ORDERCONTAINER # //
function controlPlanDelivery(e) {
  // add the delivery to the current highlighted route, rendering a HTML row for this and removing the HTML card
  routesContainerView.planDelivery(e);

  // refilters the addresses, taking out the address that was currently added
  orderContainerView.filterAddresses().searchCustomers();

  // store current state in localStorage
  model.updateLocalStorage();
}

// # FUNCTION CALLED WHEN USER SHIFT DOUBLECLICKS A ADDRESS ROW IN THE HTML TABLE # //
function controlUnplanDelivery(e) {
  // update UI visually to show user that the address has been removed
  routesContainerView.removeDelivery(e);

  // refilters the addresses, taking out the address that was currently added
  orderContainerView.filterAddresses().searchCustomers();

  // store current state in localStorage
  model.updateLocalStorage();
}

// # FUNCTION CALLED WHEN USER SHIFTS CLICKS "Submit Data" BUTTON # //
async function controlSubmitData(data, type) {
  try {
    if (!data || !type) return modalView.error();
    // make the button have a loading animation
    inputView.load();

    // turn the string input into a array
    const parsedData = parseArr(data);

    if (type === 'processCustomers') {
      // send data to model
      const newAddresses = await model.processCustomers(parsedData);

      // upate user on amount of work left
      const interval = setInterval(
        () => inputView.setLoadingText(updateTimeLeft()),
        UPDATE_LOADBTN_MS
      );

      // model makes API calls
      const result = await model.tryFetchAddress(newAddresses); // try fetching by address, returns failed to fetch

      compressDuplicates(findDuplicateCoord(model.state.addresses)); // Finds addresses with same coords and combines them into one
      model.setAddresses(); // filters out addresses with no coords or no customers

      clearInterval(interval); // done fetching, stop upating user

      // # UPDATE UI  # //
      mapView.initMarkers(model.state.addresses);
      orderContainerView.update(model.state.addresses);

      modalView.doneFetching(result);
    }

    if (type === 'processNumOrders') {
      model.processNumOrders(parsedData); // send data to model
      orderContainerView.styleCards(model.state.addresses); // style cards with new data
      modalView.succes();
    }

    inputView.reset();
    routesContainerView.updateRoutes(model.state.userRoutes); // updates HTML tables with new data

    // save data
    model.updateLocalStorage();
  } catch (error) {
    console.error(error);
    modalView.error();
  }
}

// # FUNCTION CALLED WHEN PAGE LOADS # //
(async function init() {
  await model.getLocalStorage(); // fetch stored data

  await mapView.loadMap(); // load the map

  mapView.initMarkers(model.state.addresses); // load Markers

  // adding event listeners
  inputView.addHandlerSubmit(controlSubmitData);
  orderContainerView.addHandlerPlanDel(controlPlanDelivery);
  routesContainerView.addHandlerDeleteRoute(controlDeleteRoute);
  routesContainerView.addHandlerNewRoute(controlNewRoute);
  routesContainerView.addHandlerUnplanDel(controlUnplanDelivery);

  orderContainerView.update(model.state.addresses);
  routesContainerView.render(model.state.userRoutes);

  loaderView.hide();
})();
