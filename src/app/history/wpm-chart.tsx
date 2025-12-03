'use client'

import { useState, useMemo } from 'react'
import { ParentSize } from '@visx/responsive'
import {
    Axis,
    LineSeries,
    XYChart,
    Tooltip,
    GlyphSeries,
} from '@visx/xychart'
import {
    AggregatedStats,
    VerseStatsWithDate,
    TimeRange,
    Interval,
    aggregateStats,
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
}

function WPMChartInner({ data }: { data: AggregatedStats[] }) {
    const hasAnyData = data.some(
        d => d.averageWpm !== null || d.averageAccuracy !== null,
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

    return (
        <ParentSize>
            {({ width }) => (
                <XYChart
                    height={200}
                    width={width}
                    xScale={{ type: 'band', paddingInner: 0.5 }}
                    yScale={{ type: 'linear', domain: [0, 100] }}
                    margin={{ top: 20, right: 50, bottom: 40, left: 50 }}
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
                    <Tooltip
                        snapTooltipToDatumX
                        snapTooltipToDatumY
                        showVerticalCrosshair
                        showSeriesGlyphs
                        renderTooltip={({ tooltipData }) => {
                            const datum = tooltipData?.nearestDatum
                                ?.datum as AggregatedStats
                            if (!datum) return null
                            return (
                                <div className="border-2 border-primary bg-secondary px-3 py-2 text-primary">
                                    <div className="font-medium">
                                        {datum.dateLabel}
                                    </div>
                                    {datum.averageWpm !== null && (
                                        <div>WPM: {datum.averageWpm}</div>
                                    )}
                                    {datum.averageAccuracy !== null && (
                                        <div>
                                            Accuracy: {datum.averageAccuracy}%
                                        </div>
                                    )}
                                    {datum.versesWithData > 0 && (
                                        <div className="text-sm opacity-70">
                                            {datum.versesWithData} verse
                                            {datum.versesWithData !== 1
                                                ? 's'
                                                : ''}
                                        </div>
                                    )}
                                    {datum.averageWpm === null &&
                                        datum.averageAccuracy === null && (
                                            <div>No data</div>
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

function Select<T extends string>({
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
        <label className="flex items-center gap-2 text-sm text-primary">
            <span>{label}:</span>
            <select
                value={value}
                onChange={e => onChange(e.target.value as T)}
                className="border-2 border-primary bg-secondary px-2 py-1 text-primary outline-none"
            >
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    )
}

export function WPMChart({
    allStats,
    title,
}: {
    allStats: VerseStatsWithDate[]
    title: React.ReactNode
}) {
    const [timeRange, setTimeRange] = useState<TimeRange>('week')
    const [interval, setInterval] = useState<Interval>('daily')

    // Serialize dates for client-side use (dates come as strings from server)
    const statsWithDates = useMemo(() => {
        if (!allStats) return []
        return allStats.map(stat => ({
            ...stat,
            date: new Date(stat.date),
        }))
    }, [allStats])

    const aggregatedData = useMemo(() => {
        return aggregateStats(statsWithDates, timeRange, interval)
    }, [statsWithDates, timeRange, interval])

    return (
        <div className="mb-8">
            <div className="flex flex-col justify-start items-start gap-4">
                {title}
                <div className="self-end flex flex-wrap gap-4">
                    <Select
                        value={timeRange}
                        onChange={setTimeRange}
                        options={TIME_RANGE_OPTIONS}
                        label="Range"
                    />
                    <Select
                        value={interval}
                        onChange={setInterval}
                        options={INTERVAL_OPTIONS}
                        label="Interval"
                    />
                </div>
            </div>
            <div className="mb-2 mt-4 flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="h-0.5 w-4 bg-primary" />
                    <span className="text-primary">WPM</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-0.5 w-4 bg-success" />
                    <span className="text-success">Accuracy</span>
                </div>
            </div>
            <div className="h-[200px] w-full">
                <WPMChartInner data={aggregatedData} />
            </div>
        </div>
    )
}
