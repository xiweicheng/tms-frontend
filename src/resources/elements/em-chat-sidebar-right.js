import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChatSidebarRight {

    @bindable loginUser;
    @bindable isAt;
    @bindable channel;

    actionMapping = {
        [nsCons.ACTION_TYPE_DIR]: { handler: this.dirHandler, nodata: '', show: 'dir' },
        [nsCons.ACTION_TYPE_AT]: { handler: this.atHandler, nodata: '暂无@消息', show: 'msg' },
        [nsCons.ACTION_TYPE_STOW]: { handler: this.stowHandler, nodata: '暂无收藏消息', show: 'msg' },
        [nsCons.ACTION_TYPE_ATTACH]: { handler: this.attachHandler, nodata: '', show: 'attach' },
        [nsCons.ACTION_TYPE_SCHEDULE]: { handler: this.scheduleHandler, nodata: '', show: 'schedule' },
        [nsCons.ACTION_TYPE_SEARCH]: { handler: this.serachHandler, nodata: '无符合检索结果', show: 'msg' },
    }

    /**
     * 构造函数
     */
    constructor() {

        this.subscribe = ea.subscribe(nsCons.EVENT_CHAT_RIGHT_SIDEBAR_TOGGLE, (payload) => {
            this.actived = this.actionMapping[payload.action];
            this.actived.payload = payload;
            _.bind(this.actived.handler, this, payload)();
        });

    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {

        this.subscribe.dispose();
    }

    serachHandler(payload) {
    }

    atHandler(payload) {
    }

    stowHandler(payload) {
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

}
