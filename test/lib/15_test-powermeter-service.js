'use strict'

const assert = require('assert');
const log = require("./logger")._system;
const path = require('path');
const fs = require('fs');
const Characteristic = require('./characteristic-mock').Characteristic;
const Service = require('./service-mock').Service;

const homebridgeMock = require('./homebridge-mock')();

require("../../index")(homebridgeMock);

describe("Homematic Plugin (index)", function() {

  let datapath = path.join(__dirname,'data','data_test_HM-ES-PMSw1-Pl.json')
  let data = fs.readFileSync(datapath).toString();
  let that = this
  var config = { ccu_ip: '127.0.0.1',subsection :'HomeKit', testdata:data};
  var platform = new homebridgeMock.PlatformType(log, config);

  before(function() {
    log.debug('Init Platform with Energy Counter');
    platform.accessories(function(acc) {
      that.accessories = acc;
    })
  });

  after(function() {
    log.debug('Shutdown Platform');
    that.accessories.map(ac => {
      ac.shutdown()
    });
  });


  describe("Homebridge Platform Energy Counter Service Test", function() {

    it('test accessory build', function (done) {
      assert.ok(that.accessories, "Did not find any accessories!");
      assert.equal(that.accessories.length, 1);
      done();
    });


    it('test set voltage to 230 v, current to 500 mA, power to 230 w', function (done) {
        platform.xmlrpc.event(['BidCos-RF','ADR1234567890:2','VOLTAGE',230]);
        platform.xmlrpc.event(['BidCos-RF','ADR1234567890:2','CURRENT',500]);
        platform.xmlrpc.event(['BidCos-RF','ADR1234567890:2','POWER',230]);

        // check
        that.accessories.map(ac => {
          let s = ac.get_Service(Service.PowerMeterService)
          assert.ok(s, "Service.PowerMeterService not found in Energy Counter %s",ac.name);
          let cp = s.getCharacteristic(Characteristic.PowerCharacteristic)
          assert.ok(cp, "Characteristic.PowerCharacteristic not found in Energy Counter %s",ac.name);
          cp.getValue(function(context,value){
            assert.equal(value, 230,"Power is " + value + " not 230");
          });

          let cc = s.getCharacteristic(Characteristic.CurrentCharacteristic)
          assert.ok(cc, "Characteristic.CurrentCharacteristic not found in Energy Counter %s",ac.name);
          cc.getValue(function(context,value){
            // Note there is a internal recalculation to amepere ccu sends milliamps
            assert.equal(value, 0.5,"Current is " + value + " not 0.5A");
          });

          let cv = s.getCharacteristic(Characteristic.VoltageCharacteristic)
          assert.ok(cv, "Characteristic.VoltageCharacteristic not found in Energy Counter %s",ac.name);
          cv.getValue(function(context,value){
            assert.equal(value, 230,"Voltage is " + value + " not 230");
          });


        })
        done();

    });


});
});
