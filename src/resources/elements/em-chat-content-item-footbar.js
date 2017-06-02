import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChatContentItemFootbar {

    @bindable chatChannel;

    emojis = [{
        label: '赞同',
        value: ':+1:',
    }, {
        label: '反对',
        value: ':-1:',
    }, {
        label: '爱心',
        value: ':heart:',
    }, {
        label: '开心',
        value: ':laughing:',
    }, {
        label: '关注',
        value: ':eyes:',
    }, {
        label: '困惑',
        value: ':confused:',
    }, {
        label: '悲伤',
        value: ':cry:',
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
            url: utils.getUrl(),
            meta: $(emojify.replace(item.value)).attr('src'),
            contentHtml: utils.md2html(this.chatChannel.content),
            name: item.value,
            desc: item.label,
            id: this.chatChannel.id,
        }, (data, textStatus, xhr) => {
            if (data.success) {
                let cl = _.find(this.chatChannel.chatLabels, { id: data.data.id });
                if (cl) {
                    cl.voters = data.data.voters;
                } else {
                    this.chatChannel.chatLabels = [...this.chatChannel.chatLabels, data.data];
                }
                bs.signal('sg-emoji-refresh');
            } else {
                toastr.error(data.data);
            }
        });
    }
}
