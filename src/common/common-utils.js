import {
    default as wurl
}
from 'wurl';
export class CommonUtils {

    /**
     * 获取浏览器BaseUrl
     * @return {[type]} [description]
     */
    getBaseUrl() {
        if (typeof wurl == 'function') {
            if (wurl('port') == 80 || wurl('port') == 443) {
                return (wurl('protocol') + '://' + wurl('hostname'));
            } else {
                return (wurl('protocol') + '://' + wurl('hostname') + ':' + wurl('port'));
            }
        }
        return '';
    }

    /**
     * 获取浏览器Url(不含参数)
     * @return {[type]} [description]
     */
    getUrl() {
        return this.getBaseUrl() + '#' + wurl('hash');
    }

    redirect2Login(redirectUrl) {
        let redirect = this.urlQuery('redirect');
        if (!redirect) {
            redirectUrl = redirectUrl ? redirectUrl : wurl();
            window.location = this.getBaseUrl() + wurl('path') + `#/login?redirect=${encodeURIComponent(redirectUrl)}`;
        } else {
            console.log('url has contains ?redirect');
        }

    }

    /**
     * 获取URL hash
     * @return {[type]} [description]
     */
    getHash() {
        let hash = wurl('hash');
        let index = hash.indexOf('?');
        if (index != -1) {
            return hash.substring(0, index);
        }

        return hash;
    }

    /**
     * 获取url中的查询参数值
     * @param  {[type]} name 查询参数名称
     * @return {[type]}      查询参数值
     */
    urlQuery(name) {
        return wurl('?' + name) || wurl('?' + name, wurl('hash'));
    }

    /**
     * 移除url中的指定查询参数
     * name: 查询参数名称
     * href: 操作的url(可选, 不设置时为当前浏览器页面地址)
     * return: 移除指定查询参数的url地址
     */
    removeUrlQuery(name, href) {

        var s = href ? href : window.location.href;

        var rs = new RegExp('(&|\\?)?' + name + '=?[^&#]*(.)?', 'g').exec(s);
        // eg: ["?accessToken=YUNqUkxiZ3owWXdYdDFaVUp2VmNEM0JTZTNERlowWUhPTUVVbDU1RUROOWROMmcwUlVJeXRGQ2M4ZVBqdmpkSA%3D%3D&", "?", "&"]

        if (rs) {
            // case3: ?name2=value2&name=value => ?name2=value2
            // case4: ?name2=value2&name=value&name3=value3 => ?name2=value2&name3=value3
            if (rs[1] == '&') {
                return s.replace(new RegExp('&' + name + '=?[^&#]+', 'g'), '');
            } else if (rs[1] == '?') {
                if (rs[2] != '&') { // case1: ?name=value => 
                    return s.replace(new RegExp('\\?' + name + '=?[^&#]*', 'g'), '');
                } else { // case2: ?name=value&name2=value2 => ?name2=value2
                    return s.replace(new RegExp('' + name + '=?[^&#]*&', 'g'), '');
                }
            }
        }

        return s;
    }

    /**
     * 网络连接错误后自动重试
     * @param  {Function} callback 重试回调
     * @return {[type]}            [description]
     */
    errorAutoTry(callback, time) {

        if (this.isRunning) {
            return;
        }

        let cnt = time ? time : 10;
        let timer = null;
        let $t = toastr.error(`网络连接错误,${cnt}秒后自动重试!`, null, {
            "closeButton": false,
            "timeOut": "0",
            "preventDuplicates": false,
            "onclick": () => {
                clearInterval(this.timer);
                callback && callback();
            }
        });

        this.isRunning = true;
        timer = setInterval(() => {
            if (cnt === 0) {
                clearInterval(timer);
                this.isRunning = false;
                toastr.remove();
                callback && callback();
                return;
            }
            $t && $t.find('.toast-message').text(`网络连接错误,${cnt}秒后自动重试!`);
            cnt--;
        }, 1000);
    }

    /**
     * 判断视图元素是否在可视区域中
     * @param  {[type]}  el [description]
     * @return {Boolean}    [description]
     */
    isElementInViewport(el) {

        //special bonus for those using jQuery
        if (typeof jQuery === "function" && el instanceof jQuery) {
            el = el[0];
        }

        var rect = el.getBoundingClientRect();

        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
            rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
        );
    }

    /**
     * 判断图片是否加载完毕
     * @param  {[type]}   $imgs    [description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    imgLoaded($imgs, callback) {
        var imgdefereds = [];
        $imgs.each(function() {
            var dfd = $.Deferred();
            $(this).bind('load', function() {
                dfd.resolve();
            }).bind('error', function() {
                //图片加载错误，加入错误处理
                dfd.resolve();
            })
            if (this.complete) {
                // setTimeout(function() {
                //     dfd.resolve();
                // }, 1000);
                dfd.resolve();
            }

            imgdefereds.push(dfd);
        })
        $.when.apply(null, imgdefereds).done(function() {
            callback && callback.call(null);
        });
    }

    /**
     * 获取聊天对象标识
     * @param  {[type]} name [description]
     * @return {[type]}      [description]
     */
    getChatName(name) {
        if (_.startsWith(name, '@')) {
            return name.substr(1);
        } else {
            return name;
        }
    }

    /**
     * 替换@user解析
     * @param  {[type]} plainText [description]
     * @return {[type]}           [description]
     */
    preParse(plainText, members) {

        var txt = plainText;
        $.each(this.parseUsers(plainText, members), function(index, user) {
            txt = txt.replace(new RegExp(`{~${user.username}}`, 'g'), `<span data-value="${user.username}" class="at-user">**\`@${user.name}\`**</span>`);
        });

        return txt;
    }


    /**
     * 解析@users
     * @param  {[type]} plainText [description]
     * @return {[type]}           [description]
     */
    parseUsers(plainText, members) {
        var users = [];
        var atR = /\{~([^\}]*)\}/g;
        var rs = atR.exec(plainText);
        while (rs) {
            let user = _.find(members, { username: rs[1] });
            let isNotExists = !_.some(users, { username: rs[1] });
            if (user && isNotExists) {
                users.push(user);
            }
            rs = atR.exec(plainText);
        }

        return users;
    }

    /**
     * 解析要发送邮件的用户们
     * @param  {[type]} plainText [description]
     * @return {[type]}           [description]
     */
    parseUsernames(plainText, members) {
        let users = this.parseUsers(plainText, members);
        let isExitsAll = _.some(users, { username: 'all' });
        if (isExitsAll) {
            return _.without(_.map(members, 'username'), 'all');
        }
        return _.map(users, 'username');;
    }
}

export default new CommonUtils();
