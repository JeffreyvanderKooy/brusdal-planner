'use strict';

// importing Jquery
import $ from 'jquery';

export class UserRoute {
  table; // used to store the table element belonging to this route after rendering
  #rowContainer;
  plannedAddresses = []; // empty array to store added addresses to this new route

  constructor(name) {
    this.name = name;
    this.id = Date.now().toString().slice(-6);
  }

  /**
   * Functionality for adding a address to this userRoute
   * @param {Object} address object with instanceof Address
   * @this userRoute
   */
  addAddress(address) {
    if (!this.plannedAddresses.includes(address))
      this.plannedAddresses.push(address);

    this.#rowContainer
      .get(0)
      .insertAdjacentHTML('afterbegin', this.createAddressRow(address));
    this.updateTableUI();
  }

  /**
   * Functionality for removing given address from this planned route
   * @param {Object} address object with instanceof Address
   * @this userRoute
   */
  removeAddress(address) {
    // get HTML element of the table row containing this address data
    this.table.find(`tr[data-id="${address.id}"]`).remove();

    // get index of given address object
    const index = this.plannedAddresses.findIndex(
      plannedAdd => plannedAdd === address
    );

    this.plannedAddresses.splice(index, 1); // remove this address from the array

    // update num customers num stops in HTML table
    this.updateTableUI();
  }

  /**
   * returns initial table markup for this userRoute
   * @returns HTML Table markup
   */
  tableHTML() {
    return ` <div class="user-route container fs-6 w-100 border p-2 rounded"  data-id="${
      this.id
    }">
                <div class="d-flex justify-content-between">
                 <h5 class="fw-semibold">${this.name}</h5>
                  <h6>
                      Stops:
                      <span class="fst-italic num-stops me-2">0</span>
                      Customers:
                      <span class="fst-italic num-customers">0</span>
                  </h6>
                 </div>

            <table class="table table-striped table-hover fs-8">
              <thead class="fw-bold">
                <tr>
                  <td scope="col">Address</th>
                  <td scope="col" class="text-center">Postcode</th>
                  <td scope="col" class="text-center">Area</th>
                  <td scope="col" class="text-center"># Customers</th>
                  <td scope="col" class="text-center">Kommune</th>
                  <td scope="col" class="text-center"><button type="button" class="fs-8 btn btn-outline-danger delete-route">
                    <i class="bi bi-trash-fill me-1"></i>Delete</button></i></th> 
                </tr>
              </thead>
              <tbody>
                ${this.plannedAddresses
                  .map(address => this.createAddressRow(address))
                  .join('')}
              </tbody>
            </table>
          </div>`;
  }

  /**
   * Creates HTML markup for given address object to be later inserted into the DOM
   * @param {Object} address
   * @returns HTML Markup for the new table row
   */
  createAddressRow(address) {
    // declare classnames var, address will always be the main css styling of the address card
    let extraClass;

    // if there is a address.numOrders, then the card will get extra styling depending on the amount of orders
    if (address.averageNumOrders > 0)
      extraClass = `${
        address.averageNumOrders >= 2.7 ? 'table-primary' : 'table-info'
      }`;

    const html = `<tr class="fs-6 fst-italic ${extraClass}" data-id="${
      address.id
    }">
                    <td>${address.streetAddress}</td>
                    <td class="text-center">${address.postcode}</td>
                    <td>${address.area}</td>
                    <td class="text-center">${address.deliveries.length}</td>
                    <td class="text-center">
                      <i class="bi bi-check2 ${
                        address.deliveries.some(del => del.isKommune)
                          ? 'visible'
                          : 'invisible'
                      }"></i>
                    </td>
                    <td class="text-center">
                      <button class="btn row-delete p-0" type="button">
                      <i class="bi bi-x"></i>
                      </button>
                    </td>
                </tr>`;

    return html;
  }

  // # UPDATES HTML AND MARKUP FOR THIS TABLE # //
  update() {
    $(this.#rowContainer).html('');
    this.plannedAddresses.forEach(planned => this.addAddress(planned));
  }

  // # DEFINE THIS.TABLE (TO BE CALLED AFTER THE TABLE HAS BEEN RENDERED) # //
  setTable() {
    this.table = $(`.user-route[data-id="${this.id}"]`);
    this.#rowContainer = this.table.find('table tbody');
    return this;
  }

  // # ADDS A SELECT BUTTON FOR THIS ROUTE # //
  addSelectBtn() {
    $('#editRouteSelect')
      .get(0)
      .insertAdjacentHTML(
        'beforeend',
        `<option value="${this.id}">${this.name}</option>`
      );

    return this;
  }

  // # ADDS CSS STYLING TO THIS TABLE TO SHOW THE USER THAT ITS HIGHLIGHTED / BEING WORKED ON ATM # //
  highlightTable() {
    // if a table is currently highlighted remove that styling
    $('.user-route.border-primary')?.removeClass('border-primary');
    $(this.table)?.addClass('border-primary');

    return this;
  }

  // # SCROLLS THIS TABLE INTO VIEW # //
  scroll() {
    this.table?.get(0)?.scrollIntoView({ behavior: 'smooth' });
    return this;
  }

  // # RETURNS THIS.PLANNEDADDRESSES # //
  getAddresses() {
    return this.plannedAddresses;
  }

  // # AMOUNT OF CUSTOMERS PLANNED INTO THIS ROUTE # //
  numCustomers() {
    return this.plannedAddresses.reduce(
      (acc, val) => (acc += val.deliveries.length),
      0
    );
  }

  // # UPDATE CUSTOMER AND STOP COUNTER # //
  updateTableUI() {
    this.table.find('.num-stops').text(this.plannedAddresses.length);
    this.table.find('.num-customers').text(this.numCustomers());
  }

  // # REMOVE HTML MARKUP FOR THIS TABLE # //
  remove() {
    $(this.table).remove();
    $(`#editRouteSelect option[value="${this.id}"]`).remove();
    return this;
  }

  // # RETURNS HTML ELEMENT FOR THIS TABLE # //
  getTable() {
    return this.table;
  }
}

/**
 * Used to restore the prototype of the routeObj, to be called when fetching data from localStorage
 * @param {Object} routeObj routeObject for wich the prototype needs to be restored
 * @param {Array} addresses array of addresses with restores prototypes to loop trough and add to "this.plannedAddresses"
 * @returns restored routeObject
 */
export function restoreProtoTypeRoute(routeObj, addresses) {
  Object.setPrototypeOf(routeObj, UserRoute.prototype);
  routeObj.plannedAddresses = routeObj.plannedAddresses.map(address =>
    addresses.find(a => a.id === address.id)
  );
  return routeObj;
}
