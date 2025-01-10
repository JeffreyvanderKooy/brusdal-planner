'use strict';
import { cleanAddress } from '../helper.js';

export class Customer {
  isKommune = false;
  numOrders = 0;

  constructor(
    id,
    name,
    postcode,
    area,
    streetAddress,
    route,
    creationDate,
    lastOrderDate
  ) {
    this.id = id;
    this.name = name;
    this.postcode = postcode;
    this.area = area;
    this.streetAddress = streetAddress;
    this.route = route;
    this.creationDate = this.parseDate(creationDate);
    this.lastOrderDate = this.parseDate(lastOrderDate);
  }

  /**
   * Parses the given date string to a date object
   * @param {string} date expected format "day.month.year"
   * @returns new Date object
   */
  parseDate(date) {
    const [day, month, year] = date.split('.');
    return new Date(`${month}.${day}.${year}`);
  }

  /**
   * cleans the address using the helper function (removes double spaces etc.)
   * @param {string} address
   */
  set streetAddress(address) {
    this._streetAddress = cleanAddress(address);
  }

  /**
   * Sets the average number of orders by dividing it by 11
   * @param {number} numOrders
   * @returns Customer
   */
  setNumOrders(numOrders) {
    this.numOrders = (numOrders / 11).toFixed(1);
    return this;
  }

  /**
   * Sets the isKommune property by given boolean
   * @param {boolean} bool
   * @returns Customer
   */
  setKommune(bool) {
    this.isKommune = bool;
    return this;
  }

  get streetAddress() {
    return this._streetAddress;
  }
}

/**
 * Restores the prototype of given customer object, to be used when restoring prototypes from localStorage
 * @param {Object} custObj Customer object
 * @returns restored customer object
 */
export function restoreProtoTypeCustomer(custObj) {
  Object.setPrototypeOf(custObj, Customer.prototype);

  custObj.creationDate = new Date(custObj.creationDate);
  custObj.lastOrderDate = new Date(custObj.lastOrderDate);

  return custObj;
}
