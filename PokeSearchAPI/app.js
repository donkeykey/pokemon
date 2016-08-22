'use strict';
var https = require("https");
var http = require('http');
var url = require('url');
var token = require('./token.json');
var user = require('./user.json');

const PokemonGO = require('pokemon-go-node-api');

//Set environment variables or replace placeholder text

http.createServer(function (req, res) {
    var url_parts = url.parse(req.url,true);
    var location = {
        type: 'coords',
    coords: {
        latitude: Number(url_parts.query.lat),
    longitude: Number(url_parts.query.lon),
    altitude: 0
    }
    };
    console.log(url_parts.query);

    var a = new PokemonGO.Pokeio();
    a.init(user.username, user.password, location, user.provider, (err) => {
        if (err) return;
        res.writeHead(200, {'Content-Type': 'text/plain'});
        let texts = '';

        console.log('1[i] Current location: ' + a.playerInfo.locationName);
        console.log('1[i] lat/long/alt: : ' + a.playerInfo.latitude + ' ' + a.playerInfo.longitude + ' ' + a.playerInfo.altitude);
        texts += a.playerInfo.locationName + '周辺に\n';

        a.Heartbeat((err,hb)=>{
            if(err) {
                console.log(err);
            }

            for (var i = hb.cells.length - 1; i >= 0; i--) {
                if(hb.cells[i].NearbyPokemon[0]) {
                    //console.log(a.pokemonlist[0])
                    let pokemon = a.pokemonlist[parseInt(hb.cells[i].NearbyPokemon[0].PokedexNumber)-1];
                    texts += pokemon.name + '\n';
                    console.log('1[+] There is a ' + pokemon.name + ' near.');

                }
            }
            texts += 'がいます。';
            console.log('texts : ' + texts);
            res.end(texts);
            // post to facebook
            var options = {
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
                        "id": url_parts.query.id
                    },
                    "message": {
                        "text": texts
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
        });

    });
}).listen(8888); // 127.0.0.1の1337番ポートで待機
