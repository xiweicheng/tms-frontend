import {
    bindable,
    inject
} from 'aurelia-framework';
import {
    customAttribute
} from 'aurelia-templating';
import {
    EventAggregator
}
from 'aurelia-event-aggregator';
import {
    default as Dropzone
} from 'dropzone';

@customAttribute('dropzone')
@inject(Element, EventAggregator)
export class AttrDropzone {

    @bindable clickable;
    @bindable target;
    @bindable type;
    @bindable atId;

    dropzones = [];

    constructor(element, eventAggregator) {
        this.element = element;
        this.eventAggregator = eventAggregator;

        this.subscribe = this.eventAggregator.subscribe(nsCons.EVENT_CHAT_MSG_EDIT_UPLOAD, (payload) => {
            if (payload.target === this.target) {
                $(this.element).click();
            }
        });
    }

    valueChanged(newValue, oldValue) {

        let target = this.target ? this.target : this.element;
        let toType = this.type ? this.type : (nsCtx.isAt ? 'User' : 'Channel');

        $(this.element).parent().addClass('tms-dropzone-preview-hidden');

        let elms = $(this.element).children().andSelf().toArray();

        let atId = this.atId;

        // console.log(`AttrDropzone -- ${this.atId} ${this.type} ${this.clickable} ${this.target}`);

        $.each(elms, (i, elm) => {

            let dropzone = new Dropzone(elm, {
                url: "/admin/file/upload",
                paramName: 'file',
                clickable: !!this.clickable,
                dictDefaultMessage: '',
                maxFilesize: window.tmsSysConfig.uploadMaxFileSize || 10,
                addRemoveLinks: true,
                // previewsContainer: this.chatStatusBarRef,
                // previewTemplate: this.previewTemplateRef.innerHTML,
                dictCancelUpload: '取消上传',
                dictCancelUploadConfirmation: '确定要取消上传吗?',
                dictFileTooBig: '文件过大({{filesize}}M),最大限制:{{maxFilesize}}M',
                init: function () {
                    this.on("sending", function (file, xhr, formData) {
                        formData.append('toType', toType);
                        formData.append('atId', atId);
                        console.log(`at -- ${atId}`);
                        if ('Blog' !== toType) {
                            formData.append('toId', nsCtx.chatTo);
                        }
                    });
                    this.on("success", function (file, data) {
                        if (data.success) {

                            $.each(data.data, function (index, item) {
                                if (item.type == 'Image') {
                                    $(target).insertAtCaret('![{name}]({baseURL}{path}{uuidName}?width=100)\r\n'
                                        .replace(/\{name\}/g, utils.replaceMdChar(item.name))
                                        .replace(/\{baseURL\}/g, utils.getBaseUrl() + '/')
                                        .replace(/\{path\}/g, item.path)
                                        .replace(/\{uuidName\}/g, item.uuidName));
                                } else {
                                    $(target).insertAtCaret('[{name}]({baseURL}{path}{uuidName})\r\n'
                                        .replace(/\{name\}/g, utils.replaceMdChar(item.name))
                                        .replace(/\{baseURL\}/g, utils.getBaseUrl() + '/')
                                        .replace(/\{path\}/g, "admin/file/download/")
                                        .replace(/\{uuidName\}/g, item.uuid));
                                }
                            });
                            toastr.success('上传成功!');
                        } else {
                            toastr.error(data.data, '上传失败!');
                        }

                    });
                    this.on("error", function (file, errorMessage, xhr) {
                        toastr.error(errorMessage, '上传失败!');
                    });
                    this.on("complete", function (file) {
                        this.removeFile(file);
                    });
                }
            });

            this.dropzones.push(dropzone);
        });
    }

    bind(bindingContext) {
        this.valueChanged(this.value);
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        window.__debug && console.log('AttrDropzone--unbind');
        try {
            $.each(this.dropzones, (i, dropzone) => {
                dropzone.destroy();
            });
        } catch (e) {
            console.log(e);
        }
        this.target = null;
        this.dropzones = [];
        this.eventAggregator = null;
        this.subscribe.dispose();
        // Dropzone = null;
    }
}
