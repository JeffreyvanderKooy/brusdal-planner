'use strict';

// jquery
import $ from 'jquery';

import { state } from '../model.js';
import { UserRoute } from '../state_classes/userRoute.js';
import mapView from './mapView.js';

class RoutesContainer {
  // used to store the currently highlighted route, this is the only route the users is allowed to add, remove deliveries to
  // the user can also only delete this route!
  #highlighted;

  #newRouteInput = $('#newRoute');
  #tableContainer = $('#userRoutesContainer');
  #selectRoute = $('#editRouteSelect');

  constructor() {
    // Event handler for changing the currently selected route
    $(this.#selectRoute).on('change', this.#selectTable.bind(this));
  }

  /**
   * function to be called by the controller for giving handlers
   * @param {Function} controlNewRoute function given by controller to controll the creation of a new route
   * @param {Function} controlUnplanDelivery function given by controller to controll the removing of a delivery from a route
   * @param {Function} controlDeleteRoute function given by controller to controll the deletion of a user created route
   */
  addHandlerDeleteRoute(controlDeleteRoute) {
    $(this.#tableContainer).on('click', e => {
      if (e.target.closest('.delete-route')) controlDeleteRoute(e);
    });
  }

  addHandlerUnplanDel(controlUnplanDelivery) {
    // Event handler for removing a planned address from a route
    $(this.#tableContainer).on('click', e => {
      if (e.target.closest('.row-delete')) controlUnplanDelivery(e);
    });
  }

  addHandlerNewRoute(controlNewRoute) {
    // Event handler for adding a new user made route
    $(this.#newRouteInput).on('keypress', controlNewRoute);
  }

  // # LOGIC FOR ADDING A DELIVERY TO CURRENTLY HIGHLIGHTED ROUTE # //
  planDelivery(e) {
    if (!e.shiftKey) return;
    if (!this.#highlighted) return alert('Hightlight a route first!');

    const clickedAddressCard = e.target.closest('.address-card'); // get the HTML card

    const addressID = clickedAddressCard.dataset.id; // get the address based on dataset

    if (!addressID) return;

    // find the address object
    const address = state.addresses.find(stateAdd => stateAdd.id === addressID);

    address.toggleMarker(); // hides the marker
    $(clickedAddressCard).hide(); // hide the card

    this.#highlighted.addAddress(address); // add this address to currently highlighted route

    return this;
  }

  // # LOGIC FOR REMOVING A DELIVERY FROM CURRENTLY HIGHLIGHTED ROUTE # //
  removeDelivery(e) {
    // select the street address to remove
    const addressID = e.target.closest('tr').dataset.id;
    const userRouteID = $(e.target).closest('.user-route').data('id');
    const userRoute = state.userRoutes.find(route => route.id == userRouteID);
    const address = userRoute.plannedAddresses.find(a => a.id === addressID);

    userRoute.removeAddress(address);

    // create a marker for this address, making it orange if this route is currently highlighted
    mapView.getHighlightedRoute() === address.route
      ? mapView.addMarker(address, 'icon-div-highlight')
      : mapView.addMarker(address);
  }

  // # LOGIC FOR CREATING A NEW ROUTE AND SOME UI UPDATING # //
  createNewRoute(e) {
    if (e.key !== 'Enter') return; // check for enter press (submit)

    const name = $(this.#newRouteInput).val().replace(/\s+/g, ' ').trim();

    $(this.#newRouteInput).val('').blur();
    console.log(state);

    // check if there is already a route with given name
    const checkForDuplicate = state.userRoutes.find(
      route => route.name === name
    );

    if (checkForDuplicate) return alert('Route already exists!');

    const newRoute = new UserRoute(name); // make a new route object
    this.render(newRoute); // render the HTML table
    return newRoute;
  }

  // # DELETE ROUTE # //
  deleteRoute(e) {
    const id = e.target.closest('.user-route').dataset.id;

    const route = state.userRoutes.find(route => route.id === id);

    if (!route) return;

    if (confirm('Are you sure that you want to delete this route FOREVER?')) {
      route.remove();
      this.#clearHighlighted();
      return route;
    }
  }

  // # UPDATE TABLE ROWS # //
  updateRoutes(routes) {
    routes.forEach(route => route.update());
  }

  // # FUNCTION CALLED WHEN USER SELECTS A NEW ROUTE TO EDIT # //
  #selectTable(e) {
    const selectedRouteID = $(e.currentTarget).val();

    if (!selectedRouteID) return this.#clearHighlighted();

    const selectedRoute = state.userRoutes.find(
      route => route.id === selectedRouteID
    );

    $('#clearHighlighted').text(`Stop planning: ${selectedRoute.name}`);

    selectedRoute.highlightTable().scroll();
    this.#highlighted = selectedRoute;
  }

  // # CLEAR THE THIS.#HIGHLIGHTED (USER DOES NOT WANT TO HIGHLIGHT A ROUTE ATM) # //
  #clearHighlighted() {
    this.#highlighted = undefined;
    $('.user-route.border-primary')?.removeClass('border-primary'); // remove highlighted css styling
    $('#clearHighlighted').text(`Select A Route To Start Planning`);
  }

  // # RENDER HTML FOR GIVEN ROUTES # //
  render(input) {
    $(this.#tableContainer).html('');

    Array.isArray(input)
      ? input.forEach(input => this.#renderRoute(input))
      : this.#renderRoute(input);
    return this;
  }

  // # RENDER HTML FOR A SINGULAR ROUTE # //
  #renderRoute(userRoute) {
    $(this.#tableContainer)
      .get(0)
      .insertAdjacentHTML('afterbegin', userRoute.tableHTML());
    userRoute.setTable().addSelectBtn().scroll();
    return this;
  }
}

export default new RoutesContainer();
