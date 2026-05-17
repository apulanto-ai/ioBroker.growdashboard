'use strict';

const utils = require('@iobroker/adapter-core');

class GrowDashboard extends utils.Adapter {
    constructor(options) {
        super({
            ...options,
            name: 'growdashboard',
        });

        this.on('ready',       this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('unload',      this.onUnload.bind(this));
    }

    async onReady() {
        this.setState('info.connection', { val: true, ack: true });
        this.log.info('GrowDashboard adapter started.');

        const rooms = this.config.rooms || [];
        this.log.info(`${rooms.length} grow room(s) configured.`);

        // TODO: subscribe to sensor states per room
    }

    onStateChange(id, state) {
        if (!state || state.ack) return;
        this.log.debug(`State changed: ${id} = ${state.val}`);
    }

    onUnload(callback) {
        try {
            this.setState('info.connection', { val: false, ack: true });
            callback();
        } catch {
            callback();
        }
    }
}

if (require.main !== module) {
    module.exports = options => new GrowDashboard(options);
} else {
    new GrowDashboard();
}
