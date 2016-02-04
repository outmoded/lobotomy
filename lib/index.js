'use strict';

// Load modules

const Call = require('call');
const Hoek = require('hoek');
const Joi = require('joi');


// Declare internals

const internals = {};


exports.register = function (server, options, next) {

    for (let i = 0; i < server.connections.length; ++i) {
        const connection = server.connections[i];
        connection.plugins.lobotomy = { _router: new Call.Router(connection.settings.router) };
    }

    server.decorate('server', 'lobotomize', internals.lobotomize);
    server.ext('onRequest', internals.onRequest);

    return next();
};


exports.register.attributes = {
    pkg: require('../package.json')
};


internals.route = Joi.object({
    method: Joi.string().regex(/^[a-zA-Z0-9!#\$%&'\*\+\-\.^_`\|~]+$/).lowercase().default('get'),
    path: Joi.string().required(),
    handler: Joi.alternatives([
        Joi.func(),
        Joi.object({
            statusCode: Joi.number().positive().integer().min(200).default(200),
            headers: Joi.object(),
            payload: Joi.required()
        })
    ])
        .required(),
    vhost: Joi.array().items(Joi.string().hostname()).min(1).single().default(['*']),
    filter: Joi.func(),
    once: Joi.boolean(),
    after: Joi.number().positive().integer().min(1)
})
    .without('filter', ['once', 'after']);


internals.lobotomize = function (options) {

    Hoek.assert(this.connections.length, 'Cannot lobotomize a server without any connections');

    const settings = Joi.attempt(options, internals.route);

    for (let i = 0; i < this.connections.length; ++i) {
        const connection = this.connections[i];
        if (connection.plugins.lobotomy) {
            const router = connection.plugins.lobotomy._router;

            for (let j = 0; j < settings.vhost.length; ++j) {
                const vhost = settings.vhost[j];
                router.add({ method: settings.method, path: settings.path, vhost: vhost }, settings);
            }
        }
    }
};


internals.onRequest = function (request, reply) {

    const router = request.connection.plugins.lobotomy._router;
    const match = router.route(request.method, request.path, request.info.hostname);
    if (match.isBoom) {
        return reply.continue();
    }

    const handler = match.route.handler;
    return reply(handler.payload).code(handler.statusCode);
};
