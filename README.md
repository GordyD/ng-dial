## An Angular.js Interactive Dial

An visual component for gathering user input when values sit in a range between 0-100.  Find a [demo](http://gordyd.github.io/dial.html) here.

Originally a [JSFiddle](http://jsfiddle.net/GordyD/1w8o28pa/8/) this has now been turned into a ready-to-use Angular.js directive.

#### Features

 - interactive
 - animated
 - shows previous value
 - 2-way data binding (will respond to changes to model and update model accordingly)

#### Parameters

 - `value` 
 - `animate` - either `true` or `false`. Default: `false`
 - `startAngle` - `0-360`. Default: `0`
 - `endAngle` - `0-360`. Default: `360`
 - `innerRadius` - An integer. Default: `60`
 - `outerRadius` - An integer. Default: `100`

#### Usage

In order to use in your project you will need to:

 1. include dial.js as one of your source files e.g `<script src="js/dial.js">`
 2. include dial.css for styling e.g. `<link rel="stylesheet" href="css/dial.css" type="text/css">`
 3. include ui.dial as a dependency of your Angular app e.g. `var app = angular.module('dialExampleApp', ['ui.dialplot']);`
 4. include a dial inside a template `<ng-dial value="initialValue"></ng-dial>`


#### Setup Example

Clone the repository

```bash
git clone https://github.com/GordyD/ng-dial.git
cd ng-dial
npm install
bower install
node app.js
```

Go to http://localhost:3000 to see example radial plots.

