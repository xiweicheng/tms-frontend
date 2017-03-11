import { bindable, inject } from 'aurelia-framework';

export class Blog {

    // @bindable prop = null;

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        // https://github.com/humaan/Modaal
        $(this.blogWriteRef).modaal({
            fullscreen: true,
            overlay_close: false,
            start_open: true,
            // background: '#FFF',
            // overlay_opacity: 1,
            // close_text: '关闭',
            // close_aria_label: '按[esc]关闭',
            // confirm_button_text: '确认',
            // confirm_cancel_button_text: '取消',
            // confirm_title: '确认标题',
            before_open: () => {},
            after_open: () => {
                this.blogWriteVm.init();
            },
            before_close: () => {
                this.blogWriteVm.destroy();
            },
            after_close: () => {}
        });

    }

    /**
     * 当视图从DOM中分离时被调用
     */
    detached() {

    }

    /**
     * 在视图模型(ViewModel)展示前执行一些自定义代码逻辑
     * @param  {[object]} params                参数
     * @param  {[object]} routeConfig           路由配置
     * @param  {[object]} navigationInstruction 导航指令
     * @return {[promise]}                      你可以可选的返回一个延迟许诺(promise), 告诉路由等待执行bind和attach视图(view), 直到你完成你的处理工作.
     */
    activate(params, routeConfig, navigationInstruction) {
    	toastr.info(`Blog: ${params.id}`);
    }
}
