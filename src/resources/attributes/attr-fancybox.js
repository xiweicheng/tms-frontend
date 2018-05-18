import { inject } from 'aurelia-framework';
import { customAttribute } from 'aurelia-templating';
import 'fancybox';

@customAttribute('fancybox')
@inject(Element)
export class AttrFancyboxCustomAttribute {

    constructor(element) {
        this.element = element;
    }

    valueChanged(newValue, oldValue) {
        $(this.element).on('click', 'img', (event) => {
            event.preventDefault();
            let $img = $(event.target);
            var imgs = [];
            var initialIndexOnArray = 0;
            $(this.element).find('img').each(function(index, img) {
                imgs.push({ src: $(img).attr('src'), opts: { caption: $(img).attr('alt') } });
                if (event.target == img) {
                    initialIndexOnArray = index;
                }
            });

            $.fancybox.open(imgs, {
                i18n: {
                    'zh': {
                        CLOSE: '关闭',
                        NEXT: '下一张',
                        PREV: '上一张',
                        ERROR: '请求内容不能加载. <br/> 请稍后重试.',
                        PLAY_START: '开始幻灯片',
                        PLAY_STOP: '暂停幻灯片',
                        FULL_SCREEN: '全屏',
                        THUMBS: '缩略图',
                        DOWNLOAD: '下载',
                        SHARE: '分享',
                        ZOOM: '缩放'
                    }
                },
                lang: 'zh',
                loop: true,
                animationEffect: "zoom-in-out", // false zoom fade zoom-in-out
                transitionEffect: "slide", // false fade slide circular tube zoom-in-out rotate
                arrows: true,
                infobar: true,
                buttons: [
                    'slideShow',
                    'fullScreen',
                    'thumbs',
                    // 'share',
                    'download',
                    'zoom',
                    'close'
                ],
            }, initialIndexOnArray);

        });
    }

    bind(bindingContext) {
        this.valueChanged(this.value);
    }
}
