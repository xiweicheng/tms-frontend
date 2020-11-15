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
import toastrOps from 'common/common-toastr';

@containerless
export class EmBlogComment {

    comments = [];

    baseUrl = utils.getUrl();
    basePath = utils.getBasePath();
    offset = 0;
    isSuper = nsCtx.isSuper;
    loginUser = nsCtx.loginUser;
    users;

    @bindable blog;

    blogChanged(newValue, oldValue) {
        this._refresh();
    }

    bind() {
        this.users = nsCtx.users;
    }

    detached() {
        window.__debug && console.log('EmBlogComment--detached');

        this.comments = null;
        this.users = null;
        this.blog = null;
        this.focusedComment = null;

        // 消息popup
        $('.em-blog-comment .comments').off('mouseenter', '.markdown-body a[href*="#/blog/"]:not(.pp-not)', this.blogCommentMeHandler);
        $('.em-blog-comment .comments').off('mouseleave', '.markdown-body a[href*="#/blog/"]:not(.pp-not)', this.blogCommentMlHandler);
        this.blogCommentMeHandler = null;
        this.blogCommentMlHandler = null;

        $('.em-blog-comment .comments').off('dblclick', '.comment', this.commentsDblHandler);
        $('.em-blog-comment .comments').off('click', '.comment', this.commentsClHandler);
        this.commentsDblHandler = null;
        this.commentsClHandler = null;

        $(document).unbind('keydown', this.kdRHandler).unbind('keydown', this.kdAltUpHandler).unbind('keydown', this.kdAltDownHandler);
        this.kdRHandler = null;
        this.kdAltUpHandler = null;
        this.kdAltDownHandler = null;

        if (this.$paste) {
            this.$paste.off('pasteImage', this.pasteHandler).off('pasteImageError', this.errHandler);
            this.pasteHandler = null;
            this.errHandler = null;

            this.$paste = null;
        }

        $('.CodeMirror-wrap', this.markdownRef).each((index, elem) => {
            let dd = Dropzone.forElement(elem);
            dd && dd.destroy();
        });

        $('.editor-toolbar .fa.fa-upload', this.markdownRef).each((index, elem) => {
            let dd = Dropzone.forElement(elem);
            dd && dd.destroy();
        });

        $('.editor-toolbar .fa.fa-file-excel-o', this.markdownRef).each((index, elem) => {
            let dd = Dropzone.forElement(elem);
            dd && dd.destroy();
        });
        this.markdownRef = null;

        try {

            if (this.simplemde) {
                this.simplemde.codemirror.off('keyup', this.editKeyHandler);
                this.editKeyHandler = null;

                // https://github.com/sparksuite/simplemde-markdown-editor
                this.simplemde.toTextArea();
                this.simplemde = null;
            }

            $(this.$chatMsgInputRef).textcomplete('destroy');
            this.$chatMsgInputRef = null;
        } catch (err) {
            console.error(err);
        }

    }

    /**
     * 构造函数
     */
    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_BLOG_COMMENT_MSG_INSERT, (payload) => {
            this.insertContent(`${payload.content}`);
            this._scrollTo('b');
        });

        this.subscribe2 = ea.subscribe(nsCons.EVENT_MARKDOWN_TASK_ITEM_STATUS_TOGGLE, (payload) => {
            // console.log(payload);

            if (payload.case != 'comment') return;

            let comment = _.find(this.comments, {
                id: +payload.id
            });

            if (comment && (comment.creator.username == this.loginUser.username)) {
                let lines = comment.content.split('\n');
                // console.log(lines)
                let index = -1;
                for (var i = 0; i < lines.length; i++) {

                    // console.log(lines[i])

                    if (/^\- \s*\[[x ]\]\s*/.test(lines[i])) {
                        if (++index == payload.index) {
                            if (/^\- \s*\[[x]\]\s*/.test(lines[i])) {
                                lines[i] = lines[i].replace(/^\- \s*\[[x]\]/, `- [ ]`);
                                // console.log('==' + lines[i])
                            } else if (/^\- \s*\[[ ]\]\s*/.test(lines[i])) {
                                lines[i] = lines[i].replace(/^\- \s*\[[ ]\]/, `- [x]`);
                                // console.log('==' + lines[i])
                            }

                            break;

                        }
                    }
                }

                this.sending = true;

                comment.contentOld = comment.content;
                comment.content = lines.join('\n');

                var html = utils.md2html(comment.content, true);
                // var htmlOld = utils.md2html(comment.contentOld, true);

                let users = [nsCtx.memberAll, ...(window.tmsUsers ? tmsUsers : [])];

                let channel = this.blog.space ? this.blog.space.channel : null;

                $.post(`/admin/blog/comment/update`, {
                    basePath: utils.getBasePath(),
                    id: this.blog.id,
                    cid: comment.id,
                    version: comment.version,
                    users: utils.parseUsernames(comment.content, users, channel).join(','),
                    content: comment.content,
                    contentHtml: html,
                    diff: utils.diffS(comment.contentOld, comment.content),
                }, (data, textStatus, xhr) => {
                    if (data.success) {
                        toastr.success('博文评论更新成功!');
                        // comment.isEditing = false;
                        comment.version = data.data.version;
                        comment.updateDate = data.data.updateDate;
                    } else {
                        toastr.error(data.data, '博文评论更新失败!');
                    }
                }).always(() => {
                    this.sending = false;
                });

            } else {
                payload.event && payload.event.preventDefault();
                toastr.warning(`更新权限不足!`);
            }

        });

        this.subscribe3 = ea.subscribe(nsCons.EVENT_WS_BLOG_COMMENT_UPDATE, (payload) => {

            if (this.blog.id != payload.bid) return;

            if (payload.cmd == 'U') { // 博文评论后台更新了

                $.get('/admin/blog/comment/get', {
                    cid: payload.id
                }, (data) => {
                    if (data.success) {

                        let c = _.find(this.comments, {
                            id: payload.id
                        });

                        if (c) { // 存在，更新它
                            _.extend(c, data.data);
                        } else { // 不存在，添加
                            this.comments.push(data.data);
                        }
                    }
                });
            } else {

                if (payload.username == this.loginUser.username) return;

                let c = _.find(this.comments, {
                    id: payload.id
                });
                if (c) {
                    $.get('/admin/blog/comment/get', {
                        cid: payload.id
                    }, (data) => {
                        if (data.success) {
                            c.labels = data.data.labels;

                            let t = toastr.info(`当前博文评论标签有更新，点击可查看！`, null, _.extend(toastrOps, {
                                onclick: () => {
                                    this._scrollTo(payload.id);
                                }
                            }));
                        }
                    });
                }
            }
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

    _refresh() {
        if (!this.blog) {
            return;
        }
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
                ea.publish(nsCons.EVENT_BLOG_COMMENT_CHANGED, {
                    action: 'query',
                    comments: this.comments
                });
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

        this.blogCommentMeHandler = (event) => {

            event.preventDefault();
            let target = event.currentTarget;
            let cid = utils.urlQuery('cid', $(target).attr('href'));

            if (this.hoverTimeoutRef) {
                if (this.hoverUserTarget === target) {
                    return;
                } else {
                    clearTimeout(this.hoverTimeoutRef);
                    this.hoverTimeoutRef = null;
                }
            }
            this.hoverUserTarget = target;

            this.hoverTimeoutRef = setTimeout(() => {
                cid && ea.publish(nsCons.EVENT_BLOG_COMMENT_POPUP_SHOW, {
                    id: cid,
                    target: target
                });
                this.hoverTimeoutRef = null;
            }, 500);

        };

        this.blogCommentMlHandler = (event) => {
            event.preventDefault();
            if (this.hoverTimeoutRef) {
                if (this.hoverUserTarget === event.currentTarget) {
                    clearTimeout(this.hoverTimeoutRef);
                    this.hoverTimeoutRef = null;
                }
            }
        };

        // 消息popup
        $('.em-blog-comment .comments').on('mouseenter', '.markdown-body a[href*="#/blog/"]:not(.pp-not)', this.blogCommentMeHandler);
        $('.em-blog-comment .comments').on('mouseleave', '.markdown-body a[href*="#/blog/"]:not(.pp-not)', this.blogCommentMlHandler);

        this.commentsDblHandler = (event) => {
            if (event.ctrlKey && event.shiftKey) {
                let cid = $(event.currentTarget).attr('data-id');
                let $t = $(event.currentTarget).find('.content > textarea');
                let item = _.find(this.comments, {
                    id: +cid
                });
                if (this.isSuper || item.creator.username == this.loginUser.username) {
                    this.editHandler(item, $t);
                }
            }
        };

        this.commentsClHandler = (event) => {
            this.focusedComment = $(event.currentTarget);
        };

        $('.em-blog-comment .comments').on('dblclick', '.comment', this.commentsDblHandler);
        $('.em-blog-comment .comments').on('click', '.comment', this.commentsClHandler);

        this.initHotkeys();
    }

    initHotkeys() {

        this.kdRHandler = (evt) => { // reply
            evt.preventDefault();
            $('.em-blog-content').scrollTo(`max`, 120, {
                offset: 0
            });
            this.simplemde.codemirror.focus();
        };

        this.kdAltUpHandler = (evt) => { // comment pre
            evt.preventDefault();
            $('.em-blog-content').scrollTo(this.getScrollTargetComment(true), 120, {
                offset: 0
            });
        };

        this.kdAltDownHandler = (evt) => { // comment next
            evt.preventDefault();
            $('.em-blog-content').scrollTo(this.getScrollTargetComment(), 120, {
                offset: 0
            });
        };

        $(document).bind('keydown', 'r', this.kdRHandler).bind('keydown', 'alt+up', this.kdAltUpHandler).bind('keydown', 'alt+down', this.kdAltDownHandler);

    }

    getScrollTargetComment(isPrev) {
        if (isPrev) {
            if (this.focusedComment && this.focusedComment.size() === 1) {
                let $avatar = this.focusedComment.find('> a.em-user-avatar');
                if (utils.isElementInViewport($avatar)) {
                    let prev = this.focusedComment.prev('.comment');
                    (prev.size() === 1) && (this.focusedComment = prev);
                }
            } else {
                this.focusedComment = $(this.blogCommentsRef).children('.comment:first');
            }
        } else {
            if (this.focusedComment && this.focusedComment.size() === 1) {
                let next = this.focusedComment.next('.comment');
                (next.size() === 1) && (this.focusedComment = next);
            } else {
                this.focusedComment = $(this.blogCommentsRef).children('.comment:last');
            }
        }
        return this.focusedComment;
    }

    _init() {
        this.simplemde = new SimpleMDE({
            element: this.commentRef,
            spellChecker: false,
            status: false,
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
                },
                // {
                //     name: "side-by-side",
                //     action: SimpleMDE.toggleSideBySide,
                //     className: "fa fa-columns no-disable no-mobile",
                //     title: "实时预览",
                // }, {
                //     name: "fullscreen",
                //     action: SimpleMDE.toggleFullScreen,
                //     className: "fa fa-arrows-alt no-disable no-mobile",
                //     title: "全屏",
                // }, 
                {
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

        this.editKeyHandler = (cm, e) => {
            if (e.ctrlKey && e.keyCode == 13) { // Ctrl+Enter
                this.addHandler();
            } else if (e.keyCode == 27) { // Esc
                this.simplemde.value('');
            }
        };

        this.simplemde.codemirror.on('keyup', this.editKeyHandler);

        this.$chatMsgInputRef = $(this.markdownRef).find('.CodeMirror textarea');
        if (this.$chatMsgInputRef.size() === 0) {
            this.$chatMsgInputRef = $(this.markdownRef).find('.CodeMirror [contenteditable="true"]');
        }

        this.initPaste();

        this.initTextcomplete();

        this.initUploadDropzone($('.CodeMirror-wrap', this.markdownRef), () => {
            return this.$chatMsgInputRef
        }, false);

        this.initUploadDropzone($('.editor-toolbar .fa.fa-upload', this.markdownRef), () => {
            return this.$chatMsgInputRef
        }, true);

        this.initCsvDropzone();

    }

    initCsvDropzone() {

        let _this = this;

        $($('.editor-toolbar .fa.fa-file-excel-o', this.markdownRef)).dropzone({
            url: "/admin/file/csv2md",
            paramName: 'file',
            clickable: true,
            dictDefaultMessage: '',
            maxFilesize: 10,
            acceptedFiles: '.csv,.xls,.xlsx',
            addRemoveLinks: true,
            previewsContainer: '.em-blog-comment .dropzone-previews',
            previewTemplate: $('.em-blog-comment .preview-template')[0].innerHTML,
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

                let channel = this.blog.space ? this.blog.space.channel : null;

                let users = $.map(nsCtx.users, (member) => {
                    return (member.enabled && member.username.indexOf(term) >= 0) ? member : null;
                });
                let groups = $.map(channel ? channel.channelGroups : [], (grp) => {
                    return ((grp.status != 'Deleted') && grp.name.indexOf(term) >= 0) ? grp : null;
                });
                callback([...users, ...groups]);
            },
            template: (value, term) => {
                // let user = _.find(nsCtx.users, { username: value });
                // return `${user.name ? user.name : user.username} - ${user.mails} (${user.username})`;

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

                // cm.replaceRange(txt.replace(/@(\w*)$/, `{~${value}} `), {
                //     line: cursor.line,
                //     ch: 0
                // }, cursor);

                cm.replaceRange(txt.replace(/@(\w*)$/, `{${value.username ? '' : '!'}~${value.username ? value.username : value.name}} `), {
                    line: cursor.line,
                    ch: 0
                }, cursor);

                // console.log(txt);
                // return `$1{~${value}}`;
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
            appendTo: '.tms-blog-comment-status-bar',
            // maxCount: nsCons.NUM_TEXT_COMPLETE_MAX_COUNT
        });

        this.simplemde.codemirror.on('keydown', (cm, e) => {
            if (_.includes([13, 38, 40], e.keyCode) && this.isTipsShow()) { // enter | up | down
                e.preventDefault();
            }
        });
    }

    isTipsShow() {
        return $('.tms-blog-comment-status-bar').find('.textcomplete-dropdown:visible').size() === 1;
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

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this._reset();
    }

    _reset() {
        this.blog = null;

        if (this.simplemde) {
            this.simplemde.value('');
            this.simplemde.toTextArea();
            this.simplemde = null;
        }
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

    replyHandler(item) {
        this.insertContent(`[[回复评论#${item.id}](${this.baseUrl}?cid=${item.id}){~${item.creator.username}}]\n\n`);
        this._scrollTo('b');
    }

    removeHandler(item) {
        $.post('/admin/blog/comment/remove', {
            cid: item.id
        }, (data, textStatus, xhr) => {
            if (data.success) {
                this.comments = _.reject(this.comments, {
                    id: item.id
                });
                toastr.success('博文评论移除成功!');
                ea.publish(nsCons.EVENT_BLOG_COMMENT_CHANGED, {
                    action: 'removed',
                    comments: this.comments
                });
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

        var html = utils.md2html(content, true);
        let users = [nsCtx.memberAll, ...(window.tmsUsers ? tmsUsers : [])];

        let channel = this.blog.space ? this.blog.space.channel : null;

        $.post(`/admin/blog/comment/create`, {
            basePath: utils.getBasePath(),
            id: this.blog.id,
            users: utils.parseUsernames(content, users, channel).join(','),
            content: content,
            contentHtml: html
        }, (data, textStatus, xhr) => {
            if (data.success) {
                this._addComment(data.data);
                this.simplemde.value('');
            } else {
                toastr.error(data.data, '博文评论提交失败!');
            }
        }).always(() => {
            this.sending = false;
        });
    }

    _addComment(comment) {
        this.comments = [...this.comments, comment];
        this.scrollToAfterImgLoaded('b');
        toastr.success('博文评论提交成功!');
        ea.publish(nsCons.EVENT_BLOG_COMMENT_ADDED, {});
        ea.publish(nsCons.EVENT_BLOG_COMMENT_CHANGED, {
            action: 'created',
            comments: this.comments
        });
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
                    toType: 'Blog'
                }, (data, textStatus, xhr) => {
                    if (data.success) {
                        this.insertContent('![{name}]({baseURL}{path}{uuidName}?width=100)'
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
            init: function () {
                this.on("sending", function (file, xhr, formData) {
                    if (!getInputTargetCb()) {
                        this.removeAllFiles(true);
                    } else {
                        formData.append('toType', 'Blog');
                    }
                });
                this.on("success", function (file, data) {
                    if (data.success) {

                        $.each(data.data, function (index, item) {
                            if (item.type == 'Image') {
                                _this.insertContent('![{name}]({baseURL}{path}{uuidName}?width=100) '
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
                this.on("error", function (file, errorMessage, xhr) {
                    toastr.error(errorMessage, '上传失败!');
                });
                this.on("complete", function (file) {
                    this.removeFile(file);
                });
            }
        });
    }

    scrollToAfterImgLoaded(to) {
        _.defer(() => {
            ($('.em-blog-content').length > 0) && new ImagesLoaded($('.em-blog-content')[0]).always(() => {
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
            if (_.some(this.comments, {
                    id: +to
                })) {
                $('.em-blog-content').scrollTo(`.tms-blog-comment.comment[data-id="${to}"]`, {
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

    editHandler(item, editTxtRef) {

        if (item.editor == 'Html') {
            $(`.em-blog-write-html > iframe`).attr('src', utils.getResourceBase() + 'blog.html?comment&cid=' + item.id + '&id=' + this.blog.id + '&_=' + new Date().getTime());
            $('a[href="#modaal-blog-write-html"]').click();
        } else if (item.editor == 'Excel') {
            $(`.em-blog-write-excel > iframe`).attr('src', utils.getResourceBase() + 'excel.html?comment&cid=' + item.id + '&id=' + this.blog.id + '&_=' + new Date().getTime());
            $('a[href="#modaal-blog-write-excel"]').click();
        } else if (item.editor == 'Mind') {
            $(`.em-blog-write-mind > iframe`).attr('src', utils.getResourceBase() + 'mind.html?comment&cid=' + item.id + '&id=' + this.blog.id + '&_=' + new Date().getTime());
            $('a[href="#modaal-blog-write-mind"]').click();
        } else {

            $.get(`/admin/blog/comment/get`, {
                cid: item.id
            }, (data) => {
                if (data.success) {
                    if (item.version != data.data.version) {
                        _.extend(item, data.data);
                    }
                    item.isEditing = true;
                    item.contentOld = item.content;
                    _.defer(() => {
                        $(editTxtRef).focus().select();
                        autosize.update(editTxtRef);
                    });
                } else {
                    toastr.error(data.data);
                }

            });
        }
    }

    refreshHandler(item) {
        $.get('/admin/blog/comment/get', {
            cid: item.id
        }, (data) => {
            if (item.version != data.data.version) {
                _.extend(item, data.data);
                toastr.success('刷新同步成功!');
            } else {
                toastr.info('博文评论内容暂无变更!');
            }
        });
    }

    eidtKeydownHandler(evt, item, txtRef) {

        if (this.sending) {
            return false;
        }

        if (evt.ctrlKey && evt.keyCode === 13) {

            this.editSave(item, txtRef);

            return false;
        } else if (evt.ctrlKey && evt.keyCode === 85) {
            $(txtRef).next('.tms-blog-comment-edit-actions').find('.upload').click();
            return false;
        } else if (evt.keyCode === 27) {
            this.editCancelHandler(evt, item, txtRef);
        }

        return true;
    }

    editOkHandler(evt, item, txtRef) {
        this.editSave(item, txtRef);
        item.isEditing = false;
    }

    editCancelHandler(evt, item, txtRef) {
        item.content = item.contentOld;
        $(txtRef).val(item.content);
        item.isEditing = false;
    }

    editSave(item, txtRef) {

        this.sending = true;

        item.content = $(txtRef).val();

        var html = utils.md2html(item.content, true);
        var htmlOld = utils.md2html(item.contentOld, true);

        let users = [nsCtx.memberAll, ...(window.tmsUsers ? tmsUsers : [])];

        let channel = this.blog.space ? this.blog.space.channel : null;

        $.post(`/admin/blog/comment/update`, {
            basePath: utils.getBasePath(),
            id: this.blog.id,
            cid: item.id,
            version: item.version,
            users: utils.parseUsernames(item.content, users, channel).join(','),
            content: item.content,
            contentHtml: html,
            diff: utils.diffS(item.contentOld, item.content),
        }, (data, textStatus, xhr) => {
            if (data.success) {
                toastr.success('博文评论更新成功!');
                item.isEditing = false;
                item.version = data.data.version;
                item.updateDate = data.data.updateDate;
            } else {
                toastr.error(data.data, '博文评论更新失败!');
            }
        }).always(() => {
            this.sending = false;
        });
    }

    isZanDone(comment) {
        let voteZan = comment.voteZan;
        if (!voteZan) {
            return false;
        }

        return voteZan.split(',').includes(this.loginUser.username);
    }

    rateHandler(item) {
        $.post('/admin/blog/comment/vote', {
            cid: item.id,
            url: utils.getBasePath(),
            contentHtml: utils.md2html(item.content, true),
            type: this.isZanDone(item) ? 'Cai' : 'Zan'
        }, (data, textStatus, xhr) => {
            if (data.success) {
                _.extend(item, data.data);
            } else {
                toastr.error(data.data, '博文投票失败!');
            }
        });

    }

    gotoTopHandler() {
        $('.em-blog-content').scrollTo(0, 120);
    }

    commentEditorHandler(editor) {
        if (editor == 'html') {
            $('.em-blog-write-html > iframe').attr('src', utils.getResourceBase() + 'blog.html?comment&id=' + this.blog.id + '&_=' + new Date().getTime());
            $('a[href="#modaal-blog-write-html"]').click();
        } else if (editor == 'excel') {
            $('.em-blog-write-excel > iframe').attr('src', utils.getResourceBase() + 'excel.html?comment&id=' + this.blog.id + '&_=' + new Date().getTime());
            $('a[href="#modaal-blog-write-excel"]').click();
        } else if (editor == 'mind') {
            $('.em-blog-write-mind > iframe').attr('src', utils.getResourceBase() + 'mind.html?comment&id=' + this.blog.id + '&_=' + new Date().getTime());
            $('a[href="#modaal-blog-write-mind"]').click();
        }
    }

    addComment(comment) {
        this._addComment(comment);
    }

    updateComment(comment) {

        let cmmt = _.find(this.comments, {
            id: comment.id
        });

        if (cmmt) {
            cmmt.content = comment.content;
            cmmt.version = comment.version;
            cmmt.updateDate = comment.updateDate;
        }
    }

    mind2table(node, table, col) {

        if (node && node.topic) {
            let row = [];
            for (let index = 0; index < col; index++) {
                row.push('');
            }
            row.push(node.topic);
            table.push(row);

            if (node.children) {
                col++;
                _.each(node.children, c => {
                    this.mind2table(c, table, col);
                });
            }
        }
    }

    excelDownloadHandler(item) {

        if (item.editor == 'Excel') {
            utils.downloadExcel(JSON.parse(item.content), `${this.blog.title}_评论_${item.id}`);
        } else if (item.editor == 'Mind') {
            let mdata = JSON.parse(item.content);

            let table = [];
            this.mind2table(mdata.nodeData, table, 0);

            if (table.length == 0) return;

            let sheet = XLSX.utils.aoa_to_sheet(table);
            var out = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(out, sheet, `data`);
            XLSX.writeFile(out, `${this.blog.title}_评论_${item.id}.xlsx`);
        }

    }

    pngDownloadHandler(item) {
        let ifrm = $(`.em-blog-mind[data-cid="${item.id}"] > iframe`)[0];
        if (ifrm) {
            (ifrm.contentWindow.postMessage) && (ifrm.contentWindow
                .postMessage({
                    action: 'mindExport',
                    source: 'commentMind',
                    item: item
                }, window.location.origin));
        }
    }

    md2HtmlDownloadHandler(item) {

        $.post(`/admin/blog/comment/download/md2html/${item.id}`, {
            content: utils.md2html(`> 版权声明：本文为TMS版权所有，转载请附上原文出处链接和本声明。\n> 本文链接: ${utils.getBasePath()}#/blog/${this.blog.id}?cid=${item.id}&tilte=${this.blog._encodeTitle}_评论_${item.id}\n\n` + item.content)
        }, (data, textStatus, xhr) => {
            if (data.success) {
                utils.openWin(`/admin/blog/comment/download/${item.id}?type=md2html`);
            } else {
                toastr.error(data.data);
            }
        });

    }

}
