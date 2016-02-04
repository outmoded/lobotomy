'use strict';

// Load modules

const Code = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const Lobotomy = require('../');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Lobotomy', () => {

    it('overrides route', (done) => {

        const server = new Hapi.Server();
        server.connection();

        server.register(Lobotomy, (err) => {

            expect(err).to.not.exist();

            server.route({
                path: '/',
                method: 'GET',
                handler: function (request, reply) {

                    return reply(1);
                }
            });

            server.lobotomize({ path: '/', handler: { payload: 2 } });

            server.inject('/', (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.result).to.equal(2);
                done();
            });
        });
    });

    it('ignores other routes', (done) => {

        const server = new Hapi.Server();
        server.connection();

        server.register(Lobotomy, (err) => {

            expect(err).to.not.exist();

            server.route({
                path: '/',
                method: 'GET',
                handler: function (request, reply) {

                    return reply(1);
                }
            });

            server.route({
                path: '/a',
                method: 'GET',
                handler: function (request, reply) {

                    return reply(3);
                }
            });

            server.lobotomize({ path: '/', handler: { payload: 2 } });

            server.inject('/a', (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.result).to.equal(3);
                done();
            });
        });
    });

    it('ignores other connections', (done) => {

        const server = new Hapi.Server();
        server.connection();

        server.register(Lobotomy, (err) => {

            expect(err).to.not.exist();

            server.connection();

            server.route({
                path: '/',
                method: 'GET',
                handler: function (request, reply) {

                    return reply(1);
                }
            });

            server.lobotomize({ path: '/', handler: { payload: 2 } });

            server.connections[1].inject('/', (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.result).to.equal(1);
                done();
            });
        });
    });
});
