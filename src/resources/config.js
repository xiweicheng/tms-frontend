import 'isomorphic-fetch';
import { HttpClient, json } from 'aurelia-fetch-client';
import { inject, Lazy } from 'aurelia-framework';

import {
    default as toastr
}
from 'toastr';
import {
    default as NProgress
}
from 'nprogress';

export class Config {

    initHttp() {
        window.json = (param) => {
            console.log(JSON.stringify(param));
            return json(param);
        };
        window.http = this.aurelia.container.root.get(HttpClient);
        http.configure(config => {
            config
            // .withBaseUrl(nsParam.baseUrl)
                .withDefaults({
                    credentials: 'same-origin',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'fetch'
                    }
                })
                .withInterceptor({
                    request(req) {
                        NProgress && NProgress.start();
                        return req;
                    },
                    requestError(req) {
                        console.log(req);
                    },
                    response(resp) {
                        NProgress && NProgress.done();
                        if (!resp.ok) {
                            resp.json().then((data) => {
                                // toastr.error('PATH: ' + data.path + '<br/>STATUS: ' + data.status + '<br/>EXCEPTION:<br/>' + data.exception + '<br/>MESSAGE:<br/>' + data.message, data.error);
                                toastr.error(data.message);
                            });

                            if (resp.status == 401) {
                                toastr.error('用户未登录!');
                                return;
                            }
                        }

                        return resp;
                    },
                    responseError(resp) {
                        toastr.error(resp.message, '网络请求错误!');
                        console.log(resp);
                    }
                });
        });

        return this;
    }

    initToastr() {

        // toastr弹出消息提示插件全局配置设置
        toastr.options.positionClass = 'toast-bottom-center';
        toastr.options.preventDuplicates = true;

        return this;
    }

    initAjax() {

        $(document).ajaxSend(function(event, jqxhr, settings) {

            if (settings.url.lastIndexOf('/chat/direct/latest') == -1) {
                NProgress && NProgress.start();
            }
        });

        // $(document).on('ajaxStart', function() {
        //     NProgress && NProgress.start();
        // });
        $(document).on('ajaxStop', function() {
            NProgress && NProgress.done();
        });
        // $(document).ajaxComplete(function(event, request, settings) {
        //     console.log(request);
        // });
        // $(document).ajaxError(function(event, request, settings) {
        //     console.log(request);
        // });

        return this;
    }

    context(aurelia) {
        this.aurelia = aurelia;
        return this;
    }

}

export default new Config();
