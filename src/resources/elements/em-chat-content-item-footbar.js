import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChatContentItemFootbar {

    @bindable chatChannel;

    emojis = [{
        label: '赞',
        value: ':+1:',
    }, {
        label: '踩',
        value: ':-1:',
    }, {
        label: '大笑',
        value: ':laughing:',
    }, {
        label: '困惑',
        value: ':confused:',
    }, {
        label: '心动',
        value: ':heart:',
    }];

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        $(this.addRef)
            .popup({
                inline: true,
                hoverable: true
            });
    }

    toggleEmojiHandler(item) {
        $.post('/admin/chat/channel/label/toggle', {
            basePath: utils.getBasePath(),
            name: item.value,
            id: this.chatChannel.id,
        }, (data, textStatus, xhr) => {
            if (data.success) {
                let cl = _.find(this.chatChannel.chatLabels, { id: data.data.id });
                if (cl) {
                    cl.voters = data.data.voters;
                } else {
                    this.chatChannel.chatLabels = [...this.chatChannel.chatLabels, data.data];
                }
            } else {
                toastr.error(data.data);
            }
        });
    }
}
