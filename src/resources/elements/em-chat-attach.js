import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChatAttach {

    type = 'Image'; //Image | Attachment

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        $(this.tabRef).find('.item').tab({
            onVisible: (tabPath) => {
                this.type = tabPath;
                this.fetch();
            }
        });
    }

    moreHandler() {
        this._listByPage(true);
    }

    _listByPage(nextPage = false) {
        let url = nsCtx.isAt ? '/admin/file/listByUser' : '/admin/file/listByChannel';
        this.ajax = $.get(url, {
            name: nsCtx.chatTo,
            type: this.type,
            page: this.page ? (nextPage ? this.page.number + 1 : this.page.number) : 0,
            size: 10,
            search: ''
        }, (data) => {
            this.page = data.data;
            this.moreCnt = this.page.last ? 0 : this.page.totalElements - (this.page.number + 1) * this.page.size;
            if (!nextPage) {
                this.attachs = data.data.content;
            } else {
                this.attachs = _.concat(this.attachs, data.data.content);
            }

        });
    }

    fetch() {
    	this.page = null;
    	this.moreCnt = 0;
    	this.attachs = null;
        this._listByPage();
    }
}
