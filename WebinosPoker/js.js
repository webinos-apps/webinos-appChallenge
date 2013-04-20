// Prefixes like com_, gui_, pok_ indicate function calls amongst different javascript files.
// Js code is separated into poker game, graphics, communication files for better viewing/debugging.

var winW = 630, winH = 460;
if (document.body && document.body.offsetWidth) {
 winW = document.body.offsetWidth;
 winH = document.body.offsetHeight;
}
if (document.compatMode=='CSS1Compat' &&
    document.documentElement &&
    document.documentElement.offsetWidth ) {
 winW = document.documentElement.offsetWidth;
 winH = document.documentElement.offsetHeight;
}
if (window.innerWidth && window.innerHeight) {
 winW = window.innerWidth;
 winH = window.innerHeight;
}

// console.log('Window width = '+winW);
// console.log('Window height = '+winH); 

cardW = Math.floor(winW / 5.15);
//cardW = Math.floor(winW / 12);