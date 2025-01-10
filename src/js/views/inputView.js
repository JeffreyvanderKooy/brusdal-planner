import $ from 'jquery';

class inputView {
  #submitBtns = $('.data-submit--button');
  #lastSubmittedHandler;

  /**
   * binds the function from controller to the submit button click
   * @param {Function} controlSubmitData function given by controller.js
   */
  addHandlerSubmit(controlSubmitData) {
    // Loop over each button and add the event listener to each button
    this.#submitBtns.each((_, ele) =>
      $(ele).on('click', this.#handleSubmit(controlSubmitData).bind(this))
    );
  }

  /**
   * this function returns a function wich is then to be used as the callback for the click on the "submit buttons"
   * @param {Function} controlSubmitData function given by controller.js
   * @returns function
   */
  #handleSubmit(controlSubmitData) {
    return function (e) {
      // get the handler from the data attribute of the button
      const dataHandler = $(e.currentTarget).data('handler');

      // get the value of the textarea with the same data handler attribute
      const textAreaVal = $(`textarea[data-handler="${dataHandler}"]`).val();

      // save the last submitted dataHandler
      this.#lastSubmittedHandler = dataHandler;

      controlSubmitData(textAreaVal, dataHandler);
    };
  }

  // # CLEARS INPUT FIELD # //
  clearInput() {
    $(`textarea[data-handler="${this.#lastSubmittedHandler}"]`)?.val('');
    return this;
  }

  // # SETS THE BUTTON TEXT TO GIVEN STRING # //
  setLoadingText(txt) {
    $(
      `.btn[data-handler="${this.#lastSubmittedHandler}"] .loading-status--text`
    ).text(txt);

    return this;
  }

  // # RENDERS A BUTTON WITH A LOADING ANIMATION INSTEAD OF THE REGULAR BUTTON # //
  renderLoadBtn() {
    const markup = `<span
                    class="spinner-border spinner-border-sm"
                    aria-hidden="true"
                  ></span>
                  <span role="status" class="loading-status--text">Loading...</span>`;

    $(`.btn[data-handler="${this.#lastSubmittedHandler}"]`)
      ?.html(markup)
      .prop('disabled', true);

    this.#toggleCanvasBtns(true);

    return this;
  }

  // # RENDERS THE REGULAR BUTTON, REMOVING THE LOADING BUTTON # //
  renderNormalBtn() {
    $(`.btn[data-handler="${this.#lastSubmittedHandler}"]`)
      ?.html('Submit Data')
      .prop('disabled', false);

    this.#toggleCanvasBtns(false);

    return this;
  }

  // # DISABLES THE CANVAS CLOSE BUTTON SO THE USER CANNOT INTERACT WITH THE APP UNTILL LOADING COMPLETE # //
  #toggleCanvasBtns(bool) {
    $('.offcanvas-header .btn-close').each((_, ele) =>
      $(ele).prop('disabled', bool)
    );
  }
}

export default new inputView();
