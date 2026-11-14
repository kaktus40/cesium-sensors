import { Cartesian3, Ray, defined, DeveloperError } from "cesium";

/**
 * Teste si un rayon est occulté par le terrain avant d'atteindre une distance donnée.
 *
 * Utilise `Globe.pick(ray, scene)` qui retourne le point d'intersection entre
 * le rayon et la surface du globe déjà rendu.
 *
 * LIMITES :
 *   - `globe.pick()` ne teste que ce qui a été rendu par la caméra actuelle.
 *     Pour tester des directions hors frustum, il faut rendre une passe dédiée.
 *   - Nécessite que `scene.globe` soit activé et prêt (`scene.globe.readyPromise`).
 *
 * @param {Ray} ray Rayon depuis l'origine du capteur vers la cible.
 * @param {Scene} scene Scène Cesium contenant le globe.
 * @param {number} maxDistance Distance maximale à considérer.
 * @returns {{ occluded: boolean, hit: Cartesian3|null }} `occluded` est true si le
 *   terrain est touché avant `maxDistance`. `hit` est le point d'intersection.
 */
export function rayVsTerrain(ray, scene, maxDistance) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(ray)) {
    throw new DeveloperError("ray is required.");
  }
  if (!defined(scene)) {
    throw new DeveloperError("scene is required.");
  }
  //>>includeEnd('debug');

  const globe = scene.globe;
  if (!defined(globe) || !globe.show) {
    return { occluded: false, hit: null };
  }

  const hit = globe.pick(ray, scene);
  if (!defined(hit)) {
    return { occluded: false, hit: null };
  }

  const hitDistance = Cartesian3.distance(ray.origin, hit);
  const occluded = hitDistance > 0.0 && hitDistance < maxDistance;
  return { occluded, hit: occluded ? hit : null };
}

/**
 * Teste si un rayon est occulté par un modèle 3D Tiles opaque avant d'atteindre
 * une distance donnée.
 *
 * LIMITES :
 *   - Il n'existe pas d'API publique de rayon-3DTiles intersection dans CesiumJS 1.147.0.
 *   - Une implémentation complète nécessite une passe de profondeur dédiée (offscreen)
 *     avec lecture des pixels de profondeur le long du rayon.
 *   - Cette fonction retourne toujours `{ occluded: false }` en attendant l'implémentation
 *     de la passe de profondeur.
 *
 * @param {Ray} ray Rayon depuis l'origine du capteur vers la cible.
 * @param {Scene} scene Scène Cesium contenant les modèles 3D Tiles.
 * @param {number} _maxDistance Distance maximale à considérer (réservé pour la passe de profondeur).
 * @returns {{ occluded: boolean, hit: Cartesian3|null }} Toujours `{ occluded: false, hit: null }`
 *   jusqu'à implémentation de la passe de profondeur.
 */
export function rayVs3DTiles(ray, scene, _maxDistance) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(ray)) {
    throw new DeveloperError("ray is required.");
  }
  if (!defined(scene)) {
    throw new DeveloperError("scene is required.");
  }
  //>>includeEnd('debug');

  // TODO: Implémenter une passe de profondeur dédiée (offscreen) pour lire
  // la profondeur des modèles 3D Tiles opaques le long du rayon.
  return { occluded: false, hit: null };
}

/**
 * Crée un Ray depuis une origine vers un point cible.
 *
 * @param {Cartesian3} origin Origine du rayon (position du capteur).
 * @param {Cartesian3} target Point cible.
 * @returns {Ray} Le rayon de l'origine vers la cible.
 */
export function createRay(origin, target) {
  const direction = Cartesian3.subtract(target, origin, new Cartesian3());
  return new Ray(Cartesian3.clone(origin), Cartesian3.normalize(direction, direction));
}
