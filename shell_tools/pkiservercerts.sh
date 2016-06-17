#! /bin/sh
SAN=DNS:pacrt.io,DNS:*.pacrt.io \
openssl req -new \
    -config ../pki/etc/server.conf \
    -out ../pki/certs/pacrt.io.csr \
    -keyout ../pki/certs/pacrt.io.key \
    -subj "/C=US/O=PacRT DOT IO/CN=*.pacrt.io"

openssl ca -batch \
    -config ../pki/etc/tls-ca.conf \
    -notext \
    -in ../pki/certs/pacrt.io.csr \
    -out ../pki/certs/pacrt.io.crt \
    -extensions server_ext \
    -passin pass:pass

openssl pkcs12 -export \
    -name "pacrt.io (Network Component)" \
    -caname "PacRT TLS CA" \
    -caname "PacRT Root CA" \
    -inkey ../pki/certs/pacrt.io.key \
    -in ../pki/certs/pacrt.io.crt \
    -certfile ../pki/ca/tls-ca-chain.pem \
    -out ../pki/certs/pacrt.io.p12 \
    -passin pass:pass -passout pass:pass
