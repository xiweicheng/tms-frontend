import config from './config';

/* 
代码生成常用命令:
au generate element
au generate attribute
au generate value-converter
au generate binding-behavior
au generate task
au generate generator
*/
/* 加载全局资源 */
export function configure(aurelia) {

    config.context(aurelia).initHttp().initToastr().initAjax();

    aurelia.globalResources([
        'resources/value-converters/vc-common',
        'resources/attributes/attr-task',
        'resources/attributes/attr-swipebox',
        'resources/attributes/attr-pastable',
        'resources/attributes/attr-autosize',
        'resources/attributes/attr-dropzone',
        'resources/elements/em-confirm-modal',
        'resources/elements/em-hotkeys-modal',
        'resources/elements/em-chat-input',
        'resources/elements/em-chat-top-menu',
        'resources/elements/em-chat-sidebar-left',
        'resources/elements/em-chat-content-item',
        'resources/elements/em-chat-sidebar-right',
    ]);
}
