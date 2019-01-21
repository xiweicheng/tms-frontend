import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChannelTask {

    @bindable channel;
    @bindable loginUser;

    channelChanged() {
        _.each(this.mapping, (v, k) => {
            this[v] = {};
        });
    }

    size = 10;

    cols = [{
        name: '待处理',
        value: 'todo',
    }, {
        name: '进行中',
        value: 'doing',
    }, {
        name: '已完成',
        value: 'done',
    }, {
        name: '已验收',
        value: 'verified',
    }];

    /**
     * 构造函数
     */
    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_CHANNEL_TASK_COL_REFRESH, (payload) => {

            if (_.some(this.cols, payload)) {
                this._refresh(payload.name);
            }

        });
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {

        this.subscribe.dispose();
    }

    async _getTasks(label, page) {
        let pageTask = {};
        await $.get('/admin/channel/task/listBy', {
            page: page,
            size: this.size,
            cid: this.channel.id,
            label: label
        }, (data) => {
            if (data.success) {
                pageTask = data.data;
            }
        });

        return pageTask;
    }

    init() {

        _.each(this.cols, (col) => {
            this._getTasks(col.name, 0).then(data => {
                col.page = data;
                col.moreCnt = col.page.last ? 0 : col.page.totalElements - (col.page.number + 1) * col.page.size;
            });
        });

    }

    bind(ctx) {

    }

    _refresh(label) {
        this._getTasks(label, 0).then(data => {
            let col = _.find(this.cols, { name: label });
            col.page = data;
            col.moreCnt = col.page.last ? 0 : col.page.totalElements - (col.page.number + 1) * col.page.size;
        });
    }

    moreHandler(col) {

        col.ajax = $.get('/admin/channel/task/listBy', {
            page: col.page.number + 1,
            size: this.size,
            cid: this.channel.id,
            label: col.name
        }, (data) => {
            if (data.success) {
                col.page.content.push(...data.data.content);
                col.page.number++;
                col.page.last = data.data.last;
                col.page.first = data.data.first;
                col.moreCnt = col.page.last ? 0 : col.page.totalElements - (col.page.number + 1) * col.page.size;
            }
        });
    }

    attached() {
        this.drake = dragula($(this.containerRef).find('.tms-dd-container').toArray(), {
            // isContainer: function(el) {
            //     return true; // only elements in drake.containers will be taken into account
            // },
            // moves: function(el, source, handle, sibling) {
            //     return true; // elements are always draggable by default
            // },
            // accepts: function(el, target, source, sibling) {
            //     return true; // elements can be dropped in any of the `containers` by default
            // },
            // invalid: function(el, handle) {
            //     return false; // don't prevent any drags from initiating by default
            // },
            // direction: 'vertical', // Y axis is considered when determining where an element would be dropped
            // copy: false, // elements are moved by default, not copied
            // copySortSource: false, // elements in copy-source containers can be reordered
            // revertOnSpill: false, // spilling will put the element back where it was dragged from, if this is true
            // removeOnSpill: false, // spilling will `.remove` the element, if this is true
            // mirrorContainer: document.body, // set the element that gets mirror elements appended
            // ignoreInputTextSelection: true // allows users to select input text, see details below
        });

        this.drake.on('drop', (el, target, source, sibling) => {

            // console.log(el, target, source, sibling)

            let id = $(el).attr('data-id');
            let t = $(target).attr('data-sts');
            let s = $(source).attr('data-sts');

            // console.log(id, t, s)

            if (t == s) return;

            $.post('/admin/channel/task/status/update', {
                id: id,
                from: s,
                to: t,
            }, (data, textStatus, xhr) => {
                if (data.success) {
                    toastr.success('操作成功！');
                    this._refresh(t);
                    this._refresh(s);
                }
            });

        });
    }

    removeHandler(item, col) {
        if (this.channel.creator.username != this.loginUser.username) {
            toastr.error('删除权限不足！');
            return;
        }

        $.post('/admin/channel/task/remove', {
            id: item.id,
            label: col.name
        }, (data, textStatus, xhr) => {
            if (data.success) {
                toastr.success('操作成功！');
                this._refresh(col.name);
            }
        });
    }
}
