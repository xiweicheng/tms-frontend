import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmAudioAlert {

    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_AUDIO_ALERT, (payload) => {
            this.audioRef.play();
        });
    }

    attached() {

    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe.dispose();
    }
}
