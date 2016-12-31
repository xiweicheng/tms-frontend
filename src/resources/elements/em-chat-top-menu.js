import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChatTopMenu {

    @bindable users;
    @bindable loginUser;
    @bindable chatTo;

    chatToChanged() {
        $(this.chatToDropdownRef).dropdown('set selected', this.chatTo);
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        this.initHotkeys();
        this.initSearch();
    }

    initSearch() {
        var source = [];
        if (localStorage) {
            var v = localStorage.getItem('tms/chat-direct:search');
            source = v ? $.parseJSON(v) : [];
        }
        this.searchSource = source;
        $(this.searchRef).search({
            source: source,
            onSelect: (result, response) => {
                this.searchHandler();
            },
            onResults: () => {
                $(this.searchRef).search('hide results');
            }
        });

    }

    searchHandler() {

        $(this.searchRef).search('hide results');

        let search = $(this.searchInputRef).val();

        if (!search || search.length < 2) {
            toastr.error('检索条件至少需要两个字符!');
            return;
        }

        this.search = search;

        // 保存检索值
        var isExists = false;
        $.each(this.searchSource, function(index, val) {
            if (val.title == search) {
                isExists = true;
                return false;
            }
        });
        if (!isExists) {
            this.searchSource.splice(0, 0, {
                title: search
            });
            $(this.searchRef).search({
                source: _.clone(this.searchSource)
            });
        }
        localStorage && localStorage.setItem('tms/chat-direct:search', JSON.stringify(this.searchSource));

        this.searchingP = $.get('/admin/chat/direct/search', {
            search: this.search,
            size: 20,
            page: 0
        }, (data) => {
            if (data.success) {
                this.toggleRightSidebar(true);

                ea.publish(nsCons.EVENT_CHAT_SEARCH_RESULT, {
                    result: data.data,
                    search: this.search
                });
            }
        });
    }

    initHotkeys() {
        $(document).bind('keydown', 'ctrl+.', () => {
            event.preventDefault();
            this.toggleRightSidebar();
        }).bind('keydown', 'ctrl+k', () => {
            event.preventDefault();
            $(this.chatToDropdownRef).dropdown('toggle');
        });

        $(this.filterChatToUser).bind('keydown', 'ctrl+k', () => {
            event.preventDefault();
            $(this.chatToDropdownRef).dropdown('toggle');
        });
    }

    initChatToDropdownHandler(last) {
        if (last) {
            _.defer(() => {
                $(this.chatToDropdownRef).dropdown().dropdown('set selected', this.chatTo).dropdown({
                    onChange: (value, text, $choice) => {
                        window.location = wurl('path') + `#/chat/@${value}`;
                    }
                });
            });
        }
    }

    searchFocusinHandler() {
        $(this.searchInputRef).css('width', 'auto');
        $(this.searchRemoveRef).show();
        this.isActiveSearch = true;
    }

    searchFocusoutHandler() {
        if (!$(this.searchInputRef).val()) {
            $(this.searchInputRef).css('width', '100px');
            $(this.searchRemoveRef).hide();
            this.isActiveSearch = false;
        }
    }

    sibebarRightHandler() {
        this.toggleRightSidebar();
    }

    toggleRightSidebar(asShow) {
        if (_.isUndefined(asShow)) {
            this.isRightSidebarShow = !this.isRightSidebarShow;
        } else {
            this.isRightSidebarShow = asShow;
        }

        ea.publish(nsCons.EVENT_CHAT_SIDEBAR_TOGGLE, {
            isShow: this.isRightSidebarShow
        });
    }

    searchKeyupHandler(evt) {
        if (evt.keyCode === 13) {
            this.searchHandler();
        }
        return true;
    }

    clearSearchHandler() {
        $(this.searchInputRef).val('').focus();
    }
}
