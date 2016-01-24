/*********************************************************************
 *                                                                   *
 *   Copyright 2016 Simon M. Werner                                  *
 *                                                                   *
 *   Licensed to the Apache Software Foundation (ASF) under one      *
 *   or more contributor license agreements.  See the NOTICE file    *
 *   distributed with this work for additional information           *
 *   regarding copyright ownership.  The ASF licenses this file      *
 *   to you under the Apache License, Version 2.0 (the               *
 *   "License"); you may not use this file except in compliance      *
 *   with the License.  You may obtain a copy of the License at      *
 *                                                                   *
 *      http://www.apache.org/licenses/LICENSE-2.0                   *
 *                                                                   *
 *   Unless required by applicable law or agreed to in writing,      *
 *   software distributed under the License is distributed on an     *
 *   "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY          *
 *   KIND, either express or implied.  See the License for the       *
 *   specific language governing permissions and limitations         *
 *   under the License.                                              *
 *                                                                   *
 *********************************************************************/

'use strict';

var Toy = require('./src/Device');
var Controller = require('./src/Device');
var Proxy = require('./src/Proxy');

var defaults = {
    // This is the URL were the proxy is located.  Only Toys and Controllers can
    // configure this.
    proxyUrl: 'localhost',

    // This is the port of the proxy.  All three components (proxy, controller,
    // and toy) need to be configured on the same port.
    port: 33330,

    // This is the channel to use.  The proxy will ensure that only devices on
    // the same channel can communicate together.  The controller and toy need
    // to be on the same channel.  You can make the channel a unique string.
    channel: 1,

    // How often the device pings the proxy.  This helps ensure the connection
    // is kept alive.  You can disable this by setting it to 0 (zero).
    keepalive: 30,

    // This determines the logging to use.  By default it logs to the standard
    // console.
    log: console.log,

    // Use the TCP Protocol - only the proxy can use both TCP and UDP.
    tcp4: false,

    // Use the UDP protocol - only the proxy can use both TCP and UDP.
    udp4: true
};

// The proxy is the go-between server
exports.createProxy = init('proxy');

// The controller and contolled device (toy) use the same functionality.
exports.createToy = init('toy');
exports.createController = init('controller');

/**
 * Helper function to create an initialised device or proxy server.
 * @param  {string} type 'proxy', 'toy', or 'controller'.
 * @return {function}    The initialisation function that can be called later.
 */
function init(type) {

    return function(params) {
        if (!params) {
            params = {};
        }
        var settings = {
            proxyUrl: params.proxyUrl || defaults.proxyUrl,
            channel: params.channel || defaults.channel,
            keepalive: params.keepalive || defaults.keepalive,
            port: params.port || defaults.port,
            log: params.log || defaults.log,
            tcp: params.tcp4 || defaults.tcp4,
            udp: params.udp4 || defaults.udp4,
            deviceType: type
        };

        switch (type) {
            case 'proxy':
                return new Proxy(settings);
            case 'toy':
                return new Toy(settings);
            case 'controller':
                return new Controller(settings);
            default:
                throw new Error('Could not determine server type.');
        }

    };
}