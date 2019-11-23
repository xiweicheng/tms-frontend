import { customAttribute, inject } from 'aurelia-framework';

@customAttribute('tablesort')
@inject(Element)
export class AttrTablesortCustomAttribute {

    constructor(element) {
        this.element = element;
    }

    valueChanged(newValue, oldValue) {

    }

    _init() {
        if ($(this.element).is('table')) {
            // https://github.com/kylefox/jquery-tablesort
            $(this.element).addClass('sortable').tablesort();
            this.tablesort = $(this.element).data('tablesort');
        } else {
            console.warn('tablesort element is not table tag!');
        }
    }

    bind() {
        this._init();
    }

    unbind() {

        console.log('AttrTablesortCustomAttribute--unbind');

        this.tablesort && this.tablesort.destroy();

        this.element = null;
        this.tablesort = null;

    }
}
