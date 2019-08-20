export class UserLogin {

    username = '';
    password = '';
    userRegister;

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        $(this.rememberMeRef).checkbox();
        _.delay(() => this.userRegister = _.isNil(tmsSysConfig.userRegister) ? true : tmsSysConfig.userRegister, 100);
    }

    kdHandler(evt) {
        if (evt.keyCode === 13) {
            this.loginHandler();
        }

        return true;
    }

    loginHandler() {

        // $.get('/admin/login', (data) => {

        let rm = $(this.rememberMeRef).checkbox('is checked') ? 'on' : '';

        $.post('/admin/signin', {
            username: this.username,
            password: this.password,
            "remember-me": rm
        }).done(() => {

            localStorage && localStorage.setItem(nsCons.KEY_LOGIN_USERNAME, this.username);

            let redirect = utils.urlQuery('redirect');
            if (redirect) {
                window.location = decodeURIComponent(redirect);
            } else {
                let chatTo = null;
                if (localStorage) {
                    chatTo = localStorage.getItem(nsCons.KEY_REMEMBER_LAST_CHAT_TO);
                }
                if (chatTo) {
                    window.location = wurl('path') + `#/chat/${chatTo}`;
                } else {
                    window.location = wurl('path') + `#/chat/@${this.username}`;
                }
            }

        }).fail((xhr, sts, err) => {
            if (xhr.status == 401) {
                toastr.error('用户名密码不正确!');
            } else if (xhr.status != 0) {
                toastr.error('网络连接错误!');
            }
        });
        // });

        return true;

    }
}
