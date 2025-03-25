import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import './DriveHistoryChart.css';

Chart.register(...registerables);

export default function DriveHistoryChart({ history, currentSituation, team }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current && history.length > 0) {
      // Destroy previous chart instance if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: history.map((_, index) => `Play ${index + 1}`),
          datasets: [{
            label: `${team} Drive History`,
            data: history.map(play => play.yardline),
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            tension: 0.1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: 'Yard Line'
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  const play = history[context.dataIndex];
                  return [
                    `Down: ${play.down}`,
                    `Distance: ${play.distance}`,
                    `Play: ${play.playType.toUpperCase()}`
                  ];
                }
              }
            }
          }
        }
      });
    }

    // Cleanup function to destroy chart on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [history, team]);

  return (
    <div className="drive-history-chart">
      <h3>Drive History</h3>
      <canvas ref={chartRef} />
    </div>
  );
}