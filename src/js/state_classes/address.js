'use strict';
import { getJSON } from '../helper.js';
import { API_KEY } from '../config.js';
import { API_URL } from '../config.js';
import { API_WAIT } from '../config.js';
import { wait } from '../helper.js';

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
   * Gets the coordinates for this address object using Google Maps API
   * @this Address the current address object
   */
  async fetchCoord() {
    try {
      const address = `${this.streetAddress}, ${this.postcode}, ${this.area}`;

      const url = `${API_URL}${encodeURIComponent(address)}&key=${API_KEY}`;

      const data = await getJSON(url); // get API response using getJSON helper function
      await wait(API_WAIT); // delay to avoid overloading API server

      if (data.status !== 'OK')
        throw new Error(`No Results for: ${address} (${data.status})`);

      const { lat, lng } = data.results[0].geometry.location;
      this.coords = { lat, lng };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Defines the this.deliveries array as the given customers array
   * @param {Array} customers
   * @this Address the current address object
   */
  addCustomers(customers) {
    this.deliveries = customers;
    this.#postcodeAndArea = customers;

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
  set #postcodeAndArea(deliveriesArr) {
    this.area = deliveriesArr[0].area;
    this.postcode = deliveriesArr[0].postcode;
    this.route = deliveriesArr[0].route;
  }

  // # API FOR MARKER # //
  toggleMarkerIcon() {
    $(this.marker.content).toggleClass('highlight-on-map');
  }

  toggleMarkerPopup() {
    $(this.marker.content).toggleClass('highlight');
    this.marker.zIndex = this.marker.content.classList.contains('highlight')
      ? 10
      : 1;
  }

  toggleMarker(map = null) {
    this.marker.map = map;
  }

  markerIsVisible() {
    return this.marker ? this.marker.map !== null : false;
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
      tempCust.streetAddress.toLowerCase() ===
      addressObj.streetAddress.toLowerCase()
  );

  return addressObj;
}
