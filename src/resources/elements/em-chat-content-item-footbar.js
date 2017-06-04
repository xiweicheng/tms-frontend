import { bindable, containerless } from 'aurelia-framework';
import tags from 'common/common-tags';

@containerless
export class EmChatContentItemFootbar {

    @bindable chat;

    emojis = [{
        label: '赞同',
        value: ':+1:',
        type: 'emoji'
    }, {
        label: '反对',
        value: ':-1:',
        type: 'emoji'
    }, {
        label: '知悉',
        value: ':ok_hand:',
        type: 'emoji'
    }, {
        label: '关注',
        value: ':eyes:',
        type: 'emoji'
    }, {
        label: '爱心',
        value: ':heart:',
        type: 'emoji'
    }, {
        label: '开心',
        value: ':laughing:',
        type: 'emoji'
    }, {
        label: '困惑',
        value: ':confused:',
        type: 'emoji'
    }, {
        label: '悲伤',
        value: ':cry:',
        type: 'emoji'
    }];

    /**
     * 构造函数
     */
    constructor() {
        this.tags = tags;
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        $([this.addEmojiRef])
            .popup({
                inline: true,
                hoverable: true
            });
        $([this.addTagRef])
            .popup({
                inline: true,
                hoverable: true,
                // position: 'top center',
                onHide: () => {
                    this.isCustomTag = false;
                    $(this.tagRef).val('');
                }
            });
    }

    toggleChatLabelHandler(item) {
        $.post(`/admin/chat/${nsCtx.isAt ? 'direct' : 'channel'}/label/toggle`, {
            url: nsCtx.isAt ? utils.getBasePath() : utils.getUrl(),
            meta: item.type == 'emoji' ? $(emojify.replace(item.value)).attr('src') : item.value,
            type: item.type == 'emoji' ? 'Emoji' : 'Tag',
            contentHtml: utils.md2html(this.chat.content),
            name: item.value,
            desc: item.label,
            id: this.chat.id,
        }, (data, textStatus, xhr) => {
            if (data.success) {
                let cl = _.find(this.chat.chatLabels, { id: data.data.id });
                if (cl) {
                    cl.voters = data.data.voters;
                } else {
                    this.chat.chatLabels = [...this.chat.chatLabels, data.data];
                }
                bs.signal('sg-chatlabel-refresh');
            } else {
                toastr.error(data.data);
            }
        });
    }

    toggleCustomTagHandler() {
        if (this.isCustomTag) {
            let v = $(this.tagRef).val();
            if (v) {
                this.toggleChatLabelHandler({
                    label: v,
                    value: v,
                    type: 'Tag'
                });
                $(this.tagRef).val('');
            }
        } else {
            _.defer(() => $(this.tagRef).focus());
        }
        this.isCustomTag = !this.isCustomTag;
    }

    tagKeyupHandler() {
        this.toggleCustomTagHandler();
    }
}
