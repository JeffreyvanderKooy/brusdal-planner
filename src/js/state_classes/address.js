'use strict';

import $ from 'jquery';

//  generate a unique ID for each route
import uniqid from 'uniqid';

export class Address {
  id;
  deliveries = []; // Empty array to store Customers belonging to this array
  averageNumOrders; // Used to store the average amount of orders at this address when user adds these
  card;

  // to store data about the marker visible on he map
  marker;

  constructor(address) {
    this.streetAddress = address;
    this.id = uniqid.process();
  }

  /**
   * shows/hides the list of customers when a user clicks on the customer icon in a address HTML card
   * @returns Address object
   */
  toggleSlideDropdown() {
    $($(this.card).get(0).querySelector('.dropdown')).toggle();
    return this;
  }

  /**
   * Defines the this.deliveries array as the given customers array
   * @param {Array} customers
   * @this Address the current address object
   */
  addCustomers(customers) {
    this.deliveries = customers;
    this.postcodeAndArea = customers;

    this.calcNumAverageOrder();
  }

  /**
   * calculate the average amount of orders per month for this address based on amount of orders for each delivery
   * @returns number defining average number of orders per month
   */
  calcNumAverageOrder() {
    this.averageNumOrders = this.deliveries
      .filter(deliv => deliv.numOrders)
      .reduce(
        (sum, delivery, _, arr) => (sum += delivery.numOrders / arr.length),
        0
      )
      .toFixed(1);

    return this.averageNumOrders;
  }

  /**
   * Sets the area, postcode and route properties to the value of the first customers in the given customers array
   * @param {Array} deliveriesArr  */
  set postcodeAndArea(deliveriesArr) {
    if (this.area || this.postcode || this.route) return;

    this.area = deliveriesArr[0].area;
    this.postcode = deliveriesArr[0].postcode;
    this.route = deliveriesArr[0].route;
  }

  handleGeoData(data) {
    const result = data.find(data =>
      data.address_components.find(comp => comp.long_name === 'Norway')
    );

    if (!result) throw new Error('Fetched address is not located in Norway.');

    // find address details
    const nr = result.address_components.find(comp =>
      comp.types.includes('street_number')
    )?.long_name;

    const street = result.address_components.find(comp =>
      comp.types.includes('route')
    )?.long_name;

    const area = result.address_components.find(comp =>
      comp.types.includes('postal_town')
    )?.long_name;

    const postcode = result.address_components.find(comp =>
      comp.types.includes('postal_code')
    )?.long_name;

    this.postcode = postcode || this.postcode;
    this.area = area || this.area;
    this.streetAddress = street && nr ? `${street} ${nr}` : this.streetAddress;

    this.coords = result.geometry.location;

    this.deliveries.forEach(del => (del.coords = this.coords)); // set the coords to the addresses coords for each customer
  }

  // # API FOR MARKER # //
  toggleMarkerIcon(bool) {
    bool
      ? !$(this.marker.content).hasClass('highlight-on-map') &&
        $(this.marker.content).addClass('highlight-on-map')
      : $(this.marker.content).toggleClass('highlight-on-map');
    
    return this;
  }

  toggleMarkerPopup() {
    $(this.marker.content).toggleClass('highlight');
    this.marker.zIndex = this.marker.content.classList.contains('highlight')
      ? 10
      : 1;

    return this;
  }

  toggleMarker(map = null) {
    this.marker.map = map;

    return this;
  }

  markerIsVisible() {
    return this.marker ? this.marker.map !== null : false;
  }

  setMarkerContent() {
    // generating markup
    const content = document.createElement('div');
    content.classList.add('maps-marker');
    content.setAttribute('data-id', this.id);
    content.innerHTML = `
    <div class="position-absolute top-0 end-0 p-1 marker-exit">
          <i class="bi bi-x marker-exit"></i>
    </div>
    <div class="icon">
        <p>${this.deliveries.length}</p>
    </div>
    <div class="details">
        
        <h5 class="text-center">${this.streetAddress}</h5>
        <div class="d-flex flex-column overflow-y-auto gap-1">
        ${this.deliveries
          .map(
            del =>
              `<div class="d-flex"><p class="me-3">${del.id}</p><p>${del.name}</p></div>`
          )
          .join('<hr />')}
        </div>
    </div>
    `;

    this.marker.content = content;

    return this;
  }
}

/**
 * Function to be used on fetched data from LocalStorage to restore the prototype
 * @param {Object} addressObj Address object of wich the prototype needs to be set
 * @param {Array} customerArr Array of customers to loop over and filter out the customers that have the same street address
 * @returns Restored Address object
 */
export function restoreProtoTypeAddress(addressObj, customerArr) {
  Object.setPrototypeOf(addressObj, Address.prototype);

  addressObj.deliveries = customerArr.filter(
    tempCust =>
      tempCust.coords?.lat === addressObj.coords.lat &&
      tempCust.coords?.lng === addressObj.coords.lng
  );

  return addressObj;
}
