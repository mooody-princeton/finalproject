// moodchart.js
// Script that draw mood chart

// Get mood chart data for one week or one month
get_moodchartdata = function(scope_data, timeframe) {
    var wellbeing = scope_data.wellbeingArray;
    var sleep = scope_data.sleepArray;
    var exercise = scope_data.exerciseArray;
    var study = scope_data.studyArray;
    var social = scope_data.socialArray;

    var data = {};
    if (timeframe === 7) {
        data = {
          labels: ['6 Days Ago', '5 Days Ago', '4 Days Ago', '3 Days Ago', '2 Days Ago', '1 Day Ago', 'Today'],
          series: [
            [null, null, null, null, null, null, null],
            {
                name: 'Wellbeing',
                data: [wellbeing[6], wellbeing[5], wellbeing[4], wellbeing[3], wellbeing[2], wellbeing[1], wellbeing[0]]
            },
            {
                name: 'Sleep',
                data: [sleep[6], sleep[5], sleep[4], sleep[3], sleep[2], sleep[1], sleep[0]]
            },
            {
                name: 'Exercise',
                data: [exercise[6], exercise[5], exercise[4], exercise[3], exercise[2], exercise[1], exercise[0]]
            },
            {
                name: 'Study',
                data: [study[6], study[5], study[4], study[3], study[2], study[1], study[0]]
            },
            {
                name: 'Social',
                data: [social[6], social[5], social[4], social[3], social[2], social[1], social[0]]
            }
          ]
        };
    } else {
        data.labels = [];
        data.series = [];
        data.series[0] = {};
        data.series[1] = {};
        data.series[2] = {};
        data.series[3] = {};
        data.series[4] = {};
        data.series[5] = {};
        data.series[0].data = [];
        data.series[1].data = [];
        data.series[2].data = [];
        data.series[3].data = [];
        data.series[4].data = [];
        data.series[5].data = [];

        for (var i = 0; i < timeframe; i++) {
            data.labels[i] = timeframe - i - 1;
            data.series[0].data[i] = null;
            data.series[1].data[i] = wellbeing[timeframe - i - 1];
            data.series[2].data[i] = sleep[timeframe - i - 1];
            data.series[3].data[i] = exercise[timeframe - i - 1];
            data.series[4].data[i] = study[timeframe - i - 1];
            data.series[5].data[i] = social[timeframe - i - 1];
        }
        data.series[1].name = 'Wellbeing';
        data.series[2].name = 'Sleep';
        data.series[3].name = 'Exercise';
        data.series[4].name = 'Study';
        data.series[5].name = 'Social';
        data.labels[timeframe - 1] = 'Today';
    }

    return data;
}

create_moodchart = function(data) {
    var options = {
        high: 9,
        low: 0,
        axisY: {
           onlyInteger: true,
           offset: 20,
           showLabel: false // bwahaha everything is relative, remove the label
       },
       plugins: [
           Chartist.plugins.tooltip({
               class: 'tooltip',
               transformTooltipTextFnc: function(value) {
                   return ""; // bwahaha relativity
               }
           })
       ]
    };

    var responsiveOptions = [
      ['screen and (min-width: 641px) and (max-width: 1024px)', {
        showPoint: false,
        axisX: {
          labelInterpolationFnc: function(value) {
            // Will return Mon, Tue, Wed etc. on medium screens
            return value.slice(0, 3);
          }
        }
      }],
      ['screen and (max-width: 640px)', {
        showPoint: false,
        axisX: {
          labelInterpolationFnc: function(value) {
            // Will return M, T, W etc. on small screens
            return value[0];
          }
        }
      }]
    ];

    var chart = new Chartist.Line('#moodchart', data, options, responsiveOptions);

    return chart;
}
