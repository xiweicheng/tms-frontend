import { customAttribute, inject } from 'aurelia-framework';

@customAttribute('ui-dropdown-hover-action')
@inject(Element)
export class AttrUiDropdownHoverActionCustomAttribute {

    constructor(element) {
        this.element = element;
    }

    valueChanged(newValue, oldValue) {

    }

    _init(context) {
        _.defer(() => {
            $(this.element).dropdown({
                on: 'hover',
                action: 'hide',
                context: context
            });
        });
    }

    bind() {
        this._init(this.value ? this.value : window);
    }

    unbind() {
        this.element = null;
    }
}
