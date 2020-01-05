import {
    bindable,
    containerless
} from 'aurelia-framework';

@containerless
export class EmChannelTask {

    @bindable channel;
    @bindable loginUser;

    channelChanged() {
        // _.each(this.mapping, (v, k) => {
        //     this[v] = {};
        // });

        this._sortMembers();
    }

    size = 20;

    cols = [{
        name: '待规划',
        value: 'new',
    }, {
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

    filterLbls = []; // 过滤任务标签

    /**
     * 构造函数
     */
    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_CHANNEL_TASK_COL_REFRESH, (payload) => {

            if (_.some(this.cols, payload)) {
                this._refresh(payload.name);
            }

        });

        this.subscribe2 = ea.subscribe(nsCons.EVENT_CHANNEL_TASK_LABELS_REFRESH, (payload) => {

            _.each(this.cols, col => {
                if (col.name != payload.col.name) {
                    let task = _.find(col.page.content, {
                        id: payload.task.id
                    });
                    if (task) {
                        let lbl = _.find(task.chatLabels, {
                            id: payload.label.id
                        });
                        if (lbl) {
                            lbl.voters = payload.label.voters;
                        } else {
                            task.chatLabels.push(payload.label);
                        }
                    }
                }
            });

            if (payload.label.voters.length == 0) {
                this._removeFilterLbl(payload.label);
            } else {
                this._addFilterLbl(payload.label);
            }

        });

        this.subscribe3 = ea.subscribe(nsCons.EVENT_CHANNEL_TASK_TALK_SHOW, (payload) => {

            this.talkVm.show(payload);

        });

        this.subscribe4 = ea.subscribe(nsCons.EVENT_MARKDOWN_TASK_ITEM_STATUS_TOGGLE, (payload) => {
            // console.log(payload);

            if (payload.case != 'task') return;

            let col = _.find(this.cols, {
                name: payload.from
            });

            let task = _.find(col.page.content, {
                id: +payload.id
            });

            if (task && (task.creator.username == this.loginUser.username || task.openEdit)) {
                let lines = task.content.split('\n');
                // console.log(lines)
                let index = -1;
                for (var i = 0; i < lines.length; i++) {

                    // console.log(lines[i])

                    if (/^\- \s*\[[x ]\]\s*/.test(lines[i])) {
                        if (++index == payload.index) {
                            if (/^\- \s*\[[x]\]\s*/.test(lines[i])) {
                                lines[i] = lines[i].replace(/^\- \s*\[[x]\]/, `- [ ]`);
                                // console.log('==' + lines[i])
                            } else if (/^\- \s*\[[ ]\]\s*/.test(lines[i])) {
                                lines[i] = lines[i].replace(/^\- \s*\[[ ]\]/, `- [x]`);
                                // console.log('==' + lines[i])
                            }

                            break;

                        }
                    }
                }

                this.sending = true;

                task.contentOld = task.content;
                task.content = lines.join('\n');

                // var html = utils.md2html(chat.content, true);
                // var htmlOld = utils.md2html(chat.contentOld, true);

                let url = `/admin/chat/channel/update`;
                let data = {
                    url: utils.getUrl(),
                    id: task.id,
                    version: task.version,
                    usernames: utils.parseUsernames(task.content, [nsCtx.memberAll, ...this.channel.members], this.channel).join(','),
                    content: task.content,
                    diff: utils.diffS(task.contentOld, task.content)
                };

                $.post(url, data, (data, textStatus, xhr) => {
                    if (data.success) {
                        toastr.success('更新消息成功!');
                        // chat.isEditing = false;
                        task.version = data.data.version;
                    } else {
                        toastr.error(data.data, '更新消息失败!');
                    }
                }).always(() => {
                    this.sending = false;
                });

            } else {
                payload.event && payload.event.preventDefault();
                toastr.warning(`更新权限不足!`);
            }

        });

        this.subscribe5 = ea.subscribe(nsCons.EVENT_CHANNEL_TASK_EDIT, (payload) => {

            this.addVm.showEdit(payload);

        });

    }

    // 判断标签是否在泳道列标签类别中
    _isInLblInCols(lbl) {
        return _.some(this.cols, col => col.name == lbl.name);
    }

    _addFilterLbl(lbl) {

        if (!_.some(this.filterLbls, flbl => flbl.name == lbl.name) && !this._isInLblInCols(lbl)) {
            this.filterLbls.push({
                name: lbl.name,
                active: false
            });
        }

    }

    _removeFilterLbl(lbl) {

        // 如果全部task不再包含删除的标签
        if (!_.some(this.cols, col => {
                return _.some(col.page.content, task => {
                    return _.some(task.chatLabels, clbl => {
                        return (clbl.name == lbl.name && clbl.voters.length > 0);
                    });
                });
            })) {
            let flbl = _.find(this.filterLbls, item => item.name == lbl.name);
            if (flbl) {
                _.remove(this.filterLbls, flbl => flbl.name == lbl.name);
                if (flbl.active) {
                    this.lblFilterHandler(flbl);
                }
            }
        }
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {

        this.subscribe.dispose();
        this.subscribe2.dispose();
        this.subscribe3.dispose();
        this.subscribe4.dispose();
        this.subscribe5.dispose();
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

    _filterLabels(tasks) {
        let clbls = _.filter(_.flatMap(tasks, 'chatLabels'), clbl => clbl.status != 'Deleted');
        let lbls = _.uniq(_.map(clbls, 'name'));

        lbls = _.filter(lbls, lbl => {
            return !_.find(this.cols, col => col.name == lbl)
        });

        lbls = _.flatMap(lbls, lbl => {
            return {
                name: lbl,
                active: false
            }
        });

        this.filterLbls = _.uniqBy([...this.filterLbls, ...lbls], 'name');

        if (this.filterLbls.length > 0) {
            $(this.containerRef).css('height', 'calc(100% - 54px)');
        }
    }

    init() {

        this.filterLbls = [];

        _.each(this.cols, (col) => {
            this._getTasks(col.name, 0).then(data => {
                col.page = data;
                col.moreCnt = col.page.last ? 0 : col.page.totalElements - (col.page.number + 1) * col.page.size;

                // task labels filter
                this._filterLabels(data.content);
            });
        });

    }

    bind(ctx) {
        this._sortMembers();
    }

    refreshHandler(col) {
        this._refresh(col.name);
        toastr.success(`刷新操作成功！`);
    }

    _refresh(label) {
        this._getTasks(label, 0).then(data => {
            let col = _.find(this.cols, {
                name: label
            });
            col._filterVal && _.each(data.content, item => {
                let crHas = _.some(item.chatReplies, cr => {
                    let crcHas = (_.includes(cr.content, `{~${col._filterVal}}`) || _.includes(cr.content, `{~all}`) || _.includes(cr.content, col._filterTxt));
                    return cr.creator.username == col._filterVal || crcHas;
                });
                let cHas = (_.includes(item.content, `{~${col._filterVal}}`) || _.includes(item.content, `{~all}`) || _.includes(item.content, col._filterTxt));
                item._hidden = (item.creator.username != col._filterVal && !crHas && !cHas);
            });

            col.page = data;

            this._lblFilter(col);

            col.moreCnt = col.page.last ? 0 : col.page.totalElements - (col.page.number + 1) * col.page.size;

            // task labels filter
            this._filterLabels(data.content);
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
                col._filterVal && _.each(data.data.content, item => {
                    let crHas = _.some(item.chatReplies, cr => {
                        let crcHas = (_.includes(cr.content, `{~${col._filterVal}}`) || _.includes(cr.content, `{~all}`) || _.includes(cr.content, col._filterTxt));
                        return cr.creator.username == col._filterVal || crcHas;
                    });
                    let cHas = (_.includes(item.content, `{~${col._filterVal}}`) || _.includes(item.content, `{~all}`) || _.includes(item.content, col._filterTxt));
                    item._hidden = (item.creator.username != col._filterVal && !crHas && !cHas);
                });

                col.page.content.push(...data.data.content);

                this._lblFilter(col);

                col.page.number++;
                col.page.last = data.data.last;
                col.page.first = data.data.first;
                col.moreCnt = col.page.last ? 0 : col.page.totalElements - (col.page.number + 1) * col.page.size;

                // task labels filter
                this._filterLabels(data.data.content);
            }
        });
    }

    detached() {

        this.drake.destroy();
        this.drake = null;

        $('.em-channel-task').off('click', '.tms-task-filter > .text .remove.icon', this.taskClickHandler);

        this.taskClickHandler = null;
        this.channel = null;
        this.loginUser = null;
        this.filterLbls = [];
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
                all: window.event ? window.event.shiftKey : false
            }, (data, textStatus, xhr) => {
                if (data.success) {
                    toastr.success('操作成功！');
                    this._refresh(t);
                    this._refresh(s);
                }
            });

        });

        this.taskClickHandler = event => {

            let $dd = $(event.currentTarget).parents('.tms-task-filter');
            $dd.dropdown('clear').dropdown('hide');
            let col = _.find(this.cols, {
                name: $dd.attr('data-col-name')
            });
            if (col) {
                delete col['_filter'];
                _.each(col.page.content, item => {
                    item._hidden = false;
                });
                // 继续判断是否标签过滤筛选
                this._lblFilter(col);
            }
        };

        $('.em-channel-task').on('click', '.tms-task-filter > .text .remove.icon', this.taskClickHandler);
    }

    _sortMembers() {
        if (this.channel) {
            let me = _.find(this.channel.members, {
                username: nsCtx.loginUser.username
            });
            let members = _.sortBy(this.channel.members, ['name', 'username']);
            if (me) {
                members = _.reject(members, {
                    username: nsCtx.loginUser.username
                });
                this.channel.members = [me, ...members];
            } else {
                this.channel.members = members;
            }
        }
    }

    removeHandler(item, col) {
        if (this.channel.creator.username != this.loginUser.username) {
            toastr.error('删除权限不足！');
            return;
        }

        let label = _.find(item.chatLabels, cl => {
            if (cl.type == 'Tag' && cl.status != 'Deleted' && cl.name == col.name) {
                return true;
            }
            return false;
        });

        if (!label) return;

        $.post('/admin/channel/task/remove', {
            id: item.id,
            label: col.name
        }, (data, textStatus, xhr) => {
            if (data.success) {
                toastr.success('操作成功！');

                try {
                    col.page.content.splice(col.page.content.indexOf(item), 1);
                } catch (e) {
                    console.log(e);
                }

                this._refresh(col.name);
                ea.publish(nsCons.EVENT_CHANNEL_TASK_LABELS_REFRESH, {
                    col: col,
                    label: {
                        id: label.id,
                        name: label.name,
                        voters: []
                    },
                    task: item
                });
            }
        });
    }

    initFilterHandler(filterRef, col) {
        $(filterRef).dropdown({
            onChange: (value, text, $choice) => {
                col._filterVal = value;
                col._filterTxt = text;

                _.each(col.page.content, item => {
                    let crHas = _.some(item.chatReplies, cr => {
                        let crcHas = (_.includes(cr.content, `{~${value}}`) || _.includes(cr.content, `{~all}`) || _.includes(cr.content, text));
                        return cr.creator.username == value || crcHas;
                    });
                    let cHas = (_.includes(item.content, `{~${value}}`) || _.includes(item.content, `{~all}`) || _.includes(item.content, text));
                    item._hidden = (item.creator.username != value && !crHas && !cHas);
                });

                this._lblFilter(col);

            }
        });
    }

    addHandler(col) {
        this.addVm.show(col);
    }

    mouseenterHandler(item) {
        if (!item.hasOwnProperty('_stowed') || _.isUndefined(item._stowed)) {
            $.get('/admin/chat/channel/isMyStow', {
                id: item.id
            }, (data, textStatus, xhr) => {
                if (data.data) {
                    item._stowed = true;
                    item.stowId = data.data.id;
                } else {
                    item._stowed = false;
                }
            });
        }
    }

    _lblFilter(col) {
        let aLbls = _.filter(this.filterLbls, 'active');
        if (aLbls.length > 0) {
            _.each(col.page.content, item => {
                if (!item._hidden) {
                    item._hidden = !_.some(aLbls, aLbl => {
                        return _.some(item.chatLabels, clbl => {
                            return (clbl.name == aLbl.name) && (clbl.status != 'Deleted');
                        });
                    });
                }
            })
        }
    }

    // 标签过滤是否隐藏
    _isLblFilterHidden(item) {

        let aLbls = _.filter(this.filterLbls, 'active');

        if (aLbls.length == 0) {
            return false;
        } else {
            return !_.some(aLbls, aLbl => {
                return _.some(item.chatLabels, clbl => {
                    return (clbl.name == aLbl.name) && (clbl.status != 'Deleted');
                });
            });
        }

    }

    lblFilterHandler(lbl) {
        lbl.active = !lbl.active;

        _.each(this.cols, col => {
            _.each(col.page.content, item => {
                if (!(col._filterVal && item._hidden)) { // 如果列非（按照人过滤筛选 & 隐藏状态）
                    item._hidden = this._isLblFilterHidden(item);
                }
            })
        });
    }
}
