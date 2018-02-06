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
   */
  var Knob = function(element, initialValue, innerRadius, outerRadius, startAngle, endAngle, clickable) {
    this.element = element;
    this.value = initialValue;
    this.radians = this.convertToRadians(initialValue);
    this.innerRadius = innerRadius;
    this.outerRadius = outerRadius;
    this.startAngle = startAngle,
    this.endAngle = endAngle,
    this.offset = this.outerRadius + 20;
    this.inDrag = false;
    this.clickable = clickable;
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

    var changeElem = drawArc(that.changeArc, 'changeArc');
    var valueElem = drawArc(that.valueArc, 'valueArc');

    var dragBehavior = d3.behavior.drag()
    .on('drag', dragInteraction)
    .on('dragend', clickInteraction);

    drawArc(that.interactArc, 'interactArc', clickInteraction, dragBehavior);

    if (isAnimated) {
      animate(that.convertToRadians(that.startAngle, 360), that.convertToRadians(that.value, 100, that.endAngle, that.startAngle));
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

    function animate(start, end) {
      valueElem
      .transition()
      .ease('bounce')
      .duration(1000)
      .tween('',function() {
        var i = d3.interpolate(start,end);
        return function(t) {
          var val = i(t);
          valueElem.attr('d', that.valueArc.endAngle(val));
          changeElem.attr('d', that.changeArc.endAngle(val));
        };
      });
    }

    function dragInteraction() {
      if(that.clickable){
        that.inDrag = true;
        var x = d3.event.x - that.offset;
        var y = d3.event.y - that.offset;
        interaction(x,y, false);
      }
    }

    function clickInteraction() {
      if(that.clickable){
        that.inDrag = false;
        var coords = d3.mouse(this.parentNode);
        var x = coords[0] - that.offset;
        var y = coords[1] - that.offset;
        interaction(x,y, true);
      }
    }

    function interaction(x,y, isFinal) {
      var arc = Math.atan(y/x)/(Math.PI/180), radians, delta;
      if ((x >= 0 && y <= 0) || (x >= 0 && y >= 0)) {
        delta = 90;
      } else {
        delta = 270;
      }
      radians = ((delta-that.startAngle) + arc) * (Math.PI/180);
      that.value = that.convertFromRadians(radians, 100, that.endAngle, that.startAngle);
      if(that.value >= 0 && that.value <= 100) {
        updateFn(that.value);
        that.valueArc.endAngle(that.convertToRadians(that.value, 100, that.endAngle, that.startAngle));
        d3.select(that.element).select('#valueArc').attr('d', that.valueArc);
        if (isFinal) {
          that.changeArc.endAngle(that.convertToRadians(that.value, 100, that.endAngle, that.startAngle));
          d3.select(that.element).select('#changeArc').attr('d', that.changeArc);
        }
        d3.select(that.element).select('#text').text(that.value);
      }
    }
  };

  /**
   * Set the value of the gauge to something new.
   *
   * @param {Number} newValue
   */
  Knob.prototype.setValue = function(newValue) {
    if ((!this.inDrag) && this.value >= 0 && this.value <= 100) {
      var radians = this.convertToRadians(newValue, 100, this.endAngle, this.startAngle);
      this.value = newValue;
      this.changeArc.endAngle(radians);
      d3.select(this.element).select('#changeArc').attr('d', this.changeArc);
      this.valueArc.endAngle(radians);
      d3.select(this.element).select('#valueArc').attr('d', this.valueArc);
      d3.select(this.element).select('#text').text(newValue);
    }
  };

  gmd.Knob = Knob;

  gmd.dialDirective = function() {
    return  {
      restrict: 'E',
      scope: {
        value: '='
      },
      link: function (scope, element, attrs) {
        var innerRadius = parseInt(attrs.innerRadius, 10) || 60,
            outerRadius = parseInt(attrs.outerRadius, 10) || 100,
            startAngle = parseInt(attrs.startAngle, 10) || 0,
            endAngle = parseInt(attrs.endAngle, 10) || 360,
            clickable = (attrs.clickable === 'false') ? false : true,
            knob = new gmd.Knob(element[0], scope.value, innerRadius, outerRadius, startAngle, endAngle, clickable);

        function update(value) {
          scope.$apply(function() {
            scope.value = value;
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
