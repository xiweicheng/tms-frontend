import { bindable, containerless } from 'aurelia-framework';
import 'textcomplete';
import tips from 'common/common-tips';
import emojis from 'common/common-emoji';
import {
    default as SimpleMDE
} from 'simplemde';
import {
    default as Dropzone
} from 'dropzone';

@containerless
export class EmChatTopicInput {

    @bindable channel;
    @bindable chat;
    @bindable name;
    members = [];
    isMobile = utils.isMobile();

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
        this.subscribe2 = ea.subscribe(nsCons.EVENT_CHAT_TOPIC_MSG_INSERT, (payload) => {
            if (this.name != payload.from) return;
            this.insertContent(payload.content);
        });

        this.subscribe3 = ea.subscribe(nsCons.EVENT_MD_EDITOR_TBAR_VISIBLE_CHANGE, (payload) => {
            this._setMdEditorTbarVisible(payload);
        });
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe1.dispose();
        this.subscribe2.dispose();
        this.subscribe3.dispose();
    }

    detached() {
        window.__debug && console.log('EmChatTopicInput--detached');

        this.channel = null;
        this.chat = null;
        this.name = null;
        this.members = [];

        if (this.$paste) {
            this.$paste.off('pasteImage', this.pasteHandler).off('pasteImageError', this.errHandler);
            this.pasteHandler = null;
            this.errHandler = null;

            this.$paste = null;
        }

        $(this.chatBtnRef).popup('destroy');
        this.chatBtnRef = null;

        $('.CodeMirror-wrap', this.inputRef).each((index, elem) => {
            let dd = Dropzone.forElement(elem);
            dd && dd.destroy();
        });
        this.inputRef = null;

        $(this.btnItemUploadRef).children().andSelf().each((index, elem) => {
            let dd = Dropzone.forElement(elem);
            dd && dd.destroy();
        });
        this.btnItemUploadRef = null;

        $(this.btnItemCsvRef).children().andSelf().each((index, elem) => {
            let dd = Dropzone.forElement(elem);
            dd && dd.destroy();
        });
        this.btnItemCsvRef = null;

        try {
            // https://github.com/sparksuite/simplemde-markdown-editor
            this.simplemde.toTextArea();
            this.simplemde = null;

            $(this.$chatMsgInputRef).textcomplete('destroy');
            this.$chatMsgInputRef = null;
        } catch (err) {
            console.error(err);
        }

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

        if (this.$chatMsgInputRef.is('textarea')) {
            this.$paste = $(this.$chatMsgInputRef).pastableTextarea();
        } else {
            this.$paste = $(this.$chatMsgInputRef).pastableContenteditable();
        }

        if (this.$paste) {

            this.pasteHandler = (ev, data) => {

                // 给消息体增加uuid
                nsCtx.cr_uuid = nsCtx.cr_uuid || utils.uuid();

                $.post('/admin/file/base64', {
                    dataURL: data.dataURL,
                    type: data.blob.type,
                    toType: nsCtx.isAt ? 'User' : 'Channel',
                    toId: nsCtx.chatTo,
                    atId: nsCtx.cr_uuid
                }, (data, textStatus, xhr) => {
                    if (data.success) {
                        this.insertContent('![{name}]({baseURL}{path}{uuidName}?width=auto)\r\n'
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

    initDropzone() {
        this.initUploadDropzone($('.CodeMirror-wrap', this.inputRef), () => {
            return this.$chatMsgInputRef
        }, false);
        this.initUploadDropzone($(this.btnItemUploadRef).children().andSelf(), () => {
            return this.$chatMsgInputRef
        }, true);

        this.initCsvDropzone();

        $(this.chatBtnRef).popup({
            inline: true,
            hoverable: true,
            // position: 'bottom left',
            position: 'top left',
            delay: {
                show: 300,
                hide: 300
            }
        });

    }

    initCsvDropzone() {

        let _this = this;

        $($(this.btnItemCsvRef).children().andSelf()).dropzone({
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
            init: function() {
                this.on("sending", function(file, xhr, formData) {

                });
                this.on("success", function(file, data) {
                    if (data.success) {

                        $.each(data.data, function(index, item) {
                            _this.insertContent(`\n${item}`);

                        });
                        toastr.success('CSV转换表格成功!');
                    } else {
                        toastr.error(data.data, 'CSV转换表格失败!');
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
            init: function() {
                this.on("sending", function(file, xhr, formData) {
                    if (!getInputTargetCb()) {
                        this.removeAllFiles(true);
                    } else {
                        formData.append('toType', nsCtx.isAt ? 'User' : 'Channel');
                        formData.append('toId', nsCtx.chatTo);

                         // 关联频道消息UUID
                         nsCtx.cr_uuid = nsCtx.cr_uuid || utils.uuid();
                         // console.log(nsCtx.cr_uuid);
                         formData.append('atId', nsCtx.cr_uuid);
                    }
                });
                this.on("success", function(file, data) {
                    if (data.success) {

                        $.each(data.data, function(index, item) {
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
                this.on("error", function(file, errorMessage, xhr) {
                    toastr.error(errorMessage, '上传失败!');
                });
                this.on("complete", function(file) {
                    this.removeFile(file);
                });
            }
        });
    }

    initSimpleMDE(textareaDom) {

        let toolbar = [{
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
                name: "preview",
                action: SimpleMDE.togglePreview,
                className: "fa fa-eye no-disable",
                title: "切换预览",
            }

        ];

        if (this.name == 'chat') {
            toolbar = [{
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
                name: "tasks",
                action: (editor) => {
                    this.insertContent('- [ ] 未完成任务\n- [x] 已完成任务');
                },
                className: "fa fa-check-square-o ",
                title: "任务列表",
            }, {
                name: "preview",
                action: SimpleMDE.togglePreview,
                className: "fa fa-eye no-disable",
                title: "切换预览",
            }];
        }

        this.simplemde = new SimpleMDE({
            element: textareaDom,
            spellChecker: false,
            status: false,
            autofocus: true,
            // toolbar: false,
            // forceSync: true,
            toolbar: toolbar,
            autoDownloadFontAwesome: false,
            insertTexts: {
                table: ["", "\n\n| 列1 | 列2 | 列3 |\n| ------ | ------ | ------ |\n| 文本 | 文本 | 文本 |\n\n"],
            },
            previewRender: (plainText, preview) => { // Async method
                if (emojify) {
                    plainText = emojify.replace(plainText);
                }
                return marked(utils.preParse(plainText, this.channel));
                // return this.simplemde.markdown(utils.preParse(plainText, this.channel));
            },
        });

        this.$chatMsgInputRef = $(this.inputRef).find('.textareaWrapper .CodeMirror textarea');
        if (this.$chatMsgInputRef.size() === 0) {
            this.$chatMsgInputRef = $(this.inputRef).find('.textareaWrapper .CodeMirror [contenteditable="true"]');
        }

        this.$tbar = $(`.em-chat-topic-input[data-name="${this.name}"] .editor-toolbar`);

        this.$tbar.insertAfter(this.$tbar.next());

        this.tbarVisible = false;
        if (localStorage) {
            let visible = localStorage.getItem(`tms-md-editor-tbar-visible`);
            this._setMdEditorTbarVisible(visible == 'true');
        }

        this.initTextcomplete();
    }

    _setMdEditorTbarVisible(visible) {

        this.tbarVisible = visible;
        this.$tbar.toggle(this.tbarVisible);

    }

    initTextcomplete() {

        $(this.$chatMsgInputRef).textcomplete([{ // chat msg help
            match: /(|\b)(\/.*)$/,
            search: (term, callback) => {
                var keys = _.keys(tips);
                callback($.map(keys, (key) => {
                    return key.indexOf(term) === 0 ? key : null;
                }));
            },
            template: (value, term) => {
                return tips[value].label;
            },
            replace: (value) => {
                if (this.tipsActionHandler(value)) {
                    this.setCaretPosition(tips[value].line, tips[value].ch);
                    return `$1${tips[value].value}`;
                } else {
                    return '';
                }
            }
        }, { // @user
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
                // callback($.map(this.members, (member) => {
                //     return (member.enabled && member.username.indexOf(term) >= 0) ? member.username : null;
                // }));
                let users = $.map(this.members, (member) => {
                    return (member.enabled && member.username.indexOf(term) >= 0) ? member : null;
                });
                let groups = $.map(this.channel.channelGroups, (grp) => {
                    return ((grp.status != 'Deleted') && grp.name.indexOf(term) >= 0) ? grp : null;
                });
                callback([...users, ...groups]);
            },
            template: (value, term) => {
                // let user = _.find(this.members, { username: value });
                // return `${user.name ? user.name : user.username} - ${user.mails} (${user.username})`;
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

                cm.replaceRange(txt.replace(/@(\w*)$/, `{${value.username ? '' : '!'}~${value.username ? value.username : value.name}} `), {
                    line: cursor.line,
                    ch: 0
                }, cursor);
            }
        }, { // emoji
            match: /(^|\s):([\+\-\w]*)$/,
            search: function(term, callback) {
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
            // appendTo: '.tms-chat-topic-status-bar',
            appendTo: this.chatStatusBarRef,
            maxCount: nsCons.NUM_TEXT_COMPLETE_MAX_COUNT
        });

        this.simplemde.codemirror.on('keydown', (cm, e) => {
            if (_.includes([13, 38, 40], e.keyCode) && this.isTipsShow()) { // enter | up | down
                e.preventDefault();
            } else if (e.ctrlKey && e.keyCode === 13) {
                this.sendChatMsg();
            } else if (e.keyCode === 27) {
                this.simplemde.value('');
            } else if (e.ctrlKey && e.keyCode == 85) {
                $(this.btnItemUploadRef).find('.content').click();
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

    sendChatMsg() {

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
        nsCtx.cr_uuid = nsCtx.cr_uuid || utils.uuid();

        $.post(`/admin/chat/channel/reply/add`, {
            url: utils.getUrl(),
            usernames: utils.parseUsernames(content, this.members, this.channel).join(','),
            content: content,
            ua: navigator.userAgent,
            uuid: nsCtx.cr_uuid,
            contentHtml: utils.md2html(content, true),
            id: this.chat.id
        }, (data, textStatus, xhr) => {
            if (data.success) {
                this.simplemde.value('');
                this.chat.version = data.msgs[0];
                ea.publish(nsCons.EVENT_CHAT_TOPIC_MSG_SENDED, {
                    from: this.name,
                    data: data.data
                });
            } else {
                toastr.error(data.data, '发送消息失败!');
            }
        }).always(() => {
            this.sending = false;
            nsCtx.cr_uuid = utils.uuid();
        });
    }

    sendChatMsgHandler() {
        this.sendChatMsg();
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
        } catch (err) { console.log(err); }
    }

    tipsActionHandler(value) {
        if (value == '/upload') {
            $(this.btnItemUploadRef).find('.content').click();
        } else if (value == '/shortcuts') {
            // this.emHotkeysModal.show();
        } else if (value == 'search') {
            _.delay(() => { utils.openNewWin(nsCons.STR_EMOJI_SEARCH_URL); }, 200);
        } else {
            return true;
        }

        return false;
    }

    togglePreviewHandler() {
        this.simplemde.togglePreview();
    }
}
