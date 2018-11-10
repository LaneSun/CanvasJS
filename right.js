// window.Right = {};
//
// (function (self) {
//     self.element = undefined;
//     self.menu_elem = undefined;
//     self.init = (elem) => {
//         document.oncontextmenu = () => {return false;};
//         self.element = elem;
//         self.menu_elem = document.createElement("div");
//         self.menu_elem.classList.add("right-menu");
//         self.menu_elem.hidden = true;
//         elem.appendChild(self.menu_elem);
//         // self.bind_all();
//     };
//     self.clearUnits = () => {
//         self.menu_elem.innerHTML = "";
//     };
//     self.addHTML = (html,handle) => {
//         let elem = document.createElement("div");
//         elem.classList.add("right-unit");
//         elem.innerHTML = html;
//         elem.addEventListener("mousedown",handle);
//         self.menu_elem.appendChild(elem);
//     };
//     self.hide = () => {
//         self.menu_elem.hidden = true;
//     };
//     self.appear = (x, y) => {
//         if (self.menu_elem.hidden) {
//             self.menu_elem.style.left = x + "px";
//             self.menu_elem.style.top = y + "px";
//             self.menu_elem.hidden = false;
//         } else {
//             self.hide();
//         }
//     };
//     self.bind_all = () => {
//         document.addEventListener("mousedown",Mouse_Handle);
//     };
//     let Mouse_Handle = (e) => {
//         switch (e.button) {
//             case 0:
//                 self.hide();
//                 break;
//             case 2:
//                 self.appear(e.clientX,e.clientY);
//                 break;
//             default:
//                 break;
//         }
//     };
// })(window.Right);
window.Right = {};

(function (self) {
    self.elem = undefined;
    self.init = (data) => {
        document.oncontextmenu = () => {return false;};
        self.elem = data;
        // self.bind_all();
    };
    self.clearUnits = (id, name) => {
        self.elem[id].innerHTML = "<div class=\"his-head\">" + name + "</div>";
    };
    self.addHTML = (id, html, handle) => {
        let elem = document.createElement("div");
        elem.classList.add("his-unit");
        elem.innerHTML = html;
        elem.addEventListener("mousedown",handle);
        self.elem[id].appendChild(elem);
    };
})(window.Right);