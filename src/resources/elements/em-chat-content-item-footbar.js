import { bindable, containerless } from 'aurelia-framework';
import tags from 'common/common-tags';

@containerless
export class EmChatContentItemFootbar {

    @bindable chat;

    @bindable last;

    @bindable lastPre

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

    myTags = nsCtx.myTags;

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
                hoverable: true,
                delay: {
                    show: 500,
                    hide: 300
                }
            });
        $([this.addTagRef])
            .popup({
                inline: true,
                hoverable: true,
                delay: {
                    show: 500,
                    hide: 300
                },
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
            contentHtml: utils.md2html(this.chat.content, true),
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

        if (_.some(this.myTags, item)) {
            this.myTags.splice(_.findIndex(this.myTags, item), 1);
            this.myTags.splice(0, 0, item);
        }
    }

    toggleCustomTagHandler() {
        if (this.isCustomTag) {
            let v = $(this.tagRef).val();
            if (v) {
                let tag = { label: v, value: v, type: 'tag' }
                this.toggleChatLabelHandler(tag);
                $(this.tagRef).val('');

                if (!_.some(this.myTags, tag)) {
                    this.myTags.splice(0, 0, tag);
                }

            }
        } else {
            _.defer(() => $(this.tagRef).focus());
        }
        this.isCustomTag = !this.isCustomTag;
    }

    tagKeyupHandler() {
        this.toggleCustomTagHandler();
    }

    removeTagHandler(item, event) {

        event.stopPropagation();

        $.post(`/admin/chat/label/delete`, {
            name: item.value,
        }, (data, textStatus, xhr) => {
            if (data.success) {
                this.myTags = _.reject(this.myTags, { value: item.value });
                nsCtx.myTags = this.myTags;
            } else {
                toastr.error(data.data);
            }
        });
        return false;
    }

    stopPropagationHandler(event) {
        event.stopPropagation();
    }

    filterByLabelHandler(item, event) {
        event.stopPropagation();
        ea.publish(nsCons.EVENT_CHAT_DO_MSG_FILTER, { filter: `${item.name}` })
    }

    clearFilterByLabelHandler(item, event) {
        event.stopPropagation();
        ea.publish(nsCons.EVENT_CHAT_DO_MSG_FILTER, { filter: `${item.name}`, action: 'clear' })
    }

    searchByLabelHandler(item, event) {
        event.stopPropagation();
        ea.publish(nsCons.EVENT_CHAT_DO_MSG_SEARCH, { search: `tags:${item.name}` })
    }
}
