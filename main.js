import Chart from 'chart.js/auto'

const data = import.meta.glob('./data/*.json', { eager: true, import: 'default' })

console.log(data);

