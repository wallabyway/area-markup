(function(){ 'use strict';
AutodeskNamespace('Autodesk.Viewing.Extensions.Measure');

//
// /** @constructor */
//
//
Autodesk.Viewing.Extensions.Measure.MeasureTool = function( viewer, options, sharedMeasureConfig, snapper )
{
    var tool = this;

    var _viewer  = viewer;
    var _options = options || {};
    var _names  = ["measure"];
    var _priority = 50;

    // Shared State with CalibrationTool and Indicator
    var _sharedMeasureConfig = sharedMeasureConfig;

    var MeasureCommon = Autodesk.Viewing.Extensions.Measure.Functions;
    var av = Autodesk.Viewing;
    var avem = Autodesk.Viewing.Extensions.Measure;

    // Not shared with Indicator.js
    var _active = false;
    var _isDragging = false;
    var _endpointMoved = false;
    var _activePoint = 0;
    var _consumeSingleClick = false;
    var _singleClickHandled = false;
    var _downX = null;
    var _downY = null;
    var _isolateMeasure = false;

    var _measurementsManager = new Autodesk.Viewing.Extensions.Measure.MeasurementsManager(_viewer);
    var _currentMeasurement = null;
    var _onIndicatorCreatedCB = null;
    
    var _cursor = "url(data:image/png;base64,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), auto";

    // Snapper
    var _snapper = snapper;
    
    var _isPressing = false;

    var _picksBackup = [];
    var _cursorPosition = null;

    var _closeAreaSnapRange = 25;

    var _measurementType = avem.MEASUREMENT_AREA;

    function getActivePick()
    {   
        if(!_currentMeasurement)
            return null;

        var index;

        if (_activePoint === 0) {
            return null;
        } else if (_activePoint === _currentMeasurement.getMaxNumberOfPicks() + 1) {
            index = _currentMeasurement.countPicks();
        } else {
               index = _activePoint;
        }

        return _currentMeasurement.getPick(index);
    }

    function getPreviewsPick()
    {
        if(!_currentMeasurement)
            return null;

        var index;

        if (_activePoint === 0) {
            return null;
        } else if (_activePoint === 1) {
            index = _currentMeasurement.countPicks();
        } else if (_activePoint === _currentMeasurement.getMaxNumberOfPicks() + 1) {
            index = _currentMeasurement.countPicks() - 1;
        } else {
            index = _activePoint - 1;
        }
        
        return _currentMeasurement.getPick(index);
    }

    function noPicksSet() {
        _activePoint = 0;
    }

    function allPicksSet() {
        _activePoint = _currentMeasurement.countPicks() + 1;
        enableMeasurementsTouchEvents(true);
        _currentMeasurement.indicator.enableSelectionAreas(true);
    }

    function isNoPicksSet() {
        return _activePoint === 0 || !_currentMeasurement;
    }

    this.areAllPicksSet = function() {
        return _currentMeasurement && (_activePoint === _currentMeasurement.getMaxNumberOfPicks() + 1);
    };

    this.register = function()
    {

    };

    this.deregister = function()
    {
        this.deactivate();
    };

    this.isActive = function()
    {
        return _active;
    };

    this.getNames = function()
    {
        return _names;
    };

    this.getName = function()
    {
        return _names[0];
    };

    this.getPriority = function()
    {
        return _priority;
    };

    this.getCursor = function() {
        return _isDragging ? null : _cursor;
    };

    this.getCurrentMeasurementRaw = function() {
        return _currentMeasurement;
    };

    this.getActivePointIndex = function() {
        return _activePoint;
    };

    this.getJson = function() {
        // remove all indicator objects to avoid circular reference
        const list = _measurementsManager.measurementsList;
        Object.keys(list).map(i=>{ delete(list[i].indicator) });
        var tmp = JSON.stringify(list);
        Object.keys(list).map(i=>{ list[i].attachIndicator(_viewer, this, avem.MeasureToolIndicator) })
        return tmp;
    }

    this.addPick = function(inp) {
        var json = JSON.parse(JSON.stringify(inp));
        var p = _currentMeasurement.setPick(json.id, new Autodesk.Viewing.Extensions.Measure.SnapResult())
        Object.assign(p, {
            geomType:json.geomType,
            fromTopology:false,
            viewportIndex2d:json.viewportIndex2d,
            geomVertex: new THREE.Vector3(json.geomVertex.x,json.geomVertex.y,json.geomVertex.z),
            intersectPoint: new THREE.Vector3(json.intersectPoint.x,json.intersectPoint.y,json.intersectPoint.z),
            radius:json.radius
        });
    }

    this.addMeasurement = function(json) {
        _currentMeasurement = _measurementsManager.createMeasurement(json.measurementType);
        //_currentMeasurement.id = json.id;
        for (var key in json.picks) {
            if (!json.picks[key])
                delete(json.picks[key])
            else
                this.addPick(json.picks[key])
        }
        _currentMeasurement.closedArea = true;
        _activePoint = Object.keys(json.picks).length+1;
        //clean up non object arrays
        _currentMeasurement.attachIndicator(_viewer, this, avem.MeasureToolIndicator);
        this.onMeasurementChanged();
    }

    this.onSwitchMeasurement = function(e) {
        this.loadJson(e.detail);
    }

    this.onRemoveMeasurement = function(e) {
        var id = e.detail;
        console.log('removing id=',id);
        this.selectMeasurementById(id);
        //this.clearCurrentMeasurement();        
    }

    this.loadJson = function(json) {
        for (var key in json) 
            this.addMeasurement(json[key])
    }

    this.startNewMeasurement = function() {
        //@@@ start new measurement
        _currentMeasurement = _measurementsManager.createMeasurement(_measurementType);
        _currentMeasurement.attachIndicator(_viewer, this, avem.MeasureToolIndicator);

        if (_onIndicatorCreatedCB instanceof Function) {
            _onIndicatorCreatedCB();
            _onIndicatorCreatedCB = null;
        }

        enableMeasurementsTouchEvents(false);
    };

    this.changeMeasurementType = function(type) {
        _measurementType = type;
    };

    this.activate = function()
    {
        _active = true;
        _measurementsManager.init();
        this.setUnits("decimal-ft");
        this.setPrecision(0);
        this.changeMeasurementType(avem.MEASUREMENT_AREA);

        noPicksSet();
        _isDragging = false;
        this.isEditingEndpoint = false;
        this.editByDrag = false;

        _viewer.impl.pauseHighlight(true);

        _viewer.clearSelection();
        _viewer.toolController.activateTool("snapper");
        _viewer.toolController.activateTool("magnifyingGlass");
 
       this.onMeasurementChangedBinded = this.onMeasurementChanged.bind(this);
       this.onSwitchMeasurementBinded = this.onSwitchMeasurement.bind(this);
       this.onRemoveMeasurementBinded = this.onRemoveMeasurement.bind(this);
       _viewer.addEventListener(avem.MEASUREMENT_CHANGED_EVENT, this.onMeasurementChangedBinded);
       _viewer.addEventListener(av.CAMERA_CHANGE_EVENT, this.onCameraChange);
       _viewer.addEventListener("newData", this.onSwitchMeasurementBinded);
       _viewer.addEventListener("removeData", this.onRemoveMeasurementBinded);
    };

    this.deactivate = function()
    {
        if (!_active)
            return;

        _active = false;

        while (Object.keys(_measurementsManager.measurementsList).length > 0) {
            _currentMeasurement = _measurementsManager.measurementsList[Object.keys(_measurementsManager.measurementsList)[0]];
            _measurementsManager.changeCurrentMeasurement(_currentMeasurement);
            this.clearCurrentMeasurement();
            _currentMeasurement = null;
        }

        if(_snapper && _snapper.isActive()) {
            _viewer.toolController.deactivateTool("snapper");
        }

        _viewer.toolController.deactivateTool("magnifyingGlass");

        _viewer.impl.pauseHighlight(false);

        _measurementsManager.destroy();
        _viewer.removeEventListener(av.CAMERA_CHANGE_EVENT, this.onCameraChange);
        _viewer.removeEventListener(avem.MEASUREMENT_CHANGED_EVENT, this.onMeasurementChangedBinded);
        _viewer.removeEventListener("newData", this.onSwitchMeasurementBinded);
        _viewer.removeEventListener("removeData", this.onRemoveMeasurementBinded);
    };

    this.update = function()
    {
        return false;
    };

    this.getUnits = function() {
        return _sharedMeasureConfig.units;
    };

    this.setUnits = function( units )
    {
        if (_sharedMeasureConfig.units !== units ) {
            _sharedMeasureConfig.units = units;

            for (var key in _measurementsManager.measurementsList) {
                if (_measurementsManager.measurementsList.hasOwnProperty(key)) {
                    // Update UI
                    var measurement = _measurementsManager.measurementsList[key];
                    if (measurement.indicator) {
                        measurement.indicator.updateResults();
                    }
                }
            }
        }
    };

    this.getPrecision = function() {
        return _sharedMeasureConfig.precision;
    };

    this.setPrecision = function( precision ) {

        if (_sharedMeasureConfig.precision !== precision ) {
            _sharedMeasureConfig.precision = precision;

            for (var key in _measurementsManager.measurementsList) {
                if (_measurementsManager.measurementsList.hasOwnProperty(key)) {
                    // Update UI
                    var measurement = _measurementsManager.measurementsList[key];
                    if (measurement.indicator) {
                        measurement.indicator.updateResults();
                    }
                }
            }
        }
    };

    this.getDistanceXYZ = function(measurement) {
        if (!measurement) {
            measurement = _currentMeasurement;
        }
        return this.getDistanceAux(measurement.distanceXYZ);
    };
    this.getDistanceX = function(measurement) {
        if (!measurement) {
            measurement = _currentMeasurement;
        }
        return this.getDistanceAux(measurement.distanceX);
    };
    this.getDistanceY = function(measurement) {
        if (!measurement) {
            measurement = _currentMeasurement;
        }
        return this.getDistanceAux(measurement.distanceY);
    };
    this.getDistanceZ = function(measurement) {
        if (!measurement) {
            measurement = _currentMeasurement;
        }
        return this.getDistanceAux(measurement.distanceZ);
    };

    /**
     * @private
     */
    this.getDistanceAux = function (measurementDistance) {

        if (_viewer.model) {
            var d = Autodesk.Viewing.Private.convertUnits(_viewer.model.getUnitString(), _sharedMeasureConfig.units, _sharedMeasureConfig.calibrationFactor, measurementDistance || 0);
            return Autodesk.Viewing.Private.formatValueWithUnits(d, _sharedMeasureConfig.units, 3, _sharedMeasureConfig.precision);
        }
    };

    this.getAngle = function(measurement) {

        if (!measurement) {
            measurement = _currentMeasurement;
        }
        var angle = measurement.angle;
        return Autodesk.Viewing.Private.formatValueWithUnits(angle, String.fromCharCode(0xb0), 3, _sharedMeasureConfig.precision);
    };

    this.getArea = function(measurement) { 

        if (_viewer.model) {

            if (!measurement) {
                measurement = _currentMeasurement;
            }

            var area = Autodesk.Viewing.Private.convertUnits(viewer.model.getUnitString(), _sharedMeasureConfig.units, _sharedMeasureConfig.calibrationFactor, measurement.area, 'square');

            if (_sharedMeasureConfig.units) {
                return Autodesk.Viewing.Private.formatValueWithUnits(area, _sharedMeasureConfig.units+'^2', 3, _sharedMeasureConfig.precision);
            }
            else {
                return Autodesk.Viewing.Private.formatValueWithUnits(area, null, 3, _sharedMeasureConfig.precision);
            }
        }
    };

    function snapToFirstPick(currentPick, forceSnap) {
        if (_currentMeasurement.hasPick(1) && _activePoint > 3 && !_currentMeasurement.closedArea) {
            var firstPick = _currentMeasurement.getPick(1);
            var firstPickPoint = MeasureCommon.getSnapResultPosition(firstPick, _viewer);
            var firstPickPosition = MeasureCommon.project(firstPickPoint, viewer);
            var currentPickPoint = MeasureCommon.getSnapResultPosition(currentPick, _viewer);
            var currentPickPosition = MeasureCommon.project(currentPickPoint, viewer);
            
            if (forceSnap || currentPickPosition.distanceTo(firstPickPosition) < _closeAreaSnapRange) {
                _snapper.onMouseMove(firstPickPosition);
                firstPick.copyTo(currentPick);
            }
        }
    }

    function render(showResult) {

        var hasResult = _currentMeasurement.computeResult(_currentMeasurement.picks, _viewer, _snapper);
        //@@@ debugger;
        _currentMeasurement.indicator.render(_currentMeasurement.picks, _consumeSingleClick || !!showResult);

        return hasResult;
    }

    /**
     * TODO: We need to flesh out the return value here.
     *
     * @param unitType
     * @param precision
     * @returns {Object}
     */
    this.getMeasurement = function(unitType, precision) {

        _sharedMeasureConfig.units = unitType || _sharedMeasureConfig.units;
        _sharedMeasureConfig.precision = precision || _sharedMeasureConfig.precision;

        var geomTypes = ['Vertex', 'Edge', 'Face', 'Circular Arc', 'Curved Edge', 'Curved Face'];

        var measurement = {
            from: geomTypes[_currentMeasurement.getGeometry(1).type],
            to: geomTypes[_currentMeasurement.getGeometry(2).type],
            distance: this.getDistanceXYZ(),
            deltaX: this.getDistanceX(),
            deltaY: this.getDistanceY(),
            deltaZ: this.getDistanceZ(),
            angle: this.getAngle(),
            unitType: _sharedMeasureConfig.units,
            precision: _sharedMeasureConfig.precision
        };

        return measurement;
    };

    this.clearCurrentMeasurement = function() {
        if (_currentMeasurement) {
            noPicksSet();

            for (var key in _currentMeasurement.picks) {
                if (_currentMeasurement.picks.hasOwnProperty(key)) {
                    this.clearPick(key);    
                }
            }
            
            this.updateViewportId(true);

            if (_isolateMeasure) {
                this.clearIsolate();    
            }

            _currentMeasurement.indicator.clear();
            _currentMeasurement.indicator.destroy();
            _currentMeasurement = _measurementsManager.removeCurrentMeasurement();
            _currentMeasurement = null;
        }

        enableMeasurementsTouchEvents(true);
    };

    this.clearPick = function(pickNumber) {
        if (_currentMeasurement && _currentMeasurement.hasPick(pickNumber)) {
            _currentMeasurement.clearPick(pickNumber);
            _currentMeasurement.indicator.hideClick(pickNumber);
        }
    };

    this.setIsolateMeasure = function(enable) {
        _isolateMeasure = enable;
    };

    this.isolateMeasurement = function () {
        if (_currentMeasurement) {
            var isolationGroup = [];
        
            for (var key in _currentMeasurement.picks) {
                if (_currentMeasurement.picks.hasOwnProperty(key)) {
                    isolationGroup.push(_currentMeasurement.getPick(key).snapNode);
                }
            }

            _viewer.isolate(isolationGroup);
        }
    };

    this.clearIsolate = function() {
        _viewer.showAll();
    };

    this.deselectAllMeasurements = function() {
        if (_currentMeasurement && !this.areAllPicksSet()) {
            if (this.isEditingEndpoint) {
                this.undoEditEndpoint();
            }
            else {
                this.clearCurrentMeasurement();
            }
        }

        for (var key in _measurementsManager.measurementsList) {
            if (_measurementsManager.measurementsList.hasOwnProperty(key)) {
                var measurement = _measurementsManager.measurementsList[key];
                if (measurement.indicator) {
                    measurement.indicator.setSimple(true);        
                    measurement.indicator.hideEndpoints();
                    measurement.indicator.unfocusLabels();
                }
            }
        }

        _currentMeasurement = null;
    };

    this.onMeasurementChanged = function() {
        
        this.deselectAllMeasurements();

        _currentMeasurement = _measurementsManager.getCurrentMeasurement();
        
        if (_currentMeasurement.isComplete()) {
            _currentMeasurement.indicator.setSimple(false);        
            allPicksSet();
            render(true); 
            this.updateResults();
        }
    };

    this.selectMeasurementById = function(measurementId) {
        console.log(measurementId);
        if (!_currentMeasurement) {
            _currentMeasurement = _measurementsManager.selectMeasurementById(measurementId);
        }

        if (_currentMeasurement.id !== measurementId) {
            if (!this.areAllPicksSet()) {
                if (this.isEditingEndpoint) {
                    this.undoEditEndpoint();
                }
                else {
                    this.clearCurrentMeasurement();
                }
            }
            
            _currentMeasurement = _measurementsManager.selectMeasurementById(measurementId);
        }
    };

    function enableMeasurementsTouchEvents(enable) {
        for (var key in _measurementsManager.measurementsList) {
            if (_measurementsManager.measurementsList.hasOwnProperty(key)) {
                var measurement = _measurementsManager.measurementsList[key];
                measurement.indicator.changeAllEndpointsEditableStyle(enable);   
                measurement.indicator.enableSelectionAreas(enable);
                measurement.indicator.enableLabelsTouchEvents(enable);
            }
        }
    }

    this.editEndpoint = function(event, endpointNumber, measurementId) {
        if (_currentMeasurement.id === measurementId && _activePoint === endpointNumber) {
            _currentMeasurement.indicator.changeEndpointOnEditStyle(endpointNumber, false);
            this.undoEditEndpoint();
            return;
        }

        this.selectMeasurementById(measurementId);

        _activePoint = endpointNumber;
        this.isEditingEndpoint = true;

        _currentMeasurement.indicator.changeEndpointOnEditStyle(endpointNumber, true);
        enableMeasurementsTouchEvents(false);

        for (var key in _currentMeasurement.picks) {
            if (_currentMeasurement.picks.hasOwnProperty(key)) {
                _picksBackup[key] = _currentMeasurement.getPick(key).clone();
            }
        }

        this.updateViewportId();

        if (_isolateMeasure) {
            this.clearIsolate();    
        }

        if(!av.isMobileDevice()) {
            this._handleMouseEvent(event);
        }
    };

    function canCloseArea() {
        return _currentMeasurement.countPicks() > 3;
    }

    this.undoEditEndpoint = function() {
        _currentMeasurement.indicator.clear();

        for (var key in _currentMeasurement.picks) {
            if (_currentMeasurement.picks.hasOwnProperty(key)) {
                _currentMeasurement.setPick(key, _picksBackup[key].clone());
            }
        }
        
        _currentMeasurement.indicator.changeEndpointOnEditStyle(_activePoint, false);
        
        this.isEditingEndpoint = false;
        this.updateViewportId(true);
        allPicksSet();
        render(true);
    };

    this.updateResults = function() {

        _currentMeasurement.indicator.updateResults();
        _currentMeasurement.indicator.showEndpoints();
        _currentMeasurement.indicator.focusLabels();

        if (_isolateMeasure && _currentMeasurement.isComplete()) {
            this.isolateMeasurement();
        }
    };

    this.deleteCurrentMeasurement = function() {
        this.clearCurrentMeasurement();
        this.isEditingEndpoint = false;
        this.editByDrag = false;
        _isDragging = false;
    };

    this.deleteCurrentPick = function() {

        var pick = getActivePick();
        var id = pick.id;

        while (_currentMeasurement.hasPick(id + 1)) {
            _currentMeasurement.setPick(id, _currentMeasurement.getPick(id + 1));
            id++;
        }

        delete _currentMeasurement.picks[id];
        
        
        
        var count = _currentMeasurement.countPicks();
        
        _activePoint--;
        
        if (_activePoint <= 0) {
            _activePoint = count;
        }

        if (this.isEditingEndpoint) {
            if (count == 2) {
                this.deleteCurrentMeasurement();
                return;
            }

            _currentMeasurement.indicator.changeAllEndpointsOnEditStyle(false);
            this.isEditingEndpoint = false;
            this.updateViewportId(true);
            allPicksSet();
            render();
        } else {
            this._handleMouseEvent();    
        }
    };

    this.updateViewportId = function(clear) {
        if (_viewer.model && _viewer.model.is2d()) {
            if (clear || isNoPicksSet()) {
                _viewer.impl.updateViewportId(0);
                _snapper.setViewportId(null);
            }
            else if (!_isPressing) {
                var viewport = getPreviewsPick().viewportIndex2d || getActivePick().viewportIndex2d;
                
                // Pass viewport Id to LineShader to make all other geometries with different viewport transparent
                _viewer.impl.updateViewportId(viewport);
                if (_snapper)
                    _snapper.setViewportId(viewport);  
            
            }
        }
    };

    this.setNoTopology = function() {
        if (_currentMeasurement && _currentMeasurement.indicator) {
            _currentMeasurement.indicator.setNoTopology();
        }
        else {
            _onIndicatorCreatedCB = function() { _currentMeasurement.indicator.setNoTopology(); };
        }
    };
    this.setFetchingTopology = function() {
        if (_currentMeasurement && _currentMeasurement.indicator) {
            _currentMeasurement.indicator.setFetchingTopology();
        }
        else {
            _onIndicatorCreatedCB = function() { _currentMeasurement.indicator.setFetchingTopology(); };
        }
    };
    this.setTopologyAvailable = function() {
        if (_currentMeasurement && _currentMeasurement.indicator) {
            _currentMeasurement.indicator.setTopologyAvailable();
        }
        else {
            _onIndicatorCreatedCB = function() { _currentMeasurement.indicator.setTopologyAvailable(); };
        }
    };

    this.getSnapper = function() {
        return _snapper;
    };

    this.correctPickPosition = function() {
        var active = getActivePick();
        var passive = getPreviewsPick();

        if (!active.getGeometry() && _cursorPosition) {
            active.geomType = avem.SNAP_VERTEX;
            active.geomVertex = _cursorPosition;
            active.intersectPoint = _cursorPosition;
        }

        var corrected = MeasureCommon.correctPerpendicularPicks(passive, active, viewer, _snapper);
        if (!corrected) {

            // get next pick in case of closed loop measurement.
            var id = (active.id + 1) % (_currentMeasurement.countPicks() + 1);
            
            if (id === 0)
                id = 1;

            if (id !== active.id && _currentMeasurement.hasPick(id)) {
                var nextPick = _currentMeasurement.getPick(id);   
                MeasureCommon.correctPerpendicularPicks(nextPick, active, viewer, _snapper);
            }
        }
        
        if (_currentMeasurement.measurementType == avem.MEASUREMENT_AREA) {
            snapToFirstPick(active);    
        }
    };

    this._handleMouseEvent = function (event) {

        var valid = false;

        if (_snapper.isSnapped()) {
            
            // User picked a new point after two points where already set (or none) - Start a new measurement.
            if (this.areAllPicksSet() || isNoPicksSet()) {
                this.startNewMeasurement();
                this.clearIsolate();
                _activePoint = 1;
            }

            _snapper.copyResults(getActivePick());

            valid = true;

        } 
        else { 
            // In order to draw rubber-band, set the cursor position, so the indicator will use it as active point.
            if (event && _viewer.model.is2d()) {
                var viewport = _viewer.container.getBoundingClientRect();
                var x = event.canvasX || event.clientX - viewport.left;
                var y = event.canvasY || event.clientY - viewport.top;

                if (x && y) {
                    _cursorPosition = MeasureCommon.inverseProject({ x:x, y:y }, _viewer);
                }
            }

            // In case a measurement is set, and the user clicks on a blank spot - don't do nothing.
            if (_consumeSingleClick && _currentMeasurement && !this.isEditingEndpoint) {
                if (_activePoint === _currentMeasurement.getMaxNumberOfPicks() + 1) {
                    return true;
                }
            }

            var lastPick = getActivePick();
            if (lastPick) {
                lastPick.clear();
            }
        }

        if (_currentMeasurement) {
            this.correctPickPosition();
            
            if (_consumeSingleClick) {
                this._doConsumeSingleClick();
            }

            if (!isNoPicksSet()) {
                var renderSucceeded = render();
                
                // If it's the first pick, we don't expect the render of the rubberband to be succeeded.
                // So enter here only if it's not the first pick.
                if (_currentMeasurement.hasPick(2)) {
                    valid &= renderSucceeded;
                }
            }
        }

        // If valid is false, the last pick is not revelant, and will clear it in case of a click.
        return valid;
    };

    this._doConsumeSingleClick = function() {
        // In case the measurement is a closed loop, eliminate the last pick.
        if (_currentMeasurement.measurementType === avem.MEASUREMENT_AREA && !_currentMeasurement.closedArea) {
            var length = _currentMeasurement.countPicks();
            var firstPick = _currentMeasurement.getPick(1);
            var lastPick = _currentMeasurement.getPick(length);

            if (length >= 3 && _currentMeasurement.hasEqualPicks(firstPick, lastPick)) {
                lastPick.clear();
                delete _currentMeasurement.picks[length];
                _currentMeasurement.closedArea = true;
            }
        }

        this.updateResults();

        var measurementComplete = _currentMeasurement.isComplete();
        this.updateViewportId(measurementComplete);
    };


    this.handleButtonDown = function (event, button) {
        if (av.isMobileDevice()) 
            return false;

        _isDragging = true;
        if (button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
            _consumeSingleClick = true;
            _downX = event.canvasX;
            _downY = event.canvasY;
        }
        return false;
    };

    this.handleMouseMove = function (event) {

        if (av.isMobileDevice())
            return false;

        if (event.canvasX !== _downX || event.canvasY !== _downY) {
            _consumeSingleClick = false;    
        } 

        _endpointMoved = this.isEditingEndpoint;

        if (!isNoPicksSet() && !this.areAllPicksSet()) {
            this.clearPick(_activePoint);
            this._handleMouseEvent(event);
        }

        _snapper.indicator.render();

        return false;
    };

    this.restoreMouseListeners = function () {

        // When a press event has happend, the default behavior of firefly.js is to disable other mouse events,
        // So they won't be triggered as well.
        // The solution is to enable them after the end of the pressing.

        _viewer.toolController.getTool("gestures").controller.enableMouseButtons(true);
    };

    this.handlePressHold = function (event) {
        _consumeSingleClick = false;

        if (av.isMobileDevice()) {
            switch( event.type )
            {
                case "press":
                    _isPressing = true;

                    if (this.areAllPicksSet() || isNoPicksSet()) {
                        this.startNewMeasurement();
                        this.clearIsolate();
                        _activePoint = 1;
                    }

                    this._handleMouseEvent(event);
                    _snapper.indicator.render();

                    return true;

                case "pressup":
                    _consumeSingleClick = true;
                    this.restoreMouseListeners();
                    _singleClickHandled = !_singleClickHandled;
                    this.handleSingleClick(event);
                    _isPressing = false;
                    return true;
            }
        }
        return false;

    };



    this.handleGesture = function( event )
    {   
        if (av.isMobileDevice()){
            
            _consumeSingleClick = false;
        
            if (_isPressing) {
                
                this.clearPick(_activePoint);

                switch( event.type )
                {
                    case "dragstart":
                        this._handleMouseEvent(event);
                        _snapper.indicator.render();

                        return true;

                    case "dragmove":
                        this._handleMouseEvent(event);
                        _snapper.indicator.render();

                        return true;

                    case "dragend":
                        _isPressing = false;
                        _consumeSingleClick = true;

                        if (!this.editByDrag) {
                            _singleClickHandled = !_singleClickHandled;
                            this.handleSingleClick(event);    
                        }

                        this.editByDrag = false;
                        this.restoreMouseListeners();
                        return true;

                    case "pinchstart":
                        this._handleMouseEvent(event);
                        _snapper.indicator.render();

                        break;

                    case "pinchmove":
                        this._handleMouseEvent(event);
                        _snapper.indicator.render();

                        break;

                    case "pinchend":
                        _consumeSingleClick = true;
                        _singleClickHandled = !_singleClickHandled;
                        this.handleSingleClick(event);
                        this.restoreMouseListeners();
                        return true;
                }
            }

            if (event.type.indexOf('pinch') !== -1) {
                for (var key in _measurementsManager.measurementsList) {
                    if (_measurementsManager.measurementsList.hasOwnProperty(key)) {
                        var measurement = _measurementsManager.measurementsList[key];
                        measurement.indicator.updateScale();    
                    }
                }
            }
        }

        return false;
    };

    this.handleButtonUp = function (event, button) {
        _isDragging = false;
        _downX = null;
        _downY = null;
        
        if (_endpointMoved) {
            _consumeSingleClick = true;
            _singleClickHandled = !_singleClickHandled;
            this.handleSingleClick(event);
            _endpointMoved = false;
        }

        return false;
    };

    this.handleSingleClick = function (event, button) {
        if (_consumeSingleClick) {

            _snapper.indicator.clearOverlays();

            if (_currentMeasurement) {
                _currentMeasurement.indicator.changeEndpointOnEditStyle(_activePoint, false);    
            }

            if (this._handleMouseEvent(event)) {
                this.updateResults();
                _activePoint++;
            }
            else {
                if (this.isEditingEndpoint) {
                    this.undoEditEndpoint();
                }
                else {
                    if (_currentMeasurement && _currentMeasurement.measurementType === avem.MEASUREMENT_AREA && canCloseArea()) {
                        snapToFirstPick(getActivePick(), true);
                        this._handleMouseEvent();
                    } else {
                        this.clearCurrentMeasurement();    
                    }
                }
            }

            if (_currentMeasurement && _currentMeasurement.isComplete()) {
                // @@@ closed loop, completed
                if (_measurementsManager) {
                    console.log('save it');
                    
                }
                allPicksSet();
            }

            _consumeSingleClick = false;
            _singleClickHandled = !_singleClickHandled;
            this.isEditingEndpoint = false;

            _snapper.clearSnapped();
        }
        return true;
    };

    this.handleDoubleClick = function(event) {
        return true;
    };

    this.onCameraChange = function () {
        for (var key in _measurementsManager.measurementsList) {
            if (_measurementsManager.measurementsList.hasOwnProperty(key)) {
                var measurement = _measurementsManager.measurementsList[key];
                measurement.indicator.updateScale();
            }
        }

        _snapper.indicator.onCameraChange();
    };

    this.handleSingleTap = function (event) {
        if (!_singleClickHandled) {
            _consumeSingleClick = true;
            _snapper.onMouseDown({x: event.canvasX, y:event.canvasY});
            this.handleSingleClick(event);
        }
        _singleClickHandled = !_singleClickHandled;

        return true;
    };

    this.handleDoubleTap = function(event) {
        if (_currentMeasurement && _currentMeasurement.measurementType === avem.MEASUREMENT_AREA && _currentMeasurement.countPicks() > 2) {
            // fake single click over the first handle, to close the area.
            var firstPick = _currentMeasurement.getPick(1);
            var firstPickPoint = MeasureCommon.getSnapResultPosition(firstPick, _viewer);
            var firstPickPosition = MeasureCommon.project(firstPickPoint, viewer);
            event.canvasX = firstPickPosition.x;
            event.canvasY = firstPickPosition.y;
            _consumeSingleClick = true;
            _snapper.onMouseDown(firstPickPosition);
            this.handleSingleClick(event);
            _singleClickHandled = !_singleClickHandled;
        }

        return true;
    };

    this.handleResize = function() {
        for (var key in _measurementsManager.measurementsList) {
            if (_measurementsManager.measurementsList.hasOwnProperty(key)) {
                var measurement = _measurementsManager.measurementsList[key];
                if (measurement.indicator) {
                    measurement.indicator.handleResize();
                }
            }
        }
    };

    this.handleKeyDown = function(event, keyCode) {
        const approvalID = 1;
        //console.log(keyCode);
        switch (keyCode) {
            case 65: { // key 'A' to load from DB
                fetch(`http://localhost:3000/allMarkup?approvalid=1`).then(r => r.json()).then( data => {
                    console.log(data);
                    this.loadJson(JSON.parse(data[1].json));
                });
                return true;
            }
            case 83: { // key 'S' to save to DB
                // SAVE MARKUP
                fetch(`${DBURL}/savemarkup`, {
                  method: 'post',
                  headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({"UserID":2, "sqrfoot": Math.round(_currentMeasurement.area/144), "json":this.getJson() })
                }).then(res=>res.json())
                  .then(res => console.log(res));

                return true;
            }
            case 89: {
                this.addMeasurement();
                return true;
            }
            case Autodesk.Viewing.KeyCode.BACKSPACE:
            case Autodesk.Viewing.KeyCode.DELETE:
            if (_currentMeasurement && _currentMeasurement.measurementType === avem.MEASUREMENT_AREA && !this.areAllPicksSet()) {
                if (_currentMeasurement.countPicks() > 2 ) {
                    this.deleteCurrentPick();
                } else {
                    this.deleteCurrentMeasurement();    
                }
            } else {
                this.deleteCurrentMeasurement();
            }

            return true;
        }

        return false;
    };
};

})();