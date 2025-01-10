import $ from 'jquery';
import { DELAY_LOADER_FADEOUT } from '../config';

class Loader {
  #loaderContainer = $('.loader-container');

  // # FADES OUT THE LOADER COVERING THE SCREEN # //
  hide() {
    setTimeout(() => $(this.#loaderContainer).hide(), DELAY_LOADER_FADEOUT);
  }
}

export default new Loader();
