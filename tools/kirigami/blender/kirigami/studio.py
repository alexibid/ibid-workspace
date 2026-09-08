from dataclasses import dataclass

import bpy

from . import imprints, ingest, preflight, solids, weld
from .materials import decal, mark, paint, shade
from .palettes import colour_of
from .shapes import MM
from .tiers import Tier, tier_named


class TierViolation(ValueError):
    pass


@dataclass(frozen=True)
class Part:
    name: str
    role: str
    obj: bpy.types.Object


class Studio:
    def __init__(self, tier: object, title: str = "",
                 family: str = "sitting-animal") -> None:
        self.tier: Tier = tier_named(tier)
        self.title = title or "untitled"
        self.family = family
        self._surveys: dict[str, dict] = {}
        self._parts: list[Part] = []
        self._loose: list[str] = []
        self._zones: dict[str, list[dict]] = {}

    @property
    def parts(self) -> list[Part]:
        return list(self._parts)

    @property
    def objects(self) -> list[bpy.types.Object]:
        return [part.obj for part in self._parts]

    def block(self, name: str, **kwargs) -> bpy.types.Object:
        return self._build("block", name, kwargs)

    def wedge(self, name: str, **kwargs) -> bpy.types.Object:
        return self._build("wedge", name, kwargs)

    def pyramid(self, name: str, **kwargs) -> bpy.types.Object:
        return self._build("pyramid", name, kwargs)

    def prism(self, name: str, **kwargs) -> bpy.types.Object:
        return self._build("prism", name, kwargs)

    def lowpoly(self, name: str, **kwargs) -> bpy.types.Object:
        return self._build("lowpoly", name, self._cap_subdivisions(kwargs))

    def facet(self, name: str, **kwargs) -> bpy.types.Object:
        return self._build("facet", name, kwargs)

    def loft(self, name: str, **kwargs) -> bpy.types.Object:
        return self._build("loft", name, kwargs)

    def hull(self, name: str, **kwargs) -> bpy.types.Object:
        return self._build("hull", name, kwargs)


    def weld(self, name: str, pieces: list[bpy.types.Object], role: str = "primary",
             mirror: str | None = None, skin: bool = False) -> Part:
        self._surveys[name] = {
            **preflight.refuse_if_broken(name, pieces, bool(mirror)),
            **preflight.measure(pieces, self.family),
        }
        return self._register(name, role, weld.union(
            name, pieces, mirror, self.tier.min_feature_mm,
            self.tier.max_faces_per_part if skin else None))

    def adopt(self, name: str, mesh: str, role: str | None = None) -> Part:
        obj = ingest.adopt(name, mesh, self.tier.max_faces_per_part, self.tier.min_feature_mm)
        sampled = ingest.palette_of(obj, self.tier.max_zones)
        self._admit(name, obj)
        part = self._enrol(name, role or (sampled[0] if sampled else "#FFFFFF"), obj)
        self._zones[name] = [{"role": hex_colour, "sampled": True} for hex_colour in sampled[1:]]
        return part

    def imprint(self, part: Part, features: str) -> int:
        drawn = imprints.apply(part.obj, features, self.tier.max_zones)
        self._zones.setdefault(part.name, []).extend(drawn)
        return len(drawn)

    def carve(self, name: str, solid: bpy.types.Object, cutters: list[bpy.types.Object],
              role: str = "primary", mirror: str | None = None) -> Part:
        return self._register(name, role, weld.carve(name, solid, cutters, mirror, self.tier.min_feature_mm))

    def shade(self, part: Part, role: str, **bounds) -> int:
        zones = self._budget(part, role)
        painted = shade(part.obj, colour_of(self.tier.palette, role), role, **bounds)
        zones.append({"role": role, "bounds": bounds, "faces": painted})
        return painted

    def mark(self, part: Part, role: str, at: tuple[float, float, float],
             radius: float) -> int:
        zones = self._budget(part, role)
        painted = mark(part.obj, colour_of(self.tier.palette, role), role, at, radius)
        zones.append({"role": role, "at": list(at), "radius": radius, "faces": painted})
        return painted

    def _budget(self, part: Part, role: str) -> list[dict]:
        zones = self._zones.setdefault(part.name, [])
        colours = {part.role, *(zone["role"] for zone in zones), role}
        if len(colours) > self.tier.max_zones:
            raise TierViolation(
                f"Tier {self.tier.id} allows {self.tier.max_zones} colours in a part, one "
                f"sheet of card each; adding '{role}' to '{part.name}' would make "
                f"{len(colours)}."
            )
        return zones

    def decal(self, part: Part, role: str, shape: str, at: tuple[float, float, float],
              size: tuple[float, float], facing: str = "y",
              depth: float | None = None) -> None:
        zones = self._budget(part, role)
        decal(part.obj, colour_of(self.tier.palette, role), f"{role}_{shape}",
              shape, at, size, facing, depth)
        zones.append({"role": role, "decal": shape, "at": list(at),
                      "size": list(size), "depth": depth})

    def survey(self) -> dict:
        return dict(self._surveys)

    def zones_of(self, name: str) -> list[dict]:
        return list(self._zones.get(name, []))

    def colours_of(self, part: Part) -> list[dict]:
        roles = [part.role] + [zone["role"] for zone in self._zones.get(part.name, [])]
        return [
            {"role": role, "hex": colour_of(self.tier.palette, role)}
            for role in dict.fromkeys(roles)
        ]

    def _build(self, kind: str, name: str, kwargs: dict) -> bpy.types.Object:
        if kind not in self.tier.solids:
            raise TierViolation(
                f"Tier {self.tier.id} ({self.tier.ages}, {self.tier.style}) allows only "
                f"{', '.join(self.tier.solids)}; '{kind}' is not one of them."
            )
        obj = solids.BUILDERS[kind](name, **kwargs)
        self._assert_reachable(obj)
        self._loose.append(obj.name)
        return obj

    def _cap_subdivisions(self, kwargs: dict) -> dict:
        requested = kwargs.get("subdivisions", 1)
        return {**kwargs, "subdivisions": min(requested, self.tier.max_subdivisions)}

    def _assert_reachable(self, obj: bpy.types.Object) -> None:
        thinnest = min(obj.dimensions) / MM
        if thinnest + 1e-6 >= self.tier.min_feature_mm:
            return
        complaint = (
            f"Solid '{obj.name}' is {thinnest:.1f} mm at its thinnest, below the "
            f"{self.tier.min_feature_mm:.0f} mm a {self.tier.ages} year old can cut and fold."
        )
        bpy.data.objects.remove(obj, do_unlink=True)
        raise TierViolation(complaint)

    def _register(self, name: str, role: str, obj: bpy.types.Object) -> Part:
        self._admit(name, obj)
        paint(obj, colour_of(self.tier.palette, role))
        return self._enrol(name, role, obj)

    def _admit(self, name: str, obj: bpy.types.Object) -> None:
        if len(self._parts) >= self.tier.max_parts:
            raise TierViolation(
                f"Tier {self.tier.id} allows at most {self.tier.max_parts} parts; "
                f"'{name}' would make {len(self._parts) + 1}."
            )
        if len(obj.data.polygons) > self.tier.max_faces_per_part:
            raise TierViolation(
                f"Part '{name}' welded to {len(obj.data.polygons)} faces, over the "
                f"{self.tier.max_faces_per_part} face ceiling of tier {self.tier.id}."
            )

    def _enrol(self, name: str, role: str, obj: bpy.types.Object) -> Part:
        part = Part(name=name, role=role, obj=obj)
        self._parts.append(part)
        return part

    def abandoned_solids(self) -> list[str]:
        welded = {part.name for part in self._parts}
        return [name for name in self._loose
                if name in bpy.data.objects and name not in welded]
