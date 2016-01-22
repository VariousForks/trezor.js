/* @flow weak*/
var HttpTransport = require('./http');
var PluginTransport = require('./plugin');
var ChromeExtensionTransport = require('./chrome-extension');

import {request as http} from '../http';

/**
 * interface Transport {
 *     boolean supportsSync;
 *     static function create() -> Promise(Self);
 *     function configure(string config) -> Promise();
 *     function enumerate(boolean wait) -> Promise([{
 *         string path
 *         string vendor
 *         string product
 *         string serialNumber
 *         string session
 *     }] devices);
 *     function acquire(string path) -> Promise(string session);
 *     function release(string session) -> Promise();
 *     function call(string session, string name, Object data) -> Promise({
 *         string name,
 *         Object data,
 *     });
 * }
 */

/**
 * Attempts to load any available HW transport layer.
 * @return {Promise<Transport>}
 */
export function loadTransport() {
    return ChromeExtensionTransport.create().catch(function () {
        return HttpTransport.create().catch(function () {
            return PluginTransport.create();
        });
    });
}

/**
 * Configures transport with config downloaded from url.
 * @param {Promise<Transport>} transport
 * @param {String} url
 * @return {Promise<Transport>}
 */
export function configureTransport(transport, url) {
    return http(withTimestamp(url))
        .then(function (c) { return transport.configure(c); })
        .then(function () { return transport; });
}

var CONFIG_URL = 'https://mytrezor.s3.amazonaws.com/plugin/config_signed.bin';

/**
 * Loads and configures the HW transport layer.
 * @param {?Object} options
 * @param {?String} options.configUrl
 * @return {Promise<Transport>}
 */
export function initTransport(options_) {
    var options = options_ || {};
    var configUrl = options.configUrl || CONFIG_URL;

    return loadTransport().then(function (t) {
        return configureTransport(t, configUrl);
    });
}

function withTimestamp(url) {
    return url + '?' + new Date().getTime();
}