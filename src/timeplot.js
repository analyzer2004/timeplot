// https://github.com/analyzer2004/Timeplot
// Copyright 2021 Eric Lo
class Timeplot {
    constructor(container) {
        this._container = container;

        // Groups
        this._g = null;
        this._og = null;

        // Visual elements and selections
        this._dots = null;
        this._bars = null;
        this._textBox = null;
        this._charBox = null;
        this._infoBox = null;
        this._legendBox = null;
        this._levelLine = null;
        this._hbar = null;

        // Base variables and constants        
        this._width = 0;
        this._height = 0;
        this._margin = { left: 25, top: 25, right: 60, bottom: 25 };
        this._legendHeight = 0;
        this._dotRadius = 0;
        this._dotDiameter = 0;

        // Scales
        this._x = null;
        this._y = null;
        this._cp = null;
        this._cn = null;

        // Data
        this._data = null;
        this._chartData = null;
        this._values = null;
        this._keys = null;
        this._min = 0;
        this._max = 0;
        this._level = 0;
        this._defaultLevel = 0;

        // Options
        this._options = {
            posPalette: d3.interpolateReds,
            negPalette: d3.interpolateBlues,            
            level: "zero",
            clickAction: "highlight",
            fontFamily: "sans-serif",
            fontSize: "10px",
            fadeOpacity: 0.4
        };

        this._xtick = {
            name: "",
            isDate: false,
            format: "%Y-%m-%d",
            interval: "auto",            
            extractor: null,
            color: "black"
        };

        this._ytick = {            
            interval: "auto",
            formatter: null,
            color: "black"
        };

        this._tooltip = {
            color: "black",
            boxColor: "white",
            boxOpacity: 0.8,
            formatter: null
        };

        this._legend = {
            formatter: null,
            color: "black"
        };

        this._average = {    
            enabled: true,
            average: "white"
        };            

        this._slider = {
            enabled: true,
            formatter: null,
            color: "white"
        };

        this._highlighter = {
            enabled: false,
            color: "#eee"
        };

        this._focusedKey = null;
        this._focusedRange = null;
        this._uniqueId = new String(Date.now() * Math.random()).replace(".", "");

        // events
        this._onhover = null;
        this._onclick = null;
        this._oncancel = null;
    }

    size(_) {
        return arguments.length ? (this._width = _[0], this._height = _[1], this) : [this._width, this._height];
    }

    margin(_) {
        return arguments.length ? (this._margin = Object.assign(this._margin, _), this) : this._margin;
    }

    options(_) {
        return arguments.length ? (this._options = Object.assign(this._options, _), this) : this._options;
    }

    xtick(_) {
        return arguments.length ? (this._xtick = Object.assign(this._xtick, _), this) : this._xtick;
    }

    ytick(_) {
        return arguments.length ? (this._ytick = Object.assign(this._ytick, _), this) : this._ytick;
    }

    legend(_) {
        return arguments.length ? (this._legend = Object.assign(this._legend, _), this) : this._legend;
    }

    average(_) {
        return arguments.length ? (this._average = Object.assign(this._average, _), this) : this._average;
    }

    tooltip(_) {
        return arguments.length ? (this._tooltip = Object.assign(this._tooltip, _), this) : this._tooltip;
    }

    slider(_) {
        return arguments.length ? (this._slider = Object.assign(this._slider, _), this) : this._slider;
    }

    highlighter(_) {
        return arguments.length ? (this._highlighter = Object.assign(this._highlighter, _), this) : this._highlighter;
    }

    data(_) {
        return arguments.length ? (this._data = _, this) : this._data;
    }

    onhover(_) {
        return arguments.length ? (this._onhover = _, this) : this._onhover;
    }

    onclick(_) {
        return arguments.length ? (this._onclick = _, this) : this._onclick;
    }

    oncancel(_) {
        return arguments.length ? (this._oncancel = _, this) : this._oncancel;
    }

    render() {
        this._init();
        this._process();
        this._calcConstants();
        this._initScales();
        this._render();
        return this;
    }

    _init() {
        const options = this._options;

        this._textBox = this._container
            .append("text")
            .attr("font-family", options.fontFamily)
            .attr("font-size", options.fontSize)
            .style("visibility", "hidden");
        
        this._getCharBox();        
    }

    _process() {
        const xtick = this._xtick;

        this._processKeys();
        this._values = [];
        this._chartData = this._data
            .map((d, i) => {
                let total = 0;
                const tick = xtick.isDate ? d3.timeParse(xtick.format)(d[xtick.name]) : d[xtick.name];
                const values = this._keys.map((key, index) => {
                    let value = +d[key] || 0;                    
                    total += value;
                    this._values.push(value);
                    return { index, tick, tickIndex: i, key, value }
                });
                return { index: i, tick, values, avg: total / values.length };
            });
    }

    _processKeys() {
        const keys = Object.keys(this._data[0]);

        if (this._xtick.name === "") {
            this._xtick.name = keys[0];
            this._keys = keys.slice(1);
        }
        else {
            const index = keys.indexOf(this._xtick.name);
            if (index > -1) {
                keys.splice(index, 1);
                this._keys = keys;
            }
            else throw "Invalid tick field.";
        }
    }

    _calcConstants() {
        this._dotRadius = (this._width - this._margin.left - this._margin.right) / this._chartData.length / 2;
        this._dotDiameter = this._dotRadius * 2;

        this._legendHeight = this._charBox.height * 2;
        this._margin.top += this._legendHeight;

        this._margin.left += this._slider.enabled ? 20 : 0; // slider + value text height
    }

    _initScales() {
        this._x = d3.scalePoint()
            .domain(this._seq(0, this._chartData.length))
            .range([this._margin.left, this._width - this._margin.right]);

        const ext = d3.extent(this._values);
        this._min = ext[0];
        this._max = ext[1];
        if (this._options.level === "average") {
            this._level = this._defaultLevel = this._values.reduce((a, b) => a + b, 0) / this._values.length;
            if (isNaN(this._level)) this._level = this._defaultLevel = 0;
        }

        // Calculate decimal precision for y scale
        let p = 0;
        if (this._max % 1 !== 0) {
            const
                s = this._max.toString().split(".")[1],
                diff = s.length - (+s).toString().length;
            p = diff == 0 ? 1 : diff + 2;
        }

        const
            min = nice(ext[0].toFixed(p)),
            max = nice(ext[1].toFixed(p));
        
        this._y = d3
            .scaleLinear()
            .domain([min, max])
            .range([this._height - this._margin.bottom, this._margin.top]);

        this._cp = d3.scaleSequential(this._options.posPalette).domain([this._level, this._max]);
        this._cn = d3.scaleSequential(this._options.negPalette).domain([this._level, this._min]);

        function nice(n) {
            if (n % 1 !== 0) {
                const
                    s = n.toString(),
                    ld = +s.slice(s.length - 1),
                    g = (ld < 5 ? 5 : 10) - ld;

                const
                    dIndex = s.indexOf("."),
                    dLen = s.length - dIndex - 1,
                    f = Math.pow(10, dLen);

                return (Math.abs(n) * f + g) / f * (n < 0 ? -1 : 1);
            }
            else return n;
        }
    }

    _render() {
        this._g = this._container
            .append("g")
            .attr("font-family", this._options.fontFamily)
            .attr("font-size", this._options.fontSize);

        this._container
            .on("click.eric.dotplot." + this._uniqueId, () => {
                if (this._options.clickAction === "none") return;
                this._focusedKey = this._focusedRange = null;
                this._cancel();
                this._cancelRange();
            });

        this._renderXAxis();
        this._renderYAxis();
        this._renderGroups();
        this._renderDots();
        this._renderLegend();
        if (this._slider.enabled) this._renderSlider();
    }

    _renderGroups() {
        const
            that = this,
            highlighter = this._highlighter;
        
        if (highlighter.enabled)
            this._g.on("mouseleave", () => { if (!this._focusedKey) this._hbar.attr("opacity", 0); });

        this._og = this._g
            .selectAll(".og")
            .data(this._chartData)
            .join("g")
            .attr("class", "og")
            .attr("transform", (d, i) => `translate(${this._x(i)},0)`)
            .on("mouseenter", function (e, d) {
                if (!that._focusedKey && !that._focusedRange) {
                    that._dots.attr("opacity", c => c.tickIndex === d.index ? 1 : that._options.fadeOpacity);
                    if (that._average.enabled) that._bars.attr("opacity", that._options.fadeOpacity);
                    if (highlighter.enabled) {
                        const i = that._og.nodes().indexOf(this);
                        that._hbar.attr("opacity", (_, j) => i === j ? 1 : 0);
                    }
                }
            })
            .on("mouseleave", () => {
                if (!this._focusedKey && !this._focusedRange) {
                    this._dots.attr("opacity", 1);
                    if (this._average.enabled) this._bars.attr("opacity", 1);
                }
            })
            .on("click", function (e, d) {
                if (highlighter.enabled) {
                    const i = that._og.nodes().indexOf(this);
                    that._hbar.attr("opacity", (_, j) => i === j ? 1 : 0);
                }
            });

        /*
        const
            yr = this._y.range(),
            yh = yr[0] - yr[1],
            s = this._dotDiameter * 2;

        let
            t = this._y(this._max) - s,
            h = this._y(this._min) - t + s;

        if (t < yr[1]) t = yr[1];
        if (h > yh) h = yh;
        */

        const yr = this._y.range();
        this._hbar = this._og
            .append("rect")
            .attr("opacity", 0)
            //.attr("y", t)
            .attr("y", yr[1])
            .attr("rx", 4).attr("ry", 4)
            .attr("width", this._dotDiameter)
            //.attr("height", h)
            .attr("height", yr[0] - yr[1])
            .attr("fill", highlighter.color);
    }

    _renderDots() {
        const
            that = this,
            hr = this._dotRadius / 2,
            qr = this._dotRadius / 4;

        this._dots = this._og
            .selectAll(".dot")
            .data(d => d.values)
            .join("g")
            .attr("class", "dot")
            .on("mouseenter", (e, d) => {
                if (!this._focusedKey && !this._focusedRange) this._highlight(d);
                this._showTooltip(e, d);
                if (this._onhover) this._onhover(d);
            })
            .on("mouseleave", () => {
                if (!this._focusedKey && !this._focusedRange) this._cancel();
                this._hideTooltip();
            })
            .on("click", function (e, d) {
                if (that._options.clickAction === "none") return;

                if (that._focusedKey === d) {
                    that._focusedKey = null;
                    that._cancel();
                    if (that._oncancel) that._oncancel(d);
                }
                else {
                    that._focusedKey = d;
                    that._cancel();
                    that._highlight(d);
                    if (that._onclick) that._onclick(d);
                }

                // Move highlighter
                if (that._highlighter.enabled) {
                    const i = that._og.nodes().indexOf(e.currentTarget.parentElement);
                    that._hbar.attr("opacity", (_, j) => i === j ? 1 : 0);
                }

                e.stopPropagation();
            });

        this._dots
            .append("circle")
            .attr("class", "data")
            .attr("cx", this._dotRadius)
            .attr("cy", d => this._y(d.value))
            .attr("r", this._dotRadius)
            .attr("stroke-width", 3)
            .attr("fill", d => d.value >= this._level ? this._cp(d.value) : this._cn(d.value))

        if (this._average.enabled) {
            this._bars = this._og
                .selectAll(".avg")
                .data(d => [d.avg])
                .join("rect")
                .attr("class", "avg")
                .attr("x", -qr)
                .attr("y", d => this._y(d))
                .attr("width", this._dotRadius * 2 + hr)
                .attr("height", hr)
                .attr("fill", this._average.color);
        }
    }

    _highlight(d) {
        const hr = this._dotRadius / 2;
        this._dots.attr("opacity", c => c.tickIndex === d.tickIndex || c.index === d.index ? 1 : this._options.fadeOpacity);
        const fd = this._dots
            .filter(c => c.index === d.index)
            .append("circle")
            .attr("class", "highlight")
            .attr("cx", this._dotRadius)
            .attr("cy", d => this._y(d.value))
            .attr("r", 0)
            .attr("fill", "black")
            .attr("stroke-width", 0.5)
            .attr("stroke", "white");

        if (this._options.fadeOpacity === 1)
            fd.attr("r", hr);
        else
            fd.transition().duration(500).attr("r", hr);
    }

    _cancel() {
        this._dots.selectAll(".highlight").remove();
    }

    _showTooltip(e, d) {
        const info = [
            this._xtick.isDate ? this._dateToString(d.tick) : d.tick,
            d.key,            
            this._tooltip.formatter ? this._tooltip.formatter(d.value) : d.value
        ];

        var max = 0;
        info.forEach(s => {
            const l = this._calcTextLength(s);
            if (l > max) max = l;
        })

        if (!this._infoBox)
            this._infoBox = this._g
                .append("g")
                .attr("fill", this._tooltip.color)
                .call(g => g.append("rect")
                    .attr("class", "ibbg")
                    .attr("opacity", this._tooltip.boxOpacity)
                    .attr("stroke", "#aaa")
                    .attr("stroke-width", 0.5)
                    .attr("rx", 4).attr("ry", 4)
                    .attr("x", -5).attr("y", -5)
                    .attr("fill", this._tooltip.boxColor));

        const spacing = 1.1;
        this._infoBox
            .style("visibility", "visible")
            .select(".ibbg")
            .attr("width", max + 15).attr("height", spacing * this._charBox.height * info.length + 5);

        this._infoBox
            .selectAll("text")
            .data(info)
            .join(
                enter => enter.append("text").attr("dy", (d, i) => `${spacing * i + 1}em`).text(d => d),
                update => update.text(d => d),
                exit => exit.remove()
            );

        const svg = this._getSVG();
        if (svg) {
            // convert to SVG coordinates
            const
                p = svg.createSVGPoint(),
                box = this._infoBox.node().getBBox(),
                gr = this._g.node().getBoundingClientRect(),
                dr = e.currentTarget.getBoundingClientRect();
            p.x = dr.left + dr.width + this._dotRadius;
            p.y = dr.top + dr.width + this._dotRadius;
            const converted = p.matrixTransform(this._g.node().getScreenCTM().inverse());

            const
                left = converted.x + box.width + gr.left + this._dotRadius > this._width ? converted.x - box.width - this._dotDiameter : converted.x,
                top = converted.y + box.height + gr.top + this._dotRadius > this._height ? converted.y - box.height - this._dotDiameter : converted.y;

            this._infoBox.attr("transform", `translate(${left + 3},${top + 3})`);
        }
    }

    _getSVG() {
        let curr = this._container.node();
        while (curr && curr.tagName !== "svg")
            curr = curr.parentElement;
        return curr;
    }

    _hideTooltip(d) {
        if (this._infoBox) this._infoBox.style("visibility", "hidden");
    }    

    _processLegend() {
        const
            that = this,
            ticks = [],
            ts = this._cn.ticks()
                .concat(this._cp.ticks())
                .sort((a, b) => a - b);
        for (let i = 0; i < ts.length - 1; i += 3) addTick(i);
        const last = ts[ts.length - 1];
        if (ticks[ticks.length - 1].floor != last && last <= this._pMax) addTick(ts.length - 1);

        let legendWidth = 0;
        ticks.forEach(d => {
            let len = this._calcTextLength(d.label);
            if (len > legendWidth) legendWidth = len;
        });
        legendWidth += 10;

        if (this._legend.formatter) {
            const lastTick = ticks[ticks.length - 1];
            lastTick.label = this._legend.formatter(lastTick.floor, true);
        }
        
        return { ticks, legendWidth };

        function addTick(i) {
            const floor = ts[i];
            ticks.push({
                floor: floor,
                ceiling: i + 3 < ts.length ? ts[i + 3] : Number.POSITIVE_INFINITY,
                color: floor < that._level ? that._cn(floor) : that._cp(floor),
                label: formatLabel(floor)
            });
        }

        function formatLabel(n) {
            return that._legend.formatter ? that._legend.formatter(n) : n;
        }
    }

    _renderLegend() {
        const
            that = this,
            { ticks, legendWidth } = this._processLegend();

        const validTicks = ticks.filter(t => this._values.some(v => v >= t.floor && v < t.ceiling));
        if (!this._legendBox) this._legendBox = this._g.append("g");

        this._legendBox
            .attr("transform", `translate(${this._width - validTicks.length * legendWidth},0)`)
            .selectAll("g")
            .data(validTicks)
            .join(
                enter => {
                    const g = enter
                        .append("g")                        
                        .call(g => g
                            .append("line")
                            .attr("x1", 0.5).attr("x2", 0.5)
                            .attr("y1", "1em").attr("y2", "1.3em")
                            .attr("stroke-width", 0.5)
                            .attr("stroke", this._legend.color)
                        )
                        .on("mouseenter", (e, d) => { if (!this._focusedRange) this._highlightRange(d); })
                        .on("mouseleave", () => { if (!this._focusedRange) this._cancelRange(); })
                        .on("click", (e, d) => {
                            if (this._options.clickAction === "none") return;

                            if (this._focusedRange === d) {
                                this._focusedRange = null;
                                this._cancelRange();
                            }
                            else {
                                this._focusedRange = d;
                                this._cancelRange();
                                this._highlightRange(d);
                            }
                            e.stopPropagation();
                        });


                    updateLegend(
                        g,
                        g.append("rect").attr("width", legendWidth).attr("height", "1em"),
                        g.append("text").attr("fill", this._legend.color).attr("dy", "2.2em"),
                        legendWidth
                    );
                },
                update => updateLegend(update, update.select("rect"), update.select("text"), legendWidth),
                exit => exit.remove());

        function updateLegend(g, rect, text, lwidth) {
            g.attr("transform", (d, i) => `translate(${i * lwidth},0)`);
            rect
                .attr("width", lwidth)
                .attr("fill", d => d.color);
            text.text((d, i) => {
                const last = i === validTicks.length - 1;
                return (last ? ">" : "") + d.label;
            });
        }
    }

    _highlightRange(d) {
        this._dots.attr("opacity", _ => {
            const n = _.value;
            return n >= d.floor && n < d.ceiling ? 1 : 0.3;
        });
    }

    _cancelRange() {
        this._dots.attr("opacity", 1);
    }

    _processXTicks() {
        var max = 0;
        const
            dateIntervals = ["month", "week", "biweek"],
            xtick = this._xtick,
            range = this._x.range(),
            scale = d3.scalePoint()
                .domain(this._chartData
                    .map(d => {
                        const len = this._calcTextLength(d.tick);
                        if (len > max) max = len;
                        return d.tick;
                    }))
                .range(range);

        let ticks;
        if (isDate()) {
            const
                firstDay = this._chartData[0].tick,
                lastDay = this._chartData[this._chartData.length - 1].tick;
            
            if (xtick.interval === "month")
                ticks = d3.timeMonth.every(1).range(firstDay, lastDay);
            else if (xtick.interval === "week")
                ticks = d3.timeWeek.every(1).range(firstDay, lastDay);
            else if (xtick.interval === "biweek")
                ticks = d3.timeWeek.every(2).range(firstDay, lastDay);
        }
        else {
            validateInterval();
            var intr;
            if (this._xtick.interval === "auto") {
                const c = Math.floor((range[1] - range[0]) / max / 2);
                intr = Math.ceil(this._chartData.length / c);
            }
            else intr = +this._xtick.interval;

            ticks = d3
                .axisTop(scale)
                .tickValues(scale.domain().filter((d, i) => i % intr === 0))
                .tickValues();
        }
        return { scale, ticks };
        
        function isDate() {
            return xtick.isDate && dateIntervals.indexOf(xtick.interval) > -1;
        }

        function validateInterval() {
            if (dateIntervals.indexOf(xtick.interval) > -1) xtick.interval = "auto";
        }
    }

    _renderXAxis() {
        const
            xtick = this._xtick,
            ex = xtick.extractor,
            { scale, ticks } = this._processXTicks();

        this._g.append("g")
            .attr("fill", xtick.color)
            .selectAll(".xtick")
            .data(ticks)
            .join("g")
            .attr("class", "xtick")
            .attr("transform", d => `translate(${scale(d)},0)`)
            .call(g =>
                g.append("line")
                    .attr("y1", this._margin.top)
                    .attr("y2", this._height - this._margin.bottom + 5)
                    .attr("stroke-width", 0.25)
                    .attr("stroke", xtick.color))
            .call(g =>
                g.append("text")
                    .attr("y", this._height - this._margin.bottom)
                    .attr("dy", "1.5em")
                    .text(d => {
                        if (xtick.isDate)
                            return this._dateToString(d);                   
                        else
                            return ex && typeof ex === "function" ? ex(d) : d;
                    }));

    }

    _renderYAxis() {
        const
            dy = this._y.domain(),
            intr = Math.abs(dy[1] - dy[0]) / this._ytick.num,
            yticks = this._seq2(dy[0], dy[1], intr),
            lw = this._width - this._margin.left - this._margin.right;
        
        this._g.append("g")
            .attr("fill", this._ytick.color)
            .attr("transform", `translate(${this._margin.left},0)`)
            .selectAll(".ytick")
            .data(yticks)
            .join("g")
            .attr("class", "ytick")
            .attr("transform", d => `translate(0,${this._y(d)})`)
            .call(g =>
                g.append("line")
                    .attr("x1", -10)
                    .attr("x2", lw + 25)
                    .attr("stroke-width", 0.25)
                    .attr("stroke", this._ytick.color))
            .call(g =>
                g.append("text")
                    .attr("x", this._width - this._margin.right - this._margin.left + 25)
                    .attr("dy", "-0.2em")
                    .text((d, i) => this._ytick.formatter ? this._ytick.formatter(d, i === yticks.length - 1) : d));

        if (this._slider.enabled) {
            this._levelLine = this._g
                .append("line")                
                .attr("x1", -10 + this._margin.left)
                .attr("x2", lw + 25 + this._margin.left)
                .attr("y1", this._y(this._level))
                .attr("y2", this._y(this._level))
                .attr("stroke-width", 1)
                .attr("stroke", this._slider.color);
        }
    }

    _renderSlider() {
        const
            that = this,
            height = this._height - this._margin.top - this._margin.bottom,
            top = this._margin.top;

        var inputGroup = this._g
            .append("g");
        // Doesn't work in Safari
        //.attr("transform", `translate(0,${top})`);

        const label = inputGroup
            .append("text")
            .attr("y", 0)
            .attr("fill", this._ytick.color)
            .attr("text-anchor", "middle")
            .text(this._level);

        const vbox = label.node().getBBox();
        label
            .attr("x", vbox.height)
            .attr("transform", `rotate(270,${vbox.height},0)`)
            .text(this._slider.formatter ? this._slider.formatter(this._level) : this._level);

        const
            yd = this._y.domain(),
            min = yd[0] > 0 ? yd[0] / 1.01 : yd[0] * 1.01,
            max = yd[1] * 1.01,
            step = Math.abs(min) / 100;

        const fo = inputGroup
            .append("foreignObject")
            .attr("x", this._charBox.height).attr("y", top)
            .attr("width", 20).attr("height", height + 2);

        const slider = fo
            .append("xhtml:input")
            .attr("type", "range")
            .attr("min", min).attr("max", max)
            .attr("step", step)            
            .style("width", `${height}px`).style("height", "20px")
            .style("transform-origin", `${height / 2}px ${height / 2}px`)
            .style("transform", "rotate(-90deg)")
            .on("click", e => e.stopPropagation())
            .on("dblclick", e => {
                slider.node().value = this._defaultLevel;
                change(true);
                e.stopPropagation();
            })
            .on("input", () => change(true));

        // This fixes a weird behavior if both min and max are floating poing numbers
        slider.node().value = this._level;
        change();

        function change(update) {
            var
                tw = label.node().getBBox().width,
                hw = tw / 2;

            var v = parseFloat(slider.node().value);
            var p = Math.abs(min - v);
            var ty = height - p / (max - min) * height + top;

            if (ty + hw - top > height) ty = height - hw + top;
            else if (ty - hw - top <= 0) ty = hw + top;

            label
                .attr("y", ty)
                .attr("transform", `rotate(270,${vbox.height},${ty})`)
                .text(that._slider.formatter ? that._slider.formatter(v) : v);
            that._level = v;
            if (update) that._changeLevel();
        }
    }

    _changeLevel() {        
        const y = this._y(this._level);
        this._levelLine.attr("y1", y).attr("y2", y);

        this._cp = d3.scaleSequential(this._options.posPalette).domain([this._level, this._max]);
        this._cn = d3.scaleSequential(this._options.negPalette).domain([this._level, this._min]);

        this._dots
            .selectAll(".data")
            .attr("fill", d => d.value >= this._level ? this._cp(d.value) : this._cn(d.value));

        this._renderLegend();
    }

    _getCharBox() {
        this._charBox = this._textBox.text("M").node().getBBox();
    }

    _calcTextLength(text) {
        return this._textBox.text(text).node().getBBox().width;
    }

    _seq(start, length) {
        const a = new Array(length);
        for (let i = 0; i < length; i++) a[i] = i + start;
        return a;
    }

    _seq2(start, end, step) {
        const a = [];
        for (let i = start; i <= end; i += step) a.push(i);
        if (a.indexOf(end) === -1) a.push(end);
        return a;
    }

    _dateToString(d) {
        return [pad(d.getFullYear()), pad(d.getMonth() + 1), pad(d.getDate())].join("-");
        function pad(n) {
            const s = n.toString();
            return s.length === 1 ? "0" + s : s;
        }
    }
}