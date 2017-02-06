export class UserLogin {

    username = '';
    password = '';

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        $(this.rememberMeRef).checkbox();
    }

    kdHandler(evt) {
        if (evt.keyCode === 13) {
            this.loginHandler();
        }

        return true;
    }

    loginHandler() {

        $.get('/admin/login', (data) => {

            let rm = $(this.rememberMeRef).checkbox('is checked') ? 'on' : '';

            $.post('/admin/signin', {
                username: this.username,
                password: this.password,
                "remember-me": rm
            }).always(() => {
                let redirect = utils.urlQuery('redirect');
                if (redirect) {
                    window.location = decodeURIComponent(redirect);
                } else {
                    window.location = wurl('path');
                }

            }).fail((xhr, sts, err) => {
                if (xhr.status == 401) {
                    toastr.error('用户名密码不正确!');
                } else if(xhr.status != 0) {
                    toastr.error('网络连接错误!');
                }
            });
        });

        return true;

    }
}
