class ChatService {

    async loginUser(useCache) {

        if (!useCache || !this.user) {

            // login user
            await $.get('/admin/user/loginUser', (data) => {
                if (data.success) {
                    this.user = data.data;
                }
            });
        }

        return this.user;
    }

    async sysConf(useCache) {

        if (!useCache || !this._sysConf) {

            // sys conf
            await $.get('/admin/sys/conf', (data) => {
                if (data.success) {
                    this._sysConf = data.data;
                }
            });
        }

        return this._sysConf;
    }

    async listUsers(useCache) {

        if (!useCache || !this.users) {

            // users
            await $.get('/admin/user/all', {
                // enabled: true
            }, (data) => {
                if (data.success) {
                    this.users = data.data;
                }
            });
        }

        return this.users;
    }

    async listChannels(useCache) {

        if (!useCache || !this.channels) {

            // channels
            await $.get('/admin/channel/listMy', (data) => {
                if (data.success) {
                    this.channels = data.data;
                }
            });

        }

        return this.channels;
    }

    async listMyTags(useCache) {

        if (!useCache || !this.myTags) {

            await $.get('/admin/chat/channel/label/listMy', (data) => {
                if (data.success) {
                    this.myTags = _.map(data.data, item => {
                        return {
                            label: item,
                            value: item,
                            type: 'tag',
                            undel: _.includes(['待规划', '待处理', '进行中', '已完成', '已验收'], item)
                        }
                    })
                }
            });

        }

        return this.myTags;
    }
}

export default new ChatService();
