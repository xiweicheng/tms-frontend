import { bindable, containerless } from 'aurelia-framework';
import {
    default as SimpleMDE
} from 'simplemde';
import {
    default as Dropzone
} from 'dropzone';

@containerless
export class EmBlogWrite {

    @bindable members;

    static NAME = 'blog-create';

    /**
     * 构造函数
     */
    constructor() {

        this.subscribe = ea.subscribe(nsCons.EVENT_MODAAL_AFTER_OPEN, (payload) => {
            if (payload.id == EmBlogWrite.NAME) {
                this.init();
            }
        });
        this.subscribe2 = ea.subscribe(nsCons.EVENT_MODAAL_BEFORE_CLOSE, (payload) => {
            if (payload.id == EmBlogWrite.NAME) {
                this.destroy();
            }
        });
        this.subscribe3 = ea.subscribe(nsCons.EVENT_BLOG_ACTION, (payload) => {
            this.action = payload.action;
            $.get('/admin/blog/get', { id: payload.id }, (data) => {
                if (data.success) {
                    this.blog = data.data;
                    $('a[href="#modaal-blog-write"]').click();
                }
            });

        });
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe.dispose();
        this.subscribe2.dispose();
        this.subscribe3.dispose();
    }

    _reset() {
        this.action = null;
        this.blog = null;
        $('#blog-save-btn span').text('保存');
        $('#blog-title-input').val('');
        this.simplemde.value('');
        this.simplemde.toTextArea();
        this.simplemde = null;
    }

    _editInit() {
        $('#blog-title-input').val(this.blog.title);
        this.simplemde.value(this.blog.content);
        $('#blog-save-btn span').text('更新');
    }

    init() {

        this.simplemde = new SimpleMDE({
            element: $('#txt-blog-write')[0],
            spellChecker: false,
            // status: false,
            autofocus: true,
            // toolbar: false,
            forceSync: true,
            // autoDownloadFontAwesome: false,
            insertTexts: {
                table: ["", "\n\n| 列1 | 列2 | 列3 |\n| ------ | ------ | ------ |\n| 文本 | 文本 | 文本 |\n\n"],
            },
            previewRender: (plainText, preview) => { // Async method
                return marked(utils.preParse(plainText));
            },
        });

        this.$chatMsgInputRef = $('#txt-blog-write-wrapper').find('.CodeMirror textarea');
        if (this.$chatMsgInputRef.size() === 0) {
            this.$chatMsgInputRef = $('#txt-blog-write-wrapper').find('.CodeMirror [contenteditable="true"]');
        }

        if (this.action == 'edit') { // edit
            this._editInit();
        }

        this.initPaste();

        this.initUploadDropzone($('.CodeMirror-wrap', '#txt-blog-write-wrapper'), () => {
            return this.$chatMsgInputRef
        }, false);

    }

    initPaste() {

        let $paste;
        if (this.$chatMsgInputRef.is('textarea')) {
            $paste = $(this.$chatMsgInputRef).pastableTextarea();
        } else {
            $paste = $(this.$chatMsgInputRef).pastableContenteditable();
        }

        $paste && ($paste.on('pasteImage', (ev, data) => {

            $.post('/admin/file/base64', {
                dataURL: data.dataURL,
                type: data.blob.type,
                toType: 'Blog'
            }, (data, textStatus, xhr) => {
                if (data.success) {
                    this.insertContent('![{name}]({baseURL}{path}{uuidName})'
                        .replace(/\{name\}/g, data.data.name)
                        .replace(/\{baseURL\}/g, utils.getBaseUrl() + '/')
                        .replace(/\{path\}/g, data.data.path)
                        .replace(/\{uuidName\}/g, data.data.uuidName));
                }
            });
        }).on('pasteImageError', (ev, data) => {
            toastr.error(data.message, '剪贴板粘贴图片错误!');
        }));
    }

    initUploadDropzone(domRef, getInputTargetCb, clickable) {

        let _this = this;

        $(domRef).dropzone({
            url: "/admin/file/upload",
            paramName: 'file',
            clickable: !!clickable,
            dictDefaultMessage: '',
            maxFilesize: 10,
            addRemoveLinks: true,
            // previewsContainer: this.chatStatusBarRef,
            // previewTemplate: this.previewTemplateRef.innerHTML,
            dictCancelUpload: '取消上传',
            dictCancelUploadConfirmation: '确定要取消上传吗?',
            dictFileTooBig: '文件过大({{filesize}}M),最大限制:{{maxFilesize}}M',
            init: function() {
                this.on("sending", function(file, xhr, formData) {
                    if (!getInputTargetCb()) {
                        this.removeAllFiles(true);
                    } else {
                        formData.append('toType', 'Blog');
                    }
                });
                this.on("success", function(file, data) {
                    if (data.success) {

                        $.each(data.data, function(index, item) {
                            if (item.type == 'Image') {
                                _this.insertContent('![{name}]({baseURL}{path}{uuidName}) '
                                    .replace(/\{name\}/g, item.name)
                                    .replace(/\{baseURL\}/g, utils.getBaseUrl() + '/')
                                    .replace(/\{path\}/g, item.path)
                                    .replace(/\{uuidName\}/g, item.uuidName));
                            } else {
                                _this.insertContent('[{name}]({baseURL}{path}{uuidName}) '
                                    .replace(/\{name\}/g, item.name)
                                    .replace(/\{baseURL\}/g, utils.getBaseUrl() + '/')
                                    .replace(/\{path\}/g, "admin/file/download/")
                                    .replace(/\{uuidName\}/g, item.id));
                            }
                        });
                        toastr.success('上传成功!');
                    } else {
                        toastr.error(data.data, '上传失败!');
                    }

                });
                this.on("error", function(file, errorMessage, xhr) {
                    toastr.error(errorMessage, '上传失败!');
                });
                this.on("complete", function(file) {
                    this.removeFile(file);
                });
            }
        });
    }

    /**
     * 编辑器插入自定义沟通内容
     * @param  {[type]} cm      [description]
     * @param  {[type]} comment [description]
     * @return {[type]}         [description]
     */
    insertContent(content, mde) {
        let cm = mde ? mde.codemirror : this.simplemde.codemirror;
        var cursor = cm.getCursor();
        if (cursor) {
            cm.replaceRange(content, cursor, cursor);
            cm.focus();
        }
    }

    destroy() {
        this._reset();
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        $('#blog-save-btn').click((event) => {
            this.save();
        });
    }

    save() {

        let title = $('#blog-title-input').val();
        let content = this.simplemde.value();

        if (!$.trim(title)) {
            $('#blog-title-input').val('');
            toastr.error('标题不能为空!');
            return;
        }

        if (!$.trim(content)) {
            this.simplemde.value('');
            toastr.error('内容不能为空!');
            return;
        }

        if (this.sending) {
            return;
        }

        this.sending = true;
        $('#blog-save-btn i').show();

        var html = utils.md2html(content);
        let users = [nsCtx.memberAll, ...(window.tmsUsers ? tmsUsers : [])];

        if (!this.blog) {
            $.post(`/admin/blog/create`, {
                url: utils.getBasePath(),
                usernames: utils.parseUsernames(content, users).join(','),
                title: title,
                content: content,
                contentHtml: html
            }, (data, textStatus, xhr) => {
                if (data.success) {
                    this.blog = data.data;
                    $('#blog-save-btn span').text('更新');
                    toastr.success('博文保存成功!');
                    ea.publish(nsCons.EVENT_BLOG_CHANGED, {
                        action: 'created',
                        blog: this.blog
                    });
                } else {
                    toastr.error(data.data, '博文保存失败!');
                }
            }).always(() => {
                this.sending = false;
                $('#blog-save-btn i').hide();
            });
        } else {
            $.post('/admin/blog/update', {
                url: utils.getBasePath(),
                id: this.blog.id,
                version: this.blog.version,
                usernames: utils.parseUsernames(content, users).join(','),
                title: title,
                content: content,
                diff: utils.diffS(this.blog.content, content),
                // contentHtml: html,
                // contentHtmlOld: htmlOld
            }, (data, textStatus, xhr) => {
                if (data.success) {
                    this.blog = data.data;
                    toastr.success('博文更新成功!');
                    ea.publish(nsCons.EVENT_BLOG_CHANGED, {
                        action: 'updated',
                        blog: this.blog
                    });
                } else {
                    toastr.error(data.data, '博文更新失败!');
                }
            }).always(() => {
                this.sending = false;
                $('#blog-save-btn i').hide();
            });
        }

    }

}