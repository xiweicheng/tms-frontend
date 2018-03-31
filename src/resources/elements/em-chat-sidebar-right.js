import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChatSidebarRight {

    @bindable loginUser;
    @bindable isAt;
    @bindable channel;

    actionMapping = {
        [nsCons.ACTION_TYPE_DIR]: { handler: this.dirHandler, nodata: '', show: 'dir', icon: 'unordered list', title: '消息目录' },
        [nsCons.ACTION_TYPE_AT]: { nodata: '暂无@消息', show: 'msg', icon: 'at', title: '我的消息' },
        [nsCons.ACTION_TYPE_STOW]: { nodata: '暂无收藏消息', show: 'msg', icon: 'empty star', title: '我的收藏' },
        [nsCons.ACTION_TYPE_ATTACH]: { handler: this.attachHandler, nodata: '', show: 'attach', icon: 'attach', title: '频道附件' },
        [nsCons.ACTION_TYPE_SCHEDULE]: { handler: this.scheduleHandler, nodata: '', show: 'schedule', icon: 'calendar outline', title: '我的日程' },
        [nsCons.ACTION_TYPE_SEARCH]: { nodata: '无符合检索结果', show: 'msg', icon: 'search', title: '检索结果' },
        [nsCons.ACTION_TYPE_PIN]: { nodata: '暂无频道固定消息', show: 'msg', icon: 'pin', title: '频道固定消息' },
        [nsCons.ACTION_TYPE_TOPIC]: { nodata: '', show: 'topic', icon: 'talk outline', title: '话题讨论' },
        [nsCons.ACTION_TYPE_TODO]: { handler: this.todoHandler, nodata: '暂无待办事项', show: 'todo', icon: 'ordered list', title: '待办事项' },
    }

    /**
     * 构造函数
     */
    constructor() {

        this.subscribe = ea.subscribe(nsCons.EVENT_CHAT_RIGHT_SIDEBAR_TOGGLE, (payload) => {
            this.actived = _.clone(this.actionMapping[payload.action]);
            this.actived.payload = payload;
            if (this.actived.handler) {
                _.bind(this.actived.handler, this, payload)();
            }
        });

        this.subscribe1 = ea.subscribe(nsCons.EVENT_CHAT_RIGHT_SIDEBAR_SCROLL_TO, (payload) => {
            $('.em-chat-sidebar-right div[ref="scrollbarRef"]').scrollTo(payload, 120);
        });

    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe.dispose();
        this.subscribe1.dispose();
    }

    attachHandler(payload) {
        this.chatAttachVm.fetch();
    }

    dirHandler(payload) {
        $(this.dirRef).empty().append(payload.result);
    }

    scheduleHandler(payload) {
        this.chatScheduleVm.show();
    }

    todoHandler(payload) {
        // this.chatScheduleVm.show();
    }

    closeHandler() {
        ea.publish(nsCons.EVENT_CHAT_TOGGLE_RIGHT_SIDEBAR, {});
    }

}
