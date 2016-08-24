//var async = require('async');
//var line_key = require('./line_key.json');
//var base = require('./base.json');
//var face = require('./face.json');
//var config = {
//    api_key : face.api_key,
//    api_secret : face.secret
//}
//var client = new FacePlusPlus(config);
var aws = require('aws-sdk');
//var s3 = new aws.S3({params: {Bucket: 'fukase-no-owari.net'}});

var doc = require('dynamodb-doc');
var dynamo = new doc.DynamoDB();

var dbparams = {};
dbparams.TableName = "PokeMention";

var lambda = new aws.Lambda({apiVersion: '2015-03-31'});

exports.handler = function(event, context) {
    console.log("id : " + event.id);
    console.log("location : " + event.location);
    console.log("action : " + event.action);
    var location = event.location.split(',');
    var latStr = location[0].split('=');
    var lat = latStr[1];
    var lonStr = location[1].split('&');
    var lon = lonStr[0];
    dbparams.Item = {
        sender_id: event.id,
        action: event.action,
        location: lat + ',' + lon
    };
    dynamo.putItem(dbparams, function(err, data) {
        if (err) {
            console.log(err, err.stack);
        } else {
            console.log('send to DynamoDB.');
            if (event.action == 'entered') {
                var params = {
                    FunctionName: "PokeSearch",
                    InvokeArgs: JSON.stringify({
                        "location": lat + ',' + lon,
                        "id" : event.id
                    }, null, ' ')
                };
                lambda.invokeAsync(params, function(err, data){
                    if (err) {
                        context.done('error', err.stack);
                    } else {
                        context.done(null, "id : " + event.id + " & location : " + event.location + " & action : " + event.action);
                    }
                });
            } else {
                context.done(null, 'done');
            }
        }
    });


//    res = event.result[0];
//
//    async.waterfall([
//        function recognize(callback) {
//            console.log(JSON.stringify(res));
//            if (res.content.contentType === 2) {
//                callback(null, 'image');
//            } else if (res.content.opType === 4) {
//                callback(null, 'friend');
//            } else {
//                callback(null, 'other');
//            }
//        },
//        function run(data, callback) {
//            if (data === 'image') {
//                console.log('run image');
//                async.waterfall([
//                    function getImage(callback2) {
//                        var id = res.content.id;
//                        console.log('get image : ' + id);
//
//                        var opts = {
//                            url: 'https://trialbot-api.line.me/v1/bot/message/' + id + '/content/preview',
//                            headers: {
//                                "X-Line-ChannelID": line_key.channelID,
//                                "X-Line-ChannelSecret": line_key.channelSecret,
//                                "X-Line-Trusted-User-With-ACL": line_key.mid
//                            },
//                            encoding: null
//                        }
//                        request(opts, function(error, response, body) {
//                            //console.log('error: ' + JSON.stringify(error));
//                            //console.log('response : ' + JSON.stringify(response));
//                            if (!error) {
//                                //var img = body.toString('base64')
//                                //callback2(null, img);
//                                callback2(null, body);
//                            } else {
//                                console.log('LINEえらーだよ');
//                                callback2(error);
//                            }
//                        });
//                    },
//                    function saveImg(d, callback2) {
//                        s3.putObject({
//                            Bucket: 'fukase-no-owari.net',
//                            Key: 'test/test.jpg',
//                            Body: d,
//                            ContentType: 'image/jpeg',
//                            ACL: 'public-read'
//                        }, callback2);
//                    },
//                    function detectImage(data, callback2) {
//                        client.get('recognition/identify', {url: 'http://s3-ap-northeast-1.amazonaws.com/fukase-no-owari.net/test/test.jpg', group_name: face.group_name}, function(err, response, body) {
//                            if (!err) {
//                                console.log('ok');
//                                callback2(null, body);
//                            } else {
//                                console.log('ng');
//                                callback2(null, JSON.stringify(body));
//                            }
//                        });
//                    }
//                ], function (err, result) {
//                    if (!err) {
//                        //var name = result.face[0].candidate[0].tag;
//                        var candidate = result.face[0].candidate;
//                        var param = [];
//                        for (var i = 0; i < candidate.length; i++) {
//                            var name = candidate[i].person_name;
//                            var tag = candidate[i].tag;
//                            var splitedTags = tag.split("|");
//                            var id = splitedTags[0];
//                            var img = splitedTags[1];
//                            var num = i + 1;
//                            var item = {
//                                text: "似てる女優、" + num + "人目は " + name,
//                                to: res.content.from,
//                                contentType: 1
//                            }
//                            param.push(item);
//                            item = {
//                                to: res.content.from,
//                                contentType: 2,
//                                originalContentUrl: img,
//                                previewImageUrl: img
//                            }
//                            param.push(item);
//                        }
//                        console.log(JSON.stringify(param));
//                        callback(err, param);
//                    } else {
//                        callback(err, result);
//                    }
//                });
//            } else if (data === 'friend') {
//                console.log('run friend');
//                var usermid = res.content.params[0];
//                var opts = {
//                    url: 'https://trialbot-api.line.me/v1/profiles?mids=' + usermid,
//                    headers: {
//                        "X-Line-ChannelID": line_key.channelID,
//                        "X-Line-ChannelSecret": line_key.channelSecret,
//                        "X-Line-Trusted-User-With-ACL": line_key.mid
//                    }
//                }
//                request(opts, function(error, response, body) {
//                    body = JSON.parse(body);
//                    if (!error) {
//                        dbparams.Item = {
//                            mid: usermid,
//                            name: body.contacts[0].displayName
//                        };
//                        dynamo.putItem(dbparams, function(err, data) {
//                            if (err) {
//                                console.log(err, err.stack);
//                            } else {
//                                console.log('send to DynamoDB.');
//                                var param = [
//                                    {
//                                        text: body.contacts[0].displayName + 'さん ちわーっす!',
//                                        to: usermid,
//                                        contentType: 1
//                                    }
//                                ];
//                                callback(null, param);
//                            }
//                        });
//                    } else {
//                        console.log('えらーだよ');
//                        callback(error);
//                    }
//                });
//            } else {
//                console.log('run else');
//                var param = [
//                    {
//                        text: '画像を投稿してね〜',
//                        to: res.content.from,
//                        contentType: 1
//                    }
//                ];
//                callback(null, param);
//            }
//        },
//        function postToLine(param, callback) {
//            async.eachSeries(param, function(i, c) {
//                console.log('run post : ' + i.text);
//                if (i.contentType === 1) {
//                    var data = {
//                        to: [i.to],
//                        toChannel: 1383378250,
//                        eventType: "138311608800106203",
//                        content: {
//                            "contentType":i.contentType,
//                            "toType":1,
//                            "text":i.text
//                        }
//                    };
//                } else if (i.contentType === 2) {
//                    var data = {
//                        to: [i.to],
//                        toChannel: 1383378250,
//                        eventType: "138311608800106203",
//                        content: {
//                            "contentType":i.contentType,
//                            "toType":1,
//                            "originalContentUrl": i.originalContentUrl,
//                            "previewImageUrl": i.previewImageUrl
//                        }
//                    };
//                }
//                var opts = {
//                    url: 'https://trialbot-api.line.me/v1/events',
//                    headers: {
//                        "Content-type": "application/json; charset=UTF-8",
//                        "X-Line-ChannelID": line_key.channelID,
//                        "X-Line-ChannelSecret": line_key.channelSecret,
//                        "X-Line-Trusted-User-With-ACL": line_key.mid
//                    },
//                    body: JSON.stringify(data)
//                }
//                request.post(opts, function (error, response, body) {
//                    if (!error && response.statusCode == 200) {
//                        c(null);
//                    } else {
//                        console.log(JSON.stringify(body));
//                        c(error);
//                    }
//                });
//            }, function(err) {
//                if (err) {
//                    console.log('error : ' + err);
//                    callback(err);
//                } else {
//                    console.log('post complete');
//                    callback(null);
//                }
//            });
//        }
//    ], function (err, result) {
//    });
};
