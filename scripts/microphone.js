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
    var filter = context.createBiquadFilter();
    filter.frequency.value = 60.0;
    filter.type = filter.allpass;
    filter.Q = 10.0;

    var analyser = context.createAnalyser();

    // Connect graph.
    input.connect(filter);
    filter.connect(analyser);

    this.analyser = analyser;




    // Setup a timer to visualize some stuff.
    requestAnimFrame(this.visualize.bind(this));
};

MicrophoneSample.prototype.onStreamError = function (e) {
    console.error('Error getting microphone', e);
};




var NumOfBins = 50;

MicrophoneSample.prototype.visualize = function () {


    //this.canvas.width = this.WIDTH;
    //this.canvas.height = this.HEIGHT;
    //var drawContext = this.canvas.getContext('2d');

    var times = new Uint8Array(NumOfBins);


    var x = d3.scaleLinear()
   .domain([0, times.length])
   .range([0, width]);





    ////console.log(times);
    this.analyser.getByteFrequencyData(times);

    //y = d3.scaleLinear()
    //        .domain([0, d3.max(times)])
    //        .range([height, 0]);

    var line = d3.line()
           .curve(d3.curveBasis)
           .x(function (d, i) { return x(i); })
           .y(function (d) { return y(d); });



    svg.selectAll(".line").remove();
    //console.log(times);
    svg.append("path")
 .attr("class", "line")
 .attr("d", line(times));
   requestAnimFrame(this.visualize.bind(this));
};
