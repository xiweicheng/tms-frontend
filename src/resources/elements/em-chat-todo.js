import {
    bindable,
    containerless
} from 'aurelia-framework';

@containerless
export class EmChatTodo {

    @bindable actived;
    loginUser = nsCtx.loginUser;
    title;
    todos = [];
    dones = [];
    todoFilter = '';

    last = true;

    activedChanged(newValue, oldValue) {
        if (!newValue || !this.actived || this.actived.payload.action != nsCons.ACTION_TYPE_TODO) {
            return;
        }

        this.listMy();
    }

    init() {
        if (!this.actived) {
            this.actived = {
                show: 'todo',
                payload: {
                    action: nsCons.ACTION_TYPE_TODO
                }
            };
        }
    }

    refresh() {
        this.init();
        this.listMy();
    }

    listMy() {

        this.ajax = $.get('/admin/todo/listMy/undone', {}, (data) => {
            if (data.success) {
                this.todos = data.data;
            } else {
                toastr.error(data.data, '获取待办事项列表失败！');
            }
        });

        this.ajaxDone = $.get('/admin/todo/listMy/done', {
            size: 20,
            page: 0,
        }, (data) => {
            if (data.success) {

                this.dones = data.data.content;

                this.page = data.data;
                this.last = data.data.last;
                this.moreCnt = data.data.totalElements - (data.data.number + 1) * data.data.size;
            } else {
                toastr.error(data.data, '获取待办事项列表失败！');
            }
        });

    }

    attached() {
        $(this.tasksAccRef).accordion({
            exclusive: false
        });
        this._initSortObjs();
    }

    _initSortObjs() {
        // tasks sort
        $('.tms-sortable-elem-tasks').each((i, e) => {

            let sortObj = Sortable.create(e, {
                group: {
                    name: 'task'
                },
                onEnd: (evt) => {

                    if (evt.from === evt.to) {

                        if (evt.newIndex === evt.oldIndex) return;

                        this._sortTasks($(evt.from).children('.tms-task-item'));

                    } else {

                        let todoId = $(evt.item).attr('data-id');
                        let priorityT = $(evt.to).attr('data-priority');

                        this.priorityUpdateHandler(_.find(this.todos, {
                            id: +todoId
                        }), priorityT, () => this._sortTasks($(evt.to).children('.tms-task-item')));

                    }
                },
            });

        });
    }

    _sortTasks($all, callback) {
        var items = [];
        $all.each((i, e) => {
            let tid = $(e).attr('data-id');
            items.push({
                id: tid,
                sort: i
            });

            $(e).attr('data-sort', i);

            // update todo sort value
            let todo = _.find(this.todos, {
                id: +tid
            });
            todo && (todo.sortIndex = i);

        })

        $.post("/admin/todo/sort", {
            items: JSON.stringify(items)
        }, (data) => {
            if (!data.success) {
                toastr.error(data.data);
            } else {
                this.todos = [...this.todos];
                callback && callback();
            }
        });
    }

    addTodoHandler(ctrlKey) {

        $(this.todoInputRef).focus();

        if (!this.title) {
            toastr.error('请输入待办事项内容！');
            return;
        }

        let topTodo = ctrlKey || (event && (event.ctrlKey || event.metaKey));

        this.ajax = $.post('/admin/todo/create', {
            title: this.title,
            sortIndex: 0
        }, (data, textStatus, xhr) => {
            if (data.success) {
                this.title = '';
                this.todos = [data.data, ...this.todos];

                if (topTodo) {
                    this.priorityUpdateHandler(data.data, 'ZyJj');
                }
            } else {
                toastr.error(data.data, '创建待办事项失败！');
            }
        });
    }

    addTodoKeyupHandler(event) {

        if (event.keyCode == 13) {
            this.addTodoHandler(event.ctrlKey);
        }
    }

    statusToggleHandler(item) {
        $.post('/admin/todo/update', {
            id: item.id,
            status: item.status == 'New' ? 'Doing' : "New"
        }, (data, textStatus, xhr) => {
            if (data.success) {
                item.status = data.data.status;
                item.updateDate = data.data.updateDate;
            } else {
                toastr.error(data.data, '更新待办事项失败！');
            }
        });
    }

    priorityUpdateHandler(item, priority, callback) {
        // Default, ZyJj, ZyBjj, BzyJi, BzyBjj;
        $.post('/admin/todo/update', {
            id: item.id,
            priority: priority ? priority : 'Default'
        }, (data, textStatus, xhr) => {
            if (data.success) {
                item.priority = data.data.priority;
                item.updateDate = data.data.updateDate;
                callback && callback();
            } else {
                toastr.error(data.data, '更新待办事项失败！');
            }
        });
    }

    statusDoneHandler(item) {
        $.post('/admin/todo/update', {
            id: item.id,
            status: 'Done'
        }, (data, textStatus, xhr) => {
            if (data.success) {
                this.todos = _.reject(this.todos, {
                    id: item.id
                });
                this.dones = [data.data, ...this.dones];
            } else {
                toastr.error(data.data, '更新待办事项失败！');
            }
        });
    }

    statusNewHandler(item) {
        $.post('/admin/todo/update', {
            id: item.id,
            status: 'New'
        }, (data, textStatus, xhr) => {
            if (data.success) {
                this.dones = _.reject(this.dones, {
                    id: item.id
                });
                this.todos = [data.data, ...this.todos];
            } else {
                toastr.error(data.data, '更新待办事项失败！');
            }
        });
    }

    delHandler(item, type) {
        $.post(`/admin/todo/delete/${item.id}`, {}, (data, textStatus, xhr) => {
            if (data.success) {
                if (type == 'todo') {
                    this.todos = _.reject(this.todos, {
                        id: item.id
                    });
                } else {
                    this.dones = _.reject(this.dones, {
                        id: item.id
                    });
                }
            } else {
                toastr.error(data.data, '删除待办事项失败！');
            }
        });
    }

    editHandler(item, inputRef) {
        item.isEditing = true;
        item.oldTitle = item.title;
        _.defer(() => $(inputRef).focus());
    }

    editContentHandler(item, textareaRef) {
        item.isOpen = !item.isOpen;
        if (item.isOpen) {
            item.oldContent = item.content;
            _.defer(() => {
                $(textareaRef).focus()
                if (item.content) {
                    autosize.update(textareaRef);
                }
            });
        }
    }

    updateEnterHandler(item, event) {
        $(event.target).blur();
        item.isEditing = false;
    }

    updateHandler(item) {
        item.isEditing = false;
        if (!_.trim(item.title) || item.title == item.oldTitle) {
            item.title = item.oldTitle
            return;
        }
        $.post('/admin/todo/update', {
            id: item.id,
            title: item.title
        }, (data, textStatus, xhr) => {
            if (data.success) {
                item.updateDate = data.data.updateDate;
                item.oldTitle = data.data.title;
                toastr.success('更新待办事项内容成功！');
            } else {
                item.title = item.oldTitle;
                toastr.error(data.data, '更新待办事项失败！');
            }
        });
    }

    updateDescHandler(item) {
        if (item.content == item.oldContent) {
            return;
        }
        $.post('/admin/todo/update', {
            id: item.id,
            content: item.content
        }, (data, textStatus, xhr) => {
            if (data.success) {
                item.updateDate = data.data.updateDate;
                item.oldContent = data.data.content;
                toastr.success('更新待办事项描述成功！');
            } else {
                item.content = item.oldContent;
                toastr.error(data.data, '更新待办事项失败！');
            }
        });
    }

    searchFocusHandler() {
        $(this.searchRemoveRef).show();
    }

    searchBlurHandler() {
        if (!this.todoFilter) {
            $(this.searchRemoveRef).hide();
        }
    }

    clearSearchHandler() {
        this.todoFilter = '';
        $(this.searchInputRef).focus();
    }

    loadMoreHandler() {
        this.searchMoreP = $.get('/admin/todo/listMy/done', {
            size: this.page.size,
            page: this.page.number + 1
        }, (data) => {
            if (data.success) {

                this.dones = [...this.dones, ...data.data.content];

                this.page = data.data;
                this.last = data.data.last;
                this.moreCnt = data.data.totalElements - (data.data.number + 1) * data.data.size;
            } else {
                toastr.error(data.data, '获取待办事项列表失败！');
            }
        });
    }

}
