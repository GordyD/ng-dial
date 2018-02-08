/*eslint-env browser */
/*global angular, d3 */

(function() {
  'use strict';
  var gmd = {};

  /**
   * @constructor
   *
   * @param {Element} element
   * @param {Number} initialValue 0-100
   * @param {Number} innerRadius
   * @param {Number} outerRadius
   * @param {Number} startAngle
   * @param {Number} endAngle
   * @param {Boolean} clickable
   */
  var Knob = function(element, initialValue, innerRadius, outerRadius, startAngle, endAngle, clickable) {
    this.element = element;
    this.value = initialValue;
    this.radians = this.convertToRadians(initialValue);
    this.innerRadius = innerRadius;
    this.outerRadius = outerRadius;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.offset = this.outerRadius + 40;
    this.inDrag = false;
    this.clickable = clickable;
    this.minValue = 0;
    this.maxValue = 100;
    this.prefix = null;
    this.suffix = null;
    this.noOfSegments = 0;
    this.noOfDecimals = 0;
    this.allowTosnap = false;
  };

  /**
   * Create the arcs required for this interactive component.
   *
   * @return {void}
   */
  Knob.prototype.createArcs = function() {
    this.changeArc = createArc(
      this.innerRadius, this.outerRadius, this.convertToRadians(this.startAngle, 360), this.convertToRadians(this.startAngle, 360)
    );
    this.valueArc = createArc(
      this.innerRadius, this.outerRadius, this.convertToRadians(this.startAngle, 360), this.convertToRadians(this.startAngle, 360)
    );
    this.interactArc = createArc(
      this.innerRadius, this.outerRadius, this.convertToRadians(this.startAngle, 360), this.convertToRadians(this.endAngle, 360)
    );

    function createArc(innerRadius, outerRadius, startAngle, endAngle) {
      var arc = d3.svg.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(startAngle);

      if (typeof endAngle !== 'undefined') {
        arc.endAngle(endAngle);
      }

      return arc;
    }
  };

  /**
   * Convert a value in [0,100] to radians
   *
   * @param  {Number} value
   * @param  {Number} d
   * @param  {Number} e
   * @param  {Number} s
   *
   * @return {Number}
   */
  Knob.prototype.convertToRadians = function(value, d, e, s) {
    var r;
    d = d || 100;
    e = e || 360;
    s = s || 0;
    r = e - s;
    return (s + ((r/d) * value)) * (Math.PI/180);
  };

  /**
   * Convert from radians to a value in range [0,100]
   *
   * @param  {Number} radians
   * @param  {Number} d
   * @param  {Number} e
   * @param  {Number} s
   *
   * @return {Number}
   */
  Knob.prototype.convertFromRadians = function(radians, d, e, s) {
    var r;
    d = d || 100;
    e = e || 360;
    s = s || 0;
    r = e - s;
    return Math.round(((180/Math.PI) * Math.abs(radians)) * (d/r));
  };

  /**
   * Append an SVG to the element and draw the dial component
   *
   * @param  {Function} updateFn
   * @param {Boolean} isAnimated
   *
   * @return {void}
   */
  Knob.prototype.draw = function(updateFn, isAnimated) {
    var that = this;
    that.createArcs();

    var svg = d3.select(that.element)
      .append('svg');

    drawArc(that.interactArc, 'baseArc');

    var changeElem = drawArc(that.changeArc, 'changeArc');
    var valueElem = drawArc(that.valueArc, 'valueArc');

    var dragBehavior = d3.behavior.drag()
      .on('drag', dragInteraction)
      .on('dragend', clickInteraction);

    drawArc(that.interactArc, 'interactArc', clickInteraction, dragBehavior);

    if (isAnimated) {
      that.animate(that.convertToRadians(that.startAngle, 360), that.convertToRadians(that.value, 100, that.endAngle, that.startAngle));
    } else {
      that.changeArc.endAngle(this.convertToRadians(this.value, 100, this.endAngle, this.startAngle));
      changeElem.attr('d', that.changeArc);
      that.valueArc.endAngle(this.convertToRadians(this.value, 100, this.endAngle, this.startAngle));
      valueElem.attr('d', that.valueArc);
    }

    svg.append('text')
      .attr('class', 'text')
      .attr('id', 'text')
      .text(that.value)
      .attr('transform', 'translate(' + (that.offset-12) + ', ' + (that.offset+2) + ')');

    function drawArc(arc, label, click, drag) {
      var elem = svg.append('path')
        .attr('class', label)
        .attr('id', label)
        .attr('d', arc)
        .attr('transform', 'translate(' + (that.offset) + ', ' + (that.offset) + ')');

      if (click) {
        elem.on('click', click);
      }

      if (drag) {
        elem.call(drag);
      }

      return elem;
    }

    function dragInteraction() {
      if(that.clickable){
        that.inDrag = true;
        var x = d3.event.x - that.offset;
        var y = d3.event.y - that.offset;
        interaction(x, y, false);
      }
    }

    function clickInteraction() {
      if(that.clickable){
        that.inDrag = false;
        var coords = d3.mouse(this.parentNode);
        var x = coords[0] - that.offset;
        var y = coords[1] - that.offset;
        interaction(x, y, true);
      }
    }

    function interaction(x, y, isFinal) {
      var arc = Math.atan(y/x)/(Math.PI/180), radians, delta;
      if ((x >= 0 && y <= 0) || (x >= 0 && y >= 0)) {
        delta = 90;
      } else {
        delta = 270;
      }
      radians = ((delta-that.startAngle) + arc) * (Math.PI/180);
      if(that.allowToSnap && that.noOfSegments > 0) {
        var angle = radians * (180 / Math.PI);
        angle = that.getClosestAngle(angle);
        radians = angle * (Math.PI / 180);
      }
      that.value = that.convertFromRadians(radians, 100, that.endAngle, that.startAngle);
      if(that.value >= 0 && that.value <= 100) {
        updateFn(that.value);
        that.valueArc.endAngle(that.convertToRadians(that.value, 100, that.endAngle, that.startAngle));
        d3.select(that.element).select('#valueArc').attr('d', that.valueArc);
        if (isFinal) {
          that.changeArc.endAngle(that.convertToRadians(that.value, 100, that.endAngle, that.startAngle));
          d3.select(that.element).select('#changeArc').attr('d', that.changeArc);
        }
        d3.select(that.element).select('#text').text(that.getDisplayValue(that.convertToMinMaxValue(that.value)));
        that.adjustCenterText();
      }
    }
  };

  /**
   * Redraw the dial
   *
   * @param {Boolean} animate
   *
   * @return {void}
   */
  Knob.prototype.reDraw = function (animate) {
    d3.select(this.element).select('svg').remove();
    this.draw(function(){}, animate);
  };

  /**
   * Animate the dial
   *
   * @param {Number} start
   * @param {Number} end
   *
   * @return {void}
   */
  Knob.prototype.animate = function(start, end) {
    var that = this;
    var valueElem = d3.select(that.element).select('#valueArc');
    var changeElem = d3.select(that.element).select('#changeArc');
    valueElem
      .transition()
      .ease('bounce')
      .duration(1000)
      .tween('', function() {
        var i = d3.interpolate(start, end);
        return function(t) {
          var val = i(t);
          valueElem.attr('d', that.valueArc.endAngle(val));
          changeElem.attr('d', that.changeArc.endAngle(val));
        };
      });
  };

  /**
   * Set the value of the gauge to something new.
   *
   * @param {Number} newValue
   *
   * @return {void}
   */
  Knob.prototype.setValue = function(newValue) {
    newValue = this.convertFromMinMaxValue(newValue);
    if ((!this.inDrag) && this.value >= 0 && this.value <= 100) {
      var radians = this.convertToRadians(newValue, 100, this.endAngle, this.startAngle);
      this.value = newValue;
      this.changeArc.endAngle(radians);
      this.valueArc.endAngle(radians);
      this.animate(this.convertToRadians(this.startAngle, 360), radians);
      newValue = this.convertToMinMaxValue(newValue);
      d3.select(this.element).select('#text').text(this.getDisplayValue(newValue));
      this.adjustCenterText();
    }
  };

  /**
   * Set the minimum value
   *
   * @param {Number} value
   *
   * @return {void}
   */
  Knob.prototype.setMinValue = function(value) {
    this.minValue = value;
  };

  /**
   * Set the maximum value
   *
   * @param {Number} value
   *
   * @return {void}
   */
  Knob.prototype.setMaxValue = function(value) {
    this.maxValue = value;
  };

  /**
   * Set the prefix
   *
   * @param {String} prefix
   *
   * @return {void}
   */
  Knob.prototype.setPrefix = function(prefix) {
    this.prefix = prefix;
  };

  /**
   * Set the suffix
   *
   * @param {String} suffix
   *
   * @return {void}
   */
  Knob.prototype.setSuffix = function(suffix) {
    this.suffix = suffix;
  };

  /**
   * Allow to snap
   *
   * @param {Boolean} snap
   *
   * @return {void}
   */
  Knob.prototype.isAllowToSnap = function(snap) {
    this.allowToSnap = snap;
  };

  /**
   * Allow to show the dial center text
   *
   * @param {Boolean} flag
   *
   * @return {void}
   */
  Knob.prototype.isShowCenterText = function(flag) {
    if(flag === false) {
      d3.select(this.element).select('#text').style('display', 'none');
    }
  };

  /**
   * Set number of segments
   *
   * @param {Number} noOfSegments
   *
   * @return {void}
   */
  Knob.prototype.setNoOfSegments = function(noOfSegments) {
    this.noOfSegments = noOfSegments;
  };

  /**
   * Format the display value with prefix and suffix
   *
   * @param {String} value
   *
   * @return {String}
   */
  Knob.prototype.getDisplayValue = function(value) {
    if(this.prefix) {
      value = this.prefix + value;
    }
    if(this.suffix) {
      value += this.suffix;
    }
    return value;
  };

  /**
   * Convert [0-100] value to [Min-Max] value
   *
   * @param {Number} value
   *
   * @return {Number}
   */
  Knob.prototype.convertToMinMaxValue = function(value) {
    return parseFloat(value * ((this.maxValue - this.minValue) / 100) + parseFloat(this.minValue)).toFixed(this.noOfDecimals);
  };

  /**
   * Convert [Min-Max] value to [0-100] value
   *
   * @param {Number} value
   *
   * @return {Number}
   */
  Knob.prototype.convertFromMinMaxValue = function (value) {
    return parseFloat((value - this.minValue) / (this.maxValue - this.minValue) * 100).toFixed(this.noOfDecimals);
  };

  /**
   * Get closest angle for given angle
   *
   * @param {Number} angle
   *
   * @return {Number}
   */
  Knob.prototype.getClosestAngle = function(angle) {
    var closest, smallestDiff, currentDiff;
    var segments = d3.range(0, 360, 360 / this.noOfSegments);
    if(segments.indexOf(angle) > -1) {
      return angle;
    }

    // If its last segment
    if(segments.slice(-1)[0] < angle) {
      return 360;
    }

    smallestDiff = Math.abs(angle - segments[0]);
    closest = 0;

    for (var i = 1; i < segments.length; i++) {
      currentDiff = Math.abs(angle - segments[i]);
      if (currentDiff < smallestDiff) {
        smallestDiff = currentDiff;
        closest = i;
      }
    }
    return segments[closest];
  };

  /**
   * Find and Set decimal point from Min Value, Max Value and Correct value
   *
   * @param {Number} minValue
   * @param {Number} maxValue
   * @param {Number} correctValue
   *
   * @return {void}
   */
  Knob.prototype.setNoOfDecimals = function (minValue, maxValue, correctValue) {
    this.noOfDecimals = Math.max(checkForDecimal(minValue), checkForDecimal(maxValue), checkForDecimal(correctValue));

    function checkForDecimal(value) {
      if (value - Math.floor(value) !== 0) {
        var str = value.toString();
        return str.length - 1 - str.indexOf('.');
      }
      return 0;
    }
  };

  /**
   * Set the segment lines and its labels.
   *
   * @param {Number} noOflabels
   */
  Knob.prototype.setSegments = function (noOflabels) {
    var that = this;
    var magicValue = 5;
    var numberOfSegments = this.noOfSegments;
    var outerRadius = that.outerRadius;
    var radians = (Math.PI * 2) / numberOfSegments;
    var degrees = 360 / numberOfSegments;
    var segments = d3.range(this.minValue, this.maxValue, (this.maxValue - this.minValue) / numberOfSegments);
    var labelItems = [];

    var svg = d3.select(this.element).select('svg');
    var arc = d3.svg.arc()
      .innerRadius(outerRadius + (2 * magicValue))
      .outerRadius(outerRadius + (2 * magicValue))
      .startAngle(function (d) {
        return radians * d;
      }).endAngle(function (d) {
        return radians * d;
      });

    var ga = svg.append('g')
      .attr('class', 'a axis')
      .attr('transform', 'translate(30,' + that.offset + ')')
      .selectAll('g')
      .data(d3.range(numberOfSegments))
      .enter()
      .append('g')
      .attr('transform', function (d) {
        return 'translate(' + arc.centroid(d) + ')';
      });

    ga.append('line')
      .attr('x2', outerRadius)
      .attr('x1', outerRadius + (2 * magicValue))
      .attr('transform', function (d) {
        return 'rotate(' + (d * degrees - 90) + ' ' + (outerRadius + (2 * magicValue)) + ' 0)';
      });

    if(parseInt(noOflabels) > 0) {
      // Collecting increments label
      var mod = Math.floor(numberOfSegments / noOflabels);
      for (var y=0; y <= numberOfSegments; y += mod) {
        labelItems.push(y);
        if(labelItems.length >= noOflabels) {
          break;
        }
      }

      // Set increments label text
      ga.append('text')
        .attr('x', outerRadius + (3 * magicValue))
        .attr('dy', '.35em').attr('transform', function(d) {
          var angle, tx, ty;
          angle = d * degrees;
          if (angle === 0) {
            tx = ty = -(2 * magicValue);
          } else if (angle === 90) {
            tx = ty = 0;
          } else if (angle === 180) {
            tx = -(3 * magicValue);
            ty = 2 * magicValue;
          } else if (angle === 270) {
            tx = -(6 * magicValue);
            ty = 0;
          } else if ((angle < 90 && angle > 0)) {
            tx = ty = -1 * magicValue;
          } else if ((angle < 180 && angle > 90)) {
            tx = -1 * magicValue;
            ty = magicValue;
          } else if ((angle < 270 && angle > 180)) {
            tx = -(5 * magicValue);
            ty = magicValue;
          } else if ((angle < 360 && angle > 270)) {
            tx = -(5 * magicValue);
            ty = -1 * magicValue;
          }
          return 'translate(' + tx + ',' + ty + ')';
        }).style('text-anchor', function(d) {
          return d < 360 && d > 180 ? 'end' : null;
        }).text(function(d) {
          // Don't set increments label for some increment
          if (labelItems.indexOf(d) === -1) {
            return '';
          }
          return that.getDisplayValue(segments[d].toFixed(that.noOfDecimals));
        });
    }
  };

  /**
   * Align center text as per font size
   *
   * @return {void}
   */
  Knob.prototype.adjustCenterText = function () {
    var textElement = d3.select(this.element).select('#text').node();
    var textBox = textElement.getBBox();
    var fontSize = parseFloat(window.getComputedStyle(textElement).fontSize);
    var tx = this.offset - (textBox.width / 2);
    var ty = this.offset - (textBox.height / 2) + fontSize;
    d3.select(this.element).select('#text').attr('transform', 'translate(' + tx + ', ' + ty + ')');
  };

  gmd.Knob = Knob;

  gmd.dialDirective = function() {
    return  {
      restrict: 'E',
      scope: {
        value: '='
      },
      link: function (scope, element, attrs) {
        var clientWidth = document.documentElement.clientWidth,
          innerRadius = clientWidth < 400 ? 50 : 100,
          outerRadius = clientWidth < 400 ? 100 : 150,
          startAngle = parseInt(attrs.startAngle, 10) || 0,
          endAngle = parseInt(attrs.endAngle, 10) || 360,
          clickable = (attrs.clickable === 'false') ? false : true,
          knob = new gmd.Knob(element[0], scope.value, innerRadius, outerRadius, startAngle, endAngle, clickable);

        scope.$parent.knob = knob;

        function update(value) {
          scope.$apply(function() {
            scope.value = value;
            scope.$parent.value = value;
          });
        }

        scope.$watch('value', function(newValue, oldValue) {
          if((newValue !== null || typeof newValue !== 'undefined') && typeof oldValue !== 'undefined' && newValue !== oldValue) {
            knob.setValue(newValue);
          }
        });

        knob.draw(update, attrs.animate === 'true');
      }
    };
  };

  angular
    .module('gmd.dial', [])
    .directive('gmdDial', gmd.dialDirective);
})();
