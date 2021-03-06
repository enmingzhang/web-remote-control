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

var mySmaz = require('./MySmaz');

/**
 * Parse an incoming message and ensure it's valid.  Convert it to an object that
 * can ben sent to other listeners.
 *
 * @param  {[uint8]?} message  The message from the datastream
 * @param  {object} remote   The remote host
 * @param  {string} protocol The protocol we are using
 * @return {object}          The valid object.
 * @throws Error when the message is invalid.
 */
exports.parseIncomingMessage = function(message, enable_compression) {

    if (message.length === 0) {
        // Empty packet arrived, this happens when remote closes connection
        return null;
    }

    var msgObj;

    try {
        msgObj = decompress(message, enable_compression);
    } catch (ex) {
        throw new Error('There was an error parsing the incoming message: ' + ex + JSON.stringify(message.toString()));
    }

    if (typeof msgObj !== 'object') {
        throw new Error('The incoming message is corrupt');
    }

    /* Check the type is valid */
    var requiresList;
    switch (msgObj.type) {
        case 'register':
            requiresList = ['type', 'seq', 'data'];
            break;

        case 'status':
        case 'command':
        case 'ping':
        case 'error':
            requiresList = ['type', 'seq', 'data', 'uid'];
            break;
        default:
            throw new Error('An invalid incoming message arrived: ' + msgObj.toString());
    }

    /* Check the properties are all valid */
    requiresList.forEach(function(req) {
        if (!msgObj.hasOwnProperty(req)) {
            throw new Error('The message that arrived is not valid, it does not contain a property: ' + req);
        }
    });

    return msgObj;
};

exports.packOutgoingMessage = function(msgObj, enable_compression) {

    var cleanMsgObj = {};
    if (msgObj.hasOwnProperty('type')) {
        cleanMsgObj.type = msgObj.type;
    }
    if (msgObj.hasOwnProperty('seq')) {
        cleanMsgObj.seq = msgObj.seq;
    }
    if (msgObj.hasOwnProperty('data')) {
        cleanMsgObj.data = msgObj.data;
    }
    if (msgObj.hasOwnProperty('uid')) {
        cleanMsgObj.uid = msgObj.uid;
    }
    if (msgObj.hasOwnProperty('sticky') && msgObj.sticky === true) {
        cleanMsgObj.sticky = true;
    }

    return compress(cleanMsgObj, enable_compression);

};


function compress(data, enable_compression) {

    var result = JSON.stringify(data);
    result = result + '\n';

    if (enable_compression) {
        result = mySmaz.compress(result);
    }

    return new Buffer(result);
}

function decompress(compressedData, enable_compression) {

    var str;
    if (enable_compression) {
        str = mySmaz.decompress(compressedData);
    } else {
        str = compressedData.toString();
    }

    /* socket.io has a tendancy to concatinate messages */
    // FIXME: This looses information.  But do we care?
    var strArray = str.split('\n');
    var offset = 1;
    if (strArray[strArray.length - 1] === '') {
        offset = 2;
    }
    str = strArray[strArray.length - offset];

    return JSON.parse(str);
}
