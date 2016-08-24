var https = require("https");
var async = require('async');
var doc = require('dynamodb-doc');
var dynamo = new doc.DynamoDB();
var token = require('./token.json');
var aws = require('aws-sdk');
var lambda = new aws.Lambda({apiVersion: '2015-03-31'});
var msg;
var options;
 
exports.handler = function(event, context) {
    var pattern = {
        "help": "使い方\nstop :現在滞在している登録地点の通知を止めます。\nstart : 最後に滞在した登録地点の通知を有効にします。\n最後に滞在した登録地点の生息情報を取得しました。\nset $lat,$lon : 通知対象地点を直接登録します。",
        "stop": "現在滞在している登録地点の通知を止めました。",
        "start": "最後に滞在した登録地点の通知を有効にしました。",
        "get": "最後に滞在した登録地点の生息情報を取得しました。",
        "set": "通知対象地点を登録しました。"
    }
    async.waterfall([
        function init(callback) {
            var params = {
                "TableName" : "PokeMention",
                "Key": {
                    "sender_id": event.entry[0].messaging[0].sender.id
                }
            };

            dynamo.getItem(params, function (err, res) {
                if (err) {
                    console.log("err : " + JSON.stringify(err));
                    callback(err);
                } else {
                    if (Object.keys(res).length) {
                        var text = event.entry[0].messaging[0].message.text;
                        if (text == 'stop') {
                            var dbparams = {
                                Key: {
                                     sender_id: event.entry[0].messaging[0].sender.id
                                },
                                TableName: "PokeMention"
                            }
                            dynamo.getItem(dbparams, function(err, data) {
                                if (err) {
                                    console.log(err, err.stack);
                                } else {
                                    var dbparams2 = {
                                        Item: {
                                            sender_id: data.Item.sender_id,
                                            location: data.Item.location,
                                            action: "exited"
                                        },
                                        TableName: "PokeMention"
                                    };
                                    dynamo.putItem(dbparams2, function(err, data) {
                                        if (err) {
                                            console.log(err, err.stack);
                                        } else {
                                            console.log('send to DynamoDB.');
                                            callback(null, pattern[text]);
                                        }
                                    });
                                }
                            });
                        } else if (text == 'start') {
                            var dbparams = {
                                Key: {
                                     sender_id: event.entry[0].messaging[0].sender.id
                                },
                                TableName: "PokeMention"
                            }
                            dynamo.getItem(dbparams, function(err, data) {
                                if (err) {
                                    console.log(err, err.stack);
                                } else {
                                    var dbparams2 = {
                                        Item: {
                                            sender_id: data.Item.sender_id,
                                            location: data.Item.location,
                                            action: "entered"
                                        },
                                        TableName: "PokeMention"
                                    };
                                    dynamo.putItem(dbparams2, function(err, data) {
                                        if (err) {
                                            console.log(err, err.stack);
                                        } else {
                                            console.log('send to DynamoDB.');
                                            callback(null, pattern[text]);
                                        }
                                    });
                                }
                            });
                        } else if (text == 'get') {
                            var dbparams = {
                                Key: {
                                     sender_id: event.entry[0].messaging[0].sender.id
                                },
                                TableName: "PokeMention"
                            }
                            dynamo.getItem(dbparams, function(err, data) {
                                if (err) {
                                    console.log(err, err.stack);
                                } else {
                                    var params = {
                                        FunctionName: "PokeSearch",
                                        InvokeArgs: JSON.stringify({
                                            "location": data.Item.location,
                                            "id" : data.Item.sender_id
                                        }, null, ' ')
                                    };
                                    lambda.invokeAsync(params, function(err, data){
                                        if (err) {
                                            context.done('error', err.stack);
                                        } else {
                                            context.done(null, "id : " + event.id + " & location : " + event.location + " & action : " + event.action);
                                        }
                                    });
                                }
                            });
                        } else if (text.match(/^set /)) {
                            var tmp = text.split(' ');
                            var latlon = tmp[1];
                            var dbparams = {
                                Key: {
                                     sender_id: event.entry[0].messaging[0].sender.id
                                },
                                TableName: "PokeMention"
                            }
                            dynamo.getItem(dbparams, function(err, data) {
                                if (err) {
                                    console.log(err, err.stack);
                                } else {
                                    var dbparams2 = {
                                        Item: {
                                            sender_id: data.Item.sender_id,
                                            location: latlon,
                                            action: data.Item.action
                                        },
                                        TableName: "PokeMention"
                                    };
                                    dynamo.putItem(dbparams2, function(err, data) {
                                        if (err) {
                                            console.log(err, err.stack);
                                        } else {
                                            console.log('send to DynamoDB.');
                                            callback(null, pattern["set"]);
                                        }
                                    });
                                }
                            });
                        } else if (pattern[text] === undefined) {
                            callback(null, pattern["help"]);
                        }
                    } else {
                        callback(null, 'はじめまして！IFTTTアプリのMaker Actionに ttps://4opt7zfg6f.execute-api.ap-northeast-1.amazonaws.com/prod/setPokeSearchLocation?id=' + event.entry[0].messaging[0].sender.id + '&location={{LocationMapUrl}}&action={{EnteredOrExited}} を設定して下さい。');
                        var dbparams = {
                            Item: {
                                sender_id: event.entry[0].messaging[0].sender.id,
                                location: "35.679624,139.736764",
                                action: "Entered"
                            },
                            TableName: "PokeMention"
                        };
                        dynamo.putItem(dbparams, function(err, data) {
                            if (err) {
                                console.log(err, err.stack);
                            } else {
                                console.log('send to DynamoDB.');
                            }
                        });
                    }
                }
            });
        },
        function send(data, callback) {
            console.log('Received event:', JSON.stringify(event, null, 2));
            // テキストが送られた時
            //msg = event.entry[0].messaging[0].message.text;
            //console.log(msg);

            options = {
                hostname: "graph.facebook.com",
                path:  "/v2.6/me/messages?access_token=" + token.token,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }

            var msg = function(){
                return {
                    "recipient": {
                        "id": event.entry[0].messaging[0].sender.id
                    },
                    "message": {
                        "text": data
                    }
                }
            }

            var data = JSON.stringify(msg());
            console.log(data);
            var req = https.request(options, function(res) {
                console.log(res.header);
                console.log("finish");
            }).on("error", function(e) {
                console.log(e.message);
            });

            req.write(data);
            req.end();
            callback(null, 'other');
        },

    ], function (err, result) {
        if (err) {
            console.log(err);
        }
    });
}
