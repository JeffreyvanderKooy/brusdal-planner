'use strict';

// polyfilling
import 'core-js/stable';
import 'regenerator-runtime/runtime';

import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';

import * as model from './model.js';
import { parseArr } from './helper.js';
import { updateTimeLeft } from './helper.js';

import mapView from './views/mapView.js';
import orderContainerView from './views/ordersContainerView.js';
import routesContainerView from './views/routesContainerView.js';
import loaderView from './views/loaderView.js';
import inputView from './views/inputView.js';

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
function controlDeleteRoute(e) {
  const route = routesContainerView.deleteRoute(e);
  if (!route) return;
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
    if (!data || !type) return;
    // make the button have a loading animation
    inputView.renderLoadBtn();

    // turn the string input into a array
    const parsedData = parseArr(data);

    if (type === 'processCustomers') {
      // send data to model
      model.addNewCustomers(parsedData);

      // upate user on amount of work left
      const interval = setInterval(
        () => inputView.setLoadingText(updateTimeLeft()),
        1000
      );

      // models makes API calls
      await model.FetchAllCoords();

      // done fetching, stop upating user
      clearInterval(interval);

      // # UPDATE UI  # //
      mapView.initMarkers(model.state.addresses);
      orderContainerView.update(model.state.addresses);
    }

    if (type === 'processNumOrders') {
      model.parseNumOrders(parsedData);
      orderContainerView.styleCards();
    } // send data to model

    // restore the "submit data" button
    inputView.renderNormalBtn().clearInput();
  } catch (error) {
    console.error(error);
  }
}

// # FUNCTION CALLED WHEN PAGE LOADS # //
(async function init() {
  await model.getLocalStorage(); // fetch stored data

  await mapView.loadMap(); // load the map

  mapView.initMarkers(model.state.addresses);

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
