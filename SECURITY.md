# Politique de sécurité

## Signaler une vulnérabilité

Ne pas publier de détail exploitable dans une issue publique. Utiliser le canal privé de sécurité du dépôt lorsqu’il sera configuré, ou contacter directement les mainteneurs.

Le signalement doit contenir :

- version du package ;
- navigateur et système ;
- exemple minimal reproductible ;
- impact observé ;
- logs sans token ni donnée sensible.

## Périmètre

Les problèmes de sécurité peuvent concerner :

- chargement de ressources distantes ;
- traitement de données CZML non fiables ;
- injection dans les exemples HTML ;
- fuite de tokens Cesium ion ;
- consommation excessive de ressources GPU ;
- corruption ou fuite de ressources WebGL.

Les tokens Cesium ion ne doivent jamais être commités dans le dépôt.
