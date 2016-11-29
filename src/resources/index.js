import config from './config';

export function configure(aurelia) {

    config.context(aurelia).initHttp().initToastr().initAjax();

    aurelia.globalResources([
        'resources/value-converters/vc-common',
        'resources/attributes/attr-task',
        'resources/attributes/attr-swipebox',
        'resources/attributes/attr-pastable',
        'resources/attributes/attr-autosize',
        'resources/attributes/attr-dropzone',
    ]);
}
