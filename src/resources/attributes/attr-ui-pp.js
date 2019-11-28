import { inject } from 'aurelia-framework';
import { customAttribute } from 'aurelia-templating';

@customAttribute('ui-pp')
@inject(Element)
export class AttrUiPpCustomAttribute {

    constructor(element) {
        this.element = element;
    }

    valueChanged(newValue, oldValue) {
        _.defer(() => {
            $(this.element).popup({
                inline: true
            });
        });

    }

    unbind() {
        $(this.element).popup('destroy');
        this.element = null;
    }
}
