import {
    bindable,
    containerless
} from 'aurelia-framework';
import {
    default as SimpleMDE
} from 'simplemde';
import {
    default as Dropzone
} from 'dropzone';
import emojis from 'common/common-emoji';

@containerless
export class EmBlogWrite {

    @bindable members;

    static NAME = 'blog-create';

    baseRes = utils.getResourceBase();

    detached() {

        window.__debug && console.log('EmBlogWrite--detached');

        this.members = null;
        this.blog = null;

        if (this.$paste) {
            this.$paste.off('pasteImage', this.pasteHandler).off('pasteImageError', this.errHandler);
            this.pasteHandler = null;
            this.errHandler = null;

            this.$paste = null;
        }

        $('#blog-save-btn').off('click', this.blogSaveHandler);
        $('#switch-html').off('click', this.switchHandler);

        this.blogSaveHandler = null;
        this.switchHandler = null;

        $('#blog-title-input').off('keyup', this.blogTitleInputKuHandler);

        $('.CodeMirror-wrap', '#txt-blog-write-wrapper').each((index, elem) => {
            let dd = Dropzone.forElement(elem);
            dd && dd.destroy();
        });

        $('.editor-toolbar .fa.fa-upload', '#txt-blog-write-wrapper').each((index, elem) => {
            let dd = Dropzone.forElement(elem);
            dd && dd.destroy();
        });

        $('.editor-toolbar .fa.fa-file-excel-o', '#txt-blog-write-wrapper').each((index, elem) => {
            let dd = Dropzone.forElement(elem);
            dd && dd.destroy();
        });

        try {

            $(this.$chatMsgInputRef).textcomplete('destroy');
            this.$chatMsgInputRef = null;

            if (this.simplemde) {

                this.simplemde.codemirror.off('keyup', this.editKuHandler);
                this.editKuHandler = null;

                this.simplemde.value('');
                this.simplemde.toTextArea();
                this.simplemde = null;
            }

        } catch (err) {
            console.error(err);
        }
    }

    /**
     * 构造函数
     */
    constructor() {

        this.subscribe = ea.subscribe(nsCons.EVENT_MODAAL_AFTER_OPEN, (payload) => {
            if (payload.id == EmBlogWrite.NAME) {

                // console.log(payload);

                nsCtx.isModaalOpening = true;
                this.init();
            }
        });
        this.subscribe2 = ea.subscribe(nsCons.EVENT_MODAAL_BEFORE_CLOSE, (payload) => {
            if (payload.id == EmBlogWrite.NAME) {

                // console.log(payload);

                nsCtx.isModaalOpening = false;
                nsCtx.newBlogSpace = null;
                nsCtx.newBlogDir = null;

                if (this.stompClient) {
                    this.stompClient.disconnect(() => {
                        this.stompClient = null;
                    });

                }

                this.destroy();
            }
        });
        this.subscribe3 = ea.subscribe(nsCons.EVENT_BLOG_ACTION, (payload) => {
            this.action = payload.action;
            $.get('/admin/blog/get', {
                id: payload.id
            }, (data) => {
                if (data.success) {
                    this.blog = data.data;
                    $('a[href="#modaal-blog-write"]').click();
                }
            });

        });
        this.subscribe4 = ea.subscribe(nsCons.EVENT_BLOG_CHANGED, (payload) => {
            this.action = payload.action;
            if (payload.action === 'created' && payload.from != 'html') {
                this.blog = payload.blog;
                $('#blog-save-btn span').text('更新');
                $('#blog-save-btn').attr('title', 'ctrl+click更新后关闭窗口');
            }

        });

        this.subscribe5 = ea.subscribe(nsCons.EVENT_BLOG_IS_UPDATED, (payload) => {
            let title = $('#blog-title-input').val();
            let content = this.simplemde.value();

            let updated = false;

            if (this.blog) {
                updated = (this.blog.title != title) || (this.blog.content != content);
            } else {
                updated = !!$.trim(title) || (!!$.trim(content));
            }

            ea.publish(nsCons.EVENT_BLOG_IS_UPDATED_ACK, {
                item: payload.item,
                updated: updated
            });

        });

        this.blogTitleInputKuHandler = (e) => {
            let $t = $(e.currentTarget);

            if (!e.shiftKey && e.keyCode == 13) { // Enter
                if (this.simplemde.value()) {
                    this.save(e, true);
                } else {
                    this.simplemde.codemirror.focus();
                }

            } else if (e.shiftKey && e.keyCode == 13) { // Esc
                this.simplemde.codemirror.focus();
            } else if (e.keyCode == 27) { // Esc
                $t.val('');
            }
        };

        this.blogTitleInputKeyupInit = _.once(() => {
            $('#blog-title-input').keyup(this.blogTitleInputKuHandler);
        });
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe.dispose();
        this.subscribe2.dispose();
        this.subscribe3.dispose();
        this.subscribe4.dispose();
        this.subscribe5.dispose();
    }

    _reset() {
        this.action = null;
        this.blog = null;
        $('#blog-save-btn span').text('保存');
        $('#blog-save-btn').attr('title', 'ctrl+click快速保存');
        $('#blog-title-input').val('');
        if (this.simplemde) {
            this.simplemde.value('');
            this.simplemde.toTextArea();
            this.simplemde = null;
        }

    }

    _editInit() {
        $('#blog-title-input').val(this.blog.title);
        this.simplemde.value(this.blog.content);
        $('#blog-save-btn span').text('更新');
        $('#blog-save-btn').attr('title', 'ctrl+click更新后关闭窗口');

        this._initEditSock();

    }

    _initEditSock() {
        this.stompClient = Stomp.over(new SockJS('/ws-lock?blogId=' + this.blog.id));
        this.stompClient.debug = () => {};
        // this.stompClient.debug = (msg) => { console.log(msg) };
        this.stompClient.connect({}, (frame) => {}, (err) => {
            console.error(err);
        });
    }

    _writeInit() {
        let ccid = utils.urlQuery('ccid'); // chat channel id
        let cdid = utils.urlQuery('cdid'); // chat direct id
        let url = null;
        let id = null;
        if (ccid) {
            url = `/admin/chat/channel/get`;
            id = ccid;
        } else if (cdid) {
            url = `/admin/chat/direct/get`;
            id = cdid;
        }

        if (url) {
            $.get(url, {
                id: +id
            }, (data) => {
                if (data.success) {
                    this.simplemde.value(data.data.content);
                    let val = $('#blog-title-input').val();
                    if (!val) {
                        let ms = /#{1,6}[\s]+(.+)\n?/g.exec(data.data.content);
                        if (ms && ms.length > 1) {
                            $('#blog-title-input').val(ms[1]);
                        }
                    }
                } else {
                    toastr.error(data.data, '获取沟通消息失败!');
                }
            });
        }
    }

    _copyInit() {
        $('#blog-title-input').val(this.blog.title + ' (副本)');
        this.simplemde.value(this.blog.content);
        this.blog = null;
    }

    init() {

        this.simplemde = new SimpleMDE({
            element: $('#txt-blog-write')[0],
            spellChecker: false,
            // status: false,
            // autofocus: true,
            // toolbar: false,
            // forceSync: true,
            autoDownloadFontAwesome: false,
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
                    action: function (editor) {},
                    className: "fa fa-upload",
                    title: "上传文件",
                }, {
                    name: "csv2md",
                    action: function (editor) {},
                    className: "fa fa-file-excel-o",
                    title: "上传Excel|CSV转Markdown表格",
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
                if (emojify) {
                    plainText = emojify.replace(plainText);
                }
                return marked(utils.preParse(plainText));
            },
        });

        this.editKuHandler = (cm, e) => {
            if (e.ctrlKey && e.keyCode == 13) { // Ctrl+Enter
                this.save(e, true);
            } else if (e.keyCode == 27) { // Esc
                this.simplemde.value('');
            } else if (e.keyCode == 13) { // Enter
                let val = $('#blog-title-input').val();
                if (!val) {
                    let ms = /#{1,6}[\s]+(.+)\n?/g.exec(this.simplemde.value());
                    if (ms && ms.length > 1) {
                        $('#blog-title-input').val(ms[1]);
                    }
                }
            }
        };

        this.simplemde.codemirror.on('keyup', this.editKuHandler);

        this.$chatMsgInputRef = $('#txt-blog-write-wrapper').find('.CodeMirror textarea');
        if (this.$chatMsgInputRef.size() === 0) {
            this.$chatMsgInputRef = $('#txt-blog-write-wrapper').find('.CodeMirror [contenteditable="true"]');
        }

        if (this.action == 'edit') { // edit
            this._editInit();
        } else if (this.action == 'copy') {
            this._copyInit();
        } else {
            this._writeInit();
        }

        $('#blog-title-input').focus();

        this.initPaste();
        this.initTextcomplete();

        this.initUploadDropzone($('.CodeMirror-wrap', '#txt-blog-write-wrapper'), () => {
            return this.$chatMsgInputRef
        }, false);

        this.initUploadDropzone($('.editor-toolbar .fa.fa-upload', '#txt-blog-write-wrapper'), () => {
            return this.$chatMsgInputRef
        }, true);

        this.initCsvDropzone();

        this.blogTitleInputKeyupInit();

    }

    initCsvDropzone() {

        let _this = this;

        $($('.editor-toolbar .fa.fa-file-excel-o', '#txt-blog-write-wrapper')).dropzone({
            url: "/admin/file/csv2md",
            paramName: 'file',
            clickable: true,
            dictDefaultMessage: '',
            maxFilesize: window.tmsSysConfig.uploadMaxFileSize || 10,
            acceptedFiles: '.csv,.xls,.xlsx',
            addRemoveLinks: true,
            previewsContainer: '.em-blog-write .dropzone-previews',
            previewTemplate: $('.em-blog-write .preview-template')[0].innerHTML,
            dictCancelUpload: '取消上传',
            dictCancelUploadConfirmation: '确定要取消上传吗?',
            dictFileTooBig: '文件过大({{filesize}}M),最大限制:{{maxFilesize}}M',
            init: function () {
                this.on("sending", function (file, xhr, formData) {

                });
                this.on("success", function (file, data) {
                    if (data.success) {

                        $.each(data.data, function (index, item) {
                            _this.insertContent(`\n${item}`);

                        });
                        toastr.success('CSV转换表格成功!');
                    } else {
                        toastr.error(data.data, 'CSV转换表格失败!');
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
    }

    close() {
        $('a[href="#modaal-blog-write"]').modaal('close');
    }

    initTextcomplete() {

        $(this.$chatMsgInputRef).textcomplete([{ // @user
            match: /(^|\s?)@(\w*)$/,
            context: (text) => {
                // console.log(text);
                let cm = this.simplemde.codemirror;
                let cursor = cm.getCursor();
                let txt = cm.getRange({
                    line: cursor.line,
                    ch: 0
                }, cursor);
                // console.log(txt);
                return txt;
            },
            search: (term, callback) => {
                // callback($.map(nsCtx.users, (member) => {
                //     return (member.enabled && member.username.indexOf(term) >= 0) ? member.username : null;
                // }));
                let users = $.map(nsCtx.users, (member) => {
                    return (member.enabled && member.username.indexOf(term) >= 0) ? member : null;
                });

                let cgrps = (this.blog && this.blog.space && this.blog.space.channel) ? this.blog.space.channel.channelGroups : [];
                let groups = $.map(cgrps ? cgrps : [], (grp) => {
                    return ((grp.status != 'Deleted') && grp.name.indexOf(term) >= 0) ? grp : null;
                });
                callback([...users, ...groups]);

                // callback($.map(nsCtx.users, (member) => {
                //     return (member.enabled && member.username.indexOf(term) >= 0) ? member : null;
                // }));
            },
            template: (value, term) => {
                // let user = _.find(nsCtx.users, { username: value });
                // return `${user.name ? user.name : user.username} - ${user.mails} (${user.username})`;
                // return `${value.name ? value.name : value.username} - ${value.mails} (${value.username})`;

                if (value.username) { // @user
                    // let user = _.find(this.members, { username: value });
                    return `${value.name ? value.name : value.username} - ${value.mails} (${value.username})`;
                } else { // @group
                    return `${value.name} - ${value.title} (${value.members.length}人)`;
                }
            },
            replace: (value) => {
                // return `$1{~${value}}`;
                let cm = this.simplemde.codemirror;
                let cursor = cm.getCursor();
                let txt = cm.getRange({
                    line: cursor.line,
                    ch: 0
                }, cursor);

                // cm.replaceRange(txt.replace(/@(\w*)$/, `{~${value.username}} `), {
                //     line: cursor.line,
                //     ch: 0
                // }, cursor);

                cm.replaceRange(txt.replace(/@(\w*)$/, `{${value.username ? '' : '!'}~${value.username ? value.username : value.name}} `), {
                    line: cursor.line,
                    ch: 0
                }, cursor);
            }
        }, { // emoji
            match: /(^|\s):([\+\-\w]*)$/,
            search: function (term, callback) {
                callback($.map(emojis, (emoji) => {
                    return _.some(emoji.split('_'), (item) => {
                        return item.indexOf(term) === 0;
                    }) ? emoji : null;
                }));
            },
            template: (value, term) => {
                if (value == 'search') {
                    return `表情查找 - :search`;
                }
                let emojiKey = `:${value}:`;
                return `${emojify.replace(emojiKey)} - ${emojiKey}`;
            },
            replace: (value) => {
                if (this.tipsActionHandler(value)) {
                    return '$1:' + value + ': ';
                } else {
                    return '';
                }
            }
        }], {
            appendTo: '.tms-blog-write-status-bar',
            maxCount: 5
        });

        this.simplemde.codemirror.on('keydown', (cm, e) => {
            if (_.includes([13, 38, 40], e.keyCode) && this.isTipsShow()) { // enter | up | down
                e.preventDefault();
            }
        });
    }

    isTipsShow() {
        return $('.tms-blog-write-status-bar').find('.textcomplete-dropdown:visible').size() === 1;
    }

    tipsActionHandler(value) {

        if (value == 'search') {
            _.delay(() => {
                utils.openNewWin(nsCons.STR_EMOJI_SEARCH_URL);
            }, 200);
        } else {
            return true;
        }

        return false;
    }

    initPaste() {

        if (this.$chatMsgInputRef.is('textarea')) {
            this.$paste = $(this.$chatMsgInputRef).pastableTextarea();
        } else {
            this.$paste = $(this.$chatMsgInputRef).pastableContenteditable();
        }

        if (this.$paste) {

            this.pasteHandler = (ev, data) => {

                // 给消息体增加uuid
                nsCtx.b_uuid = nsCtx.b_uuid || utils.uuid();

                $.post('/admin/file/base64', {
                    dataURL: data.dataURL,
                    type: data.blob.type,
                    toType: 'Blog',
                    atId: this.blog ? this.blog.uuid : nsCtx.b_uuid
                }, (data, textStatus, xhr) => {
                    if (data.success) {
                        this.insertContent('![{name}]({baseURL}{path}{uuidName}?width=100)\r\n'
                            .replace(/\{name\}/g, utils.replaceMdChar(data.data.name))
                            .replace(/\{baseURL\}/g, utils.getBaseUrl() + '/')
                            .replace(/\{path\}/g, data.data.path)
                            .replace(/\{uuidName\}/g, data.data.uuidName));
                    }
                });
            };

            this.errHandler = (ev, data) => {
                toastr.error(data.message, '剪贴板粘贴图片错误!');
            };

            this.$paste.on('pasteImage', this.pasteHandler).on('pasteImageError', this.errHandler);
        }
    }

    initUploadDropzone(domRef, getInputTargetCb, clickable) {

        let _this = this;

        $(domRef).dropzone({
            url: "/admin/file/upload",
            paramName: 'file',
            clickable: !!clickable,
            dictDefaultMessage: '',
            maxFilesize: window.tmsSysConfig.uploadMaxFileSize || 10,
            addRemoveLinks: true,
            previewsContainer: '.em-blog-write .dropzone-previews',
            previewTemplate: $('.em-blog-write .preview-template')[0].innerHTML,
            dictCancelUpload: '取消上传',
            dictCancelUploadConfirmation: '确定要取消上传吗?',
            dictFileTooBig: '文件过大({{filesize}}M),最大限制:{{maxFilesize}}M',
            init: function () {
                this.on("sending", function (file, xhr, formData) {
                    if (!getInputTargetCb()) {
                        this.removeAllFiles(true);
                    } else {
                        formData.append('toType', 'Blog');

                        nsCtx.b_uuid = nsCtx.b_uuid || utils.uuid();
                        formData.append('atId', _this.blog ? _this.blog.uuid : nsCtx.b_uuid);
                    }
                });
                this.on("success", function (file, data) {
                    if (data.success) {

                        $.each(data.data, function (index, item) {
                            if (item.type == 'Image') {
                                _this.insertContent('![{name}]({baseURL}{path}{uuidName}?width=100)\r\n'
                                    .replace(/\{name\}/g, utils.replaceMdChar(item.name))
                                    .replace(/\{baseURL\}/g, utils.getBaseUrl() + '/')
                                    .replace(/\{path\}/g, item.path)
                                    .replace(/\{uuidName\}/g, item.uuidName));
                            } else {
                                _this.insertContent('[{name}]({baseURL}{path}{uuidName})\r\n'
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
    }

    /**
     * 编辑器插入自定义沟通内容
     * @param  {[type]} cm      [description]
     * @param  {[type]} comment [description]
     * @return {[type]}         [description]
     */
    insertContent(content, mde) {
        try {
            let cm = mde ? mde.codemirror : this.simplemde.codemirror;
            var cursor = cm.getCursor();
            if (cursor) {
                cm.replaceRange(content, cursor, cursor);
                cm.focus();
            }
        } catch (err) {
            console.log(err);
        }

    }

    destroy() {
        this._reset();
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {

        this.blogSaveHandler = (event) => {
            this.save(event);
        };

        this.switchHandler = (event) => {
            this.switchEditorHandler();
        };

        $('#blog-save-btn').click(this.blogSaveHandler);
        $('#switch-html').click(this.switchHandler);
    }

    save(event, isKey) {

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

        if (!this.blog) {
            if (event.ctrlKey || nsCtx.newBlogSpace) {
                // 给消息体增加uuid
                nsCtx.b_uuid = nsCtx.b_uuid || utils.uuid();
                $.post(`/admin/blog/create`, {
                    url: utils.getBasePath(),
                    usernames: utils.parseUsernames(content, [nsCtx.memberAll, ...(window.tmsUsers ? tmsUsers : [])]).join(','),
                    title: title,
                    content: content,
                    spaceId: nsCtx.newBlogSpace ? nsCtx.newBlogSpace.id : '',
                    dirId: nsCtx.newBlogDir ? nsCtx.newBlogDir.id : '',
                    privated: false,
                    uuid: nsCtx.b_uuid,
                    contentHtml: utils.md2html(content, true)
                }, (data, textStatus, xhr) => {
                    if (data.success) {
                        nsCtx.b_uuid = utils.uuid();
                        this.blog = data.data;
                        toastr.success('博文保存成功!');
                        ea.publish(nsCons.EVENT_BLOG_CHANGED, {
                            action: 'created',
                            blog: this.blog
                        });
                        $('a[href="#modaal-blog-write"]').modaal('close');
                    } else {
                        toastr.error(data.data, '博文保存失败!');
                    }
                });
            } else {
                ea.publish(nsCons.EVENT_BLOG_SAVE, {
                    title: title,
                    content: content,
                });
            }
        } else {

            if (this.sending) {
                return;
            }

            this.sending = true;
            $('#blog-save-btn i').show();

            var html = utils.md2html(content, true);
            let users = [nsCtx.memberAll, ...(window.tmsUsers ? tmsUsers : [])];

            let channel = this.blog.space ? this.blog.space.channel : null;

            $.post('/admin/blog/update', {
                url: utils.getBasePath(),
                id: this.blog.id,
                version: this.blog.version,
                // usernames: utils.parseUsernames(content, users).join(','),
                usernames: utils.parseUsernames(content, users, channel).join(','),
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
                        autoFollow: true,
                        blog: this.blog
                    });
                    if (!isKey) {
                        (event && event.ctrlKey) && this.close();
                    } else {
                        (event && event.ctrlKey && event.shiftKey) && this.close();
                    }
                } else {
                    toastr.error(data.data, '博文更新失败!');
                }
            }).always(() => {
                this.sending = false;
                $('#blog-save-btn i').hide();
            });
        }

    }

    switchEditorHandler() {
        this.close();
        $('.em-blog-write-html > iframe').attr('src', this.baseRes + 'blog.html' + '?_=' + new Date().getTime());
        $('a[href="#modaal-blog-write-html"]').click();
        return false;
    }

}
