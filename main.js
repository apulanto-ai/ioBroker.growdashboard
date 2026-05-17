'use strict';

const utils = require('@iobroker/adapter-core');

function calcVPD(tempC, rh) {
    const svp = 0.6108 * Math.exp(17.27 * tempC / (tempC + 237.3));
    return parseFloat((svp * (1 - rh / 100)).toFixed(3));
}

class GrowDashboard extends utils.Adapter {
    constructor(options) {
        super({ ...options, name: 'growdashboard' });

        this._temp = null;
        this._hum  = null;

        this.on('ready',              this.onReady.bind(this));
        this.on('stateChange',        this.onStateChange.bind(this));
        this.on('foreignStateChange', this.onForeignStateChange.bind(this));
        this.on('unload',             this.onUnload.bind(this));
    }

    async onReady() {
        this.setState('info.connection', { val: true, ack: true });

        const { ventTempId, ventHumId, ventFanReadId, ventFanWriteId } = this.config;

        if (ventTempId)    await this.subscribeForeignStatesAsync(ventTempId);
        if (ventHumId)     await this.subscribeForeignStatesAsync(ventHumId);
        if (ventFanReadId) await this.subscribeForeignStatesAsync(ventFanReadId);

        // Own fanControl state → write through to external target
        if (ventFanWriteId) {
            await this.subscribeStatesAsync('ventilation.fanControl');
        }

        // Seed current values
        if (ventTempId) {
            const s = await this.getForeignStateAsync(ventTempId);
            if (s) { this._temp = s.val; await this.setStateAsync('ventilation.temperature', { val: s.val, ack: true }); }
        }
        if (ventHumId) {
            const s = await this.getForeignStateAsync(ventHumId);
            if (s) { this._hum = s.val; await this.setStateAsync('ventilation.humidity', { val: s.val, ack: true }); }
        }
        if (ventFanReadId) {
            const s = await this.getForeignStateAsync(ventFanReadId);
            if (s) await this.setStateAsync('ventilation.fanSpeed', { val: s.val, ack: true });
        }

        this._updateVpd();
        this.log.info('GrowDashboard gestartet.');
    }

    onForeignStateChange(id, state) {
        if (!state || state.ack === false) return;
        const { ventTempId, ventHumId, ventFanReadId } = this.config;

        if (id === ventTempId) {
            this._temp = state.val;
            this.setStateAsync('ventilation.temperature', { val: state.val, ack: true });
            this._updateVpd();
        } else if (id === ventHumId) {
            this._hum = state.val;
            this.setStateAsync('ventilation.humidity', { val: state.val, ack: true });
            this._updateVpd();
        } else if (id === ventFanReadId) {
            this.setStateAsync('ventilation.fanSpeed', { val: state.val, ack: true });
        }
    }

    onStateChange(id, state) {
        // ventilation.fanControl written by user → forward to external target
        if (!state || state.ack) return;
        if (id === `${this.namespace}.ventilation.fanControl`) {
            const target = this.config.ventFanWriteId;
            if (target) {
                this.setForeignStateAsync(target, { val: state.val, ack: false });
                this.log.debug(`Lüfter Sollwert → ${target}: ${state.val}%`);
            }
            this.setStateAsync('ventilation.fanControl', { val: state.val, ack: true });
        }
    }

    _updateVpd() {
        if (this._temp === null || this._hum === null) return;
        const vpd = calcVPD(this._temp, this._hum);
        this.setStateAsync('ventilation.vpd', { val: vpd, ack: true });
        this.log.debug(`VPD: ${vpd} kPa (T=${this._temp}°C, rH=${this._hum}%)`);
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
