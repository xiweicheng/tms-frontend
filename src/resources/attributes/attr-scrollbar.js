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
        this.cls = newValue ? newValue : 'scrollbar-outer';
        jQuery(this.element).addClass(this.cls).scrollbar();
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        try {
            jQuery(this.element).removeClass(this.cls).scrollbar('destroy');
        } catch (err) {}
    }
}
