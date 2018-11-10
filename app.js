window.Drawer = {};

(function (self) {
    self.context = undefined;
    self.scontext = undefined;
    self.tcontext = undefined;
    self.draw_canvas = undefined;
    self.show_canvas = undefined;
    self.tool_bar = undefined;
    self.history_elem = undefined;
    self.saves_elem = undefined;
    self.canvasjs = undefined;
    self.width = 512;
    self.height = 512;
    self.scale = 1.0;
    self.sizeX = 16;
    self.sizeY = 16;
    self.show_helper = true;
    self.SIZE_HELPER = 7;
    self.COLOR_HELPER = "#00a3ff";
    self.COLOR_HELPER_BACK = "rgba(100,100,100,0.5)";
    self.COLOR_RUlER = "#000000";
    self.SIZE_RULER = 3;
    self.type_selected = "stroke_path";
    self.drawer_selected = "line";
    self.arc_cache = {
        point1: undefined,
        center: undefined,
        point2: undefined,
    };
    self.canvas_cache = [];
    self.pointer = 0;
    self.tool_cache = [
        "fill_path",
        "stroke_path",
    ];
    self.drawer_cache = [
        "line",
        "arc",
        "point_arc"
    ];
    self.style_cache = {
        stroke_width: 2,
        line_width: 2,
        alpha: 1,
        shadow_blur: 0,
        shadow_offsetX: 0,
        shadow_offsetY: 0,
        line_cap: "round",
        line_join: "round",
        stroke_color: "#000000",
        fill_color: "#000000",
        shadow_color: "#000000",
    };
    self.save_cache = undefined;
    self.save_name = "Default";
    self.mark_index = undefined;
    self.active = true;
    self.mark_style = {
        stroke_width: 2,
        line_width: 2,
        stroke_color: "#fffa68",
        fill_color: "#a60000",
        line_cap: "round",
        line_join: "round",
        alpha: 1,
    };
    self.commands = [
        {
            name: "Clear Canvas",
            handle: () => {self.canvas_cache = [];self.pointer = 0;resetArcCache();self.refresh_history();self.refresh_canvas()},
        },
        {
            name: "Save",
            handle: () => {self.save_file(self.save_name)},
        },
        {
            name: "Rename",
            handle: () => {self.rename_file(self.save_name,window.prompt("New Name"))},
        },
        {
            name: "Create Copy",
            handle: () => {self.create_copy(self.save_name)},
        },
        {
            name: "Create File",
            handle: () => {
                let name = window.prompt("File Name");
                if (name && self.save_cache.findIndex((elem) => {return elem === name})) {
                    self.create_file(name);
                }
            },
        },
        {
            name: "Delete",
            handle: () => {self.delete_file(self.save_name)},
        },
        {
            name: "Export Code",
            handle: () => {
                    removeAllTemp();
                    swal(JSON.stringify(self.canvas_cache));
                },
        },
        {
            name: "Import Code",
            handle: () => {
                swal({
                    input: 'textarea',
                    showCancelButton: true
                }).then(function (result) {
                    if (result) {
                        removeTempCache();
                        self.canvas_cache.splice(self.pointer, 0, ...JSON.parse(result));
                        self.pointer = self.canvas_cache.length;
                        self.refresh_canvas();
                        self.refresh_history();
                    }
                })
            },
        },
        {
            name: "Fill Screen",
            handle: () => {
                if (document.webkitFullscreenElement) {
                    document.webkitExitFullscreen();
                } else {
                    document.body.webkitRequestFullscreen();
                    document.body.style.backgroundColor = "#cfcfcf";
                }
            },
        },
    ];
    self.save_file = (name) => {
        localStorage.setItem("canvas-save-" + name,JSON.stringify({width:self.width, height: self.height, style_cache: self.style_cache, canvas_cache:self.canvas_cache}));
    };
    self.rename_file = (name,newname) => {
        if (newname) {
            self.save_name = newname;
            self.save_cache.push(newname);
            self.set_saves_cache();
            self.delete_file(name);
            self.save_file(newname);
            self.refresh_title();
            self.refresh_saves();
        }
    };
    self.create_copy = (name) => {
        let newname = name + "-copy";
        self.save_file(name);
        self.save_name = newname ;
        self.save_file(newname);
        self.save_cache.push(newname);
        self.set_saves_cache();
        self.refresh_title();
        self.refresh_saves();
    };
    self.delete_file = (name) => {
        if (name === "Default") {return}
        self.save_cache.splice(self.save_cache.findIndex((elem) => {return elem === name}),1);
        localStorage.removeItem("canvas-save-" + name);
        if (name === self.save_name) {
            self.open_file("Default");
        }
        self.refresh_saves();
    };
    self.open_file = (name) => {
        let file = localStorage.getItem("canvas-save-" + name);
        if (file) {
            file = JSON.parse(file);
            self.canvas_cache = file.canvas_cache;
            self.draw_canvas.width = self.show_canvas.width = self.width = file.width;
            self.draw_canvas.height = self.show_canvas.height = self.height = file.height;
            self.style_cache = file.style_cache;
        } else {
            self.canvas_cache = [];
        }
        self.save_name = name;
        self.save_file(self.save_name);
        self.pointer = self.canvas_cache.length;
        self.set_scale(1.0);
        self.refresh_tool_bar();
        self.refresh_Right();
        self.refresh_saves();
        self.refresh_canvas();
        self.refresh_history();
        self.refresh_title();
    };
    self.create_file = (name) => {
        self.save_cache.push(name);
        self.set_saves_cache();
        self.open_file(name);
    };
    self.refresh_title = () => {
        document.title = "CanvasJS: " + self.save_name;
    };
    self.addShape = (shape) => {
        self.canvas_cache.splice(self.pointer, 0, shape);
        self.pointer++;
        self.refresh_history();
        self.refresh_canvas();
    };
    self.removeShape = (index) => {
        self.canvas_cache.splice(index,1);
        if (self.pointer > index - 1 && !atStart()) {
            self.pointer--;
        }
        self.refresh_history();
        self.refresh_canvas();
    };
    self.refresh_history = () => {
        let str = `<div class="his-head">Points</div>`;
        for (let i = 0; i < self.canvas_cache.length; i++) {
            // if (!self.canvas_cache[i].temp) {
            str += `<div class="his-unit`+ (i === self.pointer ? ` pointer` : ``) +`" id="` + i + `">` + i + ` ` + self.canvas_cache[i].type + `</div>`;
            // }
        }
        str += `<div class="his-unit`+ (atEnd() ? ` pointer` : ``) +`" id="` + self.canvas_cache.length + `"></div>`;
        self.history_elem.innerHTML = str;
        // self.refresh_shapes_menu();
    };
    self.refresh_shapes_menu = () => {
        let shapes = getShapes();
        Right.clearUnits("shapes","Shapes");
        for (let shape of shapes) {
            Right.addHTML("shapes",`
            <div class="menu-unit-left">` + shape.startP + " ~ " + shape.endP + `</div>
            <div class="menu-unit-right" id="` + shape.startP + ":" + shape.endP + `">
                <div class="button" id=""
            </div>
        `,() => {
                let index = self.tool_cache.indexOf(self.type_selected) + 1;
                self.type_selected = self.tool_cache[index > (self.tool_cache.length - 1) ? 0 : index];
                self.refresh_Right();
                self.refresh_tool_bar();
            });
        }
    };
    self.refresh_saves = () => {
        let str = `<div class="his-head" id="__save">Save</div>`;
        for (let save of self.save_cache) {
            str += `<div class="his-unit`+ (save === self.save_name ? ` selected` : ``) +`" id="save:` + save + `">` + save + `</div>`;
        }
        self.saves_elem.innerHTML = str;
    };
    self.get_saves_cache = () => {
        let cache = localStorage.getItem("canvas-saves-cache");
        cache = cache ? JSON.parse(cache) : ["Default"];
        self.save_cache = cache;
    };
    self.set_saves_cache = () => {
        localStorage.setItem("canvas-saves-cache",JSON.stringify(self.save_cache));
    };
    self.init = (draw,show,bar1,his,sav,engine) => {
        self.draw_canvas = draw;
        self.show_canvas = show;
        self.tool_bar = bar1;
        self.history_elem = his;
        self.saves_elem = sav;
        self.context = draw.getContext("2d");
        self.scontext = show.getContext("2d");
        self.tcontext = bar1.getContext("2d");
        self.context.imageSmoothingEnabled = false;
        self.canvasjs = engine;
        self.set_canvas_size(self.width,self.height);
        self.set_scale(self.scale);
        self.refresh_tool_bar();
        self.refresh_canvas();
        self.bind_all();
        self.refresh_Right();
        self.refresh_history();
        self.get_saves_cache();
        self.set_saves_cache();
        self.refresh_saves();
        self.open_file("Default");
    };
    self.set_canvas_size = (width,height) => {
        self.draw_canvas.width = self.width = width;
        self.draw_canvas.height = self.height = height;
    };
    self.set_scale = (scale,delta) => {
        if (scale <= 0 || ((scale * self.width) > window.innerWidth * 0.4 && delta > 0) || scale * self.width < 20) return;
        self.scale = scale;
        self.show_canvas.style.width = self.draw_canvas.style.width = scale * self.width + "px";
        self.show_canvas.style.height = self.draw_canvas.style.height = scale * self.height + "px";
    };
    self.refresh_tool_bar = () => {
        self.tcontext.clearRect(0,0,self.tool_bar.width,self.tool_bar.height);
        CanvasJS.draw(self.tool_bar,[{
            type: "begin",
            x: 30, y: 70,
        },{
            type: "path",
            drawer: "line",
            x: 50, y: 30,
        },{
            type: "path",
            drawer: "line",
            x: 70, y: 70,
        },{
            type: "end",
            mode: "fill",
            style: {...self.style_cache}
        },{
            type: "begin",
            x: 30, y: 70,
        },{
            type: "path",
            drawer: "line",
            x: 50, y: 30,
        },{
            type: "path",
            drawer: "line",
            x: 70, y: 70,
        },{
            type: "path",
            drawer: "line",
            x: 30, y: 70,
        },{
            type: "end",
            mode: "stroke",
            style: {...self.style_cache}
        }],{x: 0, y: 0, scale: 1.0});
    };
    self.refresh_canvas = () => {
        self.clear_ctx();
        CanvasJS.draw(self.draw_canvas,self.canvas_cache,{x: 0, y: 0, scale: 1.0});
        CanvasJS.draw(self.show_canvas,self.canvas_cache,{x: 0, y: 0, scale: 1.0});
        // if (self.canvas_cache.length > 0 && self.canvas_cache[self.canvas_cache.length - 1].type !== "end") {
        //     addEnd(true);
        // }
        if (self.SIZE_RULER) {
            for (let x = 0; x <= self.width; x += self.sizeX) {
                for (let y = 0; y <= self.height; y += self.sizeY) {
                    drawDot(x,y,self.SIZE_RULER,self.COLOR_HELPER_BACK,self.context);
                }
            }
        }
        if (self.arc_cache.point1 && self.active) {
            markDot(self.arc_cache.point1.x,self.arc_cache.point1.y,self.context);
        }
        if (self.arc_cache.center && self.active) {
            markDot(self.arc_cache.center.x,self.arc_cache.center.y,self.context);
        }
        if (self.arc_cache.point2 && self.active) {
            markDot(self.arc_cache.point2.x,self.arc_cache.point2.y,self.context);
        }
        if (!hasEndAhead() && self.active) {
            if (self.pointer > 1 && self.canvas_cache[self.pointer - 2]) {
                markDot(self.canvas_cache[self.pointer - 2].x,self.canvas_cache[self.pointer - 2].y,self.context);
            }
            if (self.pointer > 2 && self.canvas_cache[self.pointer - 3]) {
                markDot(self.canvas_cache[self.pointer - 3].x,self.canvas_cache[self.pointer - 3].y,self.context);
            }
            if (self.pointer > 3 && self.canvas_cache[self.pointer - 4]) {
                markDot(self.canvas_cache[self.pointer - 4].x,self.canvas_cache[self.pointer - 4].y,self.context);
            }
        }
        if (self.mark_index !== undefined && self.mark_index !== "" && self.canvas_cache[self.mark_index]) {
            // if (self.canvas_cache[self.mark_index] !== "end") {
            //     CanvasJS.draw(self.draw_canvas, [{
            //         type: self.canvas_cache[self.mark_index].type,
            //         data: self.canvas_cache[self.mark_index].data,
            //         style: self.mark_style
            //     }], {x: 0, y: 0, scale: 1.0});
            // }
            drawDot(self.canvas_cache[self.mark_index].x,self.canvas_cache[self.mark_index].y,self.SIZE_HELPER * 2,self.mark_style.stroke_color,self.context);
            drawDot(self.canvas_cache[self.mark_index].x,self.canvas_cache[self.mark_index].y,self.SIZE_HELPER,self.mark_style.fill_color,self.context);
        }
    };
    self.bind_all = () => {
        document.addEventListener("keydown",KeyHandle);
        self.history_elem.addEventListener("mouseout",clear_mark);
        self.history_elem.addEventListener("mousemove",refresh_mark);
        self.history_elem.addEventListener("mousedown",pointer_set);
        self.saves_elem.addEventListener("mousedown",file_set);
        self.draw_canvas.addEventListener("mousemove",DrawerMoveHandle);
        self.draw_canvas.addEventListener("mousedown",DrawerHandle);
        self.draw_canvas.addEventListener("mouseout",DrawerOutHandle);
        self.draw_canvas.addEventListener("wheel",WheelHandle);
        self.tool_bar.addEventListener("mousedown",() => {window.setTimeout(Right.appear,0,108/*window.innerWidth / 2 + 50*/, 0)});
        self.tool_bar.addEventListener("mouseover",ShowPreview);
        self.tool_bar.addEventListener("mouseout",HidePreview);
        Right.elem.shapes.addEventListener("mouseover",MoveLeft);
        Right.elem.shapes.addEventListener("mouseout",MoveBack);
        Right.elem.groups.addEventListener("mouseover",MoveLeft);
        Right.elem.groups.addEventListener("mouseout",MoveBack);
    };
    self.change_style = (style,data) => {
        self.style_cache[style] = data;
        self.refresh_Right();
        self.refresh_tool_bar();
    };
    self.refresh_Right = () => {
        // language=HTML
        Right.clearUnits("styles","Styles");
        Right.clearUnits("units","Units");
        Right.addHTML("styles",`
            <div class="menu-unit-left">Type</div>
            <div class="menu-unit-right">` + self.type_selected + `</div>
        `,() => {
            let index = self.tool_cache.indexOf(self.type_selected) + 1;
            self.type_selected = self.tool_cache[index > (self.tool_cache.length - 1) ? 0 : index];
            self.refresh_Right();
            self.refresh_tool_bar();
        });
        Right.addHTML("styles",`
            <div class="menu-unit-left">Drawer</div>
            <div class="menu-unit-right">` + self.drawer_selected + `</div>
        `,() => {
            let index = self.drawer_cache.indexOf(self.drawer_selected) + 1;
            self.drawer_selected = self.drawer_cache[index > (self.drawer_cache.length - 1) ? 0 : index];
            resetArcCache();
            self.refresh_Right();
            self.refresh_tool_bar();
        });
        Right.addHTML("units",`
            <div class="menu-unit-left">Canvas Size X</div>
            <div class="menu-unit-right">` + self.width + `</div>
        `,() => {
            self.draw_canvas.width = self.show_canvas.width = self.width = Number.parseInt(window.prompt("Canvas Size X")) || self.width;
            self.set_scale(self.scale);
            self.refresh_Right();
            self.refresh_canvas();
        });
        Right.addHTML("units",`
            <div class="menu-unit-left">Canvas Size Y</div>
            <div class="menu-unit-right">` + self.height + `</div>
        `,() => {
            self.draw_canvas.height = self.show_canvas.height = self.height = Number.parseInt(window.prompt("Canvas Size Y")) || self.height;
            self.set_scale(self.scale);
            self.refresh_Right();
            self.refresh_canvas();
        });
        Right.addHTML("units",`
            <div class="menu-unit-left">Ruler Size X</div>
            <div class="menu-unit-right">` + self.sizeX + `</div>
        `,() => {
            self.sizeX = Number.parseFloat(window.prompt("Ruler Size X")) || self.sizeX;
            self.refresh_Right();
            self.refresh_canvas();
        });
        Right.addHTML("units",`
            <div class="menu-unit-left">Ruler Size Y</div>
            <div class="menu-unit-right">` + self.sizeY + `</div>
        `,() => {
            self.sizeY = Number.parseFloat(window.prompt("Ruler Size Y")) || self.sizeY;
            self.refresh_Right();
            self.refresh_canvas();
        });
        Right.addHTML("units",`
            <div class="menu-unit-left">Ruler Point Size</div>
            <div class="menu-unit-right">` + self.SIZE_RULER + `</div>
        `,() => {
            self.SIZE_RULER = Number.parseFloat(window.prompt("Ruler Point Size"));
            self.refresh_Right();
            self.refresh_canvas();
        });
        Right.addHTML("units",`
            <div class="menu-unit-left">Mouse Point Size</div>
            <div class="menu-unit-right">` + self.SIZE_HELPER + `</div>
        `,() => {
            self.SIZE_HELPER = Number.parseFloat(window.prompt("Mouse Point Size")) || self.SIZE_HELPER;
            self.refresh_Right();
            self.refresh_canvas();
        });
        // Right.addHTML("styles",`
        //     <div class="menu-unit-left">Stroke Width</div>
        //     <div class="menu-unit-right">` + self.style_cache.stroke_width + `</div>
        // `,() => {
        //     self.change_style("stroke_width",Number.parseFloat(window.prompt("Stroke Width")));
        // });
        Right.addHTML("styles",`
            <div class="menu-unit-left">Line Width</div>
            <div class="menu-unit-right">` + self.style_cache.line_width + `</div>
        `,() => {
            self.change_style("line_width",Number.parseFloat(window.prompt("Line Width")));
        });
        Right.addHTML("styles",`
            <div class="menu-unit-left">Shadow Blur</div>
            <div class="menu-unit-right">` + self.style_cache.shadow_blur + `</div>
        `,() => {
            self.change_style("shadow_blur",Number.parseFloat(window.prompt("Shadow Blur")));
        });
        Right.addHTML("styles",`
            <div class="menu-unit-left">Shadow Offset X</div>
            <div class="menu-unit-right">` + self.style_cache.shadow_offsetX + `</div>
        `,() => {
            self.change_style("shadow_offsetX",Number.parseFloat(window.prompt("Shadow Offset X")));
        });
        Right.addHTML("styles",`
            <div class="menu-unit-left">Shadow Offset Y</div>
            <div class="menu-unit-right">` + self.style_cache.shadow_offsetY + `</div>
        `,() => {
            self.change_style("shadow_offsetY",Number.parseFloat(window.prompt("Shadow Offset Y")));
        });
        Right.addHTML("styles",`
            <div class="menu-unit-left">Alpha</div>
            <div class="menu-unit-right">` + self.style_cache.alpha + `</div>
        `,() => {
            self.change_style("alpha",Number.parseFloat(window.prompt("Alpha")));
        });
        Right.addHTML("styles",`
            <div class="menu-unit-left">Line Cap</div>
            <div class="menu-unit-right">` + self.style_cache.line_cap + `</div>
        `,() => {
            self.change_style("line_cap",window.prompt("Line Cap"));
        });
        Right.addHTML("styles",`
            <div class="menu-unit-left">Line Join</div>
            <div class="menu-unit-right">` + self.style_cache.line_join + `</div>
        `,() => {
            self.change_style("line_join",window.prompt("Line Join"));
        });
        Right.addHTML("styles",`
            <div class="menu-unit-left">Stroke Color</div>
            <div class="menu-unit-right">` + self.style_cache.stroke_color + `</div>
        `,() => {
            // self.change_style("stroke_color",window.prompt("Stroke Color"));
            swal({
                title: 'Choose a color',
                html:`<input type="color" id="color" value="` + self.style_cache.stroke_color +`" />`,
                showCancelButton: true,
            }).then(() => {
                self.change_style("stroke_color",document.getElementById("color").value);
            });
        });
        Right.addHTML("styles",`
            <div class="menu-unit-left">Fill Color</div>
            <div class="menu-unit-right">` + self.style_cache.fill_color + `</div>
        `,() => {
            // self.change_style("fill_color",window.prompt("Fill Color"));
            swal({
                title: 'Choose a color',
                html:`<input type="color" id="color" value="` + self.style_cache.fill_color +`" />`,
                showCancelButton: true,
            }).then(() => {
                self.change_style("fill_color",document.getElementById("color").value);
            });
        });
        Right.addHTML("styles",`
            <div class="menu-unit-left">Shadow Color</div>
            <div class="menu-unit-right">` + self.style_cache.shadow_color + `</div>
        `,() => {
            // self.change_style("fill_color",window.prompt("Fill Color"));
            swal({
                title: 'Choose a color',
                html:`<input type="color" id="color" value="` + self.style_cache.shadow_color +`" />`,
                showCancelButton: true,
            }).then(() => {
                self.change_style("shadow_color",document.getElementById("color").value);
            });
        });
        for (let comm of self.commands) {
            Right.addHTML("units",`<div class="menu-unit-left">` + comm.name + `</div>`,comm.handle);
        }
    };
    self.clear_ctx = () => {
        self.context.clearRect(0,0,self.width,self.height);
        self.scontext.clearRect(0,0,self.width,self.height);
    };
    let getShapes = () => {
        // TODO Fun getShapes()
    };
    let ShowPreview = () => {
        self.draw_canvas.style.left = "28%";
        self.show_canvas.style.left = "72%";
    };
    let HidePreview = () => {
        self.draw_canvas.style.left = "50%";
        self.show_canvas.style.left = "50%";
    };
    let MoveLeft = () => {
        self.draw_canvas.style.left = "28%";
        self.show_canvas.style.left = "28%";
    };
    let MoveBack = () => {
        self.draw_canvas.style.left = "50%";
        self.show_canvas.style.left = "50%";
    };
    let getHelp = (i,h) => {
        return (0|(i / h) + 0.5) * h;
    };
    let clear_mark = () => {
        self.mark_index = undefined;
    };
    let refresh_mark = (e) => {
        self.mark_index = e.target.id;
        self.refresh_canvas();
    };
    let pointer_set = (e) => {
        if (!isNaN(Number.parseInt(e.target.id))) {
            self.pointer = Number.parseInt(e.target.id);
            removeAllTemp();
            self.refresh_history();
        }
    };
    let file_set = (e) => {
        if (e.target.id) {
            if (e.target.id === "__save") {
                self.save_file(self.save_name);
            } else {
                self.open_file(e.target.id.split(":")[1]);
            }
        }
    };
    let getHelpedXYByE = (e) => {
        return {
            x: getHelp(e.offsetX / self.scale,self.sizeX),
            y: getHelp(e.offsetY / self.scale,self.sizeY)
        };
    };
    let markDot = (x,y,ctx) => {
        drawDot(x,y,self.SIZE_HELPER * 2,self.mark_style.stroke_color,ctx);
        drawDot(x,y,self.SIZE_HELPER,self.mark_style.fill_color,ctx);
    };
    let drawDot = (x,y,size,color,ctx) => {
        ctx.globalAlpha = 1;
        ctx.fillStyle = color;
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillRect(x - size/2, y - size/2, size, size);
    };
    let KeyHandle = (e) => {
        switch (e.key) {
            case "Backspace":
                resetArcCache();
                if (!atStart()) {
                    self.removeShape(self.pointer - 1);
                }
                break;
            case "s":
                self.save_file(self.save_name);
                break;
            default:
                break;
        }
    };
    let WheelHandle = (e) => {
        if (e.shiftKey) {
            self.set_scale(self.scale + e.deltaY / 1000,e.deltaY);
        }
    };
    let DrawerOutHandle = () => {
        self.active = false;
        removeTempCache();
        // removeAllTemp();
        if (!hasEndAhead() && !hasEndBack() && hasPathAhead()) {
            addEnd(true);
        }
    };
    let DrawerMoveHandle = (e) => {
        self.active = true;
        switch (self.drawer_selected) {
            case "line":
                pathController(e,true);
                break;
            case "arc":
                arcController(e,true);
                break;
            case "point_arc":
                pointArcController(e,true);
                break;
            default:
                break;
        }
        if (!atStart() && !hasEndAhead() && !hasEndBack()) {
            addEnd(true);
        }
        self.refresh_canvas();
        let pos = getHelpedXYByE(e);
        drawDot(pos.x,pos.y,self.SIZE_HELPER,self.COLOR_HELPER,self.context);
    };
    let DrawerHandle = (e) => {
        switch (self.drawer_selected) {
            case "line":
                pathController(e,false);
                break;
            case "arc":
                arcController(e,false);
                break;
            case "point_arc":
                pointArcController(e,false);
                break;
            default:
                break;
        }
        if (!atStart() && !hasEndAhead() && !hasEndBack()) {
            addEnd(true);
        }
    };
    let pathController = (e,isTemp) => {
        let pos = getHelpedXYByE(e);
        let x = pos.x;
        let y = pos.y;
        removeTempCache();
        if (isTemp) {
            if (!atStart() && !hasEndAhead()) {
                addCache(x,y,true);
            }
        } else {
            switch (e.button) {
                case 0:
                    if (atStart() || hasEndAhead()){
                        addBegin(x,y,false);
                    } else {
                        addCache(x,y,false);
                    }
                    break;
                case 2:
                    if (!atStart() && !hasEndAhead() && !hasEndBack()) {
                        addEnd(false);
                    }
                    break;
                default:
                    break;
            }
        }
    };
    let arcController = (e,isTemp) => {
        let pos = getHelpedXYByE(e);
        let x = pos.x;
        let y = pos.y;
        removeTempCache();
        if (isTemp) {
            if (!self.arc_cache.point1 && hasPathAhead() || hasBeginAhead()) {
                if (getPointAhead().drawer === "arc") {
                    self.arc_cache.point1 = {x: getPointAhead().x + getPointAhead().r * Math.cos(getPointAhead().a2), y: getPointAhead().y + getPointAhead().r * Math.sin(getPointAhead().a2)};
                } else {
                    self.arc_cache.point1 = {x: getPointAhead().x, y: getPointAhead().y};
                }
            }
            if (self.arc_cache.center) {
                if (atStart() || hasEndAhead()) {
                    addBegin(self.arc_cache.point1.x,self.arc_cache.point1.y,true);
                }
                addArcByPoints(self.arc_cache.point1,self.arc_cache.center,{x: x, y: y},e.shiftKey,true);
            }
        } else {
            switch (e.button) {
                case 0:
                    if (self.arc_cache.point1) {
                        if (self.arc_cache.center) {
                            if (atStart() || hasEndAhead()) {
                                addBegin(self.arc_cache.point1.x,self.arc_cache.point1.y,false);
                            }
                            addArcByPoints(self.arc_cache.point1,self.arc_cache.center,{x: x, y: y},e.shiftKey,false);
                            resetArcCache();
                        } else {
                            self.arc_cache.center = {x: x, y: y};
                        }
                    } else {
                        if (hasPathAhead() || hasBeginAhead()) {
                            if (getPointAhead().drawer === "arc") {
                                self.arc_cache.point1 = {x: getPointAhead().x + getPointAhead().r * Math.cos(getPointAhead().a2), y: getPointAhead().y + getPointAhead().r * Math.sin(getPointAhead().a2)};
                            } else {
                                self.arc_cache.point1 = {x: getPointAhead().x, y: getPointAhead().y};
                            }
                            self.arc_cache.center = {x: x, y: y};
                        } else {
                            self.arc_cache.point1 = {x: x, y: y};
                        }
                    }
                    break;
                case 2:
                    if (!atStart() && !hasEndAhead() && !hasEndBack()) {
                        addEnd(false);
                    }
                    break;
                default:
                    break;
            }
        }
    };
    let pointArcController = (e,isTemp) => {
        let pos = getHelpedXYByE(e);
        let x = pos.x;
        let y = pos.y;
        removeTempCache();
        if (isTemp) {
            if (!self.arc_cache.point1 && hasPathAhead() || hasBeginAhead()) {
                if (getPointAhead().drawer === "arc") {
                    self.arc_cache.point1 = {x: getPointAhead().x + getPointAhead().r * Math.cos(getPointAhead().a2), y: getPointAhead().y + getPointAhead().r * Math.sin(getPointAhead().a2)};
                } else {
                    self.arc_cache.point1 = {x: getPointAhead().x, y: getPointAhead().y};
                }
            }
            if (self.arc_cache.point2) {
                if (atStart() || hasEndAhead()) {
                    addBegin(self.arc_cache.point1.x,self.arc_cache.point1.y,true);
                }
                addArcByPoints2(self.arc_cache.point1,self.arc_cache.point2,{x: x, y: y},e.shiftKey,true);
            }
        } else {
            switch (e.button) {
                case 0:
                    if (self.arc_cache.point1) {
                        if (self.arc_cache.point2) {
                            if (atStart() || hasEndAhead()) {
                                addBegin(self.arc_cache.point1.x,self.arc_cache.point1.y,false);
                            }
                            addArcByPoints2(self.arc_cache.point1,self.arc_cache.point2,{x: x, y: y},e.shiftKey,false);
                            resetArcCache();
                        } else {
                            self.arc_cache.point2 = {x: x, y: y};
                        }
                    } else {
                        if (hasPathAhead() || hasBeginAhead()) {
                            if (getPointAhead().drawer === "arc") {
                                self.arc_cache.point1 = {x: getPointAhead().x + getPointAhead().r * Math.cos(getPointAhead().a2), y: getPointAhead().y + getPointAhead().r * Math.sin(getPointAhead().a2)};
                            } else {
                                self.arc_cache.point1 = {x: getPointAhead().x, y: getPointAhead().y};
                            }
                            self.arc_cache.point2 = {x: x, y: y};
                        } else {
                            self.arc_cache.point1 = {x: x, y: y};
                        }
                    }
                    break;
                case 2:
                    if (!atStart() && !hasEndAhead() && !hasEndBack()) {
                        addEnd(false);
                    }
                    break;
                default:
                    break;
            }
        }
    };
    let atStart = (n = 0) => {
        return self.pointer + n === 0;
    };
    let atEnd = (n = 0) => {
        return self.pointer + n === self.canvas_cache.length;
    };
    let hasEndAhead = (n = 0) => {
        return self.pointer > 0 && self.canvas_cache[self.pointer - 1 - n].type === "end" && (self.canvas_cache[self.pointer - 1 - n].temp ? hasEndAhead(n + 1) : true);
    };
    let hasPathAhead = (n = 0) => {
        return self.pointer > 0 && self.canvas_cache[self.pointer - 1 - n].type === "path" && (self.canvas_cache[self.pointer - 1 - n].temp ? hasPathAhead(n + 1) : true);
    };
    let hasBeginAhead = (n = 0) => {
        return self.pointer > 0 && self.canvas_cache[self.pointer - 1 - n].type === "begin" && (self.canvas_cache[self.pointer - 1 - n].temp ? hasBeginAhead(n + 1) : true);
    };
    let getPointAhead = () => {
        return self.canvas_cache[self.pointer - 1];
    };
    let hasEndBack = () => {
        return self.pointer < self.canvas_cache.length && self.canvas_cache[self.pointer].type === "end";
    };
    let resetArcCache = () => {
        self.arc_cache.center = undefined;
        self.arc_cache.point2 = undefined;
        self.arc_cache.point1 = undefined;
    };
    let removeAllTemp = () => {
        for (let i = 0; i < self.canvas_cache.length;) {
            if (self.canvas_cache[i].temp) {
                self.removeShape(i);
            } else {
                i++;
            }
        }
    };
    let removeTempCache = (n = self.pointer) => {
        if (n > 0 && self.canvas_cache[n - 1].temp) {
            self.removeShape(n - 1);
            removeTempCache();
        }
    };
    let addBegin = (x,y,isTemp) => {
        removeTempCache();
        let obj = {
            type: "begin",
            x: x,
            y: y,
        };
        if (isTemp) {
            obj.temp = true;
        }
        self.addShape(obj);
    };
    let addArcByPoints = (p1,center,p2,isClock,isTemp) => {
        addArc(center.x,center.y,getDistance(p1,center),Math.atan2(p1.y - center.y, p1.x - center.x),Math.atan2(p2.y - center.y, p2.x - center.x),isClock,isTemp);
    };
    let addArcByPoints2 = (p1,p2,center,isClock,isTemp) => {
        if (Math.abs(p1.y - p2.y) > Math.abs(p1.x - p2.x)) {
            center.y = (p1.y + p2.y) / 2 - (p1.x - p2.x) * (2 * center.x - p1.x - p2.x) / (p1.y - p2.y) / 2;
        } else {
            center.x = (p1.x + p2.x) / 2 - (p1.y - p2.y) * (2 * center.y - p1.y - p2.y) / (p1.x - p2.x) / 2;
        }
        addArc(center.x,center.y,getDistance(p1,center),Math.atan2(p1.y - center.y, p1.x - center.x),Math.atan2(p2.y - center.y, p2.x - center.x),isClock,isTemp);
    };
    let getDistance = (p1,p2) => {
        return Math.sqrt(Math.pow(p1.x - p2.x,2) + Math.pow(p1.y - p2.y,2));
    };
    let addArc = (x,y,r,a1,a2,isClock,isTemp) => {
        if (!isTemp) {
            removeTempCache();
        }
        let obj = {
            type: "path",
            drawer: "arc",
            x: x,
            y: y,
            r: r,
            a1: a1,
            a2: (0|(a2 * 100) + 0.5) === (0|(a1 * 100) + 0.5)  ? a2 + 2 * Math.PI : a2,
            clock: !isClock,
        };
        if (isTemp) {
            obj.temp = true;
        }
        self.addShape(obj);
    };
    let addCache = (x,y,isTemp) => {
        if (!isTemp) {
            removeTempCache();
        }
        let obj = {
            type: "path",
            drawer: "line",
            x: x,
            y: y,
        };
        if (isTemp) {
            obj.temp = true;
        }
        self.addShape(obj);
    };
    let addEnd = (isTemp) => {
        if (!isTemp) {
            removeTempCache();
        }
        let obj = {
            type: "end",
            style: {...self.style_cache}
        };
        if (isTemp) {
            obj.temp = true;
        }
        switch (self.type_selected) {
            case "fill_path":
                obj.mode = "fill";
                break;
            case "stroke_path":
                obj.mode = "stroke";
                break;
            default:
                break;
        }
        self.addShape(obj);
    }
})(window.Drawer);