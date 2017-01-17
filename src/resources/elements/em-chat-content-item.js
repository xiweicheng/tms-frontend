import { bindable, containerless, bindingMode } from 'aurelia-framework';

@containerless
export class EmChatContentItem {

    @bindable({ defaultBindingMode: bindingMode.twoWay }) chats;
    @bindable loginUser;
    @bindable isAt;
    @bindable channel;
    @bindable markId;
    members = [];
    basePath = utils.getBasePath();

    /**
     * 构造函数
     */
    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_CHAT_CHANNEL_MEMBER_ADD_OR_REMOVE, (payload) => {
            this.members = [nsCtx.memberAll, ...payload.members];
        });
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe.dispose();
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
                        toastr.success('删除消息成功!');
                    } else {
                        toastr.error(data.data, '删除消息失败!');
                    }
                });
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

        var html = utils.md2html(item.content);
        var htmlOld = utils.md2html(item.contentOld);

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
                usernames: utils.parseUsernames(item.content, this.members).join(','),
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
        $.post('/admin/chat/channel/stow', {
            id: item.id
        }, (data, textStatus, xhr) => {
            if (data.success) {
                toastr.success('收藏消息成功!');
            } else {
                toastr.error(data.data, '收藏消息失败!');
            }
        });
    }
}
