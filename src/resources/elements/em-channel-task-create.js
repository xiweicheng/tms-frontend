import {
    bindable,
    containerless
} from 'aurelia-framework';
import 'textcomplete';
import tips from 'common/common-tips';
import emojis from 'common/common-emoji';
import {
    default as SimpleMDE
} from 'simplemde';

@containerless
export class EmChannelTaskCreate {

    @bindable channel;
    @bindable isAt;
    members = [];
    isMobile = utils.isMobile();
    col;
    title = '创建';

    channelChanged() {

        if (this.channel) {
            this.members = [nsCtx.memberAll, ...this.channel.members];
        } else {
            this.members = [];
        }

    }

    /**
     * 构造函数
     */
    constructor() {
        this.subscribe1 = ea.subscribe(nsCons.EVENT_CHAT_CHANNEL_MEMBER_ADD_OR_REMOVE, (payload) => {
            this.members = [nsCtx.memberAll, ...payload.members];
        });
    }

    show(col) {
        this.col = col;
        this.taskItem = null;
        this.title = '创建';
        this.emModal.show({
            hideOnApprove: false,
            autoDimmer: false
        });
        this.simplemde.value('');
    }

    showEdit(taskItem) {
        this.taskItem = taskItem;
        this.title = '编辑';

        this.emModal.show({
            hideOnApprove: false,
            autoDimmer: false
        });

        this.simplemde.value(this.taskItem.content);

        _.delay(() => {
            // this.simplemde.codemirror.focus();
            this.simplemde.value(this.taskItem.content);
        }, 500);

    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe1.dispose();
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        this.initSimpleMDE(this.chatInputRef);
        this.initDropzone();
        this.initPaste();
    }

    initPaste() {

        let $paste;
        if (this.$chatMsgInputRef.is('textarea')) {
            $paste = $(this.$chatMsgInputRef).pastableTextarea();
        } else {
            $paste = $(this.$chatMsgInputRef).pastableContenteditable();
        }

        $paste && ($paste.on('pasteImage', (ev, data) => {

            // 给消息体增加uuid
            nsCtx.ct_uuid = nsCtx.ct_uuid || utils.uuid();

            $.post('/admin/file/base64', {
                dataURL: data.dataURL,
                type: data.blob.type,
                toType: nsCtx.isAt ? 'User' : 'Channel',
                toId: nsCtx.chatTo,
                atId: this.taskItem ? this.taskItem.uuid : nsCtx.ct_uuid
            }, (data, textStatus, xhr) => {
                if (data.success) {
                    this.insertContent('![{name}]({baseURL}{path}{uuidName}?width=auto)\r\n'
                        .replace(/\{name\}/g, utils.replaceMdChar(data.data.name))
                        .replace(/\{baseURL\}/g, utils.getBaseUrl() + '/')
                        .replace(/\{path\}/g, data.data.path)
                        .replace(/\{uuidName\}/g, data.data.uuidName));
                }
            });
        }).on('pasteImageError', (ev, data) => {
            toastr.error(data.message, '剪贴板粘贴图片错误!');
        }));
    }

    initDropzone() {
        this.initUploadDropzone($('.CodeMirror-wrap', this.inputRef), () => {
            return this.$chatMsgInputRef
        }, false);

        this.initUploadDropzone($('.editor-toolbar .fa.fa-upload', '.em-channel-task-create'), () => {
            return this.$chatMsgInputRef
        }, true);

        this.initCsvDropzone();

    }

    initCsvDropzone() {

        let _this = this;

        $($('.editor-toolbar .fa.fa-file-excel-o', '.em-channel-task-create')).dropzone({
            url: "/admin/file/csv2md",
            paramName: 'file',
            clickable: true,
            dictDefaultMessage: '',
            maxFilesize: window.tmsSysConfig.uploadMaxFileSize || 10,
            acceptedFiles: '.csv,.xls,.xlsx',
            addRemoveLinks: true,
            previewsContainer: this.chatStatusBarRef,
            previewTemplate: this.previewTemplateRef.innerHTML,
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

    initUploadDropzone(domRef, getInputTargetCb, clickable) {

        let _this = this;

        $(domRef).dropzone({
            url: "/admin/file/upload",
            paramName: 'file',
            clickable: !!clickable,
            dictDefaultMessage: '',
            maxFilesize: window.tmsSysConfig.uploadMaxFileSize || 10,
            addRemoveLinks: true,
            previewsContainer: this.chatStatusBarRef,
            previewTemplate: this.previewTemplateRef.innerHTML,
            dictCancelUpload: '取消上传',
            dictCancelUploadConfirmation: '确定要取消上传吗?',
            dictFileTooBig: '文件过大({{filesize}}M),最大限制:{{maxFilesize}}M',
            init: function () {
                this.on("sending", function (file, xhr, formData) {
                    if (!getInputTargetCb()) {
                        this.removeAllFiles(true);
                    } else {
                        formData.append('toType', nsCtx.isAt ? 'User' : 'Channel');
                        formData.append('toId', nsCtx.chatTo);

                        // 关联频道消息UUID
                        nsCtx.ct_uuid = nsCtx.ct_uuid || utils.uuid();
                        //console.log(nsCtx.ct_uuid);
                        formData.append('atId', _this.taskItem ? _this.taskItem.uuid : nsCtx.ct_uuid);
                    }
                });
                this.on("success", function (file, data) {
                    if (data.success) {

                        $.each(data.data, function (index, item) {
                            if (item.type == 'Image') {
                                _this.insertContent('![{name}]({baseURL}{path}{uuidName}?width=auto)\r\n'
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

    initSimpleMDE(textareaDom) {
        this.simplemde = new SimpleMDE({
            element: textareaDom,
            spellChecker: false,
            status: false,
            autofocus: true,
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
                return marked(utils.preParse(plainText, this.channel));
            },
        });

        this.$chatMsgInputRef = $(this.inputRef).find('.textareaWrapper .CodeMirror textarea');
        if (this.$chatMsgInputRef.size() === 0) {
            this.$chatMsgInputRef = $(this.inputRef).find('.textareaWrapper .CodeMirror [contenteditable="true"]');
        }

        this.initTextcomplete();
    }

    initTextcomplete() {

        $(this.$chatMsgInputRef).textcomplete([{ // @user
            match: /(^|\s?)@(\w*)$/,
            context: (text) => {
                let cm = this.simplemde.codemirror;
                let cursor = cm.getCursor();
                let txt = cm.getRange({
                    line: cursor.line,
                    ch: 0
                }, cursor);
                return txt;
            },
            search: (term, callback) => {
                let users = $.map(this.members, (member) => {
                    return (member.enabled && member.username.indexOf(term) >= 0) ? member : null;
                });
                let groups = $.map(this.channel.channelGroups, (grp) => {
                    return ((grp.status != 'Deleted') && grp.name.indexOf(term) >= 0) ? grp : null;
                });
                callback([...users, ...groups]);
            },
            template: (value, term) => {
                if (value.username) { // @user
                    return `${value.name ? value.name : value.username} - ${value.mails} (${value.username})`;
                } else { // @group
                    return `${value.name} - ${value.title} (${value.members.length}人)`;
                }
            },
            replace: (value) => {
                let cm = this.simplemde.codemirror;
                let cursor = cm.getCursor();
                let txt = cm.getRange({
                    line: cursor.line,
                    ch: 0
                }, cursor);

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
            appendTo: this.chatStatusBarRef,
            maxCount: nsCons.NUM_TEXT_COMPLETE_MAX_COUNT
        });

        this.simplemde.codemirror.on('keydown', (cm, e) => {
            if (_.includes([13, 38, 40], e.keyCode) && this.isTipsShow()) { // enter | up | down
                e.preventDefault();
            } else if (e.ctrlKey && e.keyCode === 13) {
                this.approveHandler();
            } else if (e.keyCode === 27) {
                this.simplemde.value('');
            } else if (e.ctrlKey && e.keyCode == 85) {
                $('.em-channel-task-create .editor-toolbar .fa.fa-upload').click();
            } else if (e.ctrlKey && e.keyCode == 191) {
                // this.emHotkeysModal.show();
            }
        });
    }

    setCaretPosition(line, ch) {
        (line || ch) && (_.delay(() => {
            let cr = this.simplemde.codemirror.getCursor();
            this.simplemde.codemirror.setCursor({
                line: cr.line - (line ? line : 0),
                ch: cr.line ? (ch ? ch : 0) : (cr.ch - (ch ? ch : 0))
            });
        }, 100));
    }

    createTask() {

        let content = this.simplemde.value();

        if (!$.trim(content)) {
            this.simplemde.value('');
            return;
        }

        if (this.sending) {
            return;
        }

        this.sending = true;

        // 给消息体增加uuid
        nsCtx.ct_uuid = nsCtx.ct_uuid || utils.uuid();

        let body;

        if (this.isAt) {
            body = {
                baseUrl: utils.getUrl(),
                path: wurl('path'),
                chatTo: nsCtx.chatTo,
                content: content,
                ua: navigator.userAgent,
                uuid: nsCtx.ct_uuid,
                contentHtml: utils.md2html(content, true)
            };
        } else {
            body = {
                url: utils.getUrl(),
                channelId: this.channel.id,
                usernames: utils.parseUsernames(content, this.members, this.channel).join(','),
                content: content,
                ua: navigator.userAgent,
                uuid: nsCtx.ct_uuid,
                contentHtml: utils.md2html(content, true)
            };
        }

        $.post(`/admin/chat/${this.isAt ? 'direct' : 'channel'}/create`, body, (data, textStatus, xhr) => {
            if (data.success) {
                this.simplemde.value('');

                // 打任务状态标签
                $.post(`/admin/chat/${this.isAt ? 'direct' : 'channel'}/label/toggle`, {
                    url: utils.getUrl(),
                    meta: this.col.name,
                    type: 'Tag',
                    contentHtml: utils.md2html(content, true),
                    name: this.col.name,
                    desc: this.col.name,
                    id: data.data.id,
                }, (data2, textStatus, xhr) => {
                    if (data2.success) {
                        ea.publish(nsCons.EVENT_CHANNEL_TASK_COL_REFRESH, {
                            name: this.col.name
                        });
                        this.emModal.hide();
                    } else {
                        toastr.error(data.data);
                    }
                });

                ea.publish(nsCons.EVENT_CHAT_MSG_SENDED, {
                    data: data
                });
            } else {
                toastr.error(data.data, '创建任务失败!');
            }
        }).always(() => {
            this.sending = false;
            nsCtx.ct_uuid = utils.uuid();
        });

    }

    editTask() {

        let content = this.simplemde.value();

        if (!$.trim(content)) {
            this.simplemde.value('');
            return;
        }

        if (this.sending) {
            return;
        }

        this.sending = true;

        this.taskItem.contentOld = this.taskItem.content;
        this.taskItem.content = content;

        let body;

        if (this.isAt) {
            body = {
                baseUrl: utils.getUrl(),
                path: wurl('path'),
                id: this.taskItem.id,
                content: this.taskItem.content,
                diff: utils.diffS(this.taskItem.contentOld, this.taskItem.content)
            };
        } else {
            body = {
                url: utils.getUrl(),
                id: this.taskItem.id,
                version: this.taskItem.version,
                usernames: utils.parseUsernames(this.taskItem.content, this.members, this.channel).join(','),
                content: this.taskItem.content,
                diff: utils.diffS(this.taskItem.contentOld, this.taskItem.content)
            };
        }

        $.post(`/admin/chat/${this.isAt ? 'direct' : 'channel'}/update`, body, (data, textStatus, xhr) => {
            if (data.success) {
                toastr.success('更新任务成功!');
                this.taskItem.version = data.data.version;
                this.emModal.hide();
            } else {
                toastr.error(data.data, '更新任务失败!');
            }
        }).always(() => {
            this.sending = false;
        });
    }

    isTipsShow() {
        return $(this.chatStatusBarRef).find('.textcomplete-dropdown:visible').size() === 1;
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

    tipsActionHandler(value) {
        if (value == '/upload') {
            $('.em-channel-task-create .editor-toolbar .fa.fa-upload').click();
        } else if (value == '/shortcuts') {
            // this.emHotkeysModal.show();
        } else if (value == 'search') {
            _.delay(() => {
                utils.openNewWin(nsCons.STR_EMOJI_SEARCH_URL);
            }, 200);
        } else {
            return true;
        }

        return false;
    }

    togglePreviewHandler() {
        this.simplemde.togglePreview();
    }

    showHandler(event) {

    }

    approveHandler(event) {
        if (this.taskItem) { // edit
            this.editTask();
        } else { // create
            this.createTask();
        }
    }
}
