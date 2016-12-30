import { BindingSignaler } from 'aurelia-templating-resources';
import { EventAggregator } from 'aurelia-event-aggregator';
import {
    default as toastr
} from 'toastr';
import {
    default as wurl
} from 'wurl';
import utils from 'common/common-utils';
import 'common/common-plugin'
import 'common/common-constant';
import {
    default as marked
} from 'marked'; // https://github.com/chjj/marked
import {
    default as hljs
} from 'highlight';
import {
    default as autosize
} from 'autosize';

export class Config {

    initToastr() {

        // toastr弹出消息提示插件全局配置设置
        toastr.options.positionClass = 'toast-bottom-center';
        toastr.options.preventDuplicates = true;

        return this;
    }

    initMarked() {

        marked.setOptions({
            breaks: true,
            highlight: function(code) {
                return hljs.highlightAuto(code).value;
            }
        });

        return this;
    }

    initAjax() {
        // ajax全局配置选项设置
        $.ajaxSetup({
            // ajax请求不缓存
            cache: false,
        });
        return this;
    }

    initGlobalVar() {
        window.toastr = toastr;
        window.wurl = wurl;
        window.utils = utils;
        window.marked = marked;
        window.autosize = autosize;
        window.bs = this.aurelia.container.root.get(BindingSignaler);
        window.ea = this.aurelia.container.root.get(EventAggregator);
        return this;
    }

    initAnimateCss() {
        $.fn.extend({
            animateCss: function(animationName) {
                var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
                this.addClass('animated ' + animationName).one(animationEnd, function() {
                    $(this).removeClass('animated ' + animationName);
                });
            }
        });
        return this;
    }

    context(aurelia) {
        this.aurelia = aurelia;
        return this;
    }

}

export default new Config();
