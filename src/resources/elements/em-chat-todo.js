import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChatTodo {

    @bindable actived;
    loginUser = nsCtx.loginUser;
    title;
    todos = [];
    dones = [];

    activedChanged(newValue, oldValue) {
        if (!newValue || this.actived.payload.action != nsCons.ACTION_TYPE_TODO) {
            return;
        }

        this.listMy();
    }

    listMy() {
        this.ajax = $.get('/admin/todo/listMy', {}, (data) => {
            if (data.success) {
                this.todos = _.reject(data.data, { status: 'Done' });
                this.dones = _.filter(data.data, { status: 'Done' });
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

    statusToggleHandler(item) {
        $.post('/admin/todo/update', { id: item.id, status: item.status == 'New' ? 'Doing' : "New" }, (data, textStatus, xhr) => {
            if (data.success) {
                item.status = data.data.status;
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

    updateHandler(item) {
        item.isEditing = false;
        if (!_.trim(item.title) || item.title == item.oldTitle) {
        	item.title = item.oldTitle
            return;
        }
        $.post('/admin/todo/update', { id: item.id, title: item.title }, (data, textStatus, xhr) => {
            if (data.success) {} else {
                item.title = item.oldTitle;
                toastr.error(data.data, '更新待办事项失败！');
            }
        });
    }

}
