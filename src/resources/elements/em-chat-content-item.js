import { bindable, containerless, bindingMode } from 'aurelia-framework';

@containerless
export class EmChatContentItem {

    @bindable({ defaultBindingMode: bindingMode.twoWay }) chats;
    @bindable loginUser;
    @bindable isAt;
    @bindable channel;
    @bindable markId;
    @bindable chatTo;
    members = [];
    basePath = utils.getBasePath();
    alarms = [{
        label: '5m',
        tip: '5分钟后提醒',
        value: 5
    }, {
        label: '15m',
        tip: '15分钟后提醒',
        value: 15
    }, {
        label: '30m',
        tip: '30分钟后提醒',
        value: 30
    }, {
        label: '1h',
        tip: '1小时后提醒',
        value: 60
    }, {
        label: '2h',
        tip: '2小时后提醒',
        value: 60 * 2
    }, {
        label: '3h',
        tip: '3小时后提醒',
        value: 60 * 3
    }, {
        label: '自定义',
        tip: '自定义时间提醒',
        value: -1
    }];

    /**
     * 构造函数
     */
    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_CHAT_CHANNEL_MEMBER_ADD_OR_REMOVE, (payload) => {
            this.members = [nsCtx.memberAll, ...payload.members];
        });

        this.subscribe2 = ea.subscribe(nsCons.EVENT_MARKDOWN_TASK_ITEM_STATUS_TOGGLE, (payload) => {
            // console.log(payload);

            if (payload.case != 'chat') return;

            let chat = _.find(this.chats, { id: +payload.id });

            if (chat && (chat.creator.username == this.loginUser.username || chat.openEdit)) {
                let lines = chat.content.split('\n');
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

                chat.contentOld = chat.content;
                chat.content = lines.join('\n');

                // var html = utils.md2html(chat.content, true);
                // var htmlOld = utils.md2html(chat.contentOld, true);

                let url;
                let data;

                if (this.isAt) {
                    url = `/admin/chat/direct/update`;
                    data = {
                        baseUrl: utils.getBaseUrl(),
                        path: wurl('path'),
                        id: chat.id,
                        content: chat.content,
                        diff: utils.diffS(chat.contentOld, chat.content)
                    };
                } else {
                    url = `/admin/chat/channel/update`;
                    data = {
                        url: utils.getUrl(),
                        id: chat.id,
                        version: chat.version,
                        usernames: utils.parseUsernames(chat.content, this.members, this.channel).join(','),
                        content: chat.content,
                        diff: utils.diffS(chat.contentOld, chat.content)
                    };
                }

                $.post(url, data, (data, textStatus, xhr) => {
                    if (data.success) {
                        toastr.success('更新消息成功!');
                        // chat.isEditing = false;
                        chat.version = data.data.version;
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

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe.dispose();
        this.subscribe2.dispose();
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        $('.tms-content-body').on('click', '.markdown-body .at-user', (event) => {
            event.preventDefault();
            ea.publish(nsCons.EVENT_CHAT_MSG_INSERT, {
                content: `{~${$(event.currentTarget).attr('data-value')}} `
            });
        });
        $('.tms-content-body').on('click', '.markdown-body .at-group', (event) => {
            event.preventDefault();
            ea.publish(nsCons.EVENT_CHAT_MSG_INSERT, {
                content: `{!~${$(event.currentTarget).attr('data-value')}} `
            });
        });

        // 消息popup
        $('.tms-chat').on('mouseenter', '.markdown-body a[href*="#/chat/"]:not(.pp-not)', (event) => {
            event.preventDefault();
            let target = event.currentTarget;

            if (this.hoverMsgTimeoutRef) {
                if (this.hoverMsgTarget === target) {
                    return;
                } else {
                    clearTimeout(this.hoverMsgTimeoutRef);
                    this.hoverMsgTimeoutRef = null;
                }
            }

            this.hoverMsgTarget = target;

            this.hoverMsgTimeoutRef = setTimeout(() => {
                ea.publish(nsCons.EVENT_CHAT_MSG_POPUP_SHOW, {
                    id: utils.urlQuery('id', $(target).attr('href')),
                    target: target
                });
                this.hoverMsgTimeoutRef = null;
            }, 500);

        });

        $('.tms-chat').on('mouseleave', '.markdown-body a[href*="#/chat/"]:not(.pp-not)', (event) => {
            event.preventDefault();
            if (this.hoverMsgTimeoutRef) {
                if (this.hoverMsgTarget === event.currentTarget) {
                    clearTimeout(this.hoverMsgTimeoutRef);
                    this.hoverMsgTimeoutRef = null;
                }
            }
        });

        // wiki dir
        $('.tms-chat').on('mouseenter', '.tms-content-body .em-chat-content-item', (event) => {
            event.preventDefault();
            var $c = $(event.currentTarget);

            ea.publish(nsCons.EVENT_CHAT_MSG_WIKI_DIR, {
                dir: utils.dir($c.find('> .content > .markdown-body'))
            });

            let chat = _.find(this.chats, { id: +$c.attr('data-id') });
            chat && (chat._hovered = true);
            chat && (chat.__hovered = true);
        });

        $('.tms-chat').on('mouseleave', '.tms-content-body .em-chat-content-item', (event) => {
            event.preventDefault();
            var $c = $(event.currentTarget);

            let chat = _.find(this.chats, { id: +$c.attr('data-id') });
            chat && (chat._hovered = false);
        });

        $('.tms-chat').on('click', '.panel-wiki-dir .wiki-dir-item', (event) => {
            event.preventDefault();
            ea.publish(nsCons.EVENT_CHAT_CONTENT_SCROLL_TO, { target: $('#' + $(event.currentTarget).attr('data-id')) });
        });

        // 用户信息popup
        $('.tms-chat').on('mouseenter', 'span[data-value].at-user:not(.pp-not),span[data-value].at-group:not(.pp-not),a[data-value].author:not(.pp-not)', (event) => {
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
                    channel: this.channel,
                    username: $(target).attr('data-value'),
                    type: $(target).attr('class'),
                    target: target
                });
                this.hoverTimeoutRef = null;
            }, 500);

        });

        // 用户信息popup
        $('.tms-chat').on('mouseleave', 'span[data-value].at-user:not(.pp-not),span[data-value].at-group:not(.pp-not),a[data-value].author:not(.pp-not)', (event) => {
            event.preventDefault();
            if (this.hoverTimeoutRef) {
                if (this.hoverUserTarget === event.currentTarget) {
                    clearTimeout(this.hoverTimeoutRef);
                    this.hoverTimeoutRef = null;
                }
            }

        });

        this.initHotkeys();
    }

    channelChanged() {

        if (this.channel) {
            this.members = [nsCtx.memberAll, ...this.channel.members];
        } else {
            this.members = [];
        }
    }

    deleteHandler(item) {

        this.emConfirmModal.show({
            onapprove: () => {

                let url;

                if (this.isAt) {
                    url = `/admin/chat/direct/delete`;
                } else {
                    url = `/admin/chat/channel/delete`;
                }

                $.post(url, {
                    id: item.id
                }, (data, textStatus, xhr) => {
                    if (data.success) {
                        this.chats = _.reject(this.chats, {
                            id: item.id
                        });
                        // this.chats.splice(_.findIndex(this.chats, { id: item.id }), 1);
                        toastr.success('删除消息成功!');
                    } else {
                        toastr.error(data.data, '删除消息失败!');
                    }
                });
            }
        });

    }

    initHotkeys() {
        $(document).bind('keydown', 'e', (evt) => {
            evt.preventDefault();
            let chat = _.findLast(this.chats, c => c.creator.username == this.loginUser.username);
            if (chat) {
                this.editHandler(chat, $(`.em-chat-content-item[data-id="${chat.id}"]`).find('> .content > textarea'));
            }
        });
    }

    editHandler(item, editTxtRef) {

        $.get(`/admin/chat/${this.isAt ? 'direct' : 'channel'}/get`, {
            id: item.id
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

        // var html = utils.md2html(item.content, true);
        // var htmlOld = utils.md2html(item.contentOld, true);

        let url;
        let data;

        if (this.isAt) {
            url = `/admin/chat/direct/update`;
            data = {
                baseUrl: utils.getBaseUrl(),
                path: wurl('path'),
                id: item.id,
                content: item.content,
                diff: utils.diffS(item.contentOld, item.content),
                // contentHtml: html,
                // contentHtmlOld: htmlOld
            };
        } else {
            url = `/admin/chat/channel/update`;
            data = {
                url: utils.getUrl(),
                id: item.id,
                version: item.version,
                usernames: utils.parseUsernames(item.content, this.members, this.channel).join(','),
                content: item.content,
                diff: utils.diffS(item.contentOld, item.content),
                // contentHtml: html,
                // contentHtmlOld: htmlOld
            };
        }

        $.post(url, data, (data, textStatus, xhr) => {
            if (data.success) {
                toastr.success('更新消息成功!');
                item.isEditing = false;
                item.version = data.data.version;
            } else {
                toastr.error(data.data, '更新消息失败!');
            }
        }).always(() => {
            this.sending = false;
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

    notifyRendered(last, item) {
        if (last) {
            _.defer(() => {
                ea.publish(nsCons.EVENT_CHAT_LAST_ITEM_RENDERED, {
                    item: item
                });
            });
        }
    }

    stowHandler(item) {

        if (item._stowed) {
            this.unStowHandler(item);
            return;
        }

        $.post('/admin/chat/channel/stow', {
            id: item.id
        }, (data, textStatus, xhr) => {
            item._stowed = true;
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
            item.stowId = '';
            item._stowed = false;
            if (data.success) {
                toastr.success('取消收藏消息成功!');
            } else {
                // toastr.error(data.data, '移除收藏消息失败!');
            }
        });
    }

    openEditHandler(item) {
        $.post('/admin/chat/channel/openEdit', {
            id: item.id,
            open: !item.openEdit
        }, (data, textStatus, xhr) => {
            if (data.success) {
                item.openEdit = !item.openEdit;
                toastr.success(`${item.openEdit ? '开启' : '关闭'}协作编辑成功!`);
            } else {
                toastr.success(`${!item.openEdit ? '开启' : '关闭'}协作编辑失败!`);
            }
        });
    }

    replyHandler(item) {
        ea.publish(nsCons.EVENT_CHAT_MSG_INSERT, {
            content: `[[回复#${item.id}](${utils.getUrl()}?id=${item.id}){~${item.creator.username}}]\n\n`
        });

        // 标记@我的该消息为已读
        $.post('/admin/chat/channel/markAsReadedByChat', {
            chatId: item.id
        });
    }

    creatorNameHandler(item) {
        ea.publish(nsCons.EVENT_CHAT_MSG_INSERT, {
            content: `{~${item.creator.username}} `
        });
    }

    refreshHandler(item) {
        $.get('/admin/chat/channel/get', {
            id: item.id
        }, (data) => {
            _.extend(item, data.data);
            toastr.success('刷新同步成功!');
        });
    }

    likeHandler(item, isLike) {

        if ((isLike && item.isZanVoted) || (!isLike && item.isCaiVoted)) {
            return;
        }

        $.post('/admin/chat/channel/vote', {
            id: item.id,
            url: utils.getUrl(),
            contentHtml: utils.md2html(item.content, true),
            type: isLike ? 'Zan' : 'Cai'
        }, (data, textStatus, xhr) => {
            if (data.success) {
                _.extend(item, data.data);
                if (isLike) {
                    item.isZanVoted = true;
                } else {
                    item.isCaiVoted = true;
                }
            } else {
                toastr.error(data.data);
            }
        });
    }

    pinHandler(item) {
        let params = {
            id: item.id,
            cid: this.channel.id
        };
        if (!item._pined) {
            params.pin = true;
        }
        $.post('/admin/chat/channel/pin/toggle', params, (data, textStatus, xhr) => {
            if (data.success) {
                toastr.success(`${data.code == 200 ? '固定频道消息成功!' : '解除固定频道消息成功!'}`);
                item._pined = (data.code == 200);
            } else {
                toastr.error(data.data);
            }
        });
    }

    talkHandler(item, event) {
        ea.publish(nsCons.EVENT_CHAT_TOPIC_SHOW, { chat: item });
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

    initAlarmHander(alarmR) {
        _.defer(() => {
            $(alarmR)
                .popup({
                    inline: true,
                    hoverable: true,
                    position: 'right center',
                    delay: {
                        show: 500,
                        hide: 300
                    },
                    onHide: () => {}
                });
        });

    }

    alarmHandler(alarm, chat) {

        ea.publish(nsCons.EVENT_SHOW_SCHEDULE, {});
        if (alarm.value == -1) {
            _.delay(() => ea.publish(nsCons.EVENT_CUSTOM_ALARM_SCHEDULE, chat), 1000);
            return;
        }

        let data = {
            title: utils.abbreviate(`【#${chat.id}】${chat.content}`, 200),
            basePath: utils.getBasePath(),
            remind: 0,
            actors: `${this.loginUser.username}`
        };

        let start = new Date(new Date().getTime() + alarm.value * 60 * 1000);
        data.startDate = start;

        $.post('/admin/schedule/create', data, (data, textStatus, xhr) => {
            if (data.success) {
                toastr.success('添加日程提醒成功!');
                ea.publish(nsCons.EVENT_SCHEDULE_REFRESH, {});
            } else {
                toastr.error(data.data);
            }
        });
    }
}
