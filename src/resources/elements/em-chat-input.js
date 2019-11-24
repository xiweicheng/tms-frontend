import { bindable, containerless, inject } from 'aurelia-framework';
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
export class EmChatInput {

    @bindable chatTo;
    @bindable isAt;
    @bindable channel;
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
        this.subscribe = ea.subscribe(nsCons.EVENT_SHOW_HOTKEYS_MODAL, (payload) => {
            this.emHotkeysModal.show();
        });
        this.subscribe1 = ea.subscribe(nsCons.EVENT_CHAT_CHANNEL_MEMBER_ADD_OR_REMOVE, (payload) => {
            this.members = [nsCtx.memberAll, ...payload.members];
        });
        this.subscribe2 = ea.subscribe(nsCons.EVENT_CHAT_MSG_INSERT, (payload) => {
            this.insertContent(payload.content);
        });
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe.dispose();
        this.subscribe1.dispose();
        this.subscribe2.dispose();
    }

    initHotkeys() {
        $(document).bind('keydown', 'r', () => { // reply message
            event.preventDefault();
            this.simplemde.codemirror.focus();
        });
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        this.initSimpleMDE(this.chatInputRef);
        this.initDropzone();
        this.initPaste();
        this.initHotkeys();
    }

    detached() {
        window.__debug && console.log('EmChatInput--detached');

        this.chatTo = null;
        this.isAt = null;
        this.channel = null;
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

    initPaste() {

        if (this.$chatMsgInputRef.is('textarea')) {
            this.$paste = $(this.$chatMsgInputRef).pastableTextarea();
        } else {
            this.$paste = $(this.$chatMsgInputRef).pastableContenteditable();
        }

        if (this.$paste) {

            this.pasteHandler = (ev, data) => {

                $.post('/admin/file/base64', {
                    dataURL: data.dataURL,
                    type: data.blob.type,
                    toType: nsCtx.isAt ? 'User' : 'Channel',
                    toId: nsCtx.chatTo
                }, (data, textStatus, xhr) => {
                    if (data.success) {
                        this.insertContent('![{name}]({baseURL}{path}{uuidName})'
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
            position: 'bottom left',
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
            maxFilesize: 10,
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
            maxFilesize: 10,
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
        this.simplemde = new SimpleMDE({
            element: textareaDom,
            spellChecker: false,
            status: false,
            autofocus: true,
            toolbar: false,
            // forceSync: true,
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

        this.initTextcomplete();
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
            // http://codemirror.net/doc/manual.html#api
            // https://github.com/yuku-t/jquery-textcomplete/blob/master/packages/jquery-textcomplete/doc/how_to_use.md
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
                let users = $.map(this.members, (member) => {
                    return (member.enabled && member.username.indexOf(term) >= 0) ? member : null;
                });
                let groups = $.map(this.channel ? this.channel.channelGroups : [], (grp) => {
                    return ((grp.status != 'Deleted') && grp.name.indexOf(term) >= 0) ? grp : null;
                });
                callback([...users, ...groups]);
            },
            template: (value, term) => {
                if (value.username) { // @user
                    // let user = _.find(this.members, { username: value });
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

                // console.log(txt);
                // return `$1{~${value}}`;
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
            // appendTo: '.tms-chat-status-bar',
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
                this.emHotkeysModal.show();
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

        var html = utils.md2html(content, true);

        let url;
        let data;
        if (this.isAt) {
            url = `/admin/chat/direct/create`;
            data = {
                baseUrl: utils.getBaseUrl(),
                path: wurl('path'),
                chatTo: this.chatTo,
                content: content,
                ua: navigator.userAgent,
                contentHtml: html
            };
        } else {
            url = `/admin/chat/channel/create`;
            let usernames = utils.parseUsernames(content, this.members, this.channel).join(',');
            data = {
                url: utils.getUrl(),
                channelId: this.channel.id,
                usernames: usernames,
                content: content,
                ua: navigator.userAgent,
                contentHtml: html
            };
        }
        $.post(url, data, (data, textStatus, xhr) => {
            if (data.success) {
                this.simplemde.value('');
                ea.publish(nsCons.EVENT_CHAT_MSG_SENDED, {
                    data: data
                });
            } else {
                toastr.error(data.data, '发送消息失败!');
            }
        }).always(() => {
            this.sending = false;
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
            this.emHotkeysModal.show();
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
