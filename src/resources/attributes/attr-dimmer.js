import { inject } from 'aurelia-dependency-injection';
import { customAttribute } from 'aurelia-templating';

@customAttribute('dimmer')
@inject(Element)
export class AttrDimmer {

    constructor(element) {

        this.element = element;
        this.$dimmer = $('<div class="ui inverted active dimmer"> <div class="ui loader"></div> </div>');
    }

    valueChanged(newValue) {
        if (this.value) {
            $(this.element).prepend(this.$dimmer);
        } else {
            this.$dimmer.remove();
        }
    }

    bind(bindingContext) {
        this.valueChanged(this.value);
    }

    unbind() {
        window.__debug && console.log('AttrDimmer--unbind');
        this.$dimmer && this.$dimmer.remove();
        this.$dimmer = null;
        this.element = null;
    }

}
