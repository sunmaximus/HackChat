/*
 * Copyright 2013 Boris Smus. All Rights Reserved.

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


navigator.getUserMedia = (navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia);
function MicrophoneSample() {
    this.WIDTH = 640;
    this.HEIGHT = 480;
    this.getMicrophoneInput();
    this.canvas = document.querySelector('canvas');
}

MicrophoneSample.prototype.getMicrophoneInput = function () {
    navigator.getUserMedia({ audio: true },
                            this.onStream.bind(this),
                            this.onStreamError.bind(this));
};

MicrophoneSample.prototype.onStream = function (stream) {
    var input = context.createMediaStreamSource(stream);
    //var filter = context.createBiquadFilter();
    //filter.frequency.value = 60.0;
    //filter.type = filter.allpass;
    //filter.Q = 50.0;

    var analyser = context.createAnalyser();
    analyser.minDecibels = -130;
    analyser.maxDecibels = -10;

    analyser.fftSize = 512;
    // Connect graph.
    input.connect(analyser);
  //  filter.connect(analyser);

    this.analyser = analyser;
    NumOfBins = analyser.frequencyBinCount;

   
    line = d3.line()
             .curve(d3.curveBasis)
             .x(function (d, i) { return x(i); })
             .y(function (d) { return y(d); });

    hueScale = d3.scaleLinear()
               .domain([0, NumOfBins - 1])
               .range([180, 240]);

    // Setup a timer to visualize some stuff.

    var recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = function (event) {
        console.log(event.results[0][0].transcript);

        //$("#message").val(event.results[0][0].transcript).trigger('keyup').trigger('change');
        //$("messages-card-container").trigger('change');
        document.getElementById('message').value = event.results[0][0].transcript;
        //$("#Submit").removeAttr('disabled');
    }
    //$("#Submit").click(function () {
    //    if(recognition.continuous == true)
    //        recognition.continuous = false;
    //    else
    //        recognition.continuous = false;
    //});

    recognition.start();

    requestAnimFrame(this.visualize.bind(this));
};

MicrophoneSample.prototype.onStreamError = function (e) {
    console.error('Error getting microphone', e);
};




var NumOfBins = 200;

var synth = window.speechSynthesis;

var line = d3.line()
         .curve(d3.curveBasis)
         .x(function (d, i) { return x(i); })
         .y(function (d) { return y(d); });

var hueScale = d3.scaleLinear()
           .domain([0, NumOfBins-1])
           .range([180, 240]);

MicrophoneSample.prototype.visualize = function () {


    var times = new Uint8Array(NumOfBins);


    var x = d3.scaleLinear()
   .domain([0, times.length-1])
   .range([0, width]);

   



    ////console.log(times);
    this.analyser.getByteFrequencyData(times);

  
    var line = d3.line()
           .curve(d3.curveBasis)
           .x(function (d, i) { return x(i); })
           .y(function (d) { return y(d); });
    svg.selectAll(".bar").remove();


    var bar = svg.selectAll(".bar")
        .data(times)
      .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function (d,i) { return "translate(" + x(i) + "," + y(d+4) + ")"; });



    bar.append("rect")
        .attr("x", 1)
        .attr("width", x(1))
        .attr("height", function (d) { return height - y(d+100); })
    .attr("fill", function (d, i) { return d3.hsl(hueScale(i), 1, 0.5) });


   requestAnimFrame(this.visualize.bind(this));
};

function palette(min, max) {
    var d = (max - min) / 7;
    return d3.scale.threshold()
        .range(['#add8e6', '#73c1fa', '#68a3fe', '#5e84ff', '#5064ff', '#3b40ff', '#0000ff'])
        .domain([min + 1 * d, min + 2 * d, min + 3 * d, min + 4 * d, min + 5 * d, min + 6 * d, min + 7 * d]);
}