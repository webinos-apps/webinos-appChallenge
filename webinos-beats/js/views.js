var BarsView = function (bars, currentBar, channel) {
    this.bars = bars;
    this.currentBar = currentBar;
    this.channel = channel;
    return this;
};
BarsView.prototype.render = function () {
    var html = "";
    for (i in this.bars) {
        var active = (this.bars[i] ? "active " : "");
        var current = ((i == this.currentBar) ? "current " : "");
        var marker = (i % 4 != 0) ? "marker " : "";
        html += "<div class='bar " + active + current + marker +
            "' + data-channel='" + this.channel +
            "' + data-pos='" + i + "'>" +
            "</div>";
    }
    return html;
};

var ChannelView = function (channel, name, currentBar) {
    this.channel = channel;
    this.name = name;
    this.currentBar = currentBar;
    return this;
};
ChannelView.prototype.render = function () {
    return "" +
        "<div class='channel'>" +
        "<div class='name'>" + this.name + "</div>" +
        "<div class='bars'>" + new BarsView(this.channel.bars, this.currentBar, this.name).render() + "</div>" +
        "</div>" +
        "</div>";
};

var SongView = function(song) {
    this.song = song;
    return this;
}
SongView.prototype.render = function() {
    var html = "";
    for (i in this.song.channels) {
        html += new ChannelView(this.song.channels[i], i, this.song.currentBar).render();
    }
    return html;
}


