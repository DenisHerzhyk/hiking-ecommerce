import { getTrailPhotos } from "./pexelRequest";
import { parseOsmDistance, trailLengthKm } from "./trailLength";
import { Trail } from "../../pages/Trails/interfaces/TrailInterface";

export const trailsSearch = async ({
  routes,
  place,
}: {
  routes: any[];
  place: string;
}) => {
  const filtered = routes.filter((route: any) => route.tags?.name);

  const results = await Promise.allSettled(
    filtered.map(async (route) => {
      const trailName = route.tags?.name ?? `${place} Trail`;

      const members =
        route.members?.filter((m: any) => m.geometry?.length > 0) ?? [];

      const startCoord = members[0]?.geometry?.[0];
      const endCoord =
        members[members.length - 1]?.geometry?.[
          members[members.length - 1].geometry.length - 1
        ];

      const distance =
        parseOsmDistance(route.tags?.distance) ?? trailLengthKm(members);

      const photos = await getTrailPhotos(trailName);

      return {
        id: route.id,
        type: "relation",
        tags: {
          name: trailName,
          photos,
          distance,
          ascent: route.tags?.ascent ?? "",
          difficulty: route.tags?.difficulty ?? route.tags?.sac_scale ?? "",
          network: route.tags?.network,
          sac_scale: route.tags?.sac_scale,
          startLat: startCoord?.lat,
          startLon: startCoord?.lon,
          endLat: endCoord?.lat,
          endLon: endCoord?.lon,
        },
        geometry: [],
      } as Trail;
    }),
  );

  return results
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<Trail>).value);
};
