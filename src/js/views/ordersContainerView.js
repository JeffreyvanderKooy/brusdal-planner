'use strict';

import $ from 'jquery';
import * as bootstrap from 'bootstrap';

import customerImg from '../../img/customer_icon.png';
import kommuneImg from '../../img/bergen_kommune_logo.png';
import { DELAY_SEARCH_FILTER } from '../config.js';

import mapView from './mapView.js';
import { state } from '../model.js';
import { filterByMonth } from '../helper.js';
import { addressesInPlannedRoutes } from '../helper.js';
import { search } from '../helper.js';

class OrdersContainer {
  // used to store all addresses that are currently not in a userRoute and also have ordered in the given amount of "months"
  #filteredAddresses = [];

  #cardsContainer = $('#cardsContainer');
  #searchInput = $('#searchOrders');
  #monthsInput = $('#searchMonths');
  #filteredStopsCount = $('#numStops');
  #filteredCustCount = $('#numCustomers');

  #isSearching = false;
  #isFiltering = false;

  constructor() {
    this.#configBootstrapTooltips();
  }

  /**
   * Function to be called by the controller to pass in the controller function for planning addresses in deliveries.
   * Also adds other handlers from internal functions.
   * @param {Function} handlerPlanDelivery function given by controller.js
   */
  addHandlerPlanDel(handlerPlanDelivery) {
    $(this.#cardsContainer).on('click', e =>
      e.shiftKey ? handlerPlanDelivery(e) : this.#handleContainerClick(e)
    );

    // event triggered when user types into the searchbar
    $(this.#searchInput).on('keyup', () => {
      if (this.#isSearching) clearTimeout(this.#isSearching);

      this.#isSearching = setTimeout(
        this.#searchCustomers.bind(this),
        DELAY_SEARCH_FILTER
      );
    });

    // event triggered when user changes the months input
    $(this.#monthsInput).on('change', () => {
      if (this.#isFiltering) clearTimeout(this.#isFiltering);

      this.#isFiltering = setTimeout(() => {
        this.#filterAddresses() // Refilter addresses
          .#searchCustomers(); // hide/show HTML cards)}
        mapView.showMarkers(this.#filteredAddresses); // hides all current markers and shows the ones in this.#filtered
      }, DELAY_SEARCH_FILTER);
    });
  }

  /**
   * searches the currently filtered customers for the customers of wich the properties include what the user typed for in the searchbar
   * @returns ordersContainerView
   */
  #searchCustomers() {
    // get current search input
    const query = $(this.#searchInput).val().toLowerCase();

    // get an array of addresses for the searchresults
    const results = query
      ? search(this.#filteredAddresses, query)
      : this.#filteredAddresses;

    // get all the html cards for the filtered addresses
    const resultsCards = results.map(address => address.card.get(0));

    // hide cards that are not filtered, show cards that are hidden but are filtered
    $('.address-card').each(function () {
      !$(this).is(':animated') && $(this).toggle(resultsCards.includes(this));
    });

    // upate stop + customer counter
    $(this.#filteredCustCount).text(
      results.reduce((acc, item) => (acc += item.deliveries.length), 0)
    );
    $(this.#filteredStopsCount).text(results.length);

    // reset the timeouts to delay user input
    this.#isFiltering = this.#isSearching = false;

    return this;
  }

  /**
   * filters the addresses based on number of months input, also called when months input is called to rerender markers on map and HTML cards
   * @returns ordersContainerView
   */
  #filterAddresses() {
    const addressesInRoutes = addressesInPlannedRoutes().map(
      address => address.id
    );

    const months = +$(this.#monthsInput).val(); // parse months input to number

    // filter out all addresses that are already planned in a route
    // as there shouldnt be a marker for those
    this.#filteredAddresses = state.addresses.filter(
      add =>
        !addressesInRoutes.includes(add.id) &&
        add.deliveries.some(del => filterByMonth(del, months))
    );

    return this;
  }

  /**
   * creates a HTML card and insterts it into the DOM for given address object
   * @param {Object} address Address object
   * @returns orderContainerView
   */
  #renderCard(address) {
    if (address.card) $(address.card).remove();

    const customers = address.deliveries
      .map(
        cust => `<small>
                    <span class="fst-italic me-3">${cust.id}</span>
                    <span class="">${cust.name}</span>
                </small><br/>`
      )
      .join('');

    const html = `<li class="list-group-item fs-6 p-2 text-body-emphasis address-card" style="display: none;" data-id="${address.id}">
                    <div class="d-flex justify-content-between align-items-center">
                      <div class="flex-grow-1 h-100  address-info pointer">
                      <p class="m-0 p-0 fw-semibold">${address.streetAddress}</p>
                      <p class="m-0 p-0 fw-normal">${address.postcode}, ${address.area}</p>
                      <p class="m-0 p-0 fst-italic">${address.route}</p>
                    </div>
                   <div class="opacity-75 rounded-circle d-flex pointer align-items-center justify-content-center h-100 gap-1 position-relative">
                      <p class="m-0 fw-bold">${address.deliveries.length}</p>
                      <div class="d-flex justify-content-center align-items-center" style="width: 40px; height: 40px;">
                        <img
                          src="${customerImg}"
                          alt="customer logo"
                          class="img-fluid"
                          style="width: 100%; height: auto;"
                          data-bs-toggle="collapse"
                          role="button"
                          aria-expanded="false"
                        />
                      </div>
                    </div>
                    </div>
                   <div class="dropdown">
                      <div class="p-1">
                        <hr class="rounded-circle" />
                         ${customers}
                      </div>
                    </div>
                  </li>`;

    $(this.#cardsContainer).get(0).insertAdjacentHTML('beforeend', html);

    // define this html card as a property in the address obj and hide it
    address.card = $(`.address-card[data-id="${address.id}"]`);
    address.toggleSlideDropdown();

    // adds custom styling if additional info about the customer has been provided
    this.#styleCard(address);

    return this;
  }

  // # DELEGATES THE CLICK EVENT WHEN USER CLICKS IN ORDERSCONTAINER # //
  #handleContainerClick(e) {
    // get address from dataset attr and pan the map to them
    const id = e.target.closest('.address-card')?.dataset.id;

    if (!id) return;
    // find the address obj that matches the clicked addressname
    const address = state.addresses.find(address => address.id === id);

    e.target.closest('.address-info')
      ? mapView.panToMarker(address)
      : address.toggleSlideDropdown();
  }

  // # CREATE A HTML CARD FOR EACH GIVEN ADDRESS IN THE GIVEN ARRAY # //
  render(input) {
    $(this.#cardsContainer).html('');

    Array.isArray(input)
      ? input.forEach(address => this.#renderCard(address))
      : this.#renderCard(input);

    return this;
  }

  // # ADDS BORDER STYLING AND ICON STYLING FOR EACH ADDRESS CARD IN STATE.ADDRESSES # //
  styleCards(addresses) {
    addresses.forEach(address => this.#styleCard(address));
  }

  // # ADDS CUSTOM STYLING TO THE ADDRESS CARD DEPENDING ON # ORDERS ETC # //
  #styleCard(address) {
    if (!address.card) return;

    // if there is a address.numOrders, then the card will get extra styling depending on the amount of orders
    if (address.calcNumAverageOrder() > 0)
      $(address.card).addClass(
        address.averageNumOrders >= 2.7
          ? 'address-many-orders'
          : 'address-less-orders'
      );

    if (address.deliveries.some(del => del.isKommune))
      $(`.address-card[data-id="${address.id}"] img`).attr('src', kommuneImg);
  }

  // # RETURNS THIS.FILTEREDADDRESSES # //
  getFilteredAddresses() {
    return this.#filteredAddresses;
  }

  // # REFILTERS ADDRESS, RENDERS A MAPHEADER BUTTON FOR EACH ROUTE, CREATES A MARKER FOR EACH FILTERED ADDRESS AND CREATES HTML CARDS FOR THESE # //
  update(input) {
    this.render(input).#filterAddresses().#searchCustomers();
    mapView.renderHighlightRouteBtn().showMarkers(this.#filteredAddresses);

    return this;
  }

  // # TO BE CALLED IN THE CONSTRUCTOR FUNCTION TO MAKE BOOTSTRAP TOOLTIPS WORK # //
  #configBootstrapTooltips() {
    // configuring bootstrap tooltips
    [...document.querySelectorAll('[data-bs-toggle="tooltip"]')].map(
      tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl)
    );
  }
}

export default new OrdersContainer();
