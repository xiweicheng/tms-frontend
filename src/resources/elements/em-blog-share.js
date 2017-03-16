import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmBlogShare {

    shares = [];
    desc = '';

    @bindable blog;

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        $(this.searchRef)
            .search({
                minCharacters: 2,
                cache: false,
                selectFirstResult: true,
                onSelect: (result, response) => {
                    result.item._id = _.uniqueId('share-item-');
                    this.shares.push(result.item);
                    _.defer(() => { $(this.inputSearchRef).val(''); });
                },
                apiSettings: {
                    onResponse: (resp) => {
                        var response = {
                            results: []
                        };
                        $.each(resp.data.users, (index, item) => {
                            if (!_.find(this.shares, { username: item.username })) {
                                response.results.push({
                                    item: item,
                                    title: `<i class="user icon"></i> ${item.name} (${item.username})`,
                                });
                            }
                        });
                        $.each(resp.data.channels, (index, item) => {
                            if (!_.find(_.filter(this.shares, c => !c.username), { name: item.name })) {
                                response.results.push({
                                    item: item,
                                    title: `<i class="users icon"></i> ${item.title} (${item.name})`,
                                });
                            }
                        });
                        return response;
                    },
                    url: '/admin/blog/share/to/search?search={query}'
                }
            });
        $(this.shareRef).popup({
            on: 'click',
            inline: true,
            silent: true,
            position: 'bottom right',
            jitter: 300,
            delay: {
                show: 300,
                hide: 300
            },
            onVisible: () => {
                $(this.inputSearchRef).focus();
            }
        });
    }

    removeShareHandler(item) {
        this.shares = _.reject(this.shares, { _id: item._id });
    }

    cancelHandler() {
        this._reset();
    }

    _reset() {
        this.shares = [];
        this.desc = '';
        $(this.inputSearchRef).val('');
        $(this.shareRef).popup('hide');
    }

    shareHandler() {

        if (this.shares.length === 0) {
            toastr.error('请先指定博文分享用户或者频道!');
            return;
        }

        $.post('/admin/blog/share', {
     		basePath: utils.getBasePath(),
            id: this.blog.id,
            desc: this.desc,
            html: utils.md2html(this.blog.content),
            users: _.chain(this.shares).filter((item) => !!item.username).map('username').join().value(),
            channels: _.chain(this.shares).filter((item) => !item.username).map('name').join().value(),
        }, (data, textStatus, xhr) => {
            if (data.success) {
                this._reset();
                toastr.success('博文分享成功!');
            } else {
                toastr.error(data.data, '博文分享失败!');
            }
        });
    }
}
