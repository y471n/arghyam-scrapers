var x       = require('casper').selectXPath,
    casper  = require('casper').create({clientScripts: "jquery.min.js"}),
    write   = require('./csv').write;

var stateTbId           = "ctl00_ContentPlaceHolder1_divStateWise",
    stateTbSel          = '#'+ stateTbId +' tbody tbody tr:gt(2):lt(31)',
    stateTbIds;

var districtTbId  = 'ctl00_ContentPlaceHolder1_divDistrictWise',
    districtTbSel = '#'+ districtTbId +' tbody tbody tr:gt(3)';

var buffer  =  [];

casper.start('http://tsc.gov.in/tsc/Report/Financial/RptPercentageFinComponentStatewiseDistrictwise_net.aspx?id=FIN', function() {
  stateTbIds = this.evaluate(function(stateTbId) {
    return $('#'+ stateTbId +'').find('a').map(function() {
      return [[ $(this).attr('id'), $(this).text() ]];
    }).get();
  }, {
    stateTbId:stateTbId
  });

  stateData = casper.evaluate(function(stateTbSel) {
    var rows = $(stateTbSel).map(function() {
      return [ $(this).children().map(function() {
        if($(this).text() !== '') { return $(this).text().trim(); }
      }).get() ];
    }).get();

    // Insert blank in place of SL_No for Grand Total row
    rows[rows.length - 1].splice(0, 0, '');

    return rows;
  }, {stateTbSel: stateTbSel});

  console.log('State', stateTbIds.length, '/', stateTbIds.length);

  this.then(function() {
    write('PercentageFinComponentStatewiseDistrictwise_net.state.csv', stateData);
  });

  this.each(stateTbIds.slice(0, 4), function(casper, stateID, index) {
    this.then(function() {
      this.click(x('//*[@id="' + stateID[0] + '"]'));
    });
    this.then(function() {
      // returns [[ANDHRA PRADESH, 7, KARIMNAGAR, 13-02-2003, 11/2012, 10849.48, 7165.48, 2612.85, 1071.15, 5602.87, 1943.23, 176.13, 7722.23, 4840.01, 1939.23, 176.13, 6955.37],..]
      districtData = this.evaluate(function(districtTbSel, stateName) {
        var rows = $(districtTbSel).not(':last');

        rows = rows.map(function(i) {
          var row = $(this).children().map(function() {
            if($(this).text() !== '') { return $(this).text().trim(); }
          }).get();

          // Insert blank in place of SL_No for Total row
          if ((rows.length - 1) == i) { row.splice(0, 0, ''); }

          row.splice(0, 0, stateName);
          return [row];
        }).get();
        return rows;
      }, {
        districtTbSel  :  districtTbSel,
        stateName      :  stateID[1]
      });
      buffer.push.apply(buffer, districtData);
      console.log('District', index + 1, '/', stateTbIds.length, buffer.length, 'rows');
    });
    this.then(function() {
      this.back();
    });
  });

  this.then(function() {
    write('PercentageFinComponentStatewiseDistrictwise_net.district.csv', buffer);
  });

});

casper.run();
