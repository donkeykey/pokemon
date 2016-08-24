'use strict';
var request = require('request');
var doc = require('dynamodb-doc');
var dynamo = new doc.DynamoDB();
var async = require('async');

exports.handler = function(event, context) {
    if (event.id) {
        var location = event.location.split(',');
        var url = 'http://210.140.83.12:8888/?lat=' + location[0] + '&lon=' + location[1] + '&id=' + event.id;
        console.log('url : ' + url);
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body);
                callback2(null, "done");
            } else {
                console.log('error: '+ response.statusCode);
                callback2(null, "err");
            }
        });
    } else {
        async.waterfall([
            function init(callback) {
                dynamo.scan({TableName : "PokeMention"}, function(err, data) {
                    if (err) {
                        callback(err);
                    } else {
                        console.log(JSON.stringify(data));
                        callback(null, data);
                    }
                });
            },
            function init(data, callback) {
                async.forEachSeries(data["Items"], function(i, callback2){
                    if (i.action == 'entered') {
                        var location = i.location.split(',');
                        var url = 'http://210.140.83.12:8888/?lat=' + location[0] + '&lon=' + location[1] + '&id=' + i.sender_id;
                        console.log('url : ' + url);
                        request(url, function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                console.log(body);
                                callback2(null, "done");
                            } else {
                                console.log('error: '+ response.statusCode);
                                callback2(null, "err");
                            }
                        });
                    } else {
                        callback2(null, "done");
                    }
                }, function(err){
                    //処理2
                    if(err) throw err;
                });
            }
        ], function (err, result) {
            if (err) {
                context.done(error);
            } else {
                context.done(null, "done");
            }
        });
    }
}
