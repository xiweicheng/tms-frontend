import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChatSidebarLeft {

    @bindable users;
    @bindable loginUser;
    @bindable channels;
    @bindable chatTo;
    @bindable isAt;

    chatToChanged() {
        _.delay(() => {
            $(this.userListRef).scrollTo(`a.item[data-id="${this.chatTo}"]`);
        }, 1000);
    }

    chatToUserFilerFocusinHanlder() {
        $(this.userListRef).scrollTo(`a.item[data-id="${this.chatTo}"]`);
    }

    chatToUserFilerKeyupHanlder(evt) {
        _.each(this.users, (item) => {
            item.hidden = item.username.indexOf(this.filter) == -1;
        });

        _.each(this.channels, (item) => {
            item.hidden = item.name.indexOf(this.filter) == -1;
        });

        if (evt.keyCode === 13) {
            let user = _.find(this.users, {
                hidden: false
            });

            if (user) {
                window.location = wurl('path') + `#/chat/@${user.username}`;
                return;
            }

            let channel = _.find(this.channels, {
                hidden: false
            });

            if (channel) {
                window.location = wurl('path') + `#/chat/${channel.name}`;
                return;
            }
        }
    }

    clearFilterHandler() {
        this.filter = '';
        _.each(this.users, (item) => {
            item.hidden = item.username.indexOf(this.filter) == -1;
        });
    }

    editHandler(item) {
        this.selectedChannel = item;
        this.channelEditMd.show();
    }

    delHandler(item) {
        this.confirmMd.show({
            onapprove: () => {
                $.post('/admin/channel/delete', {
                    id: item.id
                }, (data) => {
                    if (data.success) {
                        toastr.success('删除频道成功!');
                        _.remove(this.channels, { id: item.id });
                        // this.channels = [...this.channels];
                        ea.publish(nsCons.EVENT_CHAT_CHANNEL_DELETED, item);
                    } else {
                        toastr.error(data.data, '删除频道失败!');
                    }
                });
            }
        });
    }

    membersMgrHandler(item) {
        this.selectedChannel = item;
        this.channelMembersMgrMd.show();
    }

}
