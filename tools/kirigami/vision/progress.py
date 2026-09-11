import sys
import time

WIDTH = 24
LABEL = 26
QUIET = 0.2


class Meter:
    def __init__(self, label: str, total: int) -> None:
        self.label = label
        self.total = max(int(total), 1)
        self.done = 0
        self.started = time.monotonic()
        self.painted = 0.0

    def retitle(self, label: str) -> None:
        self.label = label
        self._paint(force=True)

    def advance(self, step: int = 1) -> None:
        self.done = min(self.done + int(step), self.total)
        self._paint()

    def close(self) -> None:
        self.done = self.total
        self._paint(force=True, final=True)

    def _paint(self, force: bool = False, final: bool = False) -> None:
        now = time.monotonic()
        if not force and now - self.painted < QUIET:
            return
        self.painted = now
        share = self.done / self.total
        elapsed = now - self.started
        remaining = elapsed / share - elapsed if share > 0 else 0.0
        tail = f"in {clock(elapsed)}" if final else f"eta {clock(remaining)}"
        _write(f"\r   {self.label:<{LABEL}}{bar(share)} {share * 100:5.1f}%  "
               f"{self.done:>12,}/{self.total:,}  {tail}      ")
        if final:
            _write("\n")


class Chunks:
    def __init__(self, module) -> None:
        self.module = module
        self.original = module.chunk_batch
        self.resolution = 0
        self.seen = 0

    def install(self) -> None:
        self.module.chunk_batch = self._counted

    def begin(self, resolution: int) -> None:
        self.resolution = resolution
        self.seen = 0

    def _counted(self, func, chunk_size, *args, **kwargs):
        self.seen += 1
        total = next((arg.shape[0] for arg in args if hasattr(arg, "shape")), 0)
        meter = Meter(self._label(), total)

        def watched(*sliced, **rest):
            answer = func(*sliced, **rest)
            meter.advance(len(sliced[0]))
            return answer

        try:
            return self.original(watched, chunk_size, *args, **kwargs)
        finally:
            meter.close()
            if self.seen == 1:
                announce("marching cubes", f"{self.resolution} grid to surface")

    def _label(self) -> str:
        return f"{'density' if self.seen == 1 else 'colour'} {self.resolution}"


class Step:
    def __init__(self, label: str) -> None:
        self.label = label
        self.started = 0.0

    def __enter__(self) -> "Step":
        self.started = time.monotonic()
        _write(f"\r   {self.label:<{LABEL}}working…")
        return self

    def __exit__(self, kind, value, trace) -> bool:
        mark = "done" if kind is None else "failed"
        _write(f"\r   {self.label:<{LABEL}}{mark} in "
               f"{clock(time.monotonic() - self.started)}                    \n")
        return False


def announce(label: str, detail: str = "") -> None:
    _write(f"\r   {label:<{LABEL}}{detail}                    \n")


def bar(share: float) -> str:
    filled = int(round(share * WIDTH))
    return f"[{'#' * filled}{'.' * (WIDTH - filled)}]"


def clock(seconds: float) -> str:
    whole = max(int(seconds), 0)
    if whole < 60:
        return f"{whole}s"
    if whole < 3600:
        return f"{whole // 60}m{whole % 60:02d}s"
    return f"{whole // 3600}h{(whole % 3600) // 60:02d}m"


def _write(text: str) -> None:
    sys.stderr.write(text)
    sys.stderr.flush()
