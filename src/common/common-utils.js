import {
    default as wurl
}
from 'wurl';
import 'common/common-diff';

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
        return this.getBaseUrl() + wurl('path') + '#' + this.getHash();
    }

    getHash() {
        let hash = wurl('hash');
        return hash ? hash.split('?')[0] : '';
    }

    getBasePath() {
        return this.getBaseUrl() + wurl('path');
    }

    getResourceBase() {
        let basePath = this.getBasePath();
        if (_.endsWith(basePath, '/index.html')) {
            basePath = _.replace(basePath, '/index.html', '/');
        }
        return _.endsWith(basePath, '/') ? basePath : basePath + '/';
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
     * 获取url中的查询参数值
     * @param  {[type]} name 查询参数名称
     * @return {[type]}      查询参数值
     */
    urlQuery(name, url) {
        if (url) {
            let query = wurl('?' + name, url);
            if (!query) {
                query = wurl('?' + name, wurl('hash', url));
            }
            return query;
        }
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

    isLoginPage() {
        let hash = wurl('hash');
        return _.startsWith(hash, '/login');
    }

    /**
     * 网络连接错误后自动重试
     * @param  {Function} callback 重试回调
     * @return {[type]}            [description]
     */
    errorAutoTry(callback, time, msg) {

        if (this.isRunning || this.isLoginPage()) {
            return;
        }

        let cnt = time ? time : 10;
        let err = msg ? msg : `网络连接错误`;
        let timer = null;
        let $t = toastr.error(`${err},${cnt}秒后自动重试!`, null, {
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
            $t && $t.find('.toast-message').text(`${err},${cnt}秒后自动重试!`);
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

        if (rect.top == 0 && rect.left == 0 && rect.bottom == 0 && rect.right == 0) {
            return false;
        }

        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
            rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
        );
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
    preParse(plainText, channel) {

        var txt = plainText;
        $.each(this.parseUsers(plainText), function (index, user) {
            txt = txt.replace(new RegExp(`{~${user.username}}`, 'g'), `<span data-value="${user.username}" class="at-user">**\`@${user.name ? user.name : user.username}\`**</span>`);
        });

        $.each(this.parseGroups(plainText, channel), function (index, grp) {
            var members = _.join(_.map(grp.members, (u) => {
                return u.name ? u.name : u.username;
            }), ' | ');
            txt = txt.replace(new RegExp(`{!~${grp.name}}`, 'g'), `<span data-value="${grp.name}" class="at-group">**\`@${grp.name}\`**</span>`);
        });

        return txt;
    }

    /**
     * 解析@users
     * @param  {[type]} plainText [description]
     * @return {[type]}           [description]
     */
    parseUsers(plainText) {
        var users = [];
        var atR = /\{~([^\}]*)\}/g;
        var rs = atR.exec(plainText);
        while (rs) {
            let user = _.find([nsCtx.memberAll, ...(window.tmsUsers ? tmsUsers : [])], {
                username: rs[1]
            });
            let isNotExists = !_.some(users, {
                username: rs[1]
            });
            if (user && isNotExists) {
                users.push(user);
            }
            rs = atR.exec(plainText);
        }

        return users;
    }

    /**
     * 解析@grouos
     * @param  {[type]} plainText [description]
     * @return {[type]}           [description]
     */
    parseGroups(plainText, channel) {
        if (!channel) {
            return [];
        }
        var groups = [];
        var atR = /\{!~([^\}]*)\}/g;
        var rs = atR.exec(plainText);
        let cGrps = _.reject(channel.channelGroups, {
            status: 'Deleted'
        });
        while (rs) {
            let grp = _.find(cGrps, {
                name: rs[1]
            });
            let isNotExists = !_.some(groups, {
                name: rs[1]
            });
            if (grp && isNotExists) {
                groups.push(grp);
            }
            rs = atR.exec(plainText);
        }

        return groups;
    }

    getUser(username) {
        return _.find(tmsUsers, {
            username: username
        });
    }

    /**
     * 解析要发送邮件的用户们
     * @param  {[type]} plainText [description]
     * @return {[type]}           [description]
     */
    parseUsernames(plainText, members, channel = null) {
        let users = this.parseUsers(plainText);
        let isExitsAll = _.some(users, {
            username: 'all'
        });

        if (isExitsAll) {
            return _.without(_.map(members, 'username'), 'all');
        }

        let groups = this.parseGroups(plainText, channel);

        let grpMembers = _.flatten(_.map(groups, (grp) => {
            return _.map(_.reject(grp.members, {
                status: 'Deleted'
            }), 'username');
        }));

        return _.union(_.map(users, 'username'), grpMembers);
    }

    /**
     * markdown to html
     * @param  {[type]} content [description]
     * @return {[type]}         [description]
     */
    md2html(content, noCss = false) {
        if (emojify) {
            content = emojify.replace(content);
        }
        if (!noCss) {
            return $('<div class="markdown-body"/>').html('<style>.markdown-body .tms-chat-msg-code-trigger{display: none;}.markdown-body{font-size:14px;line-height:1.6}.markdown-body>:first-child{margin-top:0!important}.markdown-body>:last-child{margin-bottom:0!important}.markdown-body a{word-break:break-all}.markdown-body a.absent{color:#C00}.markdown-body a.anchor{bottom:0;cursor:pointer;display:block;left:0;margin-left:-30px;padding-left:30px;position:absolute;top:0}.markdown-body h1,.markdown-body h2,.markdown-body h3,.markdown-body h4,.markdown-body h5,.markdown-body h6{cursor:text;font-weight:700;margin:20px 0 10px;padding:0;position:relative;word-break:break-all;}.markdown-body h1 .mini-icon-link,.markdown-body h2 .mini-icon-link,.markdown-body h3 .mini-icon-link,.markdown-body h4 .mini-icon-link,.markdown-body h5 .mini-icon-link,.markdown-body h6 .mini-icon-link{color:#000;display:none}.markdown-body h1:hover a.anchor,.markdown-body h2:hover a.anchor,.markdown-body h3:hover a.anchor,.markdown-body h4:hover a.anchor,.markdown-body h5:hover a.anchor,.markdown-body h6:hover a.anchor{line-height:1;margin-left:-22px;padding-left:0;text-decoration:none;top:15%}.markdown-body h1:hover a.anchor .mini-icon-link,.markdown-body h2:hover a.anchor .mini-icon-link,.markdown-body h3:hover a.anchor .mini-icon-link,.markdown-body h4:hover a.anchor .mini-icon-link,.markdown-body h5:hover a.anchor .mini-icon-link,.markdown-body h6:hover a.anchor .mini-icon-link{display:inline-block}.markdown-body hr:after,.markdown-body hr:before{display:table;content:""}.markdown-body h1 code,.markdown-body h1 tt,.markdown-body h2 code,.markdown-body h2 tt,.markdown-body h3 code,.markdown-body h3 tt,.markdown-body h4 code,.markdown-body h4 tt,.markdown-body h5 code,.markdown-body h5 tt,.markdown-body h6 code,.markdown-body h6 tt{font-size:inherit}.markdown-body h1{color:#000;font-size:28px}.markdown-body h2{border-bottom:1px solid #CCC;color:#000;font-size:24px}.markdown-body h3{font-size:18px}.markdown-body h4{font-size:16px}.markdown-body h5{font-size:14px}.markdown-body h6{color:#777;font-size:14px}.markdown-body blockquote,.markdown-body dl,.markdown-body ol,.markdown-body p,.markdown-body pre,.markdown-body table,.markdown-body ul{margin:15px 0}.markdown-body hr{overflow:hidden;background:#e7e7e7;height:4px;padding:0;margin:16px 0;border:0;-moz-box-sizing:content-box;box-sizing:content-box}.markdown-body h1+p,.markdown-body h2+p,.markdown-body h3+p,.markdown-body h4+p,.markdown-body h5+p,.markdown-body h6+p,.markdown-body ol li>:first-child,.markdown-body ul li>:first-child{margin-top:0}.markdown-body hr:after{clear:both}.markdown-body a:first-child h1,.markdown-body a:first-child h2,.markdown-body a:first-child h3,.markdown-body a:first-child h4,.markdown-body a:first-child h5,.markdown-body a:first-child h6,.markdown-body>h1:first-child,.markdown-body>h1:first-child+h2,.markdown-body>h2:first-child,.markdown-body>h3:first-child,.markdown-body>h4:first-child,.markdown-body>h5:first-child,.markdown-body>h6:first-child{margin-top:0;padding-top:0}.markdown-body li p.first{display:inline-block}.markdown-body ol,.markdown-body ul{padding-left:30px}.markdown-body ol.no-list,.markdown-body ul.no-list{list-style-type:none;padding:0}.markdown-body ol ol,.markdown-body ol ul,.markdown-body ul ol,.markdown-body ul ul{margin-bottom:0}.markdown-body dl{padding:0}.markdown-body dl dt{font-size:14px;font-style:italic;font-weight:700;margin:15px 0 5px;padding:0}.markdown-body dl dt:first-child{padding:0}.markdown-body dl dt>:first-child{margin-top:0}.markdown-body dl dt>:last-child{margin-bottom:0}.markdown-body dl dd{margin:0 0 15px;padding:0 15px}.markdown-body blockquote>:first-child,.markdown-body dl dd>:first-child{margin-top:0}.markdown-body blockquote>:last-child,.markdown-body dl dd>:last-child{margin-bottom:0}.markdown-body blockquote{border-left:4px solid #DDD;color:#777;padding:0 15px}.markdown-body table{border-collapse:collapse}.markdown-body table th{font-weight:700}.markdown-body table td,.markdown-body table th{border:1px solid #CCC;padding:6px 13px}.markdown-body table tr{background-color:#FFF;border-top:1px solid #CCC}.markdown-body table tr:nth-child(2n){background-color:#F8F8F8}.markdown-body img{max-width:100%}.markdown-body span.frame{display:block;overflow:hidden}.markdown-body span.frame>span{border:1px solid #DDD;display:block;float:left;margin:13px 0 0;overflow:hidden;padding:7px;width:auto}.markdown-body span.frame span img{display:block;float:left}.markdown-body span.frame span span{clear:both;color:#333;display:block;padding:5px 0 0}.markdown-body span.align-center{clear:both;display:block;overflow:hidden}.markdown-body span.align-center>span{display:block;margin:13px auto 0;overflow:hidden;text-align:center}.markdown-body span.align-center span img{margin:0 auto;text-align:center}.markdown-body span.align-right{clear:both;display:block;overflow:hidden}.markdown-body span.align-right>span{display:block;margin:13px 0 0;overflow:hidden;text-align:right}.markdown-body span.align-right span img{margin:0;text-align:right}.markdown-body span.float-left{display:block;float:left;margin-right:13px;overflow:hidden}.markdown-body span.float-left span{margin:13px 0 0}.markdown-body span.float-right{display:block;float:right;margin-left:13px;overflow:hidden}.markdown-body span.float-right>span{display:block;margin:13px auto 0;overflow:hidden;text-align:right}.markdown-body code,.markdown-body tt{background-color:#F8F8F8;border:1px solid #EAEAEA;border-radius:3px;margin:0 2px;padding:0 5px;white-space:normal}.markdown-body pre>code{background:none;border:none;margin:0;padding:0;white-space:pre}.markdown-body .highlight pre,.markdown-body pre{background-color:#F8F8F8;border:1px solid #CCC;border-radius:3px;font-size:13px;line-height:19px;overflow:auto;padding:6px 10px}.markdown-body pre code,.markdown-body pre tt{background-color:transparent;border:none}.markdown-body .emoji{width:1.5em;height:1.5em;display:inline-block;margin-bottom:-.25em;background-size:contain;}</style>' + marked(this.preParse(content))).wrap('<div/>').parent().html();
        } else {
            return '<div class="markdown-body"/>' + marked(this.preParse(content)) + '</div>';
        }
    }

    /**
     * wrap html content with <html/>
     * @param  {[type]} content [description]
     * @return {[type]}         [description]
     */
     htmlWrap(content) {
        return `<!DOCTYPE html><html><head><meta charset="utf-8" /><meta http-equiv="X-UA-Compatible" content="IE=edge" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no" /><meta content='tms,chat,wiki,translation,blog,markdown,group,team,teamwork,聊天,沟通,知识库,博文,国际化翻译,团队协作' name='Keywords'><meta content='TMS是免费开源的团队协作(团队沟通,博文知识库,国际化翻译i18n)web系统(响应式界面设计,移动端适配).' name='Description'></head><body>${content}</body></html>`;
    }

    /**
     * 文本比较
     * @param  {[type]} oldS [description]
     * @param  {[type]} newS [description]
     * @return {[type]}      [description]
     */
    diffS(oldS, newS, way) {
        var ways = ['diffChars', 'diffWords', 'diffWordsWithSpace', 'diffLines'];
        if (!ways.includes(way)) {
            way = 'diffWords';
        }
        var delStyle = 'style="background-color: #e6cf56; text-decoration: line-through;"';
        var insStyle = 'style="background-color: #98e287; text-decoration: none;"';
        var diff = JsDiff[way](oldS, newS);
        var nodeArr = [];
        for (var i = 0; i < diff.length; i++) {

            if (diff[i].added && diff[i + 1] && diff[i + 1].removed) {
                var swap = diff[i];
                diff[i] = diff[i + 1];
                diff[i + 1] = swap;
            }

            var node;
            if (diff[i].removed) {
                node = `<del ${delStyle}>${diff[i].value}</del>`;
            } else if (diff[i].added) {
                node = `<ins ${insStyle}>${diff[i].value}</ins>`;
            } else {
                node = `${diff[i].value}`;
            }
            nodeArr.push(node);
        }

        return `<pre>${nodeArr.join('')}</pre>`;
    }

    /**
     * 解析wiki目录
     * @param  {[type]} $e [description]
     * @return {[type]}    [description]
     */
    catalog($e) {
        var $headers = $(":header", $e);

        if ($headers && $headers.size() == 0) {
            return false;
        }

        var rootNode = {
            pre: null,
            name: null,
            arr: []
        };

        var current = rootNode;

        $headers.each((index, h) => {
            var name = h.nodeName;
            if (!current.name) {
                current.arr.push(h);
                current.name = name;
            } else {
                if (current.name < name) {
                    var last = current;
                    current = {
                        pre: last,
                        name: name,
                        arr: [h]
                    };
                    last.arr.push(current);
                } else if (current.name == name) {
                    current.arr.push(h);
                } else {
                    current = this.preNode(current, name);
                    current.arr.push(h);
                }
            }
        });

        return rootNode;
    }

    preNode(node, name) {
        if (!node.pre) {
            return node;
        }
        if (node.pre.name <= name) {
            return node.pre;
        } else {
            return this.preNode(node.pre, name);
        }
    }

    generateDir(link, uid) {
        var $list = $('<div class="ui bulleted list" data-name=""></div>');
        this.prodDir($list, link, uid);
        return $list;
    }

    dir($e, uid) {
        let cl = this.catalog($e);
        return cl ? this.generateDir(cl, uid) : '';
    }

    prodDir($list, link, uid) {
        $.each(link.arr, (index, item) => {
            if (item.hasOwnProperty('arr')) {
                var $l = $(`<div class="list" data-name="${item.name}"></div>`);
                $list.append($l);
                this.prodDir($l, item, uid);
            } else {
                var id = uid ? _.uniqueId(uid) : _.uniqueId('tms-wiki-dir-item-');
                var $item = $('<a class="item wiki-dir-item" style="word-break: keep-all; white-space: nowrap;"></a>').text($(item).attr('id', id).text()).attr('data-id', id);
                $list.append($item);
            }
        });
    }

    /**
     * 获取光标位置函数
     * @param  {[type]} ctrl [description]
     * @return {[type]}      [description]
     */
    getCursortPosition(ctrl) {
        var CaretPos = 0; // IE Support
        if (document.selection) {
            ctrl.focus();
            var Sel = document.selection.createRange();
            Sel.moveStart('character', -ctrl.value.length);
            CaretPos = Sel.text.length;
        }
        // Firefox support
        else if (ctrl.selectionStart || ctrl.selectionStart == '0') {
            CaretPos = ctrl.selectionStart;
        }
        return (CaretPos);
    }

    /**
     * 设置光标位置函数
     * @param {[type]} ctrl [description]
     * @param {[type]} pos  [description]
     */
    setCaretPosition(ctrl, pos) {
        if (ctrl.setSelectionRange) {
            ctrl.focus();
            ctrl.setSelectionRange(pos, pos);
        } else if (ctrl.createTextRange) {
            var range = ctrl.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    }

    /**
     * 是否为绝对url
     * @param  {[type]}  url [description]
     * @return {Boolean}     [description]
     */
    isAbsUrl(url) {
        if (_.startsWith(url, 'http://')) {
            return true;
        } else if (_.startsWith(url, 'https://')) {
            return true;
        } else if (_.startsWith(url, '//')) {
            return true;
        }

        return false;
    }

    escape(html, encode) {
        return html
            .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    unescape(html) {
        // explicitly match decimal, hex, and named HTML entities 
        return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/g, function (_, n) {
            n = n.toLowerCase();
            if (n === 'colon') return ':';
            if (n.charAt(0) === '#') {
                return n.charAt(1) === 'x' ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1));
            }
            return '';
        });
    }

    /**
     * 打开新的浏览器窗口，并跳转到指定页面
     * url:需要跳转的地址
     */
    openNewWin(url) {

        if (url) {
            let $a = $(`<a href="${url}" target="_blank" style="display:none;"></a>`).appendTo('body').end();
            $(`<input type="button">`).appendTo($a).end().click();

            _.delay(() => {
                $a.remove();
            }, 200);
        }

    }

    /**
     * 打开浏览器窗口，并跳转到指定页面
     * url:需要跳转的地址
     */
    openWin(url) {

        if (url) {
            let $a = $(`<a href="${url}" style="display:none;"></a>`).appendTo('body').end();
            $(`<input type="button">`).appendTo($a).end().click();

            _.delay(() => {
                $a.remove();
            }, 200);
        }

    }

    /**
     * 打开url
     * url:需要跳转的地址
     */
    openUrl(url) {

        if (url) {
            let $a = $(`<a href="${url}" style="display:none;"></a>`).appendTo('body').end();
            $(`<input type="button">`).appendTo($a).end().click();

            _.delay(() => {
                $a.remove();
            }, 200);
        }

    }

    isAdminUser(user) {
        if (user && user.authorities) {
            return _.some(user.authorities, (item) => {
                return item.id.authority === 'ROLE_ADMIN';
            });
        }
        return false;
    }

    isSuperUser(user) {
        if (user && user.authorities) {
            return _.some(user.authorities, (item) => {
                return item.id.authority === 'ROLE_SUPER';
            });
        }
        return false;
    }

    /**
     * 判断是否为全角字符
     * @param  {[type]}  str 待判断字符
     * @return {Boolean}    true: 全角 false: 半角 
     */
    isSBCcase(str) {
        // [^\x00-\xff]全角字符
        return /[^\x00-\xff]/.test(str);
    }

    /**
     * 判断是否为汉字
     * @param  {[type]}  str 待判断字符
     * @return {Boolean}    true: 汉字 false: 非汉字
     */
    isHanzi(str) {
        // [\u4e00-\u9fa5]汉字 
        return /[\u4e00-\u9fa5]/ig.test(str);
    }

    /**
     * 获取字符串byte长度
     * val: 要计算的字符串
     * return: 字符串byte长度
     */
    getByteLen(val) {
        var len = 0;
        for (var i = 0; i < val.length; i++) {
            if (this.isHanzi(val[i]) || this.isSBCcase(val[i])) {
                len += 2;
            } else {
                len += 1;
            }
        }
        return len;
    }

    /**
     * 制字符串的最大显示长度
     * value: 要处理的字符串
     * maxLen: 限制长度
     * return: 处理截取后的字符串
     */
    abbreviate(value, maxLen) {
        if (value && maxLen) {

            var len = 0;
            for (var i = 0; i < value.length; i++) {
                if (this.isHanzi(value[i]) || this.isSBCcase(value[i])) {
                    len += 2;
                } else {
                    len += 1;
                }

                if (len > maxLen) {
                    return value.substr(0, i) + '...';
                }
            }
        }
        return value;
    }

    isMail(mail) {

        var emailRegex = /^([_a-z0-9-]+)(\.[_a-z0-9-]+)*@([a-z0-9-]+)(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/i;

        return emailRegex.test(mail);
    }

    // 浏览器OS判断正则表达式
    regExpOS = {
        ios: /(iPad|iPhone|iPod)/g,
        mobileChrome: /(CriOS)/g,
        mobile: /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/g,
        cellphone: /iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/g
    }

    // 是否为IE
    isIE() {
        var
            isIE11 = (!(window.ActiveXObject) && 'ActiveXObject' in window),
            isIE = ('ActiveXObject' in window);
        return (isIE11 || isIE);
    }

    // 是否为IE11
    isIE11() {
        return (!(window.ActiveXObject) && 'ActiveXObject' in window);
    }

    // 是否为IOS
    isIOS() {
        var
            userAgent = navigator.userAgent,
            isIOS = userAgent.match(this.regExpOS.ios),
            isMobileChrome = userAgent.match(this.regExpOS.mobileChrome);
        if (isIOS && !isMobileChrome) {
            return true;
        } else {
            return false;
        }
    }

    // 是否为cellphone
    isCellphone() {
        return !!navigator.userAgent.match(this.regExpOS.cellphone);
    }

    // 是否为Mobile
    isMobile() {
        return !!navigator.userAgent.match(this.regExpOS.mobile)
    }

    // 是否为Chrome
    isChrome() {
        return /chrome\/([\d.]+)/.test(navigator.userAgent.toLowerCase());
    }

    // 是否为Safari
    isSafari() {
        return /version\/([\d.]+)/.test(navigator.userAgent.toLowerCase());
    }

    // 是否为Firefox
    isFirefox() {
        return /firefox\/([\d.]+)/.test(navigator.userAgent.toLowerCase());
    }

    // 是否为Opera
    isOpera() {
        return /opera.([\d.]+)/.test(navigator.userAgent.toLowerCase());
    }

    diffHtml(html) {

        var tags = ['html', 'head', 'meta', 'title', 'base', 'link', 'script', 'body', 'div', 'span'];

        var s = '';
        if (html) {
            s = html;
            _.each(tags, (tag) => {
                s = s.replace(new RegExp(`<(${tag})`, "gi"), `&lt;$1`);
            });
        }

        return s;
    }

    encodeHtml(str) {
        var s = "";
        if (str.length == 0) return "";
        s = str.replace(/&/g, "&gt;");
        s = s.replace(/</g, "&lt;");
        s = s.replace(/>/g, "&gt;");
        s = s.replace(/ /g, "&nbsp;");
        s = s.replace(/\'/g, "&#39;");
        s = s.replace(/\"/g, "&quot;");
        s = s.replace(/\n/g, "<br>");
        return s;
    }

    decodeHtml(str) {
        var s = "";
        if (str.length == 0) return "";
        s = str.replace(/&gt;/g, "&");
        s = s.replace(/&lt;/g, "<");
        s = s.replace(/&gt;/g, ">");
        s = s.replace(/&nbsp;/g, " ");
        s = s.replace(/&#39;/g, "\'");
        s = s.replace(/&quot;/g, "\"");
        s = s.replace(/<br>/g, "\n");
        return s;
    }

    getAlarm() {

        let chatAlarm = {
            ats: 1,
            news: 1,
            audio: 1,
            off: 0,
        };

        if (localStorage) {
            let alarm = localStorage.getItem(nsCons.KEY_CHAT_ALARM);
            if (alarm) {
                _.extend(chatAlarm, JSON.parse(alarm));
            }
        }

        return chatAlarm;
    }

    // 判断浏览器tab页面是否不可见
    isTabHidden() {
        return !this.isTabVisible();
    }

    // 判断浏览器tab页面是否可见
    isTabVisible() {
        // 各种浏览器兼容
        // var hidden;
        var state;
        // var visibilityChange;

        if (typeof document.hidden !== "undefined") {
            // hidden = "hidden";
            // visibilityChange = "visibilitychange";
            state = "visibilityState";
        } else if (typeof document.mozHidden !== "undefined") {
            // hidden = "mozHidden";
            // visibilityChange = "mozvisibilitychange";
            state = "mozVisibilityState";
        } else if (typeof document.msHidden !== "undefined") {
            // hidden = "msHidden";
            // visibilityChange = "msvisibilitychange";
            state = "msVisibilityState";
        } else if (typeof document.webkitHidden !== "undefined") {
            // hidden = "webkitHidden";
            // visibilityChange = "webkitvisibilitychange";
            state = "webkitVisibilityState";
        }

        // document.addEventListener(visibilityChange, function() {
        //     document.title = document[state];
        // }, false);
        // document.title = document[state];

        return document[state] == 'visible';
    }

    // download excel file
    downloadExcel(sdata, fileName) {

        if (!window.XLSX) return;

        var out = XLSX.utils.book_new();
        sdata.forEach(function (xws) {
            var aoa = [
                []
            ];
            var rowobj = xws.rows;
            for (var ri = 0; ri < rowobj.len; ++ri) {
                var row = rowobj[ri];
                if (!row) continue;
                aoa[ri] = [];
                Object.keys(row.cells).forEach(function (k) {
                    var idx = +k;
                    if (isNaN(idx)) return;
                    aoa[ri][idx] = row.cells[k].text;
                });
            }
            var ws = XLSX.utils.aoa_to_sheet(aoa);
            XLSX.utils.book_append_sheet(out, ws, xws.name);
        });

        XLSX.writeFile(out, `${fileName}.xlsx`);
    }

    // 生成uuid
    uuid() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }

    // 替换mardown特殊字符(){}[]
    replaceMdChar(s) {

        var _s = s;
        _s = _.replace(_s, /\(/g, '\\(');
        _s = _.replace(_s, /\)/g, '\\)');
        _s = _.replace(_s, /\[/g, '\\[');
        _s = _.replace(_s, /\]/g, '\\]');
        _s = _.replace(_s, /\{/g, '\\{');
        _s = _.replace(_s, /\}/g, '\\}');

        return _s;
    }

}

export default new CommonUtils();
