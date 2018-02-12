/* eslint-env jasmine */
/* global inject, module */

describe('gmd.dial', function() {
  var $compile, $scope;

  beforeEach(module('gmd.dial'));
  beforeEach(inject(function(_$compile_, $rootScope) {
    $compile = _$compile_;
    $scope = $rootScope.$new();
  }));
  afterEach(function() {
    $scope.$destroy();
  });

  describe('gmdDial', function() {
    it('creates a simple dial', function() {
      var element = $compile('<gmd-dial data-value="5"></gmd-dial>')($scope);
      $scope.$digest();

      var svg = element.find('svg');
      expect(svg.length).toBe(1);
      expect(svg.find('path').length).toBe(4);
      var text = svg.find('text');
      expect(text.length).toBe(1);
      expect(text.text()).toBe('5');
    });

    it('creates a dial with a dynamically-bound value', function() {
      $scope.value = 0;
      var element = $compile('<gmd-dial data-value="value"></gmd-dial>')($scope);
      $scope.$digest();

      var text = element.find('text');
      expect(text.text()).toBe('0');
      $scope.$apply('value = 3');
      expect(text.text()).toBe('3');
    });
  });
});
