import {
    bindable,
    containerless
} from 'aurelia-framework';
import {
    default as clipboard
} from 'clipboard-js';
import {
    default as Clipboard
} from 'clipboard';

import toastrOps from 'common/common-toastr';

@containerless
export class EmBlogContent {

    blog;

    loginUser;
    isSuper;
    isAdmin;

    bind() {
        this.loginUser = nsCtx.loginUser;
        this.isSuper = nsCtx.isSuper;
        this.isAdmin = nsCtx.isAdmin;
    }

    /**
     * 构造函数
     */
    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_BLOG_SWITCH, (payload) => {
            this.getBlog();
            ea.publish(nsCons.EVENT_BLOG_RIGHT_SIDEBAR_TOGGLE, {
                isHide: true
            });
        });
        this.subscribe2 = ea.subscribe(nsCons.EVENT_BLOG_CHANGED, (payload) => {
            if (payload.action == 'updated') {

                if (!payload.blog.dir) this.blog.dir = null;

                _.extend(this.blog, payload.blog);

                _.defer(() => this.catalogHandler(true));

                if (this.loginUser.username != this.blog.creator.username && !this.blogFollower && payload.autoFollow) {
                    this.getFollower();
                    toastr.info(`已为您自动关注该编辑博文，可手动取消关注！`);
                }
            }
        });
        this.subscribe3 = ea.subscribe(nsCons.EVENT_BLOG_COMMENT_ADDED, (payload) => {
            if (!this.blogFollower) {
                this.getFollower();
            }
        });
        this.subscribe4 = ea.subscribe(nsCons.EVENT_BLOG_COMMENT_CHANGED, (payload) => {
            this.comments = payload.comments;
        });
        this.subscribe5 = ea.subscribe(nsCons.EVENT_WS_BLOG_UPDATE, (payload) => {
            if (payload.username != this.loginUser.username) {

                if (payload.cmd != 'U') {
                    let alarm = utils.getAlarm();
                    (!alarm.off && alarm.audio) && ea.publish(nsCons.EVENT_AUDIO_ALERT, {});
                }

                if (payload.cmd == 'At') {
                    if (!this.blog || payload.id != this.blog.id) {
                        let t = toastr.info(`博文【${payload.title}】有提及到你，点击可查看！`, null, _.extend(toastrOps, {
                            onclick: () => {
                                this._delBlogNews(payload.nid);
                                utils.openUrl(utils.getBasePath() + '#/blog/' + payload.id);
                                // toastr.clear(t);
                            }
                        }));
                        t && t.attr({
                            'data-id': payload.nid,
                            'data-type': 'blog'
                        });
                    }
                } else if (payload.cmd == 'OU') {
                    if (!this.blog || payload.id != this.blog.id) {
                        let t = toastr.info(`您的博文【${payload.title}】有更新，点击可查看！`, null, _.extend(toastrOps, {
                            onclick: () => {
                                this._delBlogNews(payload.nid);
                                utils.openUrl(utils.getBasePath() + '#/blog/' + payload.id);
                            }
                        }));
                        t && t.attr({
                            'data-id': payload.nid,
                            'data-type': 'blog'
                        });
                    }
                } else if (payload.cmd == 'U') {
                    if (this.blog && (payload.id == this.blog.id)) {
                        let t = toastr.info(`当前博文有更新，点击可更新查看！`, null, _.extend(toastrOps, {
                            onclick: () => {
                                this._delBlogNews(payload.nid);
                                this.refreshHandler(payload.id);
                            }
                        }));
                        t && t.attr({
                            'data-id': payload.nid,
                            'data-type': 'blog'
                        });
                    }
                } else if (payload.cmd == 'F') {
                    if (!this.blog || payload.id != this.blog.id) {
                        let t = toastr.info(`您关注的博文【${payload.title}】有更新，点击可查看！`, null, _.extend(toastrOps, {
                            onclick: () => {
                                this._delBlogNews(payload.nid);
                                utils.openUrl(utils.getBasePath() + '#/blog/' + payload.id);
                            }
                        }));
                        t && t.attr({
                            'data-id': payload.nid,
                            'data-type': 'blog'
                        });
                    }
                } else if (payload.cmd == 'CAt') {
                    let t = toastr.info(`博文【${payload.title}】有评论提及到你，点击可查看！`, null, _.extend(toastrOps, {
                        onclick: () => {
                            this._delBlogNews(payload.nid);
                            if (!this.blog || payload.id != this.blog.id) {
                                utils.openUrl(utils.getBasePath() + '#/blog/' + payload.id + '?cid=' + payload.cid);
                            } else {
                                this.refreshHandler();
                            }
                        }
                    }));
                    t && t.attr({
                        'data-id': payload.nid,
                        'data-type': 'blog'
                    });
                } else if (payload.cmd == 'FCC') {
                    let t = toastr.info(`您关注的博文【${payload.title}】有新的评论，点击可查看！`, null, _.extend(toastrOps, {
                        onclick: () => {
                            this._delBlogNews(payload.nid);
                            if (!this.blog || payload.id != this.blog.id) {
                                utils.openUrl(utils.getBasePath() + '#/blog/' + payload.id + '?cid=' + payload.cid);
                            } else {
                                this.refreshHandler();
                            }
                        }
                    }));
                    t && t.attr({
                        'data-id': payload.nid,
                        'data-type': 'blog'
                    });
                } else if (payload.cmd == 'FCU') {
                    let t = toastr.info(`您关注的博文【${payload.title}】评论有更新，点击可查看！`, null, _.extend(toastrOps, {
                        onclick: () => {
                            this._delBlogNews(payload.nid);
                            if (!this.blog || payload.id != this.blog.id) {
                                utils.openUrl(utils.getBasePath() + '#/blog/' + payload.id + '?cid=' + payload.cid);
                            } else {
                                this.refreshHandler();
                            }
                        }
                    }));
                    t && t.attr({
                        'data-id': payload.nid,
                        'data-type': 'blog'
                    });
                } else if (payload.cmd == 'CC') {
                    let t = toastr.info(`您的博文【${payload.title}】有新的评论，点击可查看！`, null, _.extend(toastrOps, {
                        onclick: () => {
                            this._delBlogNews(payload.nid);
                            if (!this.blog || payload.id != this.blog.id) {
                                utils.openUrl(utils.getBasePath() + '#/blog/' + payload.id + '?cid=' + payload.cid);
                            } else {
                                this.refreshHandler();
                            }
                        }
                    }));
                    t && t.attr({
                        'data-id': payload.nid,
                        'data-type': 'blog'
                    });
                } else if (payload.cmd == 'CU') {
                    let t = toastr.info(`您的博文【${payload.title}】评论有更新，点击可查看！`, null, _.extend(toastrOps, {
                        onclick: () => {
                            this._delBlogNews(payload.nid);
                            if (!this.blog || payload.id != this.blog.id) {
                                utils.openUrl(utils.getBasePath() + '#/blog/' + payload.id + '?cid=' + payload.cid);
                            } else {
                                this.refreshHandler();
                            }
                        }
                    }));
                    t && t.attr({
                        'data-id': payload.nid,
                        'data-type': 'blog'
                    });
                } else if (payload.cmd == 'Open') {
                    let nid = new Date().getTime();
                    let t = toastr.info(`博文【${payload.title}】${payload.openEdit ? '开放了' : '关闭了'}编辑权限，点击可查看！`, null, _.extend(toastrOps, {
                        onclick: () => {
                            toastr.clear($(`[data-id="${nid}"]`));
                            if (!this.blog || payload.id != this.blog.id) {
                                utils.openUrl(utils.getBasePath() + '#/blog/' + payload.id);
                            } else {
                                this.refreshHandler();
                            }
                        }
                    }));
                    t && t.attr({
                        'data-id': nid,
                        'data-type': 'blog'
                    });
                }

            } else {
                // if (payload.cmd == 'U') {
                //     if (this.blog && (payload.id == this.blog.id) && (payload.version != this.blog.version) && (this.blog.editor == 'Html')) {
                //         this.refreshHandler();
                //     }
                // }
            }
        });

        this.subscribe6 = ea.subscribe(nsCons.EVENT_MARKDOWN_TASK_ITEM_STATUS_TOGGLE, (payload) => {
            // console.log(payload);

            if (payload.case != 'blog') return;

            if (this.blog && (this.blog.creator.username == this.loginUser.username || this.blog.openEdit || this.isSuper)) {

                if (this.blog.locker) {
                    payload.event && payload.event.preventDefault();
                    toastr.info(`当前博文处于编辑中，请稍后再试...`);
                    return;
                }

                let lines = this.blog.content.split('\n');
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

                if (this.sending) return;

                this.sending = true;

                let content = lines.join('\n');

                // var html = utils.md2html(content, true);
                let users = [nsCtx.memberAll, ...(window.tmsUsers ? tmsUsers : [])];

                let channel = this.blog.space ? this.blog.space.channel : null;

                $.post('/admin/blog/update', {
                    url: utils.getBasePath(),
                    id: this.blog.id,
                    version: this.blog.version,
                    usernames: utils.parseUsernames(content, users, channel).join(','),
                    title: this.blog.title,
                    content: content,
                    diff: utils.diffS(this.blog.content, content)
                }, (data, textStatus, xhr) => {
                    if (data.success) {
                        this.blog = data.data;
                        toastr.success('博文更新成功!');
                        ea.publish(nsCons.EVENT_BLOG_CHANGED, {
                            action: 'updated',
                            autoFollow: true,
                            blog: this.blog
                        });
                    } else {
                        toastr.error(data.data, '博文更新失败!');
                    }
                }).always(() => {
                    this.sending = false;
                });

            } else {
                payload.event && payload.event.preventDefault();
                toastr.warning(`更新权限不足!`);
            }

        });

        this.subscribe7 = ea.subscribe(nsCons.EVENT_TOASTR_CLOSE, (payload) => {

            if (payload.type == 'chat') {
                // this._delChatNews(payload.id);
            } else if (payload.type == 'blog') {
                this._delBlogNews(payload.id);
            }

        });

        this.subscribe8 = ea.subscribe(nsCons.EVENT_WS_BLOG_LOCK, (payload) => {

            if (payload.blogId != this.blog.id) return;

            if (payload.cmd == 'LOCK') {
                if (!this.blog.locker) {
                    this.blog.locker = {
                        username: payload.locker,
                        name: payload.name
                    };
                    this.blog.lockDate = new Date();

                    (payload.locker != this.loginUser.username) && toastr.info(`${payload.name ? payload.name : payload.locker} 开始编辑中,请等待...`);
                }

            } else if (payload.cmd == 'UNLOCK') {
                if (this.blog.locker) {

                    (payload.locker != this.loginUser.username) && toastr.info(`${this.blog.locker.name ? this.blog.locker.name : payload.locker} 完成了编辑,请知悉...`);

                    this.blog.locker = null;
                    this.blog.lockDate = null;

                }
            }

        });

        this.throttleCreateHandler = _.throttle(() => {
            this.createHandler()
        }, 1000, {
            'trailing': false
        });
        this.throttleEditHandler = _.throttle(() => {
            this.editHandler()
        }, 1000, {
            'trailing': false
        });
        this.throttleCopyHandler = _.throttle(() => {
            this.copyHandler()
        }, 1000, {
            'trailing': false
        });
    }

    _delBlogNews(id) {

        if (!id) return;

        $.post('/admin/blog/news/delete', {
            id: id
        }, (data, textStatus, xhr) => {
            if (data.success) {}
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
        this.subscribe6.dispose();
        this.subscribe7.dispose();
        this.subscribe8.dispose();
    }

    detached() {
        window.__debug && console.log('EmBlogContent--detached');

        this.blog = null;
        this.loginUser = null;
        this.isSuper = null;
        this.isAdmin = null;

        $('.em-blog-content').off('click', 'code[data-code]', this.codeClHandler);
        $('.em-blog-content').off('click', '.pre-code-wrapper', this.preCodeClHandler);
        $('.em-blog-content').off('click', '.markdown-body input.tms-task-item', this.taskItemClHandler);
        $('.em-blog-right-sidebar').off('click', '.panel-blog-dir .wiki-dir-item', this.wikiDirClHandler);
        $(this.mkbodyRef).off('dblclick', this.mkDblHandler);
        $('.em-blog-content').off('scroll', this.blogContentScrollHandler);
        $(this.feedRef).off('mouseenter', '.event a[href*="#/blog/"]:not(.pp-not)', this.feedMeHandler);
        $(this.feedRef).off('mouseleave', '.event a[href*="#/blog/"]:not(.pp-not)', this.feedMlHandler);
        $('.tms-blog').off('mouseenter', 'span[data-value].at-user:not(.pp-not),span[data-value].at-group:not(.pp-not),a[data-value].author:not(.pp-not)', this.userInfoMeHandler);
        $('.tms-blog').off('mouseleave', 'span[data-value].at-user:not(.pp-not),span[data-value].at-group:not(.pp-not),a[data-value].author:not(.pp-not)', this.userInfoMlHandler);

        window.removeEventListener && window.removeEventListener('message', this.messageHandler, false);

        this.codeClHandler = null;
        this.preCodeClHandler = null;
        this.wikiDirClHandler = null;
        this.mkDblHandler = null;
        this.blogContentScrollHandler = null;
        this.feedMeHandler = null;
        this.feedMlHandler = null;
        this.userInfoMeHandler = null;
        this.userInfoMlHandler = null;
        this.messageHandler = null;

        try {
            $(document).unbind('keyup', this.docKuEHandler)
                .unbind('keyup', this.docKuWHandler)
                .unbind('keydown', this.docKuDHandler)
                .unbind('keydown', this.docKuSHandler)
                .unbind('keydown', this.docKuFHandler)
                .unbind('keydown', this.docKuTHandler)
                .unbind('keydown', this.docKuBHandler)
                .unbind('keydown', this.docKuAltRHandler)
                .unbind('keydown', this.docKuAltHHandler)
                .unbind('keydown', this.docKuAltLHandler)
                .unbind('keydown', this.docKuAltSHandler)
                .unbind('keydown', this.docKuAltCHandler)
                .unbind('keydown', this.docKuAltMHandler)
                .unbind('keydown', this.docKuAltOHandler)
                .unbind('keydown', this.docKuAltTHandler)
                .unbind('keydown', this.docKuAltEHandler)
                .unbind('keydown', this.docKuAltCtrlDHandler);
        } catch (err) {
            console.log(err);
        }

    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        this.getBlog();

        new Clipboard('.em-blog-content .tms-clipboard')
            .on('success', function (e) {
                toastr.success('复制到剪贴板成功!');
            }).on('error', function (e) {
                toastr.error('复制到剪贴板失败!');
            });

        this.codeClHandler = function (event) {
            if (event.ctrlKey || event.metaKey) {
                event.stopImmediatePropagation();
                event.preventDefault();
                clipboard.copy($(event.currentTarget).attr('data-code')).then(
                    () => {
                        toastr.success('复制到剪贴板成功!');
                    },
                    (err) => {
                        toastr.error('复制到剪贴板失败!');
                    }
                );
            }
        };

        this.preCodeClHandler = function (event) {
            if (event.ctrlKey || event.metaKey) {
                event.stopImmediatePropagation();
                event.preventDefault();
                clipboard.copy($(event.currentTarget).find('i[data-clipboard-text]').attr('data-clipboard-text')).then(
                    () => {
                        toastr.success('复制到剪贴板成功!');
                    },
                    (err) => {
                        toastr.error('复制到剪贴板失败!');
                    }
                );
            }
        };

        this.taskItemClHandler = (event) => {

            if (this.blog && (this.blog.creator.username == this.loginUser.username || this.blog.openEdit || this.isSuper)) {

                if (this.blog.locker) {
                    event.preventDefault();
                    toastr.info(`当前博文处于编辑中，请稍后再试...`);
                    return;
                } else {

                    let $input = $(event.currentTarget);

                    let $blog = $(this.blog.content);
                    let $inputR = $blog.find(`input[data-id="${$input.attr('data-id')}"]`);
                    $inputR.attr('checked', $input.prop('checked'));

                    if (this.sending) return;

                    this.sending = true;

                    let content = $blog.wrapAll('<div></div>').parent().html();

                    $.post('/admin/blog/update', {
                        url: utils.getBasePath(),
                        id: this.blog.id,
                        version: this.blog.version,
                        title: this.blog.title,
                        content: content
                    }, (data, textStatus, xhr) => {
                        if (data.success) {
                            this.blog = data.data;
                            toastr.success('博文更新成功!');
                            ea.publish(nsCons.EVENT_BLOG_CHANGED, {
                                action: 'updated',
                                autoFollow: true,
                                blog: this.blog
                            });
                        } else {
                            toastr.error(data.data, '博文更新失败!');
                        }
                    }).always(() => {
                        this.sending = false;
                    });
                }
            } else {
                event.preventDefault();
            }
        }

        $('.em-blog-content').on('click', 'code[data-code]', this.codeClHandler);
        $('.em-blog-content').on('click', '.pre-code-wrapper', this.preCodeClHandler);
        $('.em-blog-content').on('click', '.markdown-body input.tms-task-item', this.taskItemClHandler);

        this.wikiDirClHandler = (event) => {
            event.preventDefault();
            if ($(window).width() <= 768) {
                ea.publish(nsCons.EVENT_BLOG_RIGHT_SIDEBAR_TOGGLE, {
                    isHide: true
                });
            }
            $('.em-blog-content').scrollTo(`#${$(event.currentTarget).attr('data-id')}`, 200, {
                offset: 0
            });
        };

        $('.em-blog-right-sidebar').on('click', '.panel-blog-dir .wiki-dir-item', this.wikiDirClHandler);

        this.mkDblHandler = (event) => {
            if (event.ctrlKey && event.shiftKey) {
                if (this.blog.openEdit || this.isSuper || this.blog.creator.username == this.loginUser.username) {
                    this.editHandler();
                }
            }
        };

        $(this.mkbodyRef).on('dblclick', this.mkDblHandler);

        this.blogContentScrollHandler = _.throttle((event) => {
            try {
                let sHeight = $('.em-blog-content')[0].scrollHeight;
                let sTop = $('.em-blog-content')[0].scrollTop;

                let scale = sTop * 1.0 / (sHeight - $('.em-blog-content').outerHeight());
                this.progressWidth = $('.em-blog-content').outerWidth() * scale;

                this.fixDirItem();

            } catch (err) {
                this.progressWidth = 0;
            }

        }, 10);

        $('.em-blog-content').scroll(this.blogContentScrollHandler);

        this.feedMeHandler = (event) => {
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

        this.feedMlHandler = (event) => {
            event.preventDefault();
            if (this.hoverTimeoutRef) {
                if (this.hoverUserTarget === event.currentTarget) {
                    clearTimeout(this.hoverTimeoutRef);
                    this.hoverTimeoutRef = null;
                }
            }
        };

        // 消息popup
        $(this.feedRef).on('mouseenter', '.event a[href*="#/blog/"]:not(.pp-not)', this.feedMeHandler);
        $(this.feedRef).on('mouseleave', '.event a[href*="#/blog/"]:not(.pp-not)', this.feedMlHandler);

        this.userInfoMeHandler = (event) => {
            event.preventDefault();
            let target = event.currentTarget;

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
                ea.publish(nsCons.EVENT_CHAT_MEMBER_POPUP_SHOW, {
                    channel: (this.blog.space ? this.blog.space.channel : null),
                    username: $(target).attr('data-value'),
                    type: $(target).attr('class'),
                    target: target
                });
                this.hoverTimeoutRef = null;
            }, 500);
        };

        this.userInfoMlHandler = (event) => {
            event.preventDefault();
            if (this.hoverTimeoutRef) {
                if (this.hoverUserTarget === event.currentTarget) {
                    clearTimeout(this.hoverTimeoutRef);
                    this.hoverTimeoutRef = null;
                }
            }
        };
        // 用户信息popup
        $('.tms-blog').on('mouseenter', 'span[data-value].at-user:not(.pp-not),span[data-value].at-group:not(.pp-not),a[data-value].author:not(.pp-not)', this.userInfoMeHandler);
        $('.tms-blog').on('mouseleave', 'span[data-value].at-user:not(.pp-not),span[data-value].at-group:not(.pp-not),a[data-value].author:not(.pp-not)', this.userInfoMlHandler);

        this.initHotkeys();

        this.messageHandler = (ev) => {
            // console.info('message from parent:', ev.data);
            if (ev.origin != window.location.origin) return;

            if (ev.data.source != 'blog' && ev.data.source != 'comment') return;

            if (ev.data.action == 'created') {
                (ev.data.editor == 'html') && $('a[href="#modaal-blog-write-html"]').modaal('close');
                (ev.data.editor == 'mind') && $('a[href="#modaal-blog-write-mind"]').modaal('close');
                (ev.data.editor == 'excel') && $('a[href="#modaal-blog-write-excel"]').modaal('close');
            }

            ev.data.from = 'html';

            (ev.data.source == 'blog') && ea.publish(nsCons.EVENT_BLOG_CHANGED, ev.data);
            if (ev.data.source == 'comment') {
                this.comments = this.comments.push(ev.data.comment);
            }
        };

        window.addEventListener && window.addEventListener('message', this.messageHandler, false);
    }

    fixDirItem() {
        let fixId = null;
        let preId = null;
        _.each(this.dirItemIds, (id) => {
            if (!preId) {
                if (utils.isElementInViewport($(`#${id}`))) {
                    fixId = id;
                    return false;
                }
            } else {
                if (utils.isElementInViewport($(`#${id}`)) && !utils.isElementInViewport($(`#${preId}`))) {
                    fixId = id;
                    return false;
                }
            }
        });

        if (fixId) {
            let fixDirItem = $('.em-blog-right-sidebar .panel-blog-dir').find(`.wiki-dir-item[data-id="${fixId}"]`);
            if (fixDirItem) {
                $('.em-blog-right-sidebar .panel-blog-dir').find(`.wiki-dir-item[data-id]`).removeClass('active');
                fixDirItem.addClass('active');

                $('.em-blog-right-sidebar .scrollbar-macosx.scroll-content.scroll-scrolly_visible').scrollTo(fixDirItem, 10, {
                    offset: -120
                });
            }
        }
    }

    initHotkeys() {


        this.docKuEHandler = (evt) => { // edit
            evt.preventDefault();
            if (this.blog.openEdit || this.isSuper || this.blog.creator.username == this.loginUser.username) {
                this.throttleEditHandler();
            }
        };
        this.docKuWHandler = (evt) => { // create
            evt.preventDefault();
            this.throttleCreateHandler();
        };
        this.docKuDHandler = (evt) => { // dir
            evt.preventDefault();
            if (this.dir) {
                this.catalogHandler();
            }
        };
        this.docKuSHandler = (evt) => { // share
            evt.preventDefault();
            this.blogShareVm.show();
        };
        this.docKuFHandler = (evt) => { // follow
            evt.preventDefault();
            this.followerHandler();
        };
        this.docKuTHandler = (event) => { // scroll top
            event.preventDefault();
            $('.em-blog-content').scrollTo(0, 200, {
                offset: 0
            });
        };
        this.docKuBHandler = (event) => { // scroll bottom
            event.preventDefault();
            $('.em-blog-content').scrollTo(`max`, 200, {
                offset: 0
            });
        };
        this.docKuAltRHandler = (event) => { // refresh
            event.preventDefault();
            this.refreshHandler();
        };
        this.docKuAltHHandler = (event) => { // history
            event.preventDefault();
            this.historyHandler();
        };
        this.docKuAltLHandler = (event) => { // auth
            event.preventDefault();
            this.authHandler();
        };
        this.docKuAltSHandler = (event) => { // stow
            event.preventDefault();
            this.stowHandler();
        };
        this.docKuAltCHandler = (event) => { // copy
            event.preventDefault();
            this.throttleCopyHandler();
        };
        this.docKuAltMHandler = (event) => { // move space
            event.preventDefault();
            this.updateSpaceHandler();
        };
        this.docKuAltOHandler = (event) => { // open edit
            event.preventDefault();
            this.openEditHandler();
        };
        this.docKuAltTHandler = (event) => { // tpl edit
            event.preventDefault();
            this.tplEditHandler();
        };
        this.docKuAltEHandler = (event) => { // change editor
            event.preventDefault();
            this.changeEditorHandler();
        };
        this.docKuAltCtrlDHandler = (event) => { // delete
            event.preventDefault();
            this.deleteHandler();
        };

        try {
            $(document).bind('keyup', 'e', this.docKuEHandler)
                .bind('keyup', 'w', this.docKuWHandler)
                .bind('keydown', 'd', this.docKuDHandler)
                .bind('keydown', 's', this.docKuSHandler)
                .bind('keydown', 'f', this.docKuFHandler)
                .bind('keydown', 't', this.docKuTHandler)
                .bind('keydown', 'b', this.docKuBHandler)
                .bind('keydown', 'alt+r', this.docKuAltRHandler)
                .bind('keydown', 'alt+h', this.docKuAltHHandler)
                .bind('keydown', 'alt+l', this.docKuAltLHandler)
                .bind('keydown', 'alt+s', this.docKuAltSHandler)
                .bind('keydown', 'alt+c', this.docKuAltCHandler)
                .bind('keydown', 'alt+m', this.docKuAltMHandler)
                .bind('keydown', 'alt+o', this.docKuAltOHandler)
                .bind('keydown', 'alt+t', this.docKuAltTHandler)
                .bind('keydown', 'alt+e', this.docKuAltEHandler)
                .bind('keydown', 'alt+ctrl+d', this.docKuAltCtrlDHandler);
        } catch (err) {
            console.log(err);
        }

    }

    _dir() {
        this.dir = utils.dir($(this.mkbodyRef), 'tms-blog-dir-item-');
        this.dirItemIds = [];
        if (this.dir) {
            $(this.dir).find('a.item.wiki-dir-item').each((index, el) => {
                this.dirItemIds.push($(el).attr('data-id'));
            });
        }
        return this.dir;
    }

    getMyLog() {
        this.ajaxS = $.get('/admin/blog/log/my', (data) => {
            if (data.success) {
                // this.logs = _.reverse(data.data);
                this.logs = data.data;
                this.hasNoMoreFeeds = _.isEmpty(data.data);
            } else {
                toastr.error(data.data);
            }
        });
    }

    getBlog(id) {

        if (id) {
            nsCtx.blogId = id;
        }

        this.progressWidth = 0;
        if (!nsCtx.blogId || isNaN(new Number(nsCtx.blogId))) {
            this.blog = null;
            this.getMyLog();
            return;
        }

        this.getStow();
        this.getFollower();

        return $.get('/admin/blog/get', {
            id: nsCtx.blogId
        }, (data) => {
            if (data.success) {
                this.blog = data.data;
                this.blog._openTime = new Date().getTime()

                ea.publish(nsCons.EVENT_BLOG_VIEW_CHANGED, this.blog);
                _.defer(() => this.catalogHandler(true));
                this.getMyTags();

            } else {
                toastr.error(data.data, "获取博文失败!");
            }
        });
    }

    getMyTags() {
        $.get('/admin/blog/tag/my', (data) => {
            let tags = [];
            if (data.success) {
                tags = data.data;
            }
            this.tags = _.unionBy(tags, this.blog.tags, 'name');

            _.defer(() => {
                let tags = _.map(this.blog.tags, "name");
                $(this.tagsRef).dropdown({}).dropdown('clear').dropdown('set selected', tags).dropdown({
                    allowAdditions: true,
                    onAdd: (addedValue, addedText, $addedChoice) => {
                        $.post('/admin/blog/tag/add', {
                            id: this.blog.id,
                            tags: addedValue
                        }, (data, textStatus, xhr) => {
                            if (data.success) {
                                toastr.success('添加标签成功!');
                            } else {
                                toastr.error(data.data, '添加标签失败!');
                            }
                        });
                    },
                    onLabelRemove: (removedValue) => {
                        $.post('/admin/blog/tag/remove', {
                            id: this.blog.id,
                            tags: removedValue
                        }, (data, textStatus, xhr) => {
                            if (data.success) {
                                toastr.success('移除标签成功!');
                            } else {
                                toastr.error(data.data, '移除标签失败!');
                            }
                        });
                    }
                });
            });
        });
    }

    getStow() {
        $.get('/admin/blog/stow/get', {
            id: nsCtx.blogId
        }, (data) => {
            if (data.success) {
                this.blogStow = data.data;
            } else {
                toastr.error(data.data);
            }
        });
    }

    getFollower() {
        $.get('/admin/blog/follower/list', {
            id: nsCtx.blogId
        }, (data) => {
            if (data.success) {
                this.blogFollowers = data.data;
                this.blogFollower = _.find(data.data, (item) => item.creator.username == this.loginUser.username);
                this.followers = _.chain(this.blogFollowers).map((item) => {
                    return item.creator.name ? item.creator.name : item.creator.username;
                }).join(',').value();
            } else {
                toastr.error(data.data);
            }
        });
    }

    editHandler() {
        if (this.blog.editor == 'Html') {
            $('.em-blog-write-html > iframe').attr('src', utils.getResourceBase() + 'blog.html?id=' + this.blog.id + '&_=' + new Date().getTime());
            $('a[href="#modaal-blog-write-html"]').click();
        } else if (this.blog.editor == 'Mind') {
            $('.em-blog-write-mind > iframe').attr('src', utils.getResourceBase() + 'mind.html?id=' + this.blog.id + '&_=' + new Date().getTime());
            $('a[href="#modaal-blog-write-mind"]').click();
        } else if (this.blog.editor == 'Excel') {
            $('.em-blog-write-excel > iframe').attr('src', utils.getResourceBase() + 'excel.html?id=' + this.blog.id + '&_=' + new Date().getTime());
            $('a[href="#modaal-blog-write-excel"]').click();
        } else if (!nsCtx.isModaalOpening) {
            ea.publish(nsCons.EVENT_BLOG_ACTION, {
                action: 'edit',
                id: this.blog.id
            });
        }
    }

    deleteHandler() {
        if (this.isSuper || this.blog.creator.username == this.loginUser.username) {
            this.emConfirmModal.show({
                title: '删除确认',
                content: '确认要删除该博文吗?',
                onapprove: () => {
                    $.post("/admin/blog/delete", {
                        id: this.blog.id
                    }, (data, textStatus, xhr) => {
                        if (data.success) {
                            toastr.success('删除博文成功!');
                            ea.publish(nsCons.EVENT_BLOG_CHANGED, {
                                action: 'deleted',
                                blog: this.blog
                            });
                            ea.publish(nsCons.EVENT_APP_ROUTER_NAVIGATE, {
                                to: '#/blog'
                            });
                        } else {
                            toastr.error(data.data, '删除博文失败!');
                        }
                    });
                }
            });
        }
    }

    createHandler() {
        if (!nsCtx.isModaalOpening) {
            $('a[href="#modaal-blog-write"]').click();
        }
    }

    updateSpaceHandler() {
        if (this.isSuper || this.blog.creator.username == this.loginUser.username || (this.blog.space && this.blog.space.creator.username == this.loginUser.username)) {
            this.blogSpaceUpdateVm.show(this.blog);
        }
    }

    updatePrivatedHandler() {
        $.post('/admin/blog/privated/update', {
            id: this.blog.id,
            privated: !this.blog.privated
        }, (data, textStatus, xhr) => {
            if (data.success) {
                _.extend(this.blog, data.data);
                ea.publish(nsCons.EVENT_BLOG_CHANGED, {
                    action: 'updated',
                    blog: this.blog
                });
                toastr.success('更新博文可见性成功!');
            } else {
                toastr.error(data.data, '更新博文可见性失败!');
            }
        });
    }

    isZanDone() {
        let voteZan = this.blog.voteZan;
        if (!voteZan) {
            return false;
        }

        return voteZan.split(',').includes(this.loginUser.username);
    }

    rateHandler() {
        $.post('/admin/blog/vote', {
            id: this.blog.id,
            url: utils.getBasePath(),
            contentHtml: utils.md2html(this.blog.content, true),
            type: this.isZanDone() ? 'Cai' : 'Zan'
        }, (data, textStatus, xhr) => {
            if (data.success) {
                _.extend(this.blog, data.data);
            } else {
                toastr.error(data.data, '博文投票失败!');
            }
        });
    }

    openEditHandler() {
        if (this.isSuper || this.blog.creator.username == this.loginUser.username) {
            $.post('/admin/blog/openEdit', {
                id: this.blog.id,
                open: !this.blog.openEdit
            }, (data, textStatus, xhr) => {
                if (data.success) {
                    this.blog.openEdit = !this.blog.openEdit;
                    ea.publish(nsCons.EVENT_BLOG_CHANGED, {
                        action: 'updated',
                        blog: this.blog
                    });
                    toastr.success(this.blog.openEdit ? '开放协作编辑成功!' : '关闭协作编辑成功!');
                } else {
                    toastr.error(data.data, '协作编辑操作失败!');
                }
            });
        }
    }

    refreshHandler(id) {
        let p = this.getBlog(id);
        p && p.done(() => {
            toastr.success('刷新操作成功!');
        });
    }

    historyHandler() {
        this.blogHistoryVm.show(this.blog);
    }

    catalogHandler(justRefresh = false) {
        ea.publish(nsCons.EVENT_BLOG_RIGHT_SIDEBAR_TOGGLE, {
            justRefresh: justRefresh,
            action: 'dir',
            dir: this._dir()
        });
    }

    authHandler() {
        if (this.isSuper || this.blog.creator.username == this.loginUser.username) {
            this.blogSpaceAuthVm.show('blog', this.blog);
        }
    }

    copyHandler() {
        if (this.blog.editor == 'Html') {
            $('.em-blog-write-html > iframe').attr('src', utils.getResourceBase() + 'blog.html?id=' + this.blog.id + '&copy' + '&_=' + new Date().getTime());
            $('a[href="#modaal-blog-write-html"]').click();
        } else if (this.blog.editor == 'Mind') {
            $('.em-blog-write-mind > iframe').attr('src', utils.getResourceBase() + 'mind.html?id=' + this.blog.id + '&copy' + '&_=' + new Date().getTime());
            $('a[href="#modaal-blog-write-mind"]').click();
        } else if (this.blog.editor == 'Excel') {
            $('.em-blog-write-excel > iframe').attr('src', utils.getResourceBase() + 'excel.html?id=' + this.blog.id + '&copy' + '&_=' + new Date().getTime());
            $('a[href="#modaal-blog-write-excel"]').click();
        } else if (!nsCtx.isModaalOpening) {
            ea.publish(nsCons.EVENT_BLOG_ACTION, {
                action: 'copy',
                id: this.blog.id
            });
        }
    }

    stowHandler() {
        if (!this.blogStow) {
            $.post('/admin/blog/stow/add', {
                id: this.blog.id
            }, (data, textStatus, xhr) => {
                if (data.success) {
                    this.blogStow = data.data;
                    ea.publish(nsCons.EVENT_BLOG_STOW_CHANGED, {
                        action: 'add',
                        data: this.blogStow
                    });
                    toastr.success('博文收藏成功!');
                } else {
                    toastr.error(data.data);
                }
            });
        } else {
            $.post('/admin/blog/stow/remove', {
                sid: this.blogStow.id
            }, (data, textStatus, xhr) => {
                if (data.success) {
                    ea.publish(nsCons.EVENT_BLOG_STOW_CHANGED, {
                        action: 'remove',
                        data: this.blogStow
                    });
                    this.blogStow = null;
                    toastr.success('删除博文收藏成功!');
                } else {
                    toastr.error(data.data);
                }
            });
        }

    }

    followerHandler() {
        if (!this.blogFollower) {
            $.post('/admin/blog/follower/add', {
                id: this.blog.id
            }, (data, textStatus, xhr) => {
                if (data.success) {
                    this.blogFollower = data.data;
                    toastr.success('博文关注成功!');
                    this.getFollower();
                } else {
                    toastr.error(data.data);
                }
            });
        } else {
            $.post('/admin/blog/follower/remove', {
                fid: this.blogFollower.id
            }, (data, textStatus, xhr) => {
                if (data.success) {
                    this.blogFollower = null;
                    toastr.success('取消博文关注成功!');
                    this.getFollower();
                } else {
                    toastr.error(data.data);
                }
            });
        }

    }

    dimmerHandler() {
        ea.publish(nsCons.EVENT_BLOG_LEFT_SIDEBAR_TOGGLE, {
            isHide: true
        });
        ea.publish(nsCons.EVENT_BLOG_RIGHT_SIDEBAR_TOGGLE, {
            isHide: true
        });
    }

    commentsHandler() {
        $('.em-blog-content').scrollTo(`.em-blog-comment `, 120, {
            offset: -16
        });
    }

    openFeedEventItemHandler(item) {
        item.isOpen = !item.isOpen;
    }

    feedEventItemMouseleaveHandler(item) {
        item.isOpen = false;
    }

    refreshFeedHandler() {
        this.getMyLog();
    }

    loadMoreFeedHandler() {

        var params = {};

        if (!_.isEmpty(this.logs)) params.lastId = _.last(this.logs).id;

        this.ajaxS = $.get('/admin/blog/log/my/more', params, (data) => {
            if (data.success) {
                this.logs = _.unionBy(this.logs, data.data, 'id');
                this.hasNoMoreFeeds = _.isEmpty(data.data);
            } else {
                toastr.error(data.data);
            }
        });
    }

    tplEditHandler() {
        if (this.isSuper || this.blog.creator.username == this.loginUser.username) {
            this.blogTplEditVm.show(this.blog);
        }
    }

    changeEditorHandler() {
        if ((this.blog.editor != 'Html') && (this.isSuper || this.blog.creator.username == this.loginUser.username)) {
            this.emConfirmModal.show({
                title: 'Markdown转HTML确认',
                content: '确认要将该博文转为HTML吗（可通过历史恢复）?',
                onapprove: () => {
                    $.post("/admin/blog/editor/change", {
                        id: this.blog.id,
                        version: this.blog.version,
                        content: marked(utils.preParse(this.blog.content)),
                        editor: 'Html'
                    }, (data, textStatus, xhr) => {
                        if (data.success) {
                            toastr.success('博文转HTML成功!');
                            ea.publish(nsCons.EVENT_BLOG_CHANGED, {
                                action: 'updated',
                                blog: data.data
                            });
                        } else {
                            toastr.error(data.data, '博文转HTML失败!');
                        }
                    });
                }
            });
        }
    }

    md2HtmlDownloadHandler() {

        $.post(`/admin/blog/download/md2html/${this.blog.id}`, {
            content: utils.md2html(`> 版权声明：本文为TMS版权所有，转载请附上原文出处链接和本声明。\n> 本文链接: ${utils.getBasePath()}#/blog/${this.blog.id}?tilte=${this.blog._encodeTitle}\n\n` + this.blog.content)
        }, (data, textStatus, xhr) => {
            if (data.success) {
                utils.openWin(`/admin/blog/download/${this.blog.id}?type=md2html`);
            } else {
                toastr.error(data.data);
            }
        });

    }

    excelDownloadHandler() {

        if (this.blog.editor == 'Excel') {
            utils.downloadExcel(JSON.parse(this.blog.content), this.blog.title);
        } else if (this.blog.editor == 'Mind') {
            let mdata = JSON.parse(this.blog.content);

            let table = [];
            this.mind2table(mdata.nodeData, table, 0);

            if (table.length == 0) return;

            let sheet = XLSX.utils.aoa_to_sheet(table);
            var out = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(out, sheet, `data`);
            XLSX.writeFile(out, `${this.blog.title}.xlsx`);
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

    mouseenterEditLockHandler() {

        bs.signal('sg-blog-lockdate-refresh');

        $.get('/admin/blog/check/lock', {
            id: this.blog.id
        }, (data) => {
            if (data.success) {
                if (!data.data) {
                    this.refreshHandler();
                }
            } else {
                toastr.error(data.data);
            }
        });

    }

    pngDownloadHandler() {
        let ifrm = $('.em-blog-mind > iframe')[0];
        if (ifrm) {
            (ifrm.contentWindow.postMessage) && (ifrm.contentWindow
                .postMessage({
                    action: 'mindExport',
                    source: 'blogMind',
                    item: this.blog
                }, window.location.origin));
        }
    }
}
