import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChatSidebarRight {

    lastSearch = true;

    /**
     * 构造函数
     */
    constructor() {

        this.subscribe = ea.subscribe(nsCons.EVENT_CHAT_SEARCH_RESULT, (payload) => {

            let result = payload.result;
            this.search = payload.search;
            this.searchPage = result;
            this.searchChats = result.content;
            this.lastSearch = result.last;
            this.moreSearchCnt = result.totalElements - (result.number + 1) * result.size;
        });
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {

        this.subscribe.dispose();
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        this.initHotkeys();
    }

    initHotkeys() {
        $(document).bind('keydown', 'o', () => {
            event.preventDefault();
            let item = _.find(this.searchChats, { isHover: true });
            item && (item.isOpen = !item.isOpen);
        });

    }

    searchItemMouseleaveHandler(item) {
        item.isOpen = false;
        item.isHover = false;
    }

    searchItemMouseenterHandler(item) {
        item.isHover = true;
    }

    gotoChatHandler(item) {
        ea.publish(nsCons.EVENT_CHAT_SEARCH_GOTO_CHAT_ITEM, { chatItem: item });
    }

    openSearchItemHandler(item) {
        item.isOpen = !item.isOpen;
    }

    searchMoreHandler() {

        this.searchMoreP = $.get('/admin/chat/direct/search', {
            search: this.search,
            size: this.searchPage.size,
            page: this.searchPage.number + 1
        }, (data) => {
            if (data.success) {
                this.searchChats = _.concat(this.searchChats, data.data.content);

                this.lastSearch = data.data.last;
                this.moreSearchCnt = data.data.totalElements - (data.data.number + 1) * data.data.size;
            }
        });
    }
}
