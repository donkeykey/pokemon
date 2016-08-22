'use strict';

const PokemonGO = require('pokemon-go-node-api');

//Set environment variables or replace placeholder text
var location = {
    type: 'coords',
    coords: {
        latitude: 35.679624,
        longitude: 139.736764,
        altitude: 0
    }
};

var username = 'donkeyshima';
var password = '923Mguoslifc';
var provider = 'ptc';

exports.handler = function(event, context) {

    var a = new PokemonGO.Pokeio();
    a.init(username, password, location, provider, (err) => {
        if (err) throw err;

        console.log('1[i] Current location: ' + a.playerInfo.locationName);
        console.log('1[i] lat/long/alt: : ' + a.playerInfo.latitude + ' ' + a.playerInfo.longitude + ' ' + a.playerInfo.altitude);

        context.done(null, "done");
        a.Heartbeat((err,hb)=>{
            if(err) {
                console.log(err);
            }

            let texts = '';
            for (var i = hb.cells.length - 1; i >= 0; i--) {
                if(hb.cells[i].NearbyPokemon[0]) {
                    //console.log(a.pokemonlist[0])
                    let pokemon = a.pokemonlist[parseInt(hb.cells[i].NearbyPokemon[0].PokedexNumber)-1];
                    console.log('1[+] There is a ' + pokemon.name + ' near.');

                }
            }
        });

    });
}
