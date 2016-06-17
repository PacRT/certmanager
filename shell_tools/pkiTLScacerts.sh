#! /bin/sh
mkdir -p ../pki/ca/root-ca/private ../pki/ca/root-ca/db ../pki/crl ../pki/certs
chmod 700 ../pki/ca/root-ca/private

cp /dev/null ../pki/ca/root-ca/db/root-ca.db
cp /dev/null ../pki/ca/root-ca/db/root-ca.db.attr
echo 01 > ../pki/ca/root-ca/db/root-ca.crt.srl
echo 01 > ../pki/ca/root-ca/db/root-ca.crl.srl

openssl req -new \
    -config ../pki/etc/root-ca.conf \
    -out ../pki/ca/root-ca.csr \
    -keyout ../pki/ca/root-ca/private/root-ca.key \
    -passin pass:pass -passout pass:pass

openssl ca -selfsign -batch \
    -config ../pki/etc/root-ca.conf \
    -notext \
    -in ../pki/ca/root-ca.csr \
    -out ../pki/ca/root-ca.crt \
    -extensions root_ca_ext \
    -enddate 301231235959Z \
    -passin pass:pass

openssl ca -gencrl \
    -config ../pki/etc/root-ca.conf \
    -out ../pki/crl/root-ca.crl \
    -passin pass:pass

mkdir -p ../pki/ca/tls-ca/private ../pki/ca/tls-ca/db
chmod 700 ../pki/ca/tls-ca/private

cp /dev/null ../pki/ca/tls-ca/db/tls-ca.db
cp /dev/null ../pki/ca/tls-ca/db/tls-ca.db.attr
echo 01 > ../pki/ca/tls-ca/db/tls-ca.crt.srl
echo 01 > ../pki/ca/tls-ca/db/tls-ca.crl.srl

openssl req -new \
    -config ../pki/etc/tls-ca.conf \
    -out ../pki/ca/tls-ca.csr \
    -keyout ../pki/ca/tls-ca/private/tls-ca.key \
    -passout pass:pass

openssl ca -batch \
    -config ../pki/etc/root-ca.conf \
    -notext \
    -in ../pki/ca/tls-ca.csr \
    -out ../pki/ca/tls-ca.crt \
    -extensions signing_ca_ext \
    -passin pass:pass

openssl ca -gencrl \
    -config ../pki/etc/tls-ca.conf \
    -out ../pki/crl/tls-ca.crl \
    -passin pass:pass

cat ../pki/ca/tls-ca.crt ../pki/ca/root-ca.crt > \
    ../pki/ca/tls-ca-chain.pem
