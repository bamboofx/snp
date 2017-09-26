
const fs = require("fs");
eval(fs.readFileSync('./lib/embox2d-noclosure.min.js') + '');



var Box2D;
if (!Box2D) Box2D = (typeof Box2D !== 'undefined' ? Box2D : null) || Module;


var WorldBox = function () {
    

}
WorldBox.init = function (p_socket, intervalRate, adaptive, width, height, scale) {
    this.socket = p_socket
    this.intervalRate = parseInt(intervalRate);
    this.adaptive = adaptive;
    this.width = width;
    this.height = height;
    this.scale = scale;

    this.gravity = new b2Vec2(0.0, 10.0);
    this.world = new b2World(this.gravity);

    this.fixDef = new b2FixtureDef();
    this.fixDef.set_density(1.0);
    this.fixDef.set_friction(1.5);
    this.fixDef.set_restitution(.50);

    this.bodyDef = new b2BodyDef();
    console.log("InitContructor");
    this.buildGround();
}

WorldBox.createPlayer = function (p) {
     
        var pm = new playerModel();
        pm.id = p.id;
        pm.name = p.name;
        
        switch (p.id) {
            case 0:
                p1 = pm;
                break;
            case 1:
                p2 = pm;
                break;
            default:
                break;
        }

    
        var world = {};
    /*
    "0": { id: 0, x: 10, y: 5, radius: 1 },
        "1": {
            id: 1, x: 5, y: 5, polys: [
                [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 2 }] // triangle
            ]
        },
        "2": { id: 2, x: 9, y: 4, halfHeight: 1.5, halfWidth: 0.9 },
        "3": {
            id: 3, x: 4.5, y: 3, polys: [
                [{ x: 0, y: -2 }, { x: 2, y: 0 }, { x: 0, y: 2 }, { x: -0.5, y: 1.5 }] // odd shape
            ], color: "gray"
        },*/
        var initialState = {
            "4": { id: 4, x: 10, y: 5, radius: 1 },
            "1": {
                id: 1, x: 5, y: 5, polys: [
                    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 2 }] // triangle
                ]
            },
            "2": { id: 2, x: 9, y: 4, halfHeight: 1.5, halfWidth: 0.9 },
            "3": {
                id: 3, x: 4.5, y: 3, polys: [
                    [{ x: 0, y: -2 }, { x: 2, y: 0 }, { x: 0, y: 2 }, { x: -0.5, y: 1.5 }] // odd shape
                ], color: "gray"
            },
        "0": {
            id: 0, x: 5, y: 10, polys: [
                [{ x: 0, y: 1.7 }, { x: 0.25, y: 1.7 }, { x: 0.25, y: 2 }, { x:0,y:2}],//head
                [{ x: 0, y: 0.1 }, { x: 0.2, y: 0.1 }, { x: 0.2, y: 1.7 }, { x: 0, y: 1.7 }], // body
                [{ x: -0.15, y: 0 }, { x: 0.35, y: 0 }, { x: 0.35, y: 0.1 }, { x:-0.15, y: .1 }] // foot
            ], color: "green"
            },
        "5": {
            id: 5, x: 15, y: 10, polys: [
                [{ x: 0, y: 1.7 }, { x: 0.25, y: 1.7 }, { x: 0.25, y: 2 }, { x: 0, y: 2 }],//head
                [{ x: 0, y: 0.1 }, { x: 0.2, y: 0.1 }, { x: 0.2, y: 1.7 }, { x: 0, y: 1.7 }], // body
                [{ x: -0.15, y: 0 }, { x: 0.35, y: 0 }, { x: 0.35, y: 0.1 }, { x: -0.15, y: .1 }] // foot
            ], color: "yellow"
        }
    };
    for (var i in initialState) {
        world[i] = initialState[i];
    }
    this.socket.emit("initCanvas", initialState,this.scale);
    this.setBodies(world);
    console.log(this.ivid);
    clearInterval(this.ivid);
    this.ivid = null;
    this.ivid = setInterval(this.update.bind(this),1/this.intervalRate);

}
WorldBox.buildGround = function () {
    //create ground
    this.bodyDef.set_type(Box2D.b2_staticBody);

    // positions the center of the object (not upper left!)
    this.bodyDef.set_position(new b2Vec2(this.width / 2 / this.scale, this.height / this.scale));
    var shape = new b2PolygonShape()
    this.fixDef.set_shape(shape);
    this.bodyDef.set_userData(-1);
    // half width, half height. eg actual height here is 1 unit
    shape.SetAsBox((this.width - (this.width * 0.1) / this.scale) / 2, (10 / this.scale) / 2);
    var body = this.world.CreateBody(this.bodyDef);
    body.CreateFixture(this.fixDef);

}

WorldBox.update = function () {

    var start = Date.now();
    var stepRate = (this.adaptive) ? (now - this.lastTimestamp) / 1000 : (1 / this.intervalRate);
    this.world.Step(
        stepRate   //frame-rate
        , 8       //velocity iterations
        , 4       //position iterations
    );
    this.world.ClearForces();
    this.socket.emit("drawCanvas", this.getState());
    //return (Date.now() - start);
}

WorldBox.getState = function () {
    var state = {};
    for (var b = this.world.GetBodyList(); b.ptr !== 0; b = b.GetNext()) {
        if (b.IsActive() && typeof b.GetUserData() !== 'undefined' && b.GetUserData() != null) {
            //console.log(b.GetPosition().get_y());
            state[b.GetUserData()] = { x: b.GetPosition().get_x(), y: b.GetPosition().get_y(), a: b.GetAngle(), c: { x: b.GetWorldCenter().get_x(), y: b.GetWorldCenter().get_y() } };

        }
    }
    return state;
}

WorldBox.setBodies = function (bodyEntities) {
    this.bodyDef.set_type(Box2D.b2_dynamicBody);

    for (var id in bodyEntities) {
        var entity = bodyEntities[id];
        this.bodyDef.set_position(new b2Vec2(entity.x, entity.y));
        this.bodyDef.set_userData(entity.id);

        var body = this.world.CreateBody(this.bodyDef);

        body.SetLinearVelocity(new b2Vec2(0, 0));
        body.SetAwake(1);
        body.SetActive(1);
        //body.SetGravityScale(1);
        if (entity.radius) {
            console.log("radius", entity.radius);
            var cshape = new b2CircleShape();
            cshape.set_m_radius(entity.radius);
            this.fixDef.set_shape(cshape)
            body.CreateFixture(this.fixDef);
        } else if (entity.polys) {
            for (var j = 0; j < entity.polys.length; j++) {
                var points = entity.polys[j];
                var verts = [];
                for (var i = 0; i < points.length; i++) {
                    verts.push(new b2Vec2(points[i].x, points[i].y));
                }
                //var shape = new b2PolygonShape;
                this.fixDef.set_shape(this.createPolygonShape(verts));
                //shape.SetAsArray(vecs, vecs.length);
                body.CreateFixture(this.fixDef);
            }
        } else {
            shape = new b2PolygonShape;
            this.fixDef.set_shape(shape);
            shape.SetAsBox(entity.halfWidth, entity.halfHeight);
            body.CreateFixture(this.fixDef);
        }
    }
    this.ready = true;
}
WorldBox.createPolygonShape = function (vertices) {
    var shape = new b2PolygonShape();
    var buffer = Box2D.allocate(vertices.length * 8, 'float', Box2D.ALLOC_STACK);
    var offset = 0;
    for (var i = 0; i < vertices.length; i++) {
        Box2D.setValue(buffer + (offset), vertices[i].get_x(), 'float'); // x
        Box2D.setValue(buffer + (offset + 4), vertices[i].get_y(), 'float'); // y
        offset += 8;
    }
    var ptr_wrapped = Box2D.wrapPointer(buffer, Box2D.b2Vec2);
    shape.Set(ptr_wrapped, vertices.length);
    return shape;
}
module.exports = WorldBox;
var playerModel = function () {
    this.id = -1;
    this.name = "";
    this.body = null;
}
