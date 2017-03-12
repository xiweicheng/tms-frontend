import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmBlogTopMenu {

    @bindable value;

    valueChanged(newValue, oldValue) {

    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        $(this.logoRef).on('mouseenter', (event) => {
            $(this.logoRef).animateCss('flip');
        });
    }
}
