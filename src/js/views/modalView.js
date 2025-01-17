import swal from 'sweetalert';
import $ from 'jquery';

class modalView {
  warning(message = 'Oops! Something went wrong.') {
    swal({
      className: 'bg-warning-subtle',
      title: message,
      text: ' ',
      icon: 'warning',
      buttons: false,
    });
  }

  error(message = 'Oops! Something went wrong.') {
    swal({
      className: 'bg-danger-subtle',
      title: message,
      icon: 'error',
      text: ' ',
      buttons: false,
    });
  }

  doneFetching(result) {
    if (result.error.length > 0)
      swal({
        title: `${result.succes.length} new addresses added!`,
        icon: 'success',
        text: `Failed to fetch: ${result.error.length}`,
        buttons: {
          cancel: 'Close',
          show: {
            text: 'Show failed addresses',
            value: true,
          },
        },
      }).then(val => {
        const content = document.createElement('div');
        content.classList.add('error-modal');

        const text = result.error
          .map(err =>
            err.deliveries.map(
              del =>
                `<p class="m-1 fs-6"><span class="me-2">${del.id}</span> ${del.name}</p>`
            )
          )
          .flat()
          .join('\n');

        $(content).html(text);

        if (val)
          swal({
            className: 'bg-danger-subtle',
            icon: 'error',
            content: content,
            buttons: false,
          });
      });

    if (result.error.length === 0)
      swal({
        title: `${result.succes.length} new addresses added!`,
        icon: 'success',
      });
  }

  succes() {
    swal({ icon: 'success' });
  }

  async confirmDelete() {
    try {
      const val = await swal({
        title: `Are you sure?`,
        text: 'Once deleted, you will not be able to recover this route!',
        dangerMode: true,
        buttons: true,
        icon: 'warning',
        className: 'bg-warning-subtle',
      });

      return val;
    } catch (error) {
      return false;
    }
  }
}

export default new modalView();
