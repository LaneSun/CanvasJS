window.CanvasJS = {};

(function (self) {
    //
    self.draw = (canvas, codes, sets = {x: 0, y: 0, scale: 1.0}) => {
        let ctx = canvas.getContext("2d");
        for (let i = 0; i < codes.length; i++) {
            Fns[(codes[i].type)](ctx,codes[i],sets);
        }
    };
    let Fns = {};
    // Fns.line = (ctx, data, style, sets) => {
    //     ctx.beginPath();
    //     ctx.moveTo(sets.x + data[0].x * sets.scale, sets.y + data[0].y * sets.scale);
    //     ctx.lineTo(sets.x + data[1].x * sets.scale, sets.y + data[1].y * sets.scale);
    //     ctx.globalAlpha = style.alpha;
    //     ctx.lineCap = style.line_cap;
    //     ctx.lineWidth = style.line_width;
    //     ctx.strokeStyle = style.stroke_color;
    //     ctx.stroke();
    // };
    Fns.begin = (ctx, data, sets) => {
        ctx.beginPath();
        ctx.moveTo(sets.x + data.x * sets.scale, sets.y + data.y * sets.scale);
    };
    Fns.path = (ctx, data, sets) => {
        switch (data.drawer) {
            case "line":
                ctx.lineTo(sets.x + data.x * sets.scale, sets.y + data.y * sets.scale);
                break;
            case "arc":
                ctx.arc(sets.x + data.x * sets.scale, sets.y + data.y * sets.scale, data.r * sets.scale, data.a1, data.a2, data.clock);
                break;
            default:
                break;
        }

        // ctx.arc(sets.x + data[i].x * sets.scale, sets.y + data[i].y * sets.scale, data[i].r * sets.scale, data[i].a1, data[i].a2, data[i].clock);
    };
    Fns.end = (ctx, data, sets) => {
        ctx.globalAlpha = data.style.alpha;
        ctx.fillStyle = data.style.fill_color;
        ctx.lineCap = data.style.line_cap;
        ctx.lineJoin = data.style.line_join;
        ctx.lineWidth = data.style.line_width * sets.scale;
        // ctx.strokeWidth = data.style.stroke_width * sets.scale;
        ctx.strokeStyle = data.style.stroke_color;
        ctx.shadowColor = data.style.shadow_color;
        ctx.shadowBlur = data.style.shadow_blur * sets.scale;
        ctx.shadowOffsetX = data.style.shadow_offsetX * sets.scale;
        ctx.shadowOffsetY = data.style.shadow_offsetY * sets.scale;
        switch (data.mode) {
            case "fill":
                ctx.fill();
                break;
            case "stroke":
                ctx.stroke();
                break;
            default:
                break;
        }

    };
})(window.CanvasJS);