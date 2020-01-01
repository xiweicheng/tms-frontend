import { inject } from 'aurelia-framework';
import { customAttribute } from 'aurelia-templating';
import 'common/common-plugin';
import 'common/common-paste';

@customAttribute('pastable')
@inject(Element)
export class AttrPastable {

    constructor(element) {
        this.element = element;
    }

    valueChanged(newValue, oldValue) {

        this.pasteHandler = (ev, data) => {

            $.post('/admin/file/base64', {
                dataURL: data.dataURL,
                type: data.blob.type,
                toType: nsCtx.isAt ? 'User' : 'Channel',
                toId: nsCtx.chatTo
            }, (data, textStatus, xhr) => {
                if (data.success) {
                    $(this.element).insertAtCaret('![{name}]({baseURL}{path}{uuidName}?width=100)'
                        .replace(/\{name\}/g, data.data.name)
                        .replace(/\{baseURL\}/g, utils.getBaseUrl() + '/')
                        .replace(/\{path\}/g, data.data.path)
                        .replace(/\{uuidName\}/g, data.data.uuidName));
                }
            });
        };

        this.errHandler = (ev, data) => {
            toastr.error(data.message, '剪贴板粘贴图片错误!');
        };

        // https://github.com/layerssss/paste.js
        // clipboard paste image
        $(this.element).pastableTextarea().on('pasteImage', this.pasteHandler).on('pasteImageError', this.errHandler);
    }

    bind(bindingContext) {
        this.valueChanged(this.value);
    }

    unbind() {
        window.__debug && console.log('AttrPastable--unbind');
        $(this.element).pastableTextarea().off('pasteImage', this.pasteHandler).off('pasteImageError', this.errHandler);
        this.element = null;
        this.pasteHandler = null;
        this.errHandler = null;

    }
}
