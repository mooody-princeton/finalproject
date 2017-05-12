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
          //labels: ['6 Days Ago', '5 Days Ago', '4 Days Ago', '3 Days Ago', '2 Days Ago', '1 Day Ago', 'Today'],
          //labels: ['', '← LAST WEEK', '', '', '', 'TODAY →', ''],
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
            data.labels[i] = '';
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
        //data.labels[timeframe - 1] = 'TODAY';
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
       lineSmooth: Chartist.Interpolation.cardinal({
                fillHoles: true,
            }),
       plugins: [
           Chartist.plugins.tooltip({
               class: 'tooltip',
               transformTooltipTextFnc: function(value) {
                   return ""; // bwahaha relativity
               }
           }),
           Chartist.plugins.legend({
               legendNames: ['', 'Wellbeing', 'Sleep', 'Exercise', 'Study', 'Social', ''],
               position: document.getElementById('moodchart-legend')
           })
       ]
    };

    var responsiveOptions = [
      ['screen and (min-width: 641px) and (max-width: 1024px)', {
        //showPoint: false,
        axisX: {
          labelInterpolationFnc: function(value) {
            return "";
          }
        }
      }],
      ['screen and (max-width: 640px)', {
        //showPoint: false,
        axisX: {
          labelInterpolationFnc: function(value) {
            return "";
          }
        }
      }]
    ];

    var chart = new Chartist.Line('#moodchart', data, options, responsiveOptions);

    return chart;
}

        // Chart animation
        // var seq = 0,
        //     delays = 10,
        //     durations = 1000;

        // Once the chart is fully created we reset the sequence
        // chart.on('created', function() {
        //   seq = 0;
        // });

        // On each drawn element by Chartist we use the Chartist.Svg API to trigger SMIL animations
        // chart.on('draw', function(data) {
        //   seq++;
        //
        //   if(data.type === 'line') {
        //     // If the drawn element is a line we do a simple opacity fade in. This could also be achieved using CSS3 animations.
        //     data.element.animate({
        //       opacity: {
        //         // The delay when we like to start the animation
        //         begin: seq * delays + 1000,
        //         // Duration of the animation
        //         dur: durations,
        //         // The value where the animation should start
        //         from: 0,
        //         // The value where it should end
        //         to: 1
        //       }
        //     });
        //   } else if(data.type === 'label' && data.axis === 'x') {
        //     data.element.animate({
        //       y: {
        //         begin: seq * delays,
        //         dur: durations,
        //         from: data.y + 100,
        //         to: data.y,
        //         // We can specify an easing function from Chartist.Svg.Easing
        //         easing: 'easeOutQuart'
        //       }
        //     });
        //   } else if(data.type === 'label' && data.axis === 'y') {
        //     data.element.animate({
        //       x: {
        //         begin: seq * delays,
        //         dur: durations,
        //         from: data.x - 100,
        //         to: data.x,
        //         easing: 'easeOutQuart'
        //       }
        //     });
        //   } else if(data.type === 'point') {
        //     data.element.animate({
        //       x1: {
        //         begin: seq * delays,
        //         dur: durations,
        //         from: data.x - 10,
        //         to: data.x,
        //         easing: 'easeOutQuart'
        //       },
        //       x2: {
        //         begin: seq * delays,
        //         dur: durations,
        //         from: data.x - 10,
        //         to: data.x,
        //         easing: 'easeOutQuart'
        //       },
        //       opacity: {
        //         begin: seq * delays,
        //         dur: durations,
        //         from: 0,
        //         to: 1,
        //         easing: 'easeOutQuart'
        //       }
        //     });
        //   } else if(data.type === 'grid') {
        //     // Using data.axis we get x or y which we can use to construct our animation definition objects
        //     var pos1Animation = {
        //       begin: seq * delays,
        //       dur: durations,
        //       from: data[data.axis.units.pos + '1'] - 30,
        //       to: data[data.axis.units.pos + '1'],
        //       easing: 'easeOutQuart'
        //     };
        //
        //     var pos2Animation = {
        //       begin: seq * delays,
        //       dur: durations,
        //       from: data[data.axis.units.pos + '2'] - 100,
        //       to: data[data.axis.units.pos + '2'],
        //       easing: 'easeOutQuart'
        //     };
        //
        //     var animations = {};
        //     animations[data.axis.units.pos + '1'] = pos1Animation;
        //     animations[data.axis.units.pos + '2'] = pos2Animation;
        //     animations['opacity'] = {
        //       begin: seq * delays,
        //       dur: durations,
        //       from: 0,
        //       to: 1,
        //       easing: 'easeOutQuart'
        //     };
        //
        //     data.element.animate(animations);
        //   }
        // });
