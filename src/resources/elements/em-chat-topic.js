import { bindable, containerless } from 'aurelia-framework';
import poll from "common/common-poll2";

@containerless
export class EmChatTopic {

    @bindable actived;
    @bindable channel;
    @bindable name;
    isSuper = nsCtx.isSuper;
    loginUser = nsCtx.loginUser;
    members = [];
    offset = 0;

    chat = null;
    basePath = utils.getBasePath();

    /**
     * 构造函数
     */
    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_CHAT_TOPIC_MSG_SENDED, (payload) => {

            if (payload.from != this.name) return;

            if (!_.some(this.chat ? this.chat.chatReplies : [], { id: payload.data.id })) {
                this.chat && this.chat.chatReplies.push(payload.data);
                this.scrollToBottom();
            }

            this.isFollower = true; // 回复话题会自动关注该话题

            // poll.reset();
        });
        this.subscribe1 = ea.subscribe(nsCons.EVENT_CHAT_CHANNEL_MEMBER_ADD_OR_REMOVE, (payload) => {
            this.members = [nsCtx.memberAll, ...payload.members];
        });

        this.subscribe2 = ea.subscribe(nsCons.EVENT_MARKDOWN_TASK_ITEM_STATUS_TOGGLE, (payload) => {
            // console.log(payload);

            if (payload.case != 'topic' || !this.chat || payload.from != this.name) return;

            let topic = _.find(this.chat.chatReplies, { id: +payload.id });

            if (topic && (topic.creator.username == this.loginUser.username)) {
                let lines = topic.content.split('\n');
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

                topic.contentOld = topic.content;
                topic.content = lines.join('\n');;

                var html = utils.md2html(topic.content, true);
                // var htmlOld = utils.md2html(topic.contentOld, true);

                $.post(`/admin/chat/channel/reply/update`, {
                    url: utils.getUrl(),
                    rid: topic.id,
                    version: topic.version,
                    usernames: utils.parseUsernames(topic.content, this.members, this.channel).join(','),
                    content: topic.content,
                    diff: utils.diffS(topic.contentOld, topic.content),
                }, (data, textStatus, xhr) => {
                    if (data.success) {
                        toastr.success('更新消息成功!');
                        // topic.isEditing = false;
                        topic.version = data.data.version;
                        this.chat.version = data.msgs[0];
                    } else {
                        toastr.error(data.data, '更新消息失败!');
                    }
                }).always(() => {
                    this.sending = false;
                });

            } else {
                payload.event && payload.event.preventDefault();
                toastr.warning(`更新权限不足!`);
            }

        });

        this.subscribe3 = ea.subscribe(nsCons.EVENT_MARKDOWN_TASK_ITEM_STATUS_TOGGLE, (payload) => {
            // console.log(payload);

            if (payload.case != 'subject' || !this.chat || payload.from != this.name) return;

            if (this.chat && (this.chat.creator.username == this.loginUser.username || this.chat.openEdit)) {
                let lines = this.chat.content.split('\n');
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

                this.chat.contentOld = this.chat.content;
                this.chat.content = lines.join('\n');

                // var html = utils.md2html(chat.content, true);
                // var htmlOld = utils.md2html(chat.contentOld, true);

                let url = `/admin/chat/channel/update`;
                let data = {
                    url: utils.getUrl(),
                    id: this.chat.id,
                    version: this.chat.version,
                    usernames: utils.parseUsernames(this.chat.content, [nsCtx.memberAll, ...this.channel.members], this.channel).join(','),
                    content: this.chat.content,
                    diff: utils.diffS(this.chat.contentOld, this.chat.content)
                };

                $.post(url, data, (data, textStatus, xhr) => {
                    if (data.success) {
                        toastr.success('更新消息成功!');
                        // chat.isEditing = false;
                        this.chat.version = data.data.version;
                    } else {
                        toastr.error(data.data, '更新消息失败!');
                    }
                }).always(() => {
                    this.sending = false;
                });

            } else {
                payload.event && payload.event.preventDefault();
                toastr.warning(`更新权限不足!`);
            }

        });
    }

    scrollToBottom() {
        // this.scrollTo('max');
        // this.scrollTo("100%", { axis: 'y' });
        this.scrollTo("100%");

    }

    scrollTo(to) {
        _.defer(() => ea.publish(nsCons.EVENT_CHAT_RIGHT_SIDEBAR_SCROLL_TO, to));
    }

    _scrollTo(to) {
        if (_.isNil(to)) {
            return;
        }
        if (to == 'b') {
            // $(this.commentsRef).closest('.scroll-content').scrollTo('max');
            $(this.commentsRef).closest('.scroll-content').scrollTo("100%", { axis: 'y' });
        } else if (to == 't') {
            $(this.commentsRef).closest('.scroll-content').scrollTo(0);
        } else {
            if (_.some(this.chat.chatReplies, { id: +to })) {
                $(this.commentsRef).closest('.scroll-content').scrollTo(`.tms-reply.comment[data-id="${to}"]`, {
                    offset: this.offset
                });
                $(this.commentsRef).find(`.comment[data-id]`).removeClass('active');
                $(this.commentsRef).find(`.comment[data-id=${to}]`).addClass('active');
            } else {
                // $(this.commentsRef).closest('.scroll-content').scrollTo('max');
                $(this.commentsRef).closest('.scroll-content').scrollTo("100%", { axis: 'y' });
                toastr.warning(`消息[${to}]不存在,可能已经被删除!`);
            }
        }
    }

    scrollToAfterImgLoaded(to) {
        _.defer(() => {
            this.commentsRef && new ImagesLoaded(this.commentsRef).always(() => {
                this._scrollTo(to);
            });

            this._scrollTo(to);
        });

    }

    detached() {
        window.__debug && console.log('EmChatTopic--detached');

        $(this.commentsRef).off('dblclick', '.comment.tms-reply', this.replydblclickHandler);
        $(this.commentsRef).off('click', '.markdown-body .at-user', this.atUserHandler);
        $(this.commentsRef).off('click', '.markdown-body .at-group', this.atGroupHandler);

        this.replydblclickHandler = null;
        this.atUserHandler = null;
        this.atGroupHandler = null;

        this.actived = null;
        this.channel = null;
        this.members = [];
        this.chat = [];
        this.commentsRef = null;
        this.ajaxTopic = null;
        this.followers = null;
    }

    attached() {

        this.replydblclickHandler = (event) => {
            if (event.ctrlKey && event.shiftKey) {
                let chatId = $(event.currentTarget).attr('data-id');
                let $t = $(event.currentTarget).find('.content > textarea');
                let item = _.find(this.chat.chatReplies, { id: Number.parseInt(chatId) });

                if (!this.isSuper && (item.creator.username != this.loginUser.username)) {
                    return;
                }

                item.isEditing = true;
                item.contentOld = item.content;
                _.defer(() => {
                    $t.focus().select();
                    autosize.update($t.get(0));
                });
            }
        };

        $(this.commentsRef).on('dblclick', '.comment.tms-reply', this.replydblclickHandler);

        this.atUserHandler = (event) => {
            event.preventDefault();
            ea.publish(nsCons.EVENT_CHAT_TOPIC_MSG_INSERT, {
                from: this.name,
                content: `{~${$(event.currentTarget).attr('data-value')}} `
            });
        };

        $(this.commentsRef).on('click', '.markdown-body .at-user', this.atUserHandler);

        this.atGroupHandler = (event) => {
            event.preventDefault();
            ea.publish(nsCons.EVENT_CHAT_TOPIC_MSG_INSERT, {
                from: this.name,
                content: `{!~${$(event.currentTarget).attr('data-value')}} `
            });
        };

        $(this.commentsRef).on('click', '.markdown-body .at-group', this.atGroupHandler);
    }

    unbind() {
        this.subscribe.dispose();
        this.subscribe1.dispose();
        this.subscribe2.dispose();
        this.subscribe3.dispose();
        // poll.stop();
    }

    channelChanged() {

        if (this.channel) {
            this.members = [nsCtx.memberAll, ...this.channel.members];
        } else {
            this.members = [];
        }
    }

    _poll() {
        poll.start((resetCb, stopCb) => {
            if (!nsCtx.isRightSidebarShow) {
                stopCb();
            }
            let cr = _.last(this.chat.chatReplies);
            this.ajaxTopic = $.get('/admin/chat/channel/reply/poll', {
                id: this.chat.id,
                rid: cr ? cr.id : null
            }, (data) => {
                if (data.success) {
                    if (data.data.length > 0) {
                        // 返回数组只要存在一个不在当前数组的元素，就需要进行合并更新
                        // if (_.some(data.data, item => {
                        //         return !_.some(this.chat.chatReplies, {
                        //             id: item.id
                        //         })
                        //     })) {
                        this._checkNeedNotify(data);
                        this.chat.chatReplies = _.unionBy(this.chat.chatReplies, data.data, 'id');
                        this.scrollToBottom();
                        resetCb();
                        // }
                    }
                } else {
                    // toastr.error(data.data);
                    stopCb();
                }
            });
        });
    }

    _checkNeedNotify(data) {

        if (data.data.length == 0) {
            return false;
        }

        let hasOwn = _.some(data.data, (item) => {
            return item.creator.username == this.loginUser.username;
        });

        let alarm = utils.getAlarm();
        if (!hasOwn && !alarm.off && alarm.news) {
            push.create('TMS沟通频道消息通知', {
                body: `频道[${this.channel.title}]有新的话题回复消息了!`,
                icon: {
                    x16: 'img/tms-x16.ico',
                    x32: 'img/tms-x32.png'
                },
                timeout: 5000
            });

            (!alarm.off && alarm.audio) && ea.publish(nsCons.EVENT_AUDIO_ALERT, {});
        }
    }

    _getFollowers() {
        $.get('/admin/chat/channel/follower/list', {
            id: this.chat.id
        }, (data) => {
            if (data.success) {
                this.followers = data.data;
                this.isFollower = _.some(this.followers, f => f.creator.username == this.loginUser.username);
            }
        });
    }

    activedChanged(newValue, oldValue) {
        if (!newValue || this.actived.payload.action != nsCons.ACTION_TYPE_TOPIC) {
            // poll.stop();
            this.chat = null;
            this.rid = null;
            return;
        }

        this.chat = this.actived.payload.result.chat;
        let lst = _.last(this.chat.chatReplies);
        lst && (lst.__scroll = true);
        this.rid = this.actived.payload.result.rid;
        // this._poll();
        this._getFollowers();
    }

    notifyRendered(last, item) {
        if (last) {
            _.defer(() => {
                if (item.__scroll) {
                    this.scrollToAfterImgLoaded(this.rid ? this.rid : 'b');
                    delete item.__scroll;
                    // this.rid = null;

                } else {
                    this.scrollToAfterImgLoaded('b');
                }
            });
        }
    }

    removeHandler(item) {
        $.post('/admin/chat/channel/reply/remove', { rid: item.id }, (data, textStatus, xhr) => {
            if (data.success) {
                this.chat.chatReplies = _.reject(this.chat.chatReplies, { id: data.data });
                this.chat.version = data.msgs[0];
            } else {
                toastr.error(data.data);
            }
        });
    }

    editHandler(item, editTxtRef) {

        item.isEditing = true;
        item.contentOld = item.content;
        _.defer(() => {
            $(editTxtRef).focus().select();
            autosize.update(editTxtRef);
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
            $(txtRef).next('.tms-edit-actions').find('.upload').click();
            return false;
        } else if (evt.keyCode === 27) {
            this.editCancelHandler(evt, item, txtRef);
        }

        return true;
    }

    editSave(item, txtRef) {

        this.sending = true;

        item.content = $(txtRef).val();

        var html = utils.md2html(item.content, true);
        var htmlOld = utils.md2html(item.contentOld, true);

        $.post(`/admin/chat/channel/reply/update`, {
            url: utils.getUrl(),
            rid: item.id,
            version: item.version,
            usernames: utils.parseUsernames(item.content, this.members, this.channel).join(','),
            content: item.content,
            diff: utils.diffS(item.contentOld, item.content),
        }, (data, textStatus, xhr) => {
            if (data.success) {
                toastr.success('更新消息成功!');
                item.isEditing = false;
                item.version = data.data.version;
                this.chat.version = data.msgs[0];
            } else {
                toastr.error(data.data, '更新消息失败!');
            }
        }).always(() => {
            this.sending = false;
        });
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

    replyHandler() {
        this.scrollToBottom();
        _.defer(() => ea.publish(nsCons.EVENT_CHAT_TOPIC_MSG_INSERT, {
            from: this.name,
            content: ''
        }));
    }

    followerHandler() {
        $.post(`/admin/chat/channel/follower/${this.isFollower ? 'remove' : 'add'}`, {
            id: this.chat.id
        }, (data, textStatus, xhr) => {
            if (data.success) {
                toastr.success(`${this.isFollower ? '取消' : ''}关注话题成功!`);
                this.isFollower = !this.isFollower;
            } else {
                toastr.error(data.data);
            }
        });
    }

    refreshHandler() {
        $.get('/admin/chat/channel/get', {
            id: this.chat.id
        }, (data) => {
            _.extend(this.chat, data.data);
            toastr.success('刷新同步成功!');
        });
    }

    refreshReplyHandler(item) {
        $.get('/admin/chat/channel/reply/get', {
            rid: item.id
        }, (data) => {
            if (item.version != data.data.version) {
                _.extend(item, data.data);
                toastr.success('刷新同步成功!');
            } else {
                item.chatReplies = data.data.chatReplies;
                toastr.info('消息内容暂无变更!');
            }
        });
    }

    stowHandler(item) {
        if (item.isStow) {
            this.unStowHandler(item);
            return;
        }

        $.post('/admin/chat/channel/stow', {
            id: this.chat.id,
            rid: item.id
        }, (data, textStatus, xhr) => {
            item.isStow = true;
            if (data.success) {
                item.stowId = data.data.id;
                toastr.success('收藏消息成功!');
            } else {
                item.stowId = (data.msgs && data.msgs.length > 0) ? data.msgs[0].id : '';
                // toastr.error(data.data, '收藏消息失败!');
            }
        });
    }

    unStowHandler(item) {
        if (!item.stowId) {
            return;
        }
        $.post('/admin/chat/channel/removeStow', {
            id: item.stowId
        }, (data, textStatus, xhr) => {
            item.isStow = false;
            item.stowId = '';
            if (data.success) {
                toastr.success('移除收藏消息成功!');
            } else {
                // toastr.error(data.data, '移除收藏消息失败!');
            }
        });
    }

    dateDblclickHandler(item) {
        let offset = parseInt((new Date().getTime() - item.createDate) / 1000 / 60 / 60);

        let offsetD = parseInt(offset / 24);

        if (offsetD > 1) {
            ea.publish(nsCons.EVENT_CHAT_DO_MSG_SEARCH, { search: `date:${offsetD - 1}d ${offsetD + 1}d` });
            return;
        } else if (offsetD > 0) {
            ea.publish(nsCons.EVENT_CHAT_DO_MSG_SEARCH, { search: `date:2d` });
            return;
        }

        if (offset < 2) {
            ea.publish(nsCons.EVENT_CHAT_DO_MSG_SEARCH, { search: `date:2h` });
        } else {
            ea.publish(nsCons.EVENT_CHAT_DO_MSG_SEARCH, { search: `date:${offset - 1}h ${offset + 1}h` });
        }
    }

    scroll2ChatHandler() {
        ea.publish(nsCons.EVENT_CHAT_TOPIC_SCROLL_TO, { chat: this.chat });
        return false;
    }

    creatorNameHandler(item) {
        ea.publish(nsCons.EVENT_CHAT_TOPIC_MSG_INSERT, {
            from: this.name,
            content: `{~${item.creator.username}} `
        });
    }

    commit() {
        this.chatTopicInputVm.sendChatMsgHandler();
    }
}
