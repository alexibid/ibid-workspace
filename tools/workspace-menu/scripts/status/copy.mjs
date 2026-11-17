export const COPY = {
  offline: 'Sem ligação à internet',
  offlineDetail: 'O estado do GitHub, das PRs e dos pods não pode ser lido.',
  dockerOff: 'Docker desligado',
  dockerOffDetail: 'O runner do Docker e os contentores estão parados.',
  containerStopped: (name) => `Contentor ${name} parado`,
  containerMissing: (name) => `Contentor ${name} não existe`,
  containerUnhealthy: (name) => `Contentor ${name} com problemas`,
  runnerOff: { docker: 'Runner do Docker desligado', mac: 'Runner do Mac desligado' },
  runnerMissing: { docker: 'Runner do Docker por registar', mac: 'Runner do Mac não instalado' },
  runnerDisconnected: {
    docker: 'Runner do Docker sem ligação ao GitHub',
    mac: 'Runner do Mac sem ligação ao GitHub',
  },
  buildFailed: (workflow) => `Falhou: ${workflow}`,
};
