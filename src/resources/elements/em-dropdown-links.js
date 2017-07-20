import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmDropdownLinks {

    isSuper = nsCtx.isSuper;

    /**
     * 构造函数
     */
    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_SYSTEM_LINKS_REFRESH, (payload) => {
            this._refreshSysLinks();
        });

    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        $(this.ddRef).dropdown({
            fullTextSearch: true,
            action: (text, value, element) => {
                $(this.ddRef).dropdown('hide');
                $.post('/admin/link/count/inc', { id: $(element).attr('data-id') });
                _.defer(() => utils.openNewWin(value));
            }
        });
    }


    bind(bindingCtx, overrideCtx) {
        this._refreshSysLinks();
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe.dispose();
    }

    _refreshSysLinks() {
        $.get('/admin/link/listByApp', (data) => {
            if (data.success) {
                this.sysLinks = data.data;
            } else {
                this.sysLinks = [];
            }
        });

        $.get('/admin/link/listByType', {
            type: 'Channel'
        }, (data) => {
            if (data.success) {
                this.channelLinks = data.data;
            } else {
                this.channelLinks = [];
            }
        });
    }

    addChannelLinkHandler(event) {
        this.sysLinkMgrVm.show();
    }

    sysLinkHandler(item) {
        return false;
    }
}
