import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChatChannelMembersMgr {

    @bindable channel;
    @bindable users;

    @bindable name;
    @bindable title;
    loginUser = nsCtx.loginUser;

    nameRegex = /^[a-z][a-z0-9_\-]{0,49}$/;

    /**
     * 构造函数
     */
    constructor() {
        this.membersOpts = {
            fullTextSearch: true,
            onAdd: (addedValue, addedText, $addedChoice) => {
                this.emModal.showDimmer();
                $.post('/admin/channel/addMember', {
                    id: this.channel.id,
                    members: addedValue,
                    baseUrl: utils.getBaseUrl(),
                    path: wurl('path'),
                }, (data, textStatus, xhr) => {
                    if (data.success) {
                        toastr.success('添加成员成功!');
                        this.channel.members = data.data.members;
                        ea.publish(nsCons.EVENT_CHAT_CHANNEL_MEMBER_ADD_OR_REMOVE, {
                            type: 'add',
                            members: data.data.members
                        });
                    } else {
                        toastr.error(data.data, '添加成员失败!');
                    }
                }).always(() => {
                    this.emModal.hideDimmer();
                });
            },
            onLabelRemove: (removedValue) => {
                if (this.channel.owner.username == removedValue) {
                    return false;
                }

                this.emModal.showDimmer();
                $.post('/admin/channel/removeMember', {
                    id: this.channel.id,
                    members: removedValue,
                    baseUrl: utils.getBaseUrl(),
                    path: wurl('path'),
                }, (data, textStatus, xhr) => {
                    if (data.success) {
                        toastr.success('移除成员成功!');
                        this.channel.members = data.data.members;
                        ea.publish(nsCons.EVENT_CHAT_CHANNEL_MEMBER_ADD_OR_REMOVE, {
                            type: 'remove',
                            members: data.data.members
                        });
                    } else {
                        toastr.error(data.data, '移除成员失败!');
                    }
                }).always(() => {
                    this.emModal.hideDimmer();
                });
            }
        };

    }

    channelChanged() {
        if (this.channel) {
            let usernames = _.sortBy(_.map(this.channel.members, 'username'));
            // usernames = [this.channel.owner.username, ..._.without(usernames, this.channel.owner.username)];
            _.defer(() => {
                $(this.membersRef).dropdown().dropdown('clear').dropdown('set selected', usernames).dropdown(this.membersOpts);
            });

        }
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {

    }

    initGrpMembersUI(last, ddRef, item) {

        if (last) {
            _.defer(() => {
                let usernames = _.sortBy(_.map(item.members, 'username'));
                _.defer(() => {
                    $(ddRef).dropdown().dropdown('clear').dropdown('set selected', usernames).dropdown({
                        fullTextSearch: true,
                        onAdd: (addedValue, addedText, $addedChoice) => {
                            this.emModal.showDimmer();
                            $.post('/admin/channel/group/member/add', {
                                id: item.id,
                                members: addedValue
                            }, (data, textStatus, xhr) => {
                                if (data.success) {
                                    toastr.success('添加成员成功!');
                                    item.members = data.data.members;
                                } else {
                                    toastr.error(data.data, '添加成员失败!');
                                }
                            }).always(() => {
                                this.emModal.hideDimmer();
                            });
                        },
                        onLabelRemove: (removedValue) => {
                            this.emModal.showDimmer();
                            $.post('/admin/channel/group/member/remove', {
                                id: item.id,
                                members: removedValue
                            }, (data, textStatus, xhr) => {
                                if (data.success) {
                                    toastr.success('移除成员成功!');
                                    item.members = data.data.members;
                                } else {
                                    toastr.error(data.data, '移除成员失败!');
                                }
                            }).always(() => {
                                this.emModal.hideDimmer();
                            });
                        }
                    });
                });
            });
        }
    }

    initMembersUI(last) {

        if (last) {
            _.defer(() => {
                this.channelChanged();
            });
        }
    }

    showHandler() {
        $(this.membersRef).dropdown().dropdown('clear');
        this.channelChanged();
        this._reset();
    }

    approveHandler(modal) {

    }

    show() {
        this.emModal.show({
            hideOnApprove: true,
            autoDimmer: false
        });
    }

    _reset() {
        this.name = '';
        this.title = '';
    }

    nameChanged(news, old) {
        this.oldName = old;
        if (news && !this.nameRegex.test(news)) {
            this.name = this._getOldName();
        }
    }

    _getOldName() {
        if (!this.nameRegex.test(this.oldName)) {
            this.oldName = '';
        }

        return this.oldName;
    }

    addHandler() {
        if (this.isSending) {
            return;
        }
        this.isSending = true;
        $.post('/admin/channel/group/create', {
            channelId: this.channel.id,
            name: this.name,
            title: this.title
        }, (data, textStatus, xhr) => {
            this.isSending = false;
            if (data.success) {
                this._reset();
                toastr.success('创建频道分组成功!');
                this.channel.channelGroups.push(data.data);
            } else {
                toastr.error(data.data, '创建频道分组失败!');
            }
        });
    }

    editHandler(item) {
        item.oldTitle = item.title;
        item.oldName = item.name;
        item.isEditing = true;
    }

    updateHandler(item) {

        if (item.oldTitle == item.title && item.oldName == item.name) {
            item.isEditing = false;
            return;
        }

        $.post('/admin/channel/group/update', {
            id: item.id,
            title: item.title,
            name: item.name,
        }, (data, textStatus, xhr) => {
            if (data.success) {
                item.isEditing = false;
                toastr.success('更新成功!');
            } else {
                toastr.error(data.data);
            }
        });
    }

    delHandler(item) {
        $.post('/admin/channel/group/delete', {
            id: item.id
        }, (data, textStatus, xhr) => {
            if (data.success) {
                this.channel.channelGroups = _.reject(this.channel.channelGroups, { id: item.id });
                toastr.success('删除成功!');
            } else {
                toastr.error(data.data);
            }
        });
    }
}
