from collections import deque
from dataclasses import dataclass
from typing import Iterable


N = 5
OBJECT_NAMES = ("a", "b", "c", "d", "e")


State = tuple[tuple[str, ...], tuple[str, ...]]


@dataclass(frozen=True)
class SolveResult:
    max_match: int
    moves: list[str]
    final_paints: list[str]
    final_hammers: list[str]
    matched_objects: list[str]


def count_matches(state: State) -> int:
    paints, hammers = state
    return sum(1 for i in range(N) if paints[i] == hammers[i])


def apply_move(state: State, index: int) -> State:
    """Move one object in the circular 5-object rule."""
    paints, hammers = map(list, state)

    left = (index - 1) % N
    right_second = (index + 2) % N

    paints[index], paints[left] = paints[left], paints[index]
    hammers[index], hammers[right_second] = hammers[right_second], hammers[index]

    return tuple(paints), tuple(hammers)


def solve(paints: Iterable[str], hammers: Iterable[str]) -> SolveResult:
    start_paints = tuple(paints)
    start_hammers = tuple(hammers)

    if len(start_paints) != N or len(start_hammers) != N:
        raise ValueError("paints and hammers must both contain exactly 5 colors")

    start: State = (start_paints, start_hammers)
    queue = deque([start])
    parent: dict[State, State | None] = {start: None}
    parent_move: dict[State, str] = {}

    best_state = start
    best_score = count_matches(start)

    while queue:
        state = queue.popleft()
        score = count_matches(state)

        if score > best_score:
            best_score = score
            best_state = state

        if best_score == N:
            break

        for index, name in enumerate(OBJECT_NAMES):
            next_state = apply_move(state, index)
            if next_state in parent:
                continue

            parent[next_state] = state
            parent_move[next_state] = name
            queue.append(next_state)

    moves: list[str] = []
    current = best_state
    while parent[current] is not None:
        moves.append(parent_move[current])
        current = parent[current]
    moves.reverse()

    final_paints, final_hammers = best_state
    matched_objects = [
        OBJECT_NAMES[i] for i in range(N) if final_paints[i] == final_hammers[i]
    ]

    return SolveResult(
        max_match=best_score,
        moves=moves,
        final_paints=list(final_paints),
        final_hammers=list(final_hammers),
        matched_objects=matched_objects,
    )


def _parse_colors(raw: str) -> list[str]:
    colors = [part.strip() for part in raw.replace(",", " ").split()]
    if len(colors) != N:
        raise ValueError("please enter exactly 5 colors")
    return colors


def main() -> None:
    print("Enter 5 paint colors, separated by spaces or commas:")
    paints = _parse_colors(input("> "))

    print("Enter 5 hammer colors, separated by spaces or commas:")
    hammers = _parse_colors(input("> "))

    result = solve(paints, hammers)

    print()
    print(f"Max matches: {result.max_match}")
    print(f"Moves: {' '.join(result.moves) if result.moves else '(already best)'}")
    print(f"Final paints:  {' '.join(result.final_paints)}")
    print(f"Final hammers: {' '.join(result.final_hammers)}")
    print(
        "Matched objects: "
        + (" ".join(result.matched_objects) if result.matched_objects else "(none)")
    )


if __name__ == "__main__":
    main()
