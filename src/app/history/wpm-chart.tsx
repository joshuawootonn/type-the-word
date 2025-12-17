'use client'

import { ParentSize } from '@visx/responsive'
import { defaultStyles as defaultTooltipStyles } from '@visx/tooltip'
import {
    Axis,
    LineSeries,
    XYChart,
    Tooltip,
    GlyphSeries,
    buildChartTheme,
} from '@visx/xychart'
import { useState, useMemo } from 'react'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/select'

import {
    AggregatedStats,
    WpmChartData,
    TimeRange,
    Interval,
    aggregateStats,
    aggregateStatsFromCache,
} from './wpm'

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
    { value: 'week', label: 'Past Week' },
    { value: 'month', label: 'Past Month' },
    { value: '3months', label: 'Past 3 Months' },
    { value: 'year', label: 'Past Year' },
]

const INTERVAL_OPTIONS: { value: Interval; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
]

const accessors = {
    xAccessor: (d: AggregatedStats) => d.dateLabel,
    yAccessorWpm: (d: AggregatedStats) => d.averageWpm ?? 0,
    yAccessorAccuracy: (d: AggregatedStats) => d.averageAccuracy ?? 0,
    yAccessorCorrectedAccuracy: (d: AggregatedStats) =>
        d.averageCorrectedAccuracy ?? 0,
}
// Add before the component
const chartTheme = buildChartTheme({
    backgroundColor: 'transparent',
    colors: [
        'oklch(var(--color-primary))',
        'oklch(var(--color-primary))', // wpm-points same as wpm
        'oklch(var(--color-success))',
        'oklch(var(--color-success))', // accuracy-points same as accuracy
        'oklch(var(--color-success))',
        'oklch(var(--color-success))', // corrected-accuracy-points same as corrected-accuracy
    ],
    gridColor: 'oklch(var(--color-primary))',
    gridColorDark: 'oklch(var(--color-primary))',
    tickLength: 4,
})

function WPMChartInner({ data }: { data: AggregatedStats[] }) {
    const hasAnyData = data.some(
        d =>
            d.averageWpm !== null ||
            d.averageAccuracy !== null ||
            d.averageCorrectedAccuracy !== null,
    )

    if (!hasAnyData) {
        return (
            <div className="flex h-[200px] items-center justify-center text-primary/60">
                No data available for this time range
            </div>
        )
    }

    // Filter data to only include points with values for lines
    const wpmData = data.filter(d => d.averageWpm !== null)
    const accuracyData = data.filter(d => d.averageAccuracy !== null)
    const correctedAccuracyData = data.filter(
        d => d.averageCorrectedAccuracy !== null,
    )

    return (
        <ParentSize>
            {({ width }) => (
                <XYChart
                    height={200}
                    width={width}
                    xScale={{ type: 'band', paddingInner: 0.5 }}
                    yScale={{ type: 'linear', domain: [0, 100] }}
                    margin={{ top: 20, right: 50, bottom: 40, left: 50 }}
                    theme={chartTheme}
                >
                    <Axis
                        orientation="bottom"
                        tickLabelProps={{
                            fill: 'oklch(var(--color-primary))',
                            fontFamily: 'var(--font-poppins)',
                            fontSize: 12,
                        }}
                        strokeWidth={2}
                        stroke="oklch(var(--color-primary))"
                        tickStroke="oklch(var(--color-primary))"
                        numTicks={Math.min(data.length, 7)}
                    />
                    <Axis
                        orientation="left"
                        numTicks={4}
                        label="WPM"
                        labelOffset={30}
                        labelProps={{
                            fill: 'oklch(var(--color-primary))',
                            fontFamily: 'var(--font-poppins)',
                            fontSize: 12,
                        }}
                        tickLabelProps={{
                            fill: 'oklch(var(--color-primary))',
                            fontFamily: 'var(--font-poppins)',
                            fontSize: 12,
                        }}
                        strokeWidth={2}
                        stroke="oklch(var(--color-primary))"
                        tickStroke="oklch(var(--color-primary))"
                    />
                    <Axis
                        orientation="right"
                        numTicks={4}
                        label="Accuracy %"
                        labelOffset={30}
                        labelProps={{
                            fill: 'oklch(var(--color-success))',
                            fontFamily: 'var(--font-poppins)',
                            fontSize: 12,
                        }}
                        tickLabelProps={{
                            fill: 'oklch(var(--color-success))',
                            fontFamily: 'var(--font-poppins)',
                            fontSize: 12,
                        }}
                        strokeWidth={2}
                        stroke="oklch(var(--color-success))"
                        tickStroke="oklch(var(--color-success))"
                    />
                    <LineSeries
                        dataKey="wpm"
                        data={wpmData}
                        xAccessor={accessors.xAccessor}
                        yAccessor={accessors.yAccessorWpm}
                        stroke="oklch(var(--color-primary))"
                        strokeWidth={2}
                    />
                    <GlyphSeries
                        dataKey="wpm-points"
                        data={wpmData}
                        xAccessor={accessors.xAccessor}
                        yAccessor={accessors.yAccessorWpm}
                        colorAccessor={() => 'oklch(var(--color-primary))'}
                    />
                    <LineSeries
                        dataKey="accuracy"
                        data={accuracyData}
                        xAccessor={accessors.xAccessor}
                        yAccessor={accessors.yAccessorAccuracy}
                        stroke="oklch(var(--color-success))"
                        strokeWidth={2}
                    />
                    <GlyphSeries
                        dataKey="accuracy-points"
                        data={accuracyData}
                        xAccessor={accessors.xAccessor}
                        yAccessor={accessors.yAccessorAccuracy}
                        colorAccessor={() => 'oklch(var(--color-success))'}
                    />
                    <LineSeries
                        dataKey="corrected-accuracy"
                        data={correctedAccuracyData}
                        xAccessor={accessors.xAccessor}
                        yAccessor={accessors.yAccessorCorrectedAccuracy}
                        stroke="oklch(var(--color-success))"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                    />
                    <GlyphSeries
                        dataKey="corrected-accuracy-points"
                        data={correctedAccuracyData}
                        xAccessor={accessors.xAccessor}
                        yAccessor={accessors.yAccessorCorrectedAccuracy}
                        colorAccessor={() => 'oklch(var(--color-success))'}
                    />
                    <Tooltip
                        snapTooltipToDatumX
                        snapTooltipToDatumY
                        showVerticalCrosshair
                        showSeriesGlyphs
                        style={{
                            ...defaultTooltipStyles,
                            padding: '0',
                            borderRadius: '0',
                            border: '1.5px solid oklch(var(--color-primary))',
                        }}
                        renderTooltip={({ tooltipData }) => {
                            const datum = tooltipData?.nearestDatum
                                ?.datum as AggregatedStats
                            if (!datum) return null
                            return (
                                <div className="bg-secondary px-3 py-2 text-primary">
                                    <div className="mb-1 text-base font-medium">
                                        {datum.dateLabel}
                                    </div>
                                    {datum.averageWpm !== null && (
                                        <div className="mb-1 flex justify-between font-normal">
                                            <div>WPM:</div>
                                            <div>{datum.averageWpm}</div>
                                        </div>
                                    )}
                                    {datum.averageAccuracy !== null && (
                                        <div className="mb-1 flex justify-between space-x-3 font-normal">
                                            <div>Accuracy:</div>
                                            <div>{datum.averageAccuracy}%</div>
                                        </div>
                                    )}
                                    {datum.averageCorrectedAccuracy !==
                                        null && (
                                        <div className="flex justify-between space-x-3 font-normal">
                                            <div>Corrected Accuracy:</div>
                                            <div>
                                                {datum.averageCorrectedAccuracy}
                                                %
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        }}
                    />
                </XYChart>
            )}
        </ParentSize>
    )
}

function ChartSelect<T extends string>({
    value,
    onChange,
    options,
    label,
}: {
    value: T
    onChange: (value: T) => void
    options: { value: T; label: string }[]
    label: string
}) {
    return (
        <div className="flex items-center gap-2 text-sm text-primary">
            <span>{label}:</span>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

export function WPMChart({ chartData }: { chartData: WpmChartData }) {
    const [timeRange, setTimeRange] = useState<TimeRange>('week')
    const [interval, setInterval] = useState<Interval>('daily')

    const aggregatedData = useMemo(() => {
        if (chartData.type === 'cached') {
            return aggregateStatsFromCache(chartData.data, timeRange, interval)
        }
        return aggregateStats(chartData.data, timeRange, interval)
    }, [chartData, timeRange, interval])

    return (
        <div className="mb-8">
            <div className="flex flex-col items-start justify-start gap-4">
                <div className="flex flex-wrap gap-4 self-end">
                    <ChartSelect
                        value={timeRange}
                        onChange={setTimeRange}
                        options={TIME_RANGE_OPTIONS}
                        label="Range"
                    />
                    <ChartSelect
                        value={interval}
                        onChange={setInterval}
                        options={INTERVAL_OPTIONS}
                        label="Interval"
                    />
                </div>
            </div>
            <div className="mb-2 mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="h-0.5 w-4 bg-primary" />
                    <span className="text-primary">WPM</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-0.5 w-4 bg-success" />
                    <span className="text-success">Accuracy</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-0.5 w-4 border-t-2 border-dashed border-success" />
                    <span className="text-success">Corrected</span>
                </div>
            </div>
            <div className="h-[200px] w-full">
                <WPMChartInner data={aggregatedData} />
            </div>
        </div>
    )
}
