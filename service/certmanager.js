var sys       = require('util')
var execsync  = require('child_process').execSync;
var format    = require("string-template");
var mqtt      = require('mqtt');
var fs        = require('fs');
var conf      = require('config')

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

var options = {
    // keyPath: KEY,
    // certPath: CERT,
    rejectUnauthorized : false,
    //The CA list will be used to determine if server is authorized
    //ca: '/home/ubuntu/codes/pki-example-3/ca/tls-ca-chain.pem'
};
var client  = mqtt.connect('mqtts://pacrt.io', conf.mqtts);

client.subscribe('/strmv1/certreq');

client.on('message', function(topic, message, packet) {
    var profile = decode(message);
    console.log('Message on topic certreq: ', profile);
    gencert(profile, function(err, res) {
        console.log('on-message - err: ', err, ' res: ', res)
        if(!err) {
            console.log('on-message - no error - publishing.... ');
            client.publish('/strmv1/gencert/cert/' + profile.nodeid, res);
        }else { //handle error
            client.publish('/strmv1/gencert/cert/err/' + profile.nodeid, {error: err})
            console.log('Error genereting certificate: ', err);
        }
    });
});

// client.publish('/strmv1/certreq', encode({nodeid: 'mynodeid', pass: 'pass'}));

var csrcmdtmpl = 'openssl req -new -config ../pki/etc/client.conf -out ../pki/certs/{nodeid}.csr -keyout ../pki/certs/{nodeid}.key -subj "/C=US/O=PacRT/OU=PacRT Hardware/CN={nodeid}" -passout pass:pass';

var certcmdtmpl = 'openssl ca -batch -config ../pki/etc/tls-ca.conf -in ../pki/certs/{nodeid}.csr -out ../pki/certs/{nodeid}.crt -policy extern_pol -extensions client_ext -passin pass:pass';

var certcmdtmpl2 = 'openssl ca -batch -config ../pki/etc/tls-ca.conf -in <(echo "{csr}") -out ../pki/certs/{nodeid}.crt -policy extern_pol -extensions client_ext -passin pass:pass';

var gencert = function(profile, callback) {
    if(profile.csr != null) {
        var certcmd2 = format(certcmdtmpl2, profile);
        try {
            execsync(certcmd2, {shell: 'bash'}, puts);
            var certpath = format('../pki/certs/{nodeid}.crt', profile);
            var cert = fs.readFileSync(certpath);
            console.log('Certificate generated: ', cert);
            var pkiobj = {
                cert: cert
            };
            return callback(null, encode(pkiobj));
        } catch (e) {
            console.log('Error is: ', e);
            return callback(e);
        }
    }
    var csrcmd = format(csrcmdtmpl, profile);
    var certcmd = format(certcmdtmpl, profile);
    execsync(csrcmd, puts);
    execsync(certcmd, puts);
    var keypath = format('../pki/certs/{nodeid}.key', profile);
    var certpath = format('../pki/certs/{nodeid}.crt', profile);
    var key = fs.readFileSync(keypath);
    var pass = format('{pass}', profile);
    console.log('key: ', key)
    var cert = fs.readFileSync(certpath);
    console.log('cert: ', cert)
    var pkiobj = {
        key: key,
        cert: cert,
        pass: pass
    };
    return callback(null, encode(pkiobj));
}