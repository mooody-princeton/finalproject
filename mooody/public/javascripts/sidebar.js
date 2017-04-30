// Sidebar.js
// Script for handling sidebar
// Toggle sidebar open

function w3_open() {
    document.getElementById("moodSidebar").style.display = "block";
}

// Toggle sidebar close
function w3_close() {
    document.getElementById("moodSidebar").style.display = "none";
}

// Create and return chart based on socialmood
function create_chart(socialmood) {
    var chart = new Chartist.Pie('.ct-chart', {
        series: [
            {meta:'Relaxed: ', value:socialmood[0]},
            {meta:'Happy: ', value:socialmood[1]},
            {meta:'Could be Better: ', value:socialmood[2]},
            {meta:'Sad: ', value:socialmood[3]},
            {meta:'Stressed: ', value:socialmood[4]},
            {meta:'Angry: ', value:socialmood[5]}
        ],
        labels: ["relaxed", "happy", "could be better", "sad", "stressed", "angry"]
    }, {
        donut: true,
        donutWidth: 30,
        showLabel: false,
        plugins: [
            // Using fillDonut removes animation from chart
            // Chartist.plugins.fillDonut({
            //     items: [
            //         {
            //             content: '<span class="post-title">Princeton\'s Mood</span>',
            //         }
            //     ]
            // }),
            Chartist.plugins.tooltip({
                class: 'tooltip',
                transformTooltipTextFnc: function(value) {
                    return (Math.round(value * 100)) + '%'
                }
            })
        ]
    });
    return chart;
}

// Draw chart
function draw_chart(data) {
    if(data.type === 'slice') {
        // Get the total path length in order to use for dash array animation
        var pathLength = data.element._node.getTotalLength();

        // Set a dasharray that matches the path length as prerequisite to animate dashoffset
        data.element.attr({
        'stroke-dasharray': pathLength + 'px ' + pathLength + 'px'
        });

        // Create animation definition while also assigning an ID to the animation for later sync usage
        var animationDefinition = {
            'stroke-dashoffset': {
                id: 'anim' + data.index,
                dur: 1000,
                from: -pathLength + 'px',
                to:  '0px',
                easing: Chartist.Svg.Easing.easeOutQuint,
                // We need to use `fill: 'freeze'` otherwise our animation will fall back to initial (not visible)
                fill: 'freeze'
            }
        };

        // If this was not the first slice, we need to time the animation so that it uses the end sync event of the previous animation
        if(data.index !== 0) {
            animationDefinition['stroke-dashoffset'].begin = 'anim' + (data.index - 1) + '.end';
        }

        // We need to set an initial value before the animation starts as we are not in guided mode which would do that for us
        data.element.attr({
            'stroke-dashoffset': -pathLength + 'px'
        });

        // We can't use guided mode as the animations need to rely on setting begin manually
        // See http://gionkunz.github.io/chartist-js/api-documentation.html#chartistsvg-function-animate
        data.element.animate(animationDefinition, false);
    }
}

// Calculate the percent for each mood
function calculate_mood(socialmood) {
    var percent = [];

    var sum = socialmood.relaxed + socialmood.happy + socialmood.couldbebetter + socialmood.sad + socialmood.stressed + socialmood.angry;
    percent.push(socialmood.relaxed / sum);
    percent.push(socialmood.happy / sum);
    percent.push(socialmood.couldbebetter / sum);
    percent.push(socialmood.sad / sum);
    percent.push(socialmood.stressed / sum);
    percent.push(socialmood.angry / sum);

    return percent;
}
