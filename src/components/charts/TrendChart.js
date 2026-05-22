import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { CHART_METRICS, createChartSeries, getMetricLabel } from '../../utils/analytics';

function TrendChart({ rows, selectedMetrics }) {
  const option = useMemo(() => {
    const metricKeys = selectedMetrics?.length ? selectedMetrics : CHART_METRICS.map((item) => item.key);
    const seriesData = createChartSeries(rows, metricKeys);

    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      legend: { top: 0, textStyle: { color: '#1f3b73' } },
      grid: { left: 36, right: 20, top: 48, bottom: 28, containLabel: true },
      xAxis: {
        type: 'category',
        data: seriesData.map((item) => item.date),
        axisLabel: { color: '#1f3b73' },
        axisLine: { lineStyle: { color: '#b8d1ff' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#1f3b73' },
        splitLine: { lineStyle: { color: '#e2ecff' } },
      },
      series: metricKeys.map((metricKey, index) => ({
        name: getMetricLabel(metricKey),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        emphasis: { focus: 'series' },
        lineStyle: { width: 3 },
        itemStyle: { color: ['#1677ff', '#4e8cff', '#74a9ff', '#2f54eb', '#91caff'][index % 5] },
        data: seriesData.map((item) => item[metricKey] ?? 0),
      })),
    };
  }, [rows, selectedMetrics]);

  return <ReactECharts option={option} style={{ height: 360, width: '100%' }} notMerge lazyUpdate />;
}

export default TrendChart;
