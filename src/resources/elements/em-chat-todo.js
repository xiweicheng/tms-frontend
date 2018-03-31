import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChatTodo {

    @bindable actived;
    loginUser = nsCtx.loginUser;

    activedChanged(newValue, oldValue) {
        if (!newValue || this.actived.payload.action != nsCons.ACTION_TYPE_TODO) {
            return;
        }

        this.listMy();
    }

    listMy() {
        $.get('/admin/todo/listMy', {}, (data) => {
            if (data.success) {
                this.todos = data.data;
            } else {
                toastr.error(data.data, '获取待办事项列表失败！');
            }
        });
    }

}
