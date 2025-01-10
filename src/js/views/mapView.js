import $ from 'jquery';

import ordersContainerView from './ordersContainerView';
import { state } from '../model';
import { STANDARD_COORDS } from '../config';
import { API_KEY } from '../config';

(g => {
  var h,
    a,
    k,
    p = 'The Google Maps JavaScript API',
    c = 'google',
    l = 'importLibrary',
    q = '__ib__',
    m = document,
    b = window;
  b = b[c] || (b[c] = {});
  var d = b.maps || (b.maps = {}),
    r = new Set(),
    e = new URLSearchParams(),
    u = () =>
      h ||
      (h = new Promise(async (f, n) => {
        await (a = m.createElement('script'));
        e.set('libraries', [...r] + '');
        for (k in g)
          e.set(
            k.replace(/[A-Z]/g, t => '_' + t[0].toLowerCase()),
            g[k]
          );
        e.set('callback', c + '.maps.' + q);
        a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
        d[q] = f;
        a.onerror = () => (h = n(Error(p + ' could not load.')));
        a.nonce = m.querySelector('script[nonce]')?.nonce || '';
        m.head.append(a);
      }));
  d[l]
    ? console.warn(p + ' only loads once. Ignoring:', g)
    : (d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)));
})({
  key: API_KEY,
  // Use the 'v' parameter to indicate the version to use (weekly, beta, alpha, etc.).
  // Add other bootstrap parameters as needed, using camel case.
});

class mapView {
  #map; // used to store the Leaflet map object after rendering it
  #highlightedRoute; // Used to store the currently highlighted route (orange markers) on the map
  #selectHighlightInput = $('#highlightRoute');
  #mapDiv = $('#map');
  #AdvancedMarkerElement;

  // # ADDING EVENT HANDLERS FOR THIS VIEW # //
  constructor() {
    $(this.#selectHighlightInput).on(
      'click',
      this.#highLightRouteOnMap.bind(this)
    );

    $(this.#mapDiv).on('click', this.#mapClick.bind(this));
  }

  // # GET CURRENT USER LOCATION # //
  #getLocation() {
    if (navigator.geolocation) {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
    }
  }

  // # LOADS THE MAP # //
  async loadMap() {
    const { Map } = await google.maps.importLibrary('maps');
    const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');
    this.#AdvancedMarkerElement = AdvancedMarkerElement;

    const position = await this.#getLocation(); // get current user locations

    const { latitude: lat, longitude: lng } =
      position.coords || STANDARD_COORDS;

    this.#map = new Map(document.getElementById('map'), {
      center: { lat, lng },
      zoom: 14,
      mapId: 'mainMap',
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_LEFT,
      },
      streetViewControl: true,
      streetViewControlOptions: {
        position: google.maps.ControlPosition.BOTTOM_LEFT,
      },
      fullscreenControl: true,
    });

    // Update clusters when the map bounds change
    this.#map.addListener('bounds_changed', () => {
      this.#updateCluster(
        this.#map,
        ordersContainerView.getFilteredAddresses()
      );
    });

    return this;
  }

  // # ADDS A BUTTON FOR EACH UNIQUE ROUTE IN THE <HIGHLIGHT ROUTE> SELECT # //
  renderHighlightRouteBtn() {
    $(this.#selectHighlightInput).html('');
    const html = Array.from(new Set(state.addresses.map(add => add.route)))
      .map(
        route =>
          `<li><a class="dropdown-item" href="#" data-route="${route}">${route}</a></li>`
      )
      .join('');

    $(this.#selectHighlightInput).get(0).insertAdjacentHTML('afterbegin', html);

    return this;
  }

  // # ADD A MARKER FOR GIVEN ADDRESS # //
  addMarker(address) {
    if (address.marker) address.marker.map = null;

    // generating markup
    const content = document.createElement('div');
    content.classList.add('maps-marker');
    content.setAttribute('data-id', address.id);
    content.innerHTML = `
    <div class="position-absolute top-0 end-0 p-1 marker-exit">
          <i class="bi bi-x marker-exit"></i>
    </div>
    <div class="icon">
        <p>${address.deliveries.length}</p>
    </div>
    <div class="details">
        
        <h5 class="text-center">${address.streetAddress}</h5>
        <div class="d-flex flex-column overflow-y-auto gap-1">
        ${address.deliveries
          .map(
            del =>
              `<div class="d-flex"><p class="me-3">${del.id}</p><p>${del.name}</p></div>`
          )
          .join('<hr />')}
        </div>
    </div>
    `;

    // setting marker options
    const marker = new this.#AdvancedMarkerElement({
      map: this.#map,
      content: content,
      position: address.coords,
      title: address.streetAddress,
      gmpClickable: true,
      zIndex: 1,
    });

    address.marker = marker; // save the marker object on the Address
    address.toggleMarker(); // hides the marker on initial load
  }

  // # EVENT DELEGATION FOR MAPCLICKS # //
  #mapClick(e) {
    const clicked = $(e.target).closest('.maps-marker'); // get clicked marker
    const id = clicked.data('id'); // get the id of the address the marker belongs oto
    const address = state.addresses.find(a => a.id === id); // find address

    if (!address) return;

    // either exit button was clicked or the marker was clicked while it wasnt highlighted
    if (e.target.closest('.marker-exit') || !clicked.hasClass('highlight'))
      return address.toggleMarkerPopup();

    // scroll the card into view
    $(address.card).get(0).scrollIntoView({ behavior: 'smooth' });
  }

  // # RENDERS ALL THE MARKERS GIVEN IN THE ARRAY AND HIDES THEM ON INITIAL # //
  initMarkers(addresses) {
    addresses.forEach(address => this.addMarker(address));

    return this;
  }

  // # FUNCTION TO USE IN ORDERSCONTAINERVIEW WHEN RE FILTERING BY MONTH TO SHOW ONLY GIVEN ADDRESSES's MARKERS # //
  showMarkers(addresses) {
    // hide all the currently visible markers
    state.addresses.forEach(address => address.toggleMarker());

    // show only markers for given addresses
    addresses.forEach(address => address.toggleMarker(this.#map));

    return this;
  }

  // # PAN TO MARKER ON THE MAP FOR GIVEN ADDRESS # //
  panToMarker(address) {
    this.#map.setOptions({
      center: address.coords, // New center
      zoom: 16, // New zoom level
    });

    return this;
  }

  // # COLORS MARKERS FROM A ROUTE  ON THE MAP BASED ON CLICKED ROUTE BTN IN THE MAP HEADER # //
  #highLightRouteOnMap(e) {
    e.preventDefault();
    if (!e.target.classList.contains('dropdown-item')) return;

    const clickedRoute = e.target.dataset.route; // clicked route e.g "KB200"
    const filteredAddresses = ordersContainerView.getFilteredAddresses(); // get currently displayed routes from the ordersContainerView

    // remove special marker for all markers with the currently selected route and replace them with regular black ones
    if (this.#highlightedRoute)
      filteredAddresses
        .filter(address => address.route === this.#highlightedRoute)
        .forEach(address => address.toggleMarkerIcon());

    // if already highlighted btn was clicked return, leaving all markers black
    if (clickedRoute === this.#highlightedRoute) {
      $(e.target).removeClass('active');
      return (this.#highlightedRoute = null);
    }

    // if user selected a new route to be highlighted, make a special marker for each address with that route
    filteredAddresses
      .filter(address => address.route === clickedRoute)
      .forEach(address => address.toggleMarkerIcon());

    // set the new highlighted route to the new clicked route
    this.#highlightedRoute = clickedRoute;

    // update buttons to show user wich one is highlighted now
    $(`#highlightRoute .active`)?.removeClass('active');
    $(e.target).addClass('active');
  }

  // # TO BE USED IN ORDERSCONTAINER VIEW # //
  getHighlightedRoute() {
    return this.#highlightedRoute;
  }

  #updateCluster(map, addresses) {
    const bounds = map.getBounds();
    const zoom = map.getZoom();

    // zoom breakpoints
    // zoom <= 13 -- SHOW ONLY MARKERS WITH DELIVERIES >= 3
    // zoom <= 14 -- SHOW ONLY MARKERS WITH DELIVERIES >= 2
    // zoom >= 15 -- SHOW ALL MARKERS IN THESE BOUNDS
    const deliveryThreshold = zoom <= 13 ? 3 : zoom <= 14 ? 2 : 0;

    addresses.forEach(address => {
      const isInBounds = bounds.contains(address.marker.position);
      const meetsDeliveryCriteria =
        address.deliveries.length >= deliveryThreshold;

      // Toggle the marker based on criteria
      if (isInBounds && meetsDeliveryCriteria) {
        address.toggleMarker(map); // Show marker
      } else {
        address.toggleMarker(); // Hide marker
      }
    });
  }
}

export default new mapView();
