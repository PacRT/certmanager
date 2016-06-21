var sys = require('util')
var execsync = require('child_process').execSync;
var format = require("string-template");
var mqtt    = require('mqtt');
var fs = require('fs');
var config = require('config');

var msgpack = require('msgpack5')()
    , encode  = msgpack.encode
    , decode  = msgpack.decode

function puts(error, stderr, stdout) {
    if(error)
        console.log('error: ', error);
    if(stdout)
        console.log('stdout: ', stdout)
    if(stderr)
        console.log('stderr: ', stderr)
}

var client  = mqtt.connect('mqtts://pacrt.io', config.mqtts);

//client.subscribe('/strmv1/gencert/cert/mynodeid');


var profile = {nodeid: 'mynodeid', pass: 'pass'}

var csrcmdtmpl = 'openssl req -new -config ../pki/etc/client.conf -out ../pki/certs/{nodeid}.csr -keyout ../pki/certs/{nodeid}.key -subj "/C=US/O=PacRT/OU=PacRT Hardware/CN={nodeid}" -passout pass:{pass}';

client.subscribe(format('/strmv1/gencert/cert/' + '{nodeid}', profile));

client.subscribe(format('/strmv1/gencert/cert/err/' + '{nodeid}', profile));

client.on('message', function(topic, message, packet) {
    var msg = decode(message);
    console.log('Message on topic: ', topic, "----", msg);
    if(topic == '/strmv1/gencert/cert/' + profile.nodeid) {
        var certpath = format('../pki/certs/{nodeid}__.crt', profile);
        fs.writeFileSync(certpath, msg.cert);
    }
});

var csrcmd = format(csrcmdtmpl, profile);
delete profile.pass
execsync(csrcmd, puts);
var keypath = format('../pki/certs/{nodeid}.key', profile);
var key = fs.readFileSync(keypath);
var pass = format('{pass}', profile);

var csrpath = format('../pki/certs/{nodeid}.csr', profile);
var csrtext = fs.readFileSync(csrpath);

console.log('key: ', key)

client.publish('/strmv1/certreq', encode({nodeid: profile.nodeid, csr: csrtext}));

//client.publish('/aaaa/bb', encode({nodeid: 'mynodeid', pass: 'pass'}));
