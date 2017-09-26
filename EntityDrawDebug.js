var SCALE = 30;
var NULL_CENTER = {
    x: null,
    y: null
};

function Entity(id, x, y, center, color) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.center = center;
    this.color = color || "red";
}

Entity.prototype.update = function (state) {
    this.x = state.x;
    this.y = state.y;
    this.center = state.c;
    this.angle = state.a;
}

Entity.prototype.draw = function (ctx) {
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(this.x * SCALE, this.y * SCALE, 4, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(this.center.x * SCALE, this.center.y * SCALE, 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    
}

Entity.build = function (def) {
    if (def.isHide) return new Entity(def.id, def.x, def.y, NULL_CENTER, def.color);

    if (def.radius) {
        return new CircleEntity(def.id, def.x, def.y, NULL_CENTER, def.color, def.radius);
    } else if (def.polys) {
        return new PolygonEntity(def.id, def.x, def.y, NULL_CENTER, def.color, def.polys);
    } else {
        return new RectangleEntity(def.id, def.x, def.y, NULL_CENTER, def.color, def.halfWidth, def.halfHeight);
    }
}

function CircleEntity(id, x, y, center, color, radius) {
    color = color || 'blue';
    Entity.call(this, id, x, y, center, color);
    this.radius = radius;
}
CircleEntity.prototype = new Entity();
CircleEntity.prototype.constructor = CircleEntity;

CircleEntity.prototype.draw = function (ctx) {
    ctx.fillStyle = this.color;
    //console.log(this.x);
    
    ctx.beginPath();
    ctx.arc(this.x * SCALE, this.y * SCALE, this.radius * SCALE, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    
    Entity.prototype.draw.call(this, ctx);
}

function RectangleEntity(id, x, y, center, color, halfWidth, halfHeight) {
    Entity.call(this, id, x, y, center, color);
    this.halfWidth = halfWidth;
    this.halfHeight = halfHeight;
}
RectangleEntity.prototype = new Entity();
RectangleEntity.prototype.constructor = RectangleEntity;

RectangleEntity.prototype.draw = function (ctx) {
    ctx.save();
    ctx.translate(this.x * SCALE, this.y * SCALE);
    ctx.rotate(this.angle);
    ctx.translate(-(this.x) * SCALE, -(this.y) * SCALE);
    ctx.fillStyle = this.color;
    ctx.fillRect((this.x - this.halfWidth) * SCALE,
        (this.y - this.halfHeight) * SCALE,
        (this.halfWidth * 2) * SCALE,
        (this.halfHeight * 2) * SCALE);
    ctx.restore();
    ctx.globalAlpha=0.5
    Entity.prototype.draw.call(this, ctx);
}

function PolygonEntity(id, x, y, center, color, polys) {
    Entity.call(this, id, x, y, center, color);
    this.polys = polys;
}
PolygonEntity.prototype = new Entity();
PolygonEntity.prototype.constructor = PolygonEntity;

PolygonEntity.prototype.draw = function (ctx) {
    ctx.save();
    ctx.translate(this.x * SCALE, this.y * SCALE);
    ctx.rotate(this.angle);
    ctx.translate(-(this.x) * SCALE, -(this.y) * SCALE);
    ctx.fillStyle = this.color;

    for (var i = 0; i < this.polys.length; i++) {
        var points = this.polys[i];
        ctx.beginPath();
        ctx.moveTo((this.x + points[0].x) * SCALE, (this.y + points[0].y) * SCALE);
        for (var j = 1; j < points.length; j++) {
            ctx.lineTo((points[j].x + this.x) * SCALE, (points[j].y + this.y) * SCALE);
        }
        ctx.lineTo((this.x + points[0].x) * SCALE, (this.y + points[0].y) * SCALE);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    ctx.restore();

    Entity.prototype.draw.call(this, ctx);
}

