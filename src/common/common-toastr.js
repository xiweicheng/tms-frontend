export default {
    timeOut: 0,
    hideDuration: 0,
    extendedTimeOut: 0,
    tapToDismiss: false,
    closeButton: true,
    preventDuplicates: true,
    // positionClass: 'toast-top-right'
    // positionClass: 'toast-top-right-custom'
    positionClass: 'toast-bottom-right-custom',
    onCloseClick: (event) => {

        let $tInfo = $(event.currentTarget).closest('.toast.toast-info');

        if (!$tInfo || $tInfo.length === 0) return;

        if (!$tInfo.attr('data-id') || !$tInfo.attr('data-type')) return;

        ea.publish(nsCons.EVENT_TOASTR_CLOSE, {
            id: $tInfo.attr('data-id'),
            type: $tInfo.attr('data-type')
        });
    }
}
