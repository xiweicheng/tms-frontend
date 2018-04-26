import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChatMemberPopup {

    members = [];
    member = {};

    /**
     * 构造函数
     */
    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_CHAT_MEMBER_POPUP_SHOW, (payload) => {
            this.channel = payload.channel;
            this.username = payload.username;
            this.target = payload.target;
            this.type = _.includes(payload.type, 'at-group') ? 'at-group' : 'at-user';
            if (this.type == 'at-group') {
                this.group = _.find(_.reject(this.channel.channelGroups, { status: 'Deleted' }), { name: this.username });
                this.members = this.group.members;
            } else {
                this.group = null;
                if (this.username == 'all') {
                    if (!this.channel) {
                        return;
                    }
                    this.members = this.channel.members;
                } else {
                    if (!this.username) {
                        return;
                    }
                    this.member = utils.getUser(this.username);
                    let user = utils.getUser(this.member.creator);
                    this.member.creatorName = (user && (!!user.name)) ? user.name : this.member.creator;
                }
            }
            _.defer(() => {

                $(this.target).popup('is hidden') && $(this.target).popup({
                    popup: this.popup,
                    hoverable: true,
                    inline: false,
                    silent: true,
                    movePopup: false,
                    position: 'bottom left',
                    jitter: 300,
                    prefer: 'opposite',
                    // boundary: '.tms-content',
                    // context: '.tms-content',
                    // maxSearchDepth: 50,
                    delay: {
                        show: 300,
                        hide: 300
                    }
                }).popup('show');
            });
        });
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe.dispose();
    }
}
