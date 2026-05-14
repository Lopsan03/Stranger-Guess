# Stranger Guess Security Specification

## Data Invariants
1. A **Player** must belong to an existing **GameRoom**.
2. An **Answer** must belong to an existing **GameRoom** and the author must be a member of that room.
3. A **Guess** must belong to an existing **Answer**, and the guesser must be a member of the room but NOT the author of the answer.
4. **GameRoom** status transitions must follow the state machine: lobby -> question -> answering -> revealing -> guessing -> round_results -> game_over.
5. Scores can only be updated during the scoring phase trigger.

## The "Dirty Dozen" Payloads
1. Attempt to create a room with a pre-set `host_id` that isn't the requester's session.
2. Attempt to join a room and set `is_host: true`.
3. Attempt to update another player's `nickname` or `avatar`.
4. Attempt to submit an `Answer` for a previous round.
5. Attempt to submit an `Answer` on behalf of another player ID.
6. Attempt to update an `Answer` after it has been revealed.
7. Attempt to submit a `Guess` for your own answer.
8. Attempt to submit multiple `Guesses` for the same answer.
9. Attempt to update your own `score` directly from the client.
10. Attempt to change a `GameRoom` status to `game_over` as a non-host.
11. Attempt to set an `Answer` text larger than 150 characters.
12. Attempt to read all `Answers` for a room before they are revealed.

## Identity Protection
- `Answers` link `player_id` but this field is sensitive.
- We use `session_id` as the primary untrusted identity check from the client, but in rules we should ideally use `auth.uid`. However, this app currently uses anonymous session IDs. To be truly secure, I should use Firebase Anonymous Auth.

Let's adjust the implementation to use Firebase Anonymous Auth.
