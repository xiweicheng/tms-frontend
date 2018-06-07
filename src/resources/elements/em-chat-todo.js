import { bindable, containerless } from 'aurelia-framework';

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
        if (!newValue || this.actived.payload.action != nsCons.ACTION_TYPE_TODO) {
            return;
        }

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

    addTodoHandler() {

        $(this.todoInputRef).focus();

        if (!this.title) {
            toastr.error('请输入待办事项内容！');
            return;
        }

        this.ajax = $.post('/admin/todo/create', { title: this.title }, (data, textStatus, xhr) => {
            if (data.success) {
                this.title = '';
                this.todos = [data.data, ...this.todos];
            } else {
                toastr.error(data.data, '创建待办事项失败！');
            }
        });
    }

    addTodoKeyupHandler(event) {

        if (event.keyCode == 13) {
            this.addTodoHandler();
        }
    }

    statusToggleHandler(item) {
        $.post('/admin/todo/update', { id: item.id, status: item.status == 'New' ? 'Doing' : "New" }, (data, textStatus, xhr) => {
            if (data.success) {
                item.status = data.data.status;
                item.updateDate = data.data.updateDate;
            } else {
                toastr.error(data.data, '更新待办事项失败！');
            }
        });
    }

    statusDoneHandler(item) {
        $.post('/admin/todo/update', { id: item.id, status: 'Done' }, (data, textStatus, xhr) => {
            if (data.success) {
                this.todos = _.reject(this.todos, { id: item.id });
                this.dones = [data.data, ...this.dones];
            } else {
                toastr.error(data.data, '更新待办事项失败！');
            }
        });
    }

    statusNewHandler(item) {
        $.post('/admin/todo/update', { id: item.id, status: 'New' }, (data, textStatus, xhr) => {
            if (data.success) {
                this.dones = _.reject(this.dones, { id: item.id });
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
                    this.todos = _.reject(this.todos, { id: item.id });
                } else {
                    this.dones = _.reject(this.dones, { id: item.id });
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

    updateHandler(item) {
        item.isEditing = false;
        if (!_.trim(item.title) || item.title == item.oldTitle) {
            item.title = item.oldTitle
            return;
        }
        $.post('/admin/todo/update', { id: item.id, title: item.title }, (data, textStatus, xhr) => {
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
        $.post('/admin/todo/update', { id: item.id, content: item.content }, (data, textStatus, xhr) => {
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

    topHandler(item) {
        $.post('/admin/todo/update', { id: item.id, sortIndex: item.sortIndex ? 0 : 1 }, (data, textStatus, xhr) => {
            if (data.success) {
                item.updateDate = data.data.updateDate;
                item.sortIndex = data.data.sortIndex;
                toastr.success(`${item.sortIndex ? '' : '取消'}置顶待办事项成功！`);
                this.todos = [...this.todos];
            } else {
                toastr.error(data.data, `${!item.sortIndex ? '' : '取消'}置顶待办事项失败！`);
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
