/*global defineSuite*/
defineSuite([
        'RectangularSensorVisualizer',
        'Core/Cartesian3',
        'Core/Color',
        'Core/JulianDate',
        'Core/Math',
        'Core/Matrix3',
        'Core/Matrix4',
        'Core/Quaternion',
        'Core/Spherical',
        'DataSources/ColorMaterialProperty',
        'DataSources/ConstantProperty',
        'DataSources/EntityCollection',
        'RectangularSensorGraphics',
        'Specs/createScene',
        'Specs/destroyScene'
    ], function(
        RectangularSensorVisualizer,
        Cartesian3,
        Color,
        JulianDate,
        CesiumMath,
        Matrix3,
        Matrix4,
        Quaternion,
        Spherical,
        ColorMaterialProperty,
        ConstantProperty,
        EntityCollection,
        RectangularSensorGraphics,
        createScene,
        destroyScene) {
    "use strict";
    /*global jasmine,describe,xdescribe,it,xit,expect,beforeEach,afterEach,beforeAll,afterAll,spyOn,runs,waits,waitsFor*/

    var scene;
    var visualizer;

    beforeAll(function() {
        scene = createScene();
    });

    afterAll(function() {
        destroyScene(scene);
    });

    afterEach(function() {
        visualizer = visualizer && visualizer.destroy();
    });

    it('constructor throws if no scene is passed.', function() {
        expect(function() {
            return new RectangularSensorVisualizer();
        }).toThrowDeveloperError();
    });

    it('update throws if no time specified.', function() {
        var entityCollection = new EntityCollection();
        visualizer = new RectangularSensorVisualizer(scene, entityCollection);
        expect(function() {
            visualizer.update();
        }).toThrowDeveloperError();
    });

    it('isDestroy returns false until destroyed.', function() {
        var entityCollection = new EntityCollection();
        visualizer = new RectangularSensorVisualizer(scene, entityCollection);
        expect(visualizer.isDestroyed()).toEqual(false);
        visualizer.destroy();
        expect(visualizer.isDestroyed()).toEqual(true);
        visualizer = undefined;
    });

    it('object with no rectangularSensor does not create a primitive.', function() {
        var entityCollection = new EntityCollection();
        visualizer = new RectangularSensorVisualizer(scene, entityCollection);

        var testObject = entityCollection.getOrCreateEntity('test');
        testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
        testObject.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));
        visualizer.update(JulianDate.now());
        expect(scene.primitives.length).toEqual(0);
    });

    it('object with no position does not create a primitive.', function() {
        var entityCollection = new EntityCollection();
        visualizer = new RectangularSensorVisualizer(scene, entityCollection);

        var testObject = entityCollection.getOrCreateEntity('test');
        testObject.addProperty('rectangularSensor');
        testObject.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));
        var rectangularSensor = testObject.rectangularSensor = new RectangularSensorGraphics();
        rectangularSensor.xHalfAngle = new ConstantProperty(0.1);
        rectangularSensor.yHalfAngle = new ConstantProperty(0.2);
        visualizer.update(JulianDate.now());
        expect(scene.primitives.length).toEqual(0);
    });

    it('object with no orientation does not create a primitive.', function() {
        var entityCollection = new EntityCollection();
        visualizer = new RectangularSensorVisualizer(scene, entityCollection);

        var testObject = entityCollection.getOrCreateEntity('test');
        testObject.addProperty('rectangularSensor');
        testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
        var rectangularSensor = testObject.rectangularSensor = new RectangularSensorGraphics();
        rectangularSensor.xHalfAngle = new ConstantProperty(0.1);
        rectangularSensor.yHalfAngle = new ConstantProperty(0.2);
        visualizer.update(JulianDate.now());
        expect(scene.primitives.length).toEqual(0);
    });

    it('A RectangularSensorGraphics causes a sensor to be created and updated.', function() {
        var time = JulianDate.now();
        var entityCollection = new EntityCollection();
        visualizer = new RectangularSensorVisualizer(scene, entityCollection);

        var testObject = entityCollection.getOrCreateEntity('test');
        testObject.addProperty('rectangularSensor');
        testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
        testObject.orientation = new ConstantProperty(new Quaternion(0, 0, Math.sin(CesiumMath.PI_OVER_FOUR), Math.cos(CesiumMath.PI_OVER_FOUR)));

        var rectangularSensor = testObject.rectangularSensor = new RectangularSensorGraphics();
        rectangularSensor.xHalfAngle = new ConstantProperty(0.1);
        rectangularSensor.yHalfAngle = new ConstantProperty(0.2);
        rectangularSensor.intersectionColor = new ConstantProperty(new Color(0.1, 0.2, 0.3, 0.4));
        rectangularSensor.intersectionWidth = new ConstantProperty(0.5);
        rectangularSensor.showIntersection = new ConstantProperty(true);
        rectangularSensor.radius = new ConstantProperty(123.5);
        rectangularSensor.show = new ConstantProperty(true);
        rectangularSensor.lateralSurfaceMaterial = ColorMaterialProperty.fromColor(Color.WHITE);
        visualizer.update(time);

        expect(scene.primitives.length).toEqual(1);
        var p = scene.primitives.get(0);
        expect(p.intersectionColor).toEqual(testObject.rectangularSensor.intersectionColor.getValue(time));
        expect(p.intersectionWidth).toEqual(testObject.rectangularSensor.intersectionWidth.getValue(time));
        expect(p.showIntersection).toEqual(testObject.rectangularSensor.showIntersection.getValue(time));
        expect(p.radius).toEqual(testObject.rectangularSensor.radius.getValue(time));
        expect(p.modelMatrix).toEqual(Matrix4.fromRotationTranslation(Matrix3.fromQuaternion(testObject.orientation.getValue(time)), testObject.position.getValue(time)));
        expect(p.show).toEqual(testObject.rectangularSensor.show.getValue(time));
        expect(p.lateralSurfaceMaterial.uniforms).toEqual(testObject.rectangularSensor.lateralSurfaceMaterial.getValue(time));

        rectangularSensor.show.setValue(false);
        visualizer.update(time);
        expect(p.show).toEqual(false);
    });

    it('clear removes rectangularSensors.', function() {
        var entityCollection = new EntityCollection();
        visualizer = new RectangularSensorVisualizer(scene, entityCollection);

        var testObject = entityCollection.getOrCreateEntity('test');
        testObject.addProperty('rectangularSensor');
        testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
        testObject.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));
        var rectangularSensor = testObject.rectangularSensor = new RectangularSensorGraphics();
        rectangularSensor.xHalfAngle = new ConstantProperty(0.1);
        rectangularSensor.yHalfAngle = new ConstantProperty(0.2);

        var time = JulianDate.now();
        expect(scene.primitives.length).toEqual(0);
        visualizer.update(time);
        expect(scene.primitives.length).toEqual(1);
        expect(scene.primitives.get(0).show).toEqual(true);
        entityCollection.removeAll();
        visualizer.update(time);
        expect(scene.primitives.length).toEqual(0);
    });

    it('Visualizer sets entity property.', function() {
        var entityCollection = new EntityCollection();
        visualizer = new RectangularSensorVisualizer(scene, entityCollection);

        var testObject = entityCollection.getOrCreateEntity('test');
        testObject.addProperty('rectangularSensor');
        testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
        testObject.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));
        var rectangularSensor = testObject.rectangularSensor = new RectangularSensorGraphics();
        rectangularSensor.xHalfAngle = new ConstantProperty(0.1);
        rectangularSensor.yHalfAngle = new ConstantProperty(0.2);

        var time = JulianDate.now();
        visualizer.update(time);
        expect(scene.primitives.get(0).id).toEqual(testObject);
    });
}, 'WebGL');
