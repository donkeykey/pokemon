var https = require("https");
var async = require('async');
var doc = require('dynamodb-doc');
var dynamo = new doc.DynamoDB();
var token = require('./token.json');
var msg;
var options;
exports.handler = function(event, context) {
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
                        console.log("dynamo : " + JSON.stringify(res));
                        callback(null, event.entry[0].messaging[0].message.text);
                    } else {
                        callback(null, 'はじめまして！IFTTTアプリのMaker Actionに https://4opt7zfg6f.execute-api.ap-northeast-1.amazonaws.com/prod/setPokeSearchLocation?id=' + event.entry[0].messaging[0].sender.id + '&location={{OccurredAt}}&action={{EnteredOrExited}} を設定して下さい。');
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
