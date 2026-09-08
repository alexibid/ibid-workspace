COAT = "#DE7B39"
BIB = "#F7F4EC"
SOCK = "#2B2621"


def build(studio):
    body = studio.loft(
        "body",
        spine=[(-34, 0, 24), (-18, 0, 52), (-2, 0, 84), (8, 0, 112), (14, 0, 134)],
        sections=[(58, 66), (54, 58), (44, 46), (32, 34), (28, 30)],
        sides=10,
    )
    head = studio.loft(
        "head",
        spine=[(6, 0, 146), (22, 0, 148), (40, 0, 143), (56, 0, 137), (66, 0, 133)],
        sections=[(34, 34), (36, 34), (26, 24), (16, 15), (9, 9)],
        sides=8,
    )
    ear = studio.pyramid("ear", base=(20, 16), height=34, at=(14, 16, 168),
                         rotation=(-12, 0, 0))
    foreleg = studio.loft(
        "foreleg",
        spine=[(30, 17, 5), (29, 17, 34), (26, 16, 58), (20, 16, 82)],
        sections=[(22, 32), (17, 18), (20, 24), (26, 30)],
        sides=6,
    )
    tail = studio.loft(
        "tail",
        spine=[(-22, 6, 36), (-48, 15, 34), (-58, 19, 56), (-50, 19, 78)],
        sections=[(30, 30), (38, 38), (34, 34), (22, 22)],
        sides=8,
    )

    fox = studio.weld("fox", [body, head, ear, foreleg, tail], role=COAT, mirror="y")
    studio.shade(fox, BIB, x=(20, 82), z=(58, 152))
    studio.shade(fox, SOCK, z=(0, 18))
    studio.mark(fox, BIB, at=(-52, 19, 80), radius=22)
    studio.decal(fox, SOCK, "lens", at=(38, 15, 152), size=(19, 10), facing="y")
    studio.decal(fox, SOCK, "lens", at=(38, -15, 152), size=(19, 10), facing="y")
    studio.decal(fox, SOCK, "triangle", at=(67, 0, 133), size=(11, 9), facing="y")
