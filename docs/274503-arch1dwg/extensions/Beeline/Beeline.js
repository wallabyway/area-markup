'use strict';

AutodeskNamespace('Autodesk.Viewing.Extensions.Beeline');

Autodesk.Viewing.Extensions.Beeline.BeelineExtension = function(viewer, options) {
    Autodesk.Viewing.Extension.call(this, viewer, options);
};

Autodesk.Viewing.Extensions.Beeline.BeelineExtension.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
Autodesk.Viewing.Extensions.Beeline.BeelineExtension.prototype.constructor = Autodesk.Viewing.Extensions.Beeline.BeelineExtension;

Autodesk.Viewing.Extensions.Beeline.BeelineExtension.prototype.load = function() {
    var self = this;
    var viewer = this.viewer;
    var AVU = Autodesk.Viewing.UI;

    // Register tool
    this.tool = new Autodesk.Viewing.Extensions.Beeline.BeelineTool(viewer.impl, viewer);
    viewer.toolController.registerTool(this.tool);

    // Add UI
    // Add beeline button
    this.createUI();

    // Add hotkey
    var previousTool;
    function onPress() {
        previousTool = viewer.getActiveNavigationTool();
        viewer.setActiveNavigationTool(self.tool.getName());
        return true;
    }
    function onRelease() {
        viewer.setActiveNavigationTool(previousTool ? previousTool : viewer.defaultNavigationToolName);
        return true;
    }
    this.HOTKEYS_ID = "Autodesk.Beeline.Hotkeys";
    var hotkeys = [
        {
            keycodes: [
                Autodesk.Viewing.theHotkeyManager.KEYCODES.CONTROL,
                Autodesk.Viewing.theHotkeyManager.KEYCODES.ALT
            ],
            onPress: onPress,
            onRelease: onRelease
        }
    ];
    Autodesk.Viewing.theHotkeyManager.pushHotkeys(this.HOTKEYS_ID, hotkeys);

    // Register listeners
    this.onToolChanged = function (e) {
        if (e.toolName.indexOf('beeline') === -1) {
            return;
        }

        if (self.beelineButton) {
            var state = e.active ? AVU.Button.State.ACTIVE : AVU.Button.State.INACTIVE;
            self.beelineButton.setState(state);
        }
    };

    viewer.addEventListener(Autodesk.Viewing.TOOL_CHANGE_EVENT, this.onToolChanged);

    return true;
};

Autodesk.Viewing.Extensions.Beeline.BeelineExtension.prototype.createUI = function()
{
    var viewer = this.viewer;
    if (!viewer.getToolbar || !viewer.getSettingsPanel) return; // Add support for Viewer3D instance

    var toolbar = viewer.getToolbar(true);

    var AVU = Autodesk.Viewing.UI;
    var navTools = toolbar.getControl(Autodesk.Viewing.TOOLBAR.NAVTOOLSID);

    var beelineButtonId = "toolbar-beelineTool";

    /*var options = {
        defaultTooltipValue: "Walk to (double-click to Walk through)"
    };*/
    var beelineButton = new AVU.Button(beelineButtonId);
    beelineButton.setToolTip('Walk to');
    beelineButton.setIcon("adsk-icon-walk");
    beelineButton.onClick = function(e) {
        var state = beelineButton.getState();
        if (state === AVU.Button.State.INACTIVE) {
            viewer.setActiveNavigationTool("beeline");
        } else if (state === AVU.Button.State.ACTIVE) {
            viewer.setActiveNavigationTool();
        }
    };
    this.beelineButton = beelineButton;

    var cameraSubmenuTool = navTools.getControl('toolbar-cameraSubmenuTool');
    if (cameraSubmenuTool) {
        navTools.addControl(this.beelineButton, {index: navTools.indexOf(cameraSubmenuTool.getId())});
    } else {
        navTools.addControl(this.beelineButton);
    }

    // Add beeline settings to the viewer's setting panel.
    var that = this;
    var addViewerUIOptions = function() {
        viewer.removeEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, addViewerUIOptions);

        var navTab = Autodesk.Viewing.Extensions.ViewerSettingTab.Navigation;
        var viewerOptions = viewer.getSettingsPanel(true);
        that.viewerOption_LookHorId = viewerOptions.addCheckbox(navTab, "Reverse horizontal look direction", false, function(checked) {
            viewer.setReverseHorizontalLookDirection(checked);
        }, "reverseHorizontalLookDirection");

        that.viewerOption_LookVertId = viewerOptions.addCheckbox(navTab, "Reverse vertical look direction", false, function(checked) {
            viewer.setReverseVerticalLookDirection(checked);
        }, "reverseVerticalLookDirection");

    };

    if (this.viewer.getSettingsPanel(false)) {
        addViewerUIOptions();
    } else {
        this.viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, addViewerUIOptions);
    }
};

Autodesk.Viewing.Extensions.Beeline.BeelineExtension.prototype.unload = function () {
    var viewer = this.viewer;

    // Remove listeners
    viewer.removeEventListener(Autodesk.Viewing.TOOL_CHANGE_EVENT, this.onToolChanged);
    this.onToolChanged = undefined;

    // Remove hotkey
    Autodesk.Viewing.theHotkeyManager.popHotkeys(this.HOTKEYS_ID);

    // Remove the UI
    if (this.beelineButton) {
        // Button is created only if toolbar API is available
        var toolbar = viewer.getToolbar(false);
        if (toolbar) {
            toolbar.getControl(Autodesk.Viewing.TOOLBAR.NAVTOOLSID).removeControl(this.beelineButton.getId());
        }
        this.beelineButton = null;
    }

    // Remove the options from the Viewer SettingsPanel.
    if (viewer.getSettingsPanel) {
        viewer.getSettingsPanel(false).removeCheckbox(this.viewerOption_LookHorId);
        viewer.getSettingsPanel(false).removeCheckbox(this.viewerOption_LookVertId);
    }

    //Uh, why does the viewer need to keep track of this in addition to the tool stack?
    if (viewer.getActiveNavigationTool() == this.tool.getName())
        viewer.setActiveNavigationTool();

    // Deregister tool
    viewer.toolController.deregisterTool(this.tool);
    this.tool = null;

    return true;
};

Autodesk.Viewing.theExtensionManager.registerExtension('Autodesk.Beeline', Autodesk.Viewing.Extensions.Beeline.BeelineExtension);
AutodeskNamespace('Autodesk.Viewing.Extensions.Beeline');

var avp = Autodesk.Viewing.Private;

// /** @constructor */
//
// TODO: Pass in the api instead of the impl, don't use the impl object.
//
Autodesk.Viewing.Extensions.Beeline.BeelineTool = function( viewerImpl, viewerApi )
{
    var MODE = {
        GO_TO: 0,
        PASS_THROUGH: 1,
        DEFAULT: 0
    };

    // Constants
    var kDefaultFlightDuration = 1000; // milliseconds
    var kLookSensitivity = 0.8;
    var kMaxFocalLength = 28;
    var kDampingFactor = 0.7;

    // States
    var kStartState = 0;
    var kFlightState = 1;

    var self = this;
    var _viewerapi = viewerApi;
    var _container = viewerApi.container;
    var _autocam = viewerApi.autocam;
    var _navapi = viewerApi.navigation;
    var _viewerUtilities = viewerApi.utilities;
    var _names = ["beeline"];

    var _state = kStartState;
    var _isDragging = false;
    var _mouseButtons = 0;
    var _flightStartTime = null;
    var _flightDuration = null;
    var _intersectPointNear = new THREE.Vector3();
    var _intersectPointFar = new THREE.Vector3();
    var _flightStartPosition = new THREE.Vector3();
    var _flightEndPosition = new THREE.Vector3();
    var _haltAnimation = false;
    var _mouseXY = new THREE.Vector3();
    var _previousXY = new THREE.Vector3();

    var _expectedCameraState = null;
    var _touchType = null;

    function screenModeChanged()
    {
        self.revertToStartState();
    }

    // Utility methods
    function getCameraState(camera) {
        var state = {};

        state.target  = camera.target.clone();
        state.worldup = camera.worldup.clone();

        state.position = camera.position.clone();
        state.up = camera.up.clone();

        var props = ['isPerspective', 'fov', 'zoom', 'aspect', 'left', 'right', 'top', 'bottom'];
        for (var i = 0; i < props.length; i++) {
            state[props[i]] = camera[props[i]];
        }

        return state;
    }

    function compareCameraToState(camera, state) {
        var result = camera.target.equals(state.target) &&
            camera.position.equals(state.position) &&
            camera.worldup.equals(state.worldup) &&
            camera.up.equals(state.up);

        if (!result) {
            return false;
        }

        var props = ['isPerspective', 'fov', 'zoom', 'aspect', 'left', 'right', 'top', 'bottom'];
        for (var i = 0; i < props.length; i++) {
            if (camera[props[i]] !== state[props[i]]) {
                return false;
            }
        }

        return true;
    }

    function getIntersectionPoints(normalizedScreenPosition) {
        var viewportVec = new THREE.Vector3(normalizedScreenPosition.x, normalizedScreenPosition.y, 1.0);
        var result = viewerImpl.hitTestViewport(viewportVec.clone(), false);

        if (!result || !result.intersectPoint) {
            return [];
        }

        var caster = new THREE.Raycaster();
        var vector = viewportVec.clone();
        var camera = viewerImpl.camera;
        var end = new THREE.Vector3( vector.x, vector.y, 1.0 );

        vector.z = -1.0;
        vector = vector.unproject( camera );
        end = end.unproject( camera );
        end.sub(vector).normalize();
        caster.set(_navapi.isPerspective ? camera.position : vector, end);

        var intersects = [];

        // Get intersection points
        var frags = result.fragId instanceof Array ? result.fragId : [result.fragId];
        for (var i = 0; i < frags.length; i++) {
            var mesh = viewerImpl.getRenderProxy(viewerApi.model, frags[i]);

            avp.VBIntersector.meshRayCast(mesh, caster, intersects);
        }

        intersects.sort(function(a,b) { return a.distance - b.distance;});

        return intersects;
    }

    function prepareCamera() {
        if (!_navapi.isPerspective) {
            _navapi.toPerspective();
            _viewerUtilities.activatePivot(false);
        }
        if (_navapi.getFocalLength() > kMaxFocalLength) {
            _navapi.setFocalLength(kMaxFocalLength, true);
        }
    }

    // Tool methdos
    this.getNames = function()
    {
        return _names;
    };

    this.getName = function()
    {
        return _names[0];
    };

    this.activate = function(toolName)
    {
        _mouseButtons = 0;
        viewerApi.addEventListener(Autodesk.Viewing.FULLSCREEN_MODE_EVENT, screenModeChanged);
        _autocam.userLookSpeed = kLookSensitivity;
        this.showHUDMessage(true);
    };

    this.deactivate = function()
    {
        viewerApi.removeEventListener(Autodesk.Viewing.FULLSCREEN_MODE_EVENT, screenModeChanged);
        this.revertToStartState();
        this.showHUDMessage(false);
    };

    this.getCursor = function()
    {
        if (_isDragging) {
            return "url(data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAQAAADYBBcfAAAACXBIWXMAABYlAAAWJQFJUiTwAAADGGlDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjaY2BgnuDo4uTKJMDAUFBUUuQe5BgZERmlwH6egY2BmYGBgYGBITG5uMAxIMCHgYGBIS8/L5UBFTAyMHy7xsDIwMDAcFnX0cXJlYE0wJpcUFTCwMBwgIGBwSgltTiZgYHhCwMDQ3p5SUEJAwNjDAMDg0hSdkEJAwNjAQMDg0h2SJAzAwNjCwMDE09JakUJAwMDg3N+QWVRZnpGiYKhpaWlgmNKflKqQnBlcUlqbrGCZ15yflFBflFiSWoKAwMD1A4GBgYGXpf8EgX3xMw8BSMDVQYqg4jIKAUICxE+CDEESC4tKoMHJQODAIMCgwGDA0MAQyJDPcMChqMMbxjFGV0YSxlXMN5jEmMKYprAdIFZmDmSeSHzGxZLlg6WW6x6rK2s99gs2aaxfWMPZ9/NocTRxfGFM5HzApcj1xZuTe4FPFI8U3mFeCfxCfNN45fhXyygI7BD0FXwilCq0A/hXhEVkb2i4aJfxCaJG4lfkaiQlJM8JpUvLS19QqZMVl32llyfvIv8H4WtioVKekpvldeqFKiaqP5UO6jepRGqqaT5QeuA9iSdVF0rPUG9V/pHDBYY1hrFGNuayJsym740u2C+02KJ5QSrOutcmzjbQDtXe2sHY0cdJzVnJRcFV3k3BXdlD3VPXS8Tbxsfd99gvwT//ID6wIlBS4N3hVwMfRnOFCEXaRUVEV0RMzN2T9yDBLZE3aSw5IaUNak30zkyLDIzs+ZmX8xlz7PPryjYVPiuWLskq3RV2ZsK/cqSql01jLVedVPrHzbqNdU0n22VaytsP9op3VXUfbpXta+x/+5Em0mzJ/+dGj/t8AyNmf2zvs9JmHt6vvmCpYtEFrcu+bYsc/m9lSGrTq9xWbtvveWGbZtMNm/ZarJt+w6rnft3u+45uy9s/4ODOYd+Hmk/Jn58xUnrU+fOJJ/9dX7SRe1LR68kXv13fc5Nm1t379TfU75/4mHeY7En+59lvhB5efB1/lv5dxc+NH0y/fzq64Lv4T8Ffp360/rP8f9/AA0ADzT6lvFdAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAEtSURBVHja7JQxTkJBFEXPQ/xQEDG0ljRYSU1iLN2AtSWlC7Gw04QtGF2ApQVLIDY2hlgIDagJwWCOhf74JXxRYumbaib3ZO7c9zIhq1WBfzAfjJViDWPdYBq/w0pKITjhd7eGJwQkDu2I8rOFHYcmkqgDz4wfoeGZA01BHXtsbSla89ixZsH3an2LtpRUOQde28xFm17PgyPvVK1bl5yYEOtuq3rnyMQCXNJgiiTchuHCnhrGbYBMaXAJULGqlJz54O43bcFdH5xZUqpWJJWW7duza/tDmTWJbbv27Fs2PS2m1iZRNeGcI/aAEevOgCKnbAI7DNjjhUmk1ouf7xgHbLgF3MSzT7wCaxxSiW3hnsf4OngLotj3ILO74CoWTWzOIGcTXab4/6z+CnwbAGjXSZC++vLvAAAAAElFTkSuQmCC), auto";
        } else if (_mouseButtons <= 1) {
            return "url(data:image/x-icon;base64,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), auto";
        }

        return null;
    };

    this.update = function () {
        var camera = _navapi.getCamera();
        _isDragging = false;

        var moved = false;
        if (_mouseButtons === 1) {
            var deltaXY = _mouseXY.clone().sub(_previousXY);
            if (deltaXY.x !== 0 || deltaXY.y !== 0) {
                _isDragging = true;
                _previousXY.x += deltaXY.x * kDampingFactor;
                _previousXY.y += deltaXY.y * kDampingFactor;
                
                var worldDotCamera = _navapi.getWorldUpVector().dot(_navapi.getCameraUpVector());
                var horDirection = viewerApi.prefs.reverseHorizontalLookDirection ? -1 : 1;
                var vertDirection = viewerApi.prefs.reverseVerticalLookDirection ? -1 : 1;

                deltaXY.x *= worldDotCamera < 0 ? -horDirection : horDirection;
                deltaXY.y *= vertDirection;

                // Make sure we're synced with the camera
                _autocam.sync(_navapi.getCamera());
                _autocam.look(deltaXY);
                moved = true;

                _expectedCameraState = getCameraState(camera);
            }
        }
        return moved;
    };

    // Beeline methods
    this.revertToStartState = function()
    {
        _viewerUtilities.pivotActive(false);
        _state = kStartState;
        _haltAnimation = true;
    };

    this.attemptFlight = function(normalizedScreenPosition, mode)
    {
        if (!_navapi.isActionEnabled('walk')) {
            return;
        }

        var intersectionPoints = getIntersectionPoints(normalizedScreenPosition);

        if (intersectionPoints.length > 0) {
            _intersectPointNear = intersectionPoints[0].point;
            _intersectPointFar = intersectionPoints[intersectionPoints.length - 1].point;
            self.fly(kDefaultFlightDuration, mode);
        }
    };

    this.fly = function(duration, mode)
    {
        // Pivot needs to be set before altering focal length to make it less jarring for the user. Changing the focal
        // length alters the camera's position and we need the camera's position to calculate the far pivot. Instead,
        // use approximation of where the far pivot will be (i.e. _intersectPointFar).
        _viewerUtilities.setPivotPoint(mode === MODE.GO_TO ? _intersectPointNear : _intersectPointFar, true, true);
        prepareCamera();

        _flightStartPosition = _navapi.getPosition();
        _flightDuration = duration;
        switch (mode) {
            case MODE.GO_TO:
                // Fly 80% of the way there
                _flightEndPosition = _flightStartPosition.clone().lerp(_intersectPointNear, 0.8);
                break;

            case MODE.PASS_THROUGH:
                // Fly 2 near planes past the object.
                var near = _autocam.camera.near * 2;
                var distance = _intersectPointFar.clone().sub(_flightStartPosition).length();
                var nearRatio = near / distance;

                _viewerUtilities.setPivotPoint(_flightStartPosition.clone().lerp(_intersectPointFar, 1 + 10 * nearRatio), true, true);
                _flightEndPosition = _flightStartPosition.clone().lerp(_intersectPointFar, 1 + nearRatio);
                break;

            default:
                return;
        }

        _state = kFlightState;

        _haltAnimation = false;
        _flightStartTime = null;

        requestAnimationFrame(self.step);
    };

    // Animating the camera
    this.step = function(timestamp)
    {
        var camera = _navapi.getCamera();

        if (_haltAnimation) {
            return;
        }

        if (_flightStartTime === null) {
            _expectedCameraState = getCameraState(camera);

            _flightStartTime = timestamp;
        } else if (!compareCameraToState(camera, _expectedCameraState)) {
            self.revertToStartState();
            return;
        }

        var flightTime = timestamp - _flightStartTime;
        var t = flightTime < _flightDuration ? flightTime / _flightDuration : 1;

        var newPosition = _flightStartPosition.clone().lerp(_flightEndPosition, t);

        // Keep target the same distance as the pivot
        var viewVec = _navapi.getEyeVector();
        viewVec.multiplyScalar(_navapi.getPivotPoint().sub(_navapi.getPosition()).length() / viewVec.length());

        _navapi.setView(newPosition, viewVec.add(newPosition));

        _expectedCameraState = getCameraState(camera);

        _viewerUtilities.activatePivot(false);

        if (flightTime < _flightDuration) {
            requestAnimationFrame(self.step);
        } else {
            self.revertToStartState();
        }
    };

    // ------------------------
    // Event handler callbacks:
    // These can use "this".

    this.handleGesture = function( event )
    {
        Autodesk.Viewing.Private.HudMessage.dismiss();

        switch( event.type )
        {
            case "dragstart":
                _touchType = "drag";
                // Single touch, fake the mouse for now...
                return this.handleButtonDown(event, 0);

            case "dragmove":
                return (_touchType === "drag") ? this.handleMouseMove(event) : false;

            case "dragend":
                if( _touchType === "drag" )
                {
                    this.handleButtonUp(event, 0);
                    _touchType = null;
                    return true;
                }
                return false;
        }
        return false;
    };


    this.handleButtonDown = function( event, button )
    {
        Autodesk.Viewing.Private.HudMessage.dismiss();

        _mouseButtons += 1 << button;

        if (button === 0) {
            _previousXY.x = _mouseXY.x = event.canvasX;
            _previousXY.y = _mouseXY.y = event.canvasY;
            return true;
        }
        return false;
    };

    this.handleButtonUp = function( event, button )
    {
        _mouseButtons -= 1 << button;

        if (button === 0) {
            return true;
        }
        return false;
    };

    this.handleSingleClick = function( event, button )
    {
        Autodesk.Viewing.Private.HudMessage.dismiss();

        // Anything besides LMB should revert viewer to initial state
        if (button === 0) {
            var normalizedScreenLocation = {
                x: event.normalizedX,
                y: event.normalizedY
            };

            switch (_state) {
                case kStartState:
                    self.attemptFlight(normalizedScreenLocation, MODE.GO_TO);
                    break;

                case kFlightState:
                    self.revertToStartState();
                    break;

                default:
                    break;
            }
        } else {
            this.revertToStartState();
            return false;
        }

        return true;
    };

    this.handleSingleTap = function( event )
    {
        return this.handleSingleClick(event, 0);
    };

    this.handleDoubleTap = function( event )
    {
        if( event.pointers && event.pointers.length === 1 ) {
            self.attemptFlight({x: event.normalizedX, y: event.normalizedY}, MODE.PASS_THROUGH);
            return true;
        }
        return false;
    };

    this.handleDoubleClick = function( event, button )
    {
        if (button === 0) {
            self.attemptFlight({x: event.normalizedX, y: event.normalizedY}, MODE.PASS_THROUGH);
            return true;
        }

        return false;
    };

    this.handleMouseMove = function( event )
    {
        _mouseXY.x = event.canvasX;
        _mouseXY.y = event.canvasY;

        if (_mouseButtons === 1) {
            prepareCamera();
            return true;
        }

        return false;
    };

    this.handleBlur = function(event)
    {
        // Reset things when we lose focus...
        this.revertToStartState();
        return false;
    };

    this.showOrthoWarningMessage = function()
    {
        var messageSpecs = {
            "msgTitleKey"   : "Orthographic View Set",
            "messageKey"    : "The view is set to Orthographic Beeline",
            "messageDefaultValue"  : "The view is set to Orthographic. Using this tool will switch to Perspective."
        };
        var closeCallback = function() {}; // dummy callback function so that the 'X' is shown
        Autodesk.Viewing.Private.HudMessage.displayMessage(_container, messageSpecs, closeCallback);
    };

    this.showFocalWarningMessage = function()
    {
        var messageSpecs = {
            "msgTitleKey"   : "Long Focal Length View Set",
            "messageKey"    : "The view is set to a long focal length",
            "messageDefaultValue"  : "This view has a long focal length. Using this tool will set a short focal length."
        };
        var closeCallback = function() {}; // dummy callback function so that the 'X' is shown
        Autodesk.Viewing.Private.HudMessage.displayMessage(_container, messageSpecs, closeCallback);
    };

    this.watchCamera = function(e)
    {
        // If camera changed to ORTHO and we are still in Beeline mode
        // put up the warning message that the system will switch to perspective.
        // Similarly, warn for long focal length.
        if (_viewerapi.toolController.getActiveToolName() === _names[0] ||
            _viewerapi.toolController.getActiveToolName() === _names[1]) {
            var camera = _navapi.getCamera();
            var isOrtho = camera && !camera.isPerspective;
            var hasLongFocalLength = _navapi.getFocalLength() > kMaxFocalLength;

            if (isOrtho)
                self.showOrthoWarningMessage();
            else if (hasLongFocalLength)
                self.showFocalWarningMessage();
            else
                Autodesk.Viewing.Private.HudMessage.dismiss();
        }
    };

    this.showHUDMessage = function(state)
    {
        var camera = _navapi.getCamera();
        var isOrtho = camera && !camera.isPerspective;
        var hasLongFocalLength = _navapi.getFocalLength() > kMaxFocalLength;

        if (state && isOrtho) {
            self.showOrthoWarningMessage();
        } else if (state && hasLongFocalLength) {
            self.showFocalWarningMessage();
        } else {
            Autodesk.Viewing.Private.HudMessage.dismiss();
        }

        if (state) {
            _viewerapi.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, self.watchCamera);
        } else {
            _viewerapi.removeEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, self.watchCamera);
        }
    };

};
