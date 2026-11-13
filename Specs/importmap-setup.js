// Configure l'import map pour résoudre les imports bare (ex: "cesium", "@cesium/core")
// avant le chargement des modules de specs et de sources.
(function () {
  const map = {
    imports: {
      cesium: '/base/node_modules/cesium/Source/Cesium.js',
      '@cesium/core': '/base/node_modules/@cesium/core/index.js',
      '@cesium/engine': '/base/node_modules/@cesium/engine/index.js',
      '@cesium/gltf': '/base/node_modules/@cesium/gltf/index.js',
      '@cesium/widgets': '/base/node_modules/@cesium/widgets/index.js',
      'mersenne-twister': '/base/node_modules/mersenne-twister/src/mersenne-twister.js',
    },
  };
  const el = document.createElement('script');
  el.type = 'importmap';
  el.textContent = JSON.stringify(map);
  document.head.appendChild(el);
})();