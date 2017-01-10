import { inject } from 'aurelia-framework';
import { customAttribute } from 'aurelia-templating';
import 'common/common-scrollbar';

@customAttribute('scrollbar')
@inject(Element)
export class AttrScrollbarCustomAttribute {

    constructor(element) {
        this.element = element;
    }

    valueChanged(newValue, oldValue) {
        let cls = newValue ? newValue : 'scrollbar-outer';
        jQuery(this.element).addClass(cls).scrollbar();
    }
}
