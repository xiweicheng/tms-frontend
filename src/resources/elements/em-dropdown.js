import { bindable, bindingMode } from 'aurelia-framework';

export class EmDropdown {

    @bindable name = _.uniqueId('em-dropdown-');
    @bindable text = '';
    @bindable labelProp = 'label';
    @bindable valueProp = 'value';
    @bindable({ defaultBindingMode: bindingMode.twoWay }) selectedItem;
    @bindable menuItems = [];
    @bindable classes = 'selection';

    selectedItemChanged(news, old) {
        
        if (news) {
            _.defer(() => {
                $(this.dropdown).dropdown('set selected', news);
            });
        }

    }

    menuItemsChanged(news, old) {
        if (_.isEmpty(news)) {
            $(this.dropdown).dropdown('clear')
            this.selectedItem = null;
        }
    }

    initDropdownHandler(last) {

        if (last) {
            _.defer(() => {
                $(this.dropdown).dropdown({
                    onChange: (value, text, $choice) => {
                        this.selectedItem = value;
                    }
                }).dropdown('set selected', this.selectedItem);
            });
        }
    }

    detached() {
        window.__debug && console.log('EmDropdown--detached');

        this.selectedItem = null;
        this.menuItems = [];
        this.dropdown = null;
    }
}
