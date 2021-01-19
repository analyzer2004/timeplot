# Performance Chart


The **Timeplot** visualizes trends and the categorical distribution in data over time. It is beneficial for finding the behavior and patterns of the data, helps users understand the underlying causes of trends, and reveals the most important insights.

For live demos and sample codes, please see [Time Plot](https://observablehq.com/@analyzer2004/time-plot)

<img src="https://github.com/analyzer2004/timeplot/blob/master/images/cover.png" width="768">

## API Reference
* **Timeplot(container)** - Constructs a new instance of Timeplot with default settings. The container can be an svg or g element.
* **size(_)** - Sets the dimensions of the chart to specified width, height and returns this chart.
* **margin(margin)** - Sets the margins of the chart and returns this chart.
  * margin.**left** - sets the left margin of the chart. Default is 25.
  * margin.**top** - sets the top margin of the chart. Default is 25.
  * margin.**right** - sets the right margin of the chart. Default is 60.
  * margin.**bottom** - sets the left margin of the chart. Default is 25.
* **options(options)** - Overrides the default settings and returns this chart.
  * options.**posPalette** - sets the color palette of positive (rising) section to the specified continous interpolator.
  * options.**negPalette** - sets the color palette of negative (falling) section to the specified continous interpolator.
  * options.**level** - specifies the default level to *"zero"* or *"average"*. Default is average.
  * options.**clickAction** - specifies the click action to *"none"* or *"highlight"*. Default is highlight.
  * options.**fontFamily** - sets the font. Default is sans-serif.
  * options.**fontSize** - sets the font size. Default is 10px.
  * options.**fadeOpacity** - sets the opacity for faded dots. Default is 0.4.
* **xtick(tick)** - Overrides the tick settings of X axis and returns this chart.
  * tick.**name** - sets the column name of ticks
  * tick.**isDate** - sets whether the tick value is date string that can be parsed by d3.parseTime. Default is false.
  * tick.**format** - sets the format (d3.parseTime) for parsing dates. Default is "%Y-%m-%d".
  * tick.**interval** - sets the interval of x-axis to "auto", "month", "week" or a number. Default is auto.
  * tick.**extractor** - sets the function for extracting tick string. See the **US Employeement** demo for usage.
  * tick.**color** - sets the color of tick texts and lines.
* **ytick(tick)** - Overrides the tick settings of Y axis and returns this chart.
  * tick.**interval** - sets the interval of y-axis to "auto" or a number. Default is auto.
  * tick.**formatter** - sets the number formatter function of Y axis and returns this chart. See the first demo for usage.
  * tick.**color** - sets the color of tick texts and lines.
* **tooltip(tooltip)** - Overrides the tooltip settings and returns this chart.
  * tooltip.**color** - sets the text color of tooltip.
  * tooltip.**boxColor** - sets the background color of the tooltip box.
  * tooltip.**boxOpacity** - sets the opacity of the tooltip box. Default is 0.8.
  * tooltip.**formatter** - sets the number formatter function of tooltip box and returns this chart. See the first demo for usage.
* **legend(legend)** - Overrides the legend settings and returns this chart.
  * legend.**formatter** - sets the number formatter function for legend and returns this chart. See the demos for usage.
  * legend.**color** - sets the text color of legend.
* **average(average)** - Overrides the average box settings and returns this chart.
  * average.**enabled** - specifies whether the average boxes are enabled.
  * legend.**color** - sets the color of average boxes.  
* **slider(slider)** - Overrides the slider settings and returns this chart.
  * slider.**enabled** - specifies whether the slider is enabled. 
  * slider.**formatter** - sets the number formatter function for slider and returns this chart. See the demos for usage.
  * slider.**color** - sets the text color of slider.
* **highlighter(highlighter)** - Overrides the highlighter settings and returns this chart.
  * highlighter.**enabled** - specifies whether the highlighter is enabled. 
  * highlighter.**color** - sets the color of highlighter.
* **data(_)** - Sets the data and returns this chart.
* **render()** - Renders the chart and returns it's instance.
* **onhover(d)** - Occurs when user hover over a dot.
* **onclick(d)** - Occurs when user click on a dot.
* **oncancel(d)** - Occurs when cancelling the locked highlight.`