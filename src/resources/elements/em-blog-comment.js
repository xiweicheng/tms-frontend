import { bindable, containerless } from 'aurelia-framework';
import {
    default as SimpleMDE
} from 'simplemde';
import {
    default as Dropzone
} from 'dropzone';

@containerless
export class EmBlogComment {

    comments = [];

    baseUrl = utils.getUrl();
    offset = 0;
    isSuper = nsCtx.isSuper;
    loginUser = loginUser;

    @bindable blog;

    blogChanged(newValue, oldValue) {
        this._refresh();
    }

    _refresh() {
        $.get('/admin/blog/comment/query', {
            id: this.blog.id,
            page: 0,
            size: 1000
        }, (data) => {
            if (data.success) {
                this.comments = data.data.content;
                let cid = utils.urlQuery('cid');
                if (cid) {
                    _.defer(() => {
                        this.scrollToAfterImgLoaded(cid);
                    });
                }
            } else {
                toastr.error(data.data);
            }
        });
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        this._init();
    }

    _init() {
        this.simplemde = new SimpleMDE({
            element: this.commentRef,
            spellChecker: false,
            // status: false,
            autofocus: true,
            // toolbar: false,
            forceSync: true,
            // autoDownloadFontAwesome: false,
            toolbar: [{
                    name: "bold",
                    action: SimpleMDE.toggleBold,
                    className: "fa fa-bold",
                    title: "粗体",
                }, {
                    name: "italic",
                    action: SimpleMDE.toggleItalic,
                    className: "fa fa-italic",
                    title: "斜体",
                }, {
                    name: "strikethrough",
                    action: SimpleMDE.toggleStrikethrough,
                    className: "fa fa-strikethrough",
                    title: "删除线",
                }, {
                    name: "heading",
                    action: SimpleMDE.toggleHeadingSmaller,
                    className: "fa fa-header",
                    title: "标题",
                }, {
                    name: "heading-smaller",
                    action: SimpleMDE.toggleHeadingSmaller,
                    className: "fa fa-header fa-header-x fa-header-smaller",
                    title: "变小标题",
                }, {
                    name: "heading-bigger",
                    action: SimpleMDE.toggleHeadingBigger,
                    className: "fa fa-header fa-header-x fa-header-bigger",
                    title: "变大标题",
                }, "|", {
                    name: "code",
                    action: SimpleMDE.toggleCodeBlock,
                    className: "fa fa-code",
                    title: "代码",
                }, {
                    name: "quote",
                    action: SimpleMDE.toggleBlockquote,
                    className: "fa fa-quote-left",
                    title: "引用",
                }, {
                    name: "unordered-list",
                    action: SimpleMDE.toggleUnorderedList,
                    className: "fa fa-list-ul",
                    title: "无序列表",
                }, {
                    name: "ordered-list",
                    action: SimpleMDE.toggleOrderedList,
                    className: "fa fa-list-ol",
                    title: "有序列表",
                }, {
                    name: "tasks",
                    action: (editor) => {
                        this.insertContent('- [ ] 未完成任务\n- [x] 已完成任务');
                    },
                    className: "fa fa-check-square-o ",
                    title: "任务列表",
                }, {
                    name: "details",
                    action: (editor) => {
                        this.insertContent('<details>\n<summary>标题</summary>\n<p>详情内容</p>\n</details>');
                    },
                    className: "fa fa-play ",
                    title: "折叠详情",
                }, "|", {
                    name: "link",
                    action: SimpleMDE.drawLink,
                    className: "fa fa-link",
                    title: "创建链接",
                }, {
                    name: "image",
                    action: SimpleMDE.drawImage,
                    className: "fa fa-picture-o",
                    title: "插入图片",
                }, {
                    name: "table",
                    action: SimpleMDE.drawTable,
                    className: "fa fa-table",
                    title: "插入表格",
                }, {
                    name: "horizontal-rule",
                    action: SimpleMDE.drawHorizontalRule,
                    className: "fa fa-minus",
                    title: "插入水平分割线",
                }, "|", {
                    name: "upload",
                    action: function(editor) {},
                    className: "fa fa-upload",
                    title: "上传文件",
                }, "|", {
                    name: "preview",
                    action: SimpleMDE.togglePreview,
                    className: "fa fa-eye no-disable",
                    title: "切换预览",
                }, {
                    name: "side-by-side",
                    action: SimpleMDE.toggleSideBySide,
                    className: "fa fa-columns no-disable no-mobile",
                    title: "实时预览",
                }, {
                    name: "fullscreen",
                    action: SimpleMDE.toggleFullScreen,
                    className: "fa fa-arrows-alt no-disable no-mobile",
                    title: "全屏",
                }, {
                    name: "guide",
                    action: 'https://simplemde.com/markdown-guide',
                    className: "fa fa-question-circle",
                    title: "Markdown指南",
                }

            ],
            insertTexts: {
                table: ["", "\n\n| 列1 | 列2 | 列3 |\n| ------ | ------ | ------ |\n| 文本 | 文本 | 文本 |\n\n"],
            },
            previewRender: (plainText, preview) => { // Async method
                return marked(utils.preParse(plainText));
            },
        });

        this.simplemde.codemirror.on('keyup', (cm, e) => {
            if (e.ctrlKey && e.keyCode == 13) { // Ctrl+Enter
                this.addHandler();
            } else if (e.keyCode == 27) { // Esc
                this.simplemde.value('');
            }
        });

        this.$chatMsgInputRef = $(this.markdownRef).find('.CodeMirror textarea');
        if (this.$chatMsgInputRef.size() === 0) {
            this.$chatMsgInputRef = $(this.markdownRef).find('.CodeMirror [contenteditable="true"]');
        }

        this.initPaste();

        this.initUploadDropzone($('.CodeMirror-wrap', this.markdownRef), () => {
            return this.$chatMsgInputRef
        }, false);

        this.initUploadDropzone($('.editor-toolbar .fa.fa-upload', this.markdownRef), () => {
            return this.$chatMsgInputRef
        }, true);
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this._reset();
    }

    _reset() {
        this.blog = null;
        this.simplemde.value('');
        this.simplemde.toTextArea();
        this.simplemde = null;
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

    replyHandler(item) {
        this.insertContent(`[[回复评论#${item.id}](${this.baseUrl}?cid=${item.id}){~${item.creator.username}}]\n\n`);
        this._scrollTo('b');
    }

    removeHandler(item) {
        $.post('/admin/blog/comment/remove', {
            cid: item.id
        }, (data, textStatus, xhr) => {
            if (data.success) {
                this.comments = _.reject(this.comments, { id: item.id });
                toastr.success('博文评论移除成功!');
            } else {
                toastr.error(data.data, '博文评论移除失败!');
            }
        });
    }

    addHandler() {
        let content = this.simplemde.value();

        if (!$.trim(content)) {
            this.simplemde.value('');
            toastr.error('评论内容不能为空!');
            return;
        }

        if (this.sending) {
            return;
        }

        this.sending = true;

        var html = utils.md2html(content);
        let users = [nsCtx.memberAll, ...(window.tmsUsers ? tmsUsers : [])];

        $.post(`/admin/blog/comment/create`, {
            basePath: utils.getBasePath(),
            id: this.blog.id,
            users: utils.parseUsernames(content, users).join(','),
            content: content,
            contentHtml: html
        }, (data, textStatus, xhr) => {
            if (data.success) {
                this.comments = [...this.comments, data.data];
                this.simplemde.value('');
                toastr.success('博文评论提交成功!');
                this.scrollToAfterImgLoaded('b');
            } else {
                toastr.error(data.data, '博文评论提交失败!');
            }
        }).always(() => {
            this.sending = false;
        });
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
            previewsContainer: '.em-blog-comment .dropzone-previews',
            previewTemplate: $('.em-blog-comment .preview-template')[0].innerHTML,
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

    scrollToAfterImgLoaded(to) {
        _.defer(() => {
            new ImagesLoaded($('.em-blog-content')[0]).always(() => {
                this._scrollTo(to);
            });

            this._scrollTo(to);
        });

    }

    _scrollTo(to) {
        if (to == 'b') {
            $('.em-blog-content').scrollTo('max');
        } else if (to == 't') {
            $('.em-blog-content').scrollTo(0);
        } else {
            if (_.some(this.comments, { id: +to })) {
                $('.em-blog-content').scrollTo(`.comment[data-id="${to}"]`, {
                    offset: this.offset
                });
                $('.em-blog-content').find(`.comment[data-id]`).removeClass('active');
                $('.em-blog-content').find(`.comment[data-id=${to}]`).addClass('active');
            } else {
                $('.em-blog-content').scrollTo('max');
                toastr.warning(`博文评论[${to}]不存在,可能已经被删除!`);
            }
        }
    }

}
