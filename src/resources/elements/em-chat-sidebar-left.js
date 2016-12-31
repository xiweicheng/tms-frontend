import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChatSidebarLeft {

    @bindable users;
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

        if (evt.keyCode === 13) {
            let user = _.find(this.users, {
                hidden: false
            });

            if (user) {
                window.location = wurl('path') + `#/chat/@${user.username}`;
            }
        }
    }

    clearFilterHandler() {
        this.filter = '';
        _.each(this.users, (item) => {
            item.hidden = item.username.indexOf(this.filter) == -1;
        });
    }

}
