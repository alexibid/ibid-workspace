from .validate import MeshReport, OFFENDER_NAMES


def totals(reports: list[MeshReport]) -> dict[str, int]:
    return {
        name: sum(report.offenders.get(name, 0) for report in reports)
        for name in OFFENDER_NAMES
    }


def is_clean(reports: list[MeshReport]) -> bool:
    return all(report.clean for report in reports)


def offender_summary(reports: list[MeshReport]) -> str:
    dirty = [report for report in reports if not report.clean]
    if not dirty:
        return "zero offenders"
    lines = [
        f"{report.part}: " + ", ".join(
            f"{name} x{report.offenders[name]}" for name in report.failures
        )
        for report in dirty
    ]
    return "; ".join(lines)
