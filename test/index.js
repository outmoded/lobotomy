'use strict';

// Load modules

const Boom = require('boom');
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

    it('invokes function handler', (done) => {

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

            const handler = function (request, reply) {

                return reply(2);
            };

            server.lobotomize({ path: '/', handler: handler });

            server.inject('/', (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.result).to.equal(2);
                done();
            });
        });
    });

    it('returns error', (done) => {

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

            server.lobotomize({ path: '/', handler: Boom.badRequest('kaboom') });

            server.inject('/', (res) => {

                expect(res.statusCode).to.equal(400);
                expect(res.result.message).to.equal('kaboom');
                done();
            });
        });
    });

    it('overrides route once', (done) => {

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

            server.lobotomize({ path: '/', handler: { payload: 2 }, once: true });

            server.inject('/', (res1) => {

                expect(res1.statusCode).to.equal(200);
                expect(res1.result).to.equal(2);

                server.inject('/', (res2) => {

                    expect(res2.statusCode).to.equal(200);
                    expect(res2.result).to.equal(1);
                    done();
                });
            });
        });
    });

    it('overrides route after count', (done) => {

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

            server.lobotomize({ path: '/', handler: { payload: 2 }, after: 1 });

            server.inject('/', (res1) => {

                expect(res1.statusCode).to.equal(200);
                expect(res1.result).to.equal(1);

                server.inject('/', (res2) => {

                    expect(res2.statusCode).to.equal(200);
                    expect(res2.result).to.equal(2);
                    done();
                });
            });
        });
    });

    it('overrides route based on filter', (done) => {

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

            let count = 0;
            const filter = function (request, next) {

                return next(++count > 1);
            };

            server.lobotomize({ path: '/', handler: { payload: 2 }, filter: filter });

            server.inject('/', (res1) => {

                expect(res1.statusCode).to.equal(200);
                expect(res1.result).to.equal(1);

                server.inject('/', (res2) => {

                    expect(res2.statusCode).to.equal(200);
                    expect(res2.result).to.equal(2);
                    done();
                });
            });
        });
    });
});
